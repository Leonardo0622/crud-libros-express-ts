import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { getPool, closePool } from "./pool";

/**
 * Runner de migraciones mínimo.
 *
 * Aplica, en orden alfabético, los archivos *.sql de db/migrations/ que aún no
 * figuren en public.schema_migrations. Cada archivo se ejecuta dentro de una
 * transacción: si falla, no se registra.
 */
const MIGRATIONS_DIR = path.resolve(__dirname, "../../db/migrations");

async function ensureBookkeeping(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    create table if not exists public.schema_migrations (
      version    text primary key,
      applied_at timestamptz not null default now()
    )
  `);
  await pool.query("alter table public.schema_migrations enable row level security");
}

async function migrate(): Promise<void> {
  const pool = getPool();
  await ensureBookkeeping();

  const appliedResult = await pool.query<{ version: string }>(
    "select version from public.schema_migrations"
  );
  const applied = new Set(appliedResult.rows.map((r) => r.version));

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No hay archivos de migración.");
    return;
  }

  for (const file of files) {
    const version = file.replace(/\.sql$/i, "");

    if (applied.has(version)) {
      console.log(`= ${version} (ya aplicada)`);
      continue;
    }

    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    const client = await pool.connect();

    try {
      await client.query("begin");
      await client.query(sql);
      await client.query(
        "insert into public.schema_migrations (version) values ($1) on conflict (version) do nothing",
        [version]
      );
      await client.query("commit");
      console.log(`+ ${version} aplicada`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}

migrate()
  .then(() => closePool())
  .then(() => console.log("Migraciones al día."))
  .catch(async (error) => {
    console.error("Error ejecutando migraciones:", error);
    await closePool();
    process.exit(1);
  });
