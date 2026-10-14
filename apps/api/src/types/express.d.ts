import type { AuthUser } from "@crud-libros/types";

declare global {
  namespace Express {
    interface Request {
      /** Usuario autenticado, lo rellena el middleware requireAuth. */
      user?: AuthUser;
    }
  }
}

export {};
