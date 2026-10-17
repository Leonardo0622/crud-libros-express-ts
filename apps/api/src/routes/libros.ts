import { Router } from "express";
import * as ctrl from "../controllers/librosController";

/**
 * Rutas PÚBLICAS del catálogo. Solo lectura y únicamente libros publicados.
 * No permiten crear, editar, publicar ni eliminar.
 */
export const librosRouter = Router();

librosRouter.get("/", ctrl.listarLibros);
librosRouter.get("/:id", ctrl.obtenerLibro);
