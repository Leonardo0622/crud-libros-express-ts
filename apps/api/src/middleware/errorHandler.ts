import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { isProduction } from "../config/env";
import { AppError } from "../utils/errors";

/**
 * Manejador de errores centralizado. Debe registrarse al final, tras las rutas.
 * - ZodError  -> 422 con la lista de problemas.
 * - AppError  -> su statusCode y mensaje.
 * - Postgres  -> mapea códigos de constraint a respuestas claras.
 * - Resto     -> 500 (sin filtrar detalles internos en producción).
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: "Datos inválidos",
      detalles: err.issues.map((issue) => {
        const campo = issue.path.join(".") || "(raíz)";
        return `${campo}: ${issue.message}`;
      }),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toResponse());
    return;
  }

  // JSON malformado (lo lanza express.json)
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "JSON inválido en el cuerpo de la petición" });
    return;
  }

  // Errores de PostgreSQL
  const pgCode =
    typeof err === "object" && err !== null && "code" in err
      ? (err as { code?: unknown }).code
      : undefined;

  if (pgCode === "23505") {
    res.status(409).json({ error: "El recurso ya existe" });
    return;
  }
  if (pgCode === "23514" || pgCode === "23502" || pgCode === "22P02") {
    res.status(422).json({ error: "Datos inválidos" });
    return;
  }

  console.error("Error no controlado:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    ...(isProduction
      ? {}
      : { detalles: [err instanceof Error ? err.message : String(err)] }),
  });
};
