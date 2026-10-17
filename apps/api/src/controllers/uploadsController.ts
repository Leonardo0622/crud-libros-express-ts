import type { RequestHandler } from "express";
import { subirPortada, validarPortada } from "../services/storageService";

/**
 * POST /admin/uploads
 * Recibe el binario de la imagen como cuerpo "raw" (Content-Type = tipo de imagen).
 * Valida tipo/tamaño y lo sube a Supabase Storage con el Service Role.
 */
export const subirImagen: RequestHandler = async (req, res) => {
  const contenido = Buffer.isBuffer(req.body) ? req.body : undefined;
  const validada = validarPortada(contenido);
  const url = await subirPortada(validada);
  res.status(201).json({ data: { url } });
};
