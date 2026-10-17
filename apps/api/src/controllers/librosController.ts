import type { RequestHandler } from "express";
import { libroIdParamSchema, libroQuerySchema } from "@crud-libros/types";
import { librosService } from "../services/librosService";

/**
 * Endpoints PÚBLICOS del catálogo (sin autenticación, solo lectura).
 * Nunca devuelven borradores.
 */

export const listarLibros: RequestHandler = async (req, res) => {
  const query = libroQuerySchema.parse(req.query);
  res.json(await librosService.listarPublicos(query));
};

export const obtenerLibro: RequestHandler = async (req, res) => {
  const { id } = libroIdParamSchema.parse(req.params);
  res.json({ data: await librosService.obtenerPublico(id) });
};
