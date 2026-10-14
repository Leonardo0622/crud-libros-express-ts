import type { ApiErrorBody } from "@crud-libros/types";

/**
 * Error de aplicación con código HTTP asociado.
 * Los errores "operacionales" (esperados) devuelven su mensaje al cliente;
 * el resto se trata como 500 y se registra en el servidor.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly detalles?: string[];
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, detalles?: string[], isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.detalles = detalles;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toResponse(): ApiErrorBody {
    return {
      error: this.message,
      ...(this.detalles ? { detalles: this.detalles } : {}),
    };
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Solicitud inválida", detalles?: string[]) {
    super(message, 400, detalles);
  }
}

export class ValidationError extends AppError {
  constructor(detalles: string[], message = "Datos inválidos") {
    super(message, 422, detalles);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acceso denegado") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "El recurso ya existe") {
    super(message, 409);
  }
}
