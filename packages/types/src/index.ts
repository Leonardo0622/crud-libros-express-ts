import { z } from "zod";

/* ============================== Libros ============================== */

/** Entidad Libro tal como la devuelve la API (id numérico). */
export const libroSchema = z.object({
  id: z.number().int().positive(),
  titulo: z.string(),
  autor: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Libro = z.infer<typeof libroSchema>;

/** Cuerpo para crear/actualizar un libro. */
export const libroInputSchema = z.object({
  titulo: z
    .string({ error: "El título es obligatorio" })
    .trim()
    .min(1, "El título no puede estar vacío")
    .max(200, "El título no puede superar los 200 caracteres"),
  autor: z
    .string({ error: "El autor es obligatorio" })
    .trim()
    .min(1, "El autor no puede estar vacío")
    .max(120, "El autor no puede superar los 120 caracteres"),
});
export type LibroInput = z.infer<typeof libroInputSchema>;
export const libroUpdateSchema = libroInputSchema;

/** Query params del listado (page/limit/filtros). */
export const libroQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  titulo: z.string().trim().min(1).optional(),
  autor: z.string().trim().min(1).optional(),
});
export type LibroQuery = z.infer<typeof libroQuerySchema>;

/** Parámetro :id (entero positivo). */
export const libroIdParamSchema = z.object({
  id: z.coerce.number().int().positive("El id debe ser un entero positivo"),
});
export type LibroIdParam = z.infer<typeof libroIdParamSchema>;

/* =========================== Autenticación =========================== */

export const rolSchema = z.enum(["admin", "editor"]);
export type Rol = z.infer<typeof rolSchema>;

/** Credenciales de inicio de sesión. */
export const loginSchema = z.object({
  email: z
    .string({ error: "El email es obligatorio" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Debe ser un email válido" })),
  password: z
    .string({ error: "La contraseña es obligatoria" })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña es demasiado larga"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Usuario administrador (sin datos sensibles). */
export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: rolSchema,
  createdAt: z.string(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

/** Datos mínimos del usuario autenticado (contenido del JWT). */
export type AuthUser = Pick<AdminUser, "id" | "email" | "role">;

/* ==================== Envoltorios de respuesta ==================== */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LibroListResponse {
  data: Libro[];
  pagination: Pagination;
}

export interface LibroResponse {
  data: Libro;
}

export interface AuthResponse {
  data: AdminUser;
}

export interface ApiErrorBody {
  error: string;
  detalles?: string[];
}
