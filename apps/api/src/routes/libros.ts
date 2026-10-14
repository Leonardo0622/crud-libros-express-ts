import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as ctrl from "../controllers/librosController";

export const librosRouter = Router();

// Lectura pública
librosRouter.get("/", ctrl.listarLibros);
librosRouter.get("/:id", ctrl.obtenerLibro);

// Escritura protegida (requiere sesión de administrador)
librosRouter.post("/", requireAuth, ctrl.crearLibro);
librosRouter.put("/:id", requireAuth, ctrl.actualizarLibro);
librosRouter.delete("/:id", requireAuth, ctrl.eliminarLibro);
