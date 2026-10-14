import bcrypt from "bcryptjs";
import type { AdminUser, AuthUser, LoginInput } from "@crud-libros/types";
import { adminUsersRepository, type AdminUserRow } from "../repositories/adminUsersRepository";
import { UnauthorizedError } from "../utils/errors";

/** Hash de referencia para igualar el coste de tiempo cuando el usuario no existe. */
const DUMMY_HASH = bcrypt.hashSync("libra-dummy-password", 10);

function toAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  };
}

export const authService = {
  /** Verifica credenciales y devuelve los datos que irán dentro del JWT. */
  async autenticar({ email, password }: LoginInput): Promise<AuthUser> {
    const usuario = await adminUsersRepository.findByEmail(email);

    if (!usuario) {
      // Evita enumeración de usuarios por diferencias de tiempo.
      await bcrypt.compare(password, DUMMY_HASH);
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) throw new UnauthorizedError("Credenciales inválidas");

    return { id: usuario.id, email: usuario.email, role: usuario.role };
  },

  /** Devuelve el perfil público del usuario autenticado. */
  async perfil(id: string): Promise<AdminUser> {
    const usuario = await adminUsersRepository.findById(id);
    if (!usuario) throw new UnauthorizedError("Sesión no válida");
    return toAdminUser(usuario);
  },
};
