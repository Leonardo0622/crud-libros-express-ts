import type { RequestHandler } from "express";
import { libroIdParamSchema, libroInputSchema, libroQuerySchema } from "@crud-libros/types";
import { librosService } from "../services/librosService";

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

export const eliminarLibro: RequestHandler = async (req, res) => {
  const { id } = libroIdParamSchema.parse(req.params);
  await librosService.eliminar(id);
  res.status(204).send();
};
