import { useCallback, useEffect, useState } from "react";
import type { AuthUser, LoginInput } from "@crud-libros/types";
import { api } from "../lib/api";

/** Gestiona la sesión del administrador (cookie HttpOnly en el API). */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    api
      .me()
      .then((u) => {
        if (activo) setUser(u);
      })
      .catch(() => {
        if (activo) setUser(null);
      })
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const u = await api.login(input);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}
