import { z } from "zod";

/* ============================== Libros ============================== */

/**
 * Estado de publicación de un libro.
 *  - `borrador`   → solo visible en el panel de administración.
 *  - `publicado`  → visible en el catálogo público para cualquier visitante.
 */
export const estadoLibroSchema = z.enum(["borrador", "publicado"]);
export type EstadoLibro = z.infer<typeof estadoLibroSchema>;

/** Entidad Libro tal como la devuelve la API (id numérico). */
export const libroSchema = z.object({
  id: z.number().int().positive(),
  titulo: z.string(),
  autor: z.string(),
  descripcion: z.string(),
  imagenUrl: z.string().nullable(),
  estado: estadoLibroSchema,
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
  descripcion: z
    .string()
    .trim()
    .max(2000, "La descripción no puede superar los 2000 caracteres")
    .optional()
    .default(""),
  imagenUrl: z
    .union([z.url({ error: "La URL de la imagen no es válida" }), z.null()])
    .optional()
    .default(null),
  estado: estadoLibroSchema.optional().default("borrador"),
});
export type LibroInput = z.infer<typeof libroInputSchema>;
export const libroUpdateSchema = libroInputSchema;

/** Cambio de estado de publicación (publicar / retirar). */
export const libroEstadoSchema = z.object({ estado: estadoLibroSchema });
export type LibroEstadoInput = z.infer<typeof libroEstadoSchema>;

/** Query params del listado (page/limit/filtros). */
export const libroQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  /** Búsqueda combinada por título o autor. */
  q: z.string().trim().min(1).optional(),
  titulo: z.string().trim().min(1).optional(),
  autor: z.string().trim().min(1).optional(),
  estado: estadoLibroSchema.optional(),
});
export type LibroQuery = z.infer<typeof libroQuerySchema>;

/** Parámetro :id (entero positivo). */
export const libroIdParamSchema = z.object({
  id: z.coerce.number().int().positive("El id debe ser un entero positivo"),
});
export type LibroIdParam = z.infer<typeof libroIdParamSchema>;

/** Contadores para el panel de administración. */
export interface LibroEstadisticas {
  total: number;
  publicados: number;
  borradores: number;
}

/* ========================= Subida de portadas ========================= */

/** Tipos MIME aceptados para las portadas (compartido frontend/backend). */
export const PORTADA_MIME_TIPOS = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
export type PortadaMime = (typeof PORTADA_MIME_TIPOS)[number];

/** Tamaño máximo de una portada (5 MB). */
export const PORTADA_MAX_BYTES = 5 * 1024 * 1024;

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

export interface EstadisticasResponse {
  data: LibroEstadisticas;
}

export interface PortadaResponse {
  data: { url: string };
}

export interface AuthResponse {
  data: AdminUser;
}

export interface ApiErrorBody {
  error: string;
  detalles?: string[];
}
