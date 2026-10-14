import type { Rol } from "@crud-libros/types";
import { getPool } from "../db/pool";

export interface AdminUserRow {
  id: string;
  email: string;
  password_hash: string;
  role: Rol;
  created_at: Date;
}

export const adminUsersRepository = {
  async findByEmail(email: string): Promise<AdminUserRow | null> {
    const { rows } = await getPool().query<AdminUserRow>(
      `select id, email, password_hash, role, created_at
         from public.admin_users
        where lower(email) = lower($1)
        limit 1`,
      [email]
    );
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<AdminUserRow | null> {
    const { rows } = await getPool().query<AdminUserRow>(
      `select id, email, password_hash, role, created_at
         from public.admin_users
        where id = $1
        limit 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async create(email: string, passwordHash: string, role: Rol = "admin"): Promise<string | null> {
    const { rows } = await getPool().query<{ id: string }>(
      `insert into public.admin_users (email, password_hash, role)
       values ($1, $2, $3)
       returning id`,
      [email, passwordHash, role]
    );
    return rows[0]?.id ?? null;
  },
};
