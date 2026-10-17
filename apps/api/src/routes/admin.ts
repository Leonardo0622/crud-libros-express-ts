import { Router, raw } from "express";
import { PORTADA_MIME_TIPOS } from "@crud-libros/types";
import { requireAuth } from "../middleware/auth";
import { env } from "../config/env";
import * as libros from "../controllers/adminLibrosController";
import * as uploads from "../controllers/uploadsController";

/**
 * Rutas de ADMINISTRACIÓN. Todas exigen sesión válida (cookie HttpOnly o Bearer).
 * Bajo /admin se gestionan libros de cualquier estado y la subida de portadas.
 */
export const adminRouter = Router();

adminRouter.use(requireAuth);

adminRouter.get("/libros", libros.listarLibros);
// Debe ir antes de "/libros/:id" para que "estadisticas" no se interprete como id.
adminRouter.get("/libros/estadisticas", libros.obtenerEstadisticas);
adminRouter.get("/libros/:id", libros.obtenerLibro);
adminRouter.post("/libros", libros.crearLibro);
adminRouter.put("/libros/:id", libros.actualizarLibro);
adminRouter.patch("/libros/:id/estado", libros.cambiarEstadoLibro);
adminRouter.delete("/libros/:id", libros.eliminarLibro);

// Subida de portadas: el cuerpo es el binario de la imagen (Content-Type image/*).
adminRouter.post(
  "/uploads",
  raw({
    type: [...PORTADA_MIME_TIPOS],
    limit: `${Math.ceil(env.UPLOAD_MAX_BYTES / 1024)}kb`,
  }),
  uploads.subirImagen
);
