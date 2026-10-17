import "dotenv/config";
import { z } from "zod";

/**
 * Validación y tipado de las variables de entorno.
 * Si falta o es inválida alguna, el proceso no arranca (fallo rápido y claro).
 */
/**
 * Trata las cadenas vacías del entorno (p. ej. `SUPABASE_URL=` o `PORT=`) como
 * "no definidas", para que se apliquen los valores por defecto en lugar de
 * fallar la validación y romper el arranque.
 */
const vacioComoUndefined = (valor: unknown) =>
  typeof valor === "string" && valor.trim() === "" ? undefined : valor;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.preprocess(vacioComoUndefined, z.coerce.number().int().min(1).max(65535).default(3000)),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  CORS_ORIGIN: z.preprocess(vacioComoUndefined, z.string().default("http://localhost:5173")),
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  JWT_EXPIRES_IN: z.preprocess(vacioComoUndefined, z.string().default("2h")),
  BCRYPT_ROUNDS: z.preprocess(
    vacioComoUndefined,
    z.coerce.number().int().min(8).max(15).default(12)
  ),
  /**
   * Atributo SameSite de la cookie de sesión.
   * - "lax" (por defecto): suficiente si frontend y API comparten dominio registrable.
   * - "none": necesario si el frontend (Vercel) y la API (Render) están en dominios
   *   distintos; exige `Secure` (se fuerza automáticamente).
   */
  COOKIE_SAMESITE: z.preprocess(vacioComoUndefined, z.enum(["lax", "strict", "none"]).default("lax")),
  ADMIN_PATH: z.preprocess(
    vacioComoUndefined,
    z
      .string()
      .regex(/^[a-z0-9][a-z0-9-]{2,63}$/i, "ADMIN_PATH solo admite letras, números y guiones")
      .default("admin")
  ),
  ADMIN_EMAIL: z.preprocess(
    vacioComoUndefined,
    z.email({ error: "ADMIN_EMAIL debe ser un email válido" }).optional()
  ),
  ADMIN_PASSWORD: z.preprocess(
    vacioComoUndefined,
    z.string().min(8, "ADMIN_PASSWORD debe tener al menos 8 caracteres").optional()
  ),

  // Supabase Storage (para las portadas). Opcional: si falta, la subida queda
  // deshabilitada con un error claro (el resto de la app funciona con normalidad).
  SUPABASE_URL: z.preprocess(
    vacioComoUndefined,
    z.url({ error: "SUPABASE_URL debe ser una URL válida" }).optional()
  ),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(vacioComoUndefined, z.string().min(1).optional()),
  SUPABASE_STORAGE_BUCKET: z.preprocess(
    vacioComoUndefined,
    z.string().min(1).default("portadas")
  ),
  /** Tamaño máximo de subida en bytes (5 MB por defecto). */
  UPLOAD_MAX_BYTES: z.preprocess(
    vacioComoUndefined,
    z.coerce.number().int().min(1024).max(20 * 1024 * 1024).default(5 * 1024 * 1024)
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Configuración de entorno inválida:");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".") || "(raíz)"}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/** Orígenes CORS permitidos (la env admite varios separados por coma). */
export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origen) => origen.trim())
  .filter(Boolean);

/** true si Supabase Storage está configurado para subir portadas. */
export const isStorageConfigured = Boolean(
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
);
