import type { RequestHandler } from "express";
import { loginSchema } from "@crud-libros/types";
import { authService } from "../services/authService";
import { AUTH_COOKIE, authCookieOptions, signToken } from "../middleware/auth";
import { UnauthorizedError } from "../utils/errors";

export const login: RequestHandler = async (req, res) => {
  const credenciales = loginSchema.parse(req.body);
  const usuario = await authService.autenticar(credenciales);
  const token = signToken(usuario);

  res.cookie(AUTH_COOKIE, token, authCookieOptions);
  res.json({ data: usuario });
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: authCookieOptions.httpOnly,
    sameSite: authCookieOptions.sameSite,
    secure: authCookieOptions.secure,
    path: authCookieOptions.path,
  });
  res.status(204).send();
};

export const me: RequestHandler = async (req, res) => {
  if (!req.user) throw new UnauthorizedError();
  res.json({ data: await authService.perfil(req.user.id) });
};
