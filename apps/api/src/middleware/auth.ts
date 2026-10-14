import type { CookieOptions, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { AuthUser } from "@crud-libros/types";
import { env, isProduction } from "../config/env";
import { UnauthorizedError } from "../utils/errors";

export const AUTH_COOKIE = "libra_token";

/** Firma un JWT con los datos mínimos del usuario. */
export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
}

/** Verifica un JWT y devuelve el usuario; lanza si es inválido/expirado. */
export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  return {
    id: String(payload.sub ?? ""),
    email: String(payload.email ?? ""),
    role: (payload.role as AuthUser["role"]) ?? "admin",
  };
}

/** Cookie HttpOnly que transporta el JWT. */
export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
  maxAge: 2 * 60 * 60 * 1000, // 2 h
};

/**
 * Exige un usuario autenticado. Acepta el token en la cookie HttpOnly
 * o en la cabecera "Authorization: Bearer <token>".
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const deCookie = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE];
  const cabecera = req.headers.authorization;
  const deCabecera = cabecera?.startsWith("Bearer ") ? cabecera.slice(7) : undefined;
  const token = deCabecera ?? deCookie;

  if (!token) {
    next(new UnauthorizedError("Se requiere autenticación"));
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new UnauthorizedError("Token inválido o expirado"));
  }
};
