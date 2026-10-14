import { Pool } from "pg";

/**
 * Pool de conexiones compartido (se crea de forma perezosa).
 * La cadena se toma de DATABASE_URL (ver .env).
 */
let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "Falta la variable de entorno DATABASE_URL. Copia .env.example a .env y complétala."
      );
    }

    const isLocal =
      connectionString.includes("localhost") ||
      connectionString.includes("127.0.0.1");

    pool = new Pool({
      connectionString,
      // Supabase exige TLS; los servidores locales no.
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    pool.on("error", (err) => {
      console.error("Error inesperado en el pool de Postgres:", err);
    });
  }

  return pool;
}

/** Cierra el pool (útil para apagado ordenado y tests). */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
