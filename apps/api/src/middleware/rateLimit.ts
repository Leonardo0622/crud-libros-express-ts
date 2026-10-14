import rateLimit from "express-rate-limit";
import { isTest } from "../config/env";

/** Límite estricto para el login (evita fuerza bruta). */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => isTest,
  message: { error: "Demasiados intentos de inicio de sesión. Inténtalo más tarde." },
});

/** Límite general para toda la API (se aplica en producción). */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => isTest,
  message: { error: "Demasiadas peticiones. Inténtalo de nuevo en un momento." },
});
