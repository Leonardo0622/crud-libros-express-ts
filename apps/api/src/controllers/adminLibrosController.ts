import type { RequestHandler } from "express";
import {
  libroEstadoSchema,
  libroIdParamSchema,
  libroInputSchema,
  libroQuerySchema,
} from "@crud-libros/types";
import { librosService } from "../services/librosService";

/**
 * Endpoints de ADMINISTRACIÓN de libros (requieren sesión; ver routes/admin.ts).
 * Pueden leer y mutar cualquier estado, incluidos los borradores.
 */

export const listarLibros: RequestHandler = async (req, res) => {
  const query = libroQuerySchema.parse(req.query);
  res.json(await librosService.listar(query));
};

export const obtenerLibro: RequestHandler = async (req, res) => {
  const { id } = libroIdParamSchema.parse(req.params);
  res.json({ data: await librosService.obtener(id) });
};

export const crearLibro: RequestHandler = async (req, res) => {
  const input = libroInputSchema.parse(req.body);
  res.status(201).json({ data: await librosService.crear(input) });
};

export const actualizarLibro: RequestHandler = async (req, res) => {
  const { id } = libroIdParamSchema.parse(req.params);
  const input = libroInputSchema.parse(req.body);
  res.json({ data: await librosService.actualizar(id, input) });
};

export const cambiarEstadoLibro: RequestHandler = async (req, res) => {
  const { id } = libroIdParamSchema.parse(req.params);
  const { estado } = libroEstadoSchema.parse(req.body);
  res.json({ data: await librosService.cambiarEstado(id, estado) });
};

export const obtenerEstadisticas: RequestHandler = async (_req, res) => {
  res.json({ data: await librosService.estadisticas() });
};

export const eliminarLibro: RequestHandler = async (req, res) => {
  const { id } = libroIdParamSchema.parse(req.params);
  await librosService.eliminar(id);
  res.status(204).send();
};
