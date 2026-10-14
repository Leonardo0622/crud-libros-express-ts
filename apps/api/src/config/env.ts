import "dotenv/config";
import { z } from "zod";

/**
 * Validación y tipado de las variables de entorno.
 * Si falta o es inválida alguna, el proceso no arranca (fallo rápido y claro).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().default("2h"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),
  ADMIN_PATH: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{2,63}$/i, "ADMIN_PATH solo admite letras, números y guiones")
    .default("admin"),
  ADMIN_EMAIL: z.email({ error: "ADMIN_EMAIL debe ser un email válido" }).optional(),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD debe tener al menos 8 caracteres").optional(),
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
