import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { adminUsersRepository } from "../repositories/adminUsersRepository";
import { closePool } from "../db/pool";

/**
 * Crea (o actualiza) el usuario administrador inicial a partir de las
 * variables ADMIN_EMAIL / ADMIN_PASSWORD. Ejecutar con:
 *   npm run db:seed-admin --workspace @crud-libros/api
 */
async function main(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.error("Define ADMIN_EMAIL y ADMIN_PASSWORD en el entorno antes de ejecutar el seed.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, env.BCRYPT_ROUNDS);

  const existente = await adminUsersRepository.findByEmail(env.ADMIN_EMAIL);
  if (existente) {
    console.log(`El administrador ${env.ADMIN_EMAIL} ya existe. Nada que hacer.`);
  } else {
    const id = await adminUsersRepository.create(env.ADMIN_EMAIL, passwordHash, "admin");
    console.log(`Administrador creado (id: ${id})`);
  }

  await closePool();
}

main().catch(async (error) => {
  console.error("Error al crear el administrador:", error);
  await closePool();
  process.exit(1);
});
