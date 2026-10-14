import type { Libro, LibroInput, LibroQuery } from "@crud-libros/types";
import { getPool } from "../db/pool";

interface LibroRow {
  id: string;
  titulo: string;
  autor: string;
  created_at: Date;
  updated_at: Date;
}

/** pg devuelve bigint como string; lo normalizamos a number. */
function mapRow(row: LibroRow): Libro {
  return {
    id: Number(row.id),
    titulo: row.titulo,
    autor: row.autor,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const librosRepository = {
  async findAll({
    page,
    limit,
    titulo,
    autor,
  }: LibroQuery): Promise<{ items: Libro[]; total: number }> {
    const condiciones: string[] = [];
    const valores: unknown[] = [];

    if (titulo) {
      valores.push(`%${titulo}%`);
      condiciones.push(`titulo ilike $${valores.length}`);
    }
    if (autor) {
      valores.push(`%${autor}%`);
      condiciones.push(`autor ilike $${valores.length}`);
    }
    const where = condiciones.length ? `where ${condiciones.join(" and ")}` : "";

    const pool = getPool();

    const totalResult = await pool.query<{ total: string }>(
      `select count(*)::text as total from public.libros ${where}`,
      valores
    );
    const total = Number(totalResult.rows[0]?.total ?? 0);

    const offset = (page - 1) * limit;
    const filas = await pool.query<LibroRow>(
      `select id, titulo, autor, created_at, updated_at
         from public.libros
         ${where}
        order by id asc
        limit $${valores.length + 1} offset $${valores.length + 2}`,
      [...valores, limit, offset]
    );

    return { items: filas.rows.map(mapRow), total };
  },

  async findById(id: number): Promise<Libro | null> {
    const { rows } = await getPool().query<LibroRow>(
      "select id, titulo, autor, created_at, updated_at from public.libros where id = $1",
      [id]
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  },

  async create({ titulo, autor }: LibroInput): Promise<Libro> {
    const { rows } = await getPool().query<LibroRow>(
      "insert into public.libros (titulo, autor) values ($1, $2) returning id, titulo, autor, created_at, updated_at",
      [titulo, autor]
    );
    const row = rows[0];
    if (!row) throw new Error("No se pudo crear el libro");
    return mapRow(row);
  },

  async update(id: number, { titulo, autor }: LibroInput): Promise<Libro | null> {
    const { rows } = await getPool().query<LibroRow>(
      `update public.libros
          set titulo = $1, autor = $2
        where id = $3
        returning id, titulo, autor, created_at, updated_at`,
      [titulo, autor, id]
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  },

  async remove(id: number): Promise<boolean> {
    const resultado = await getPool().query(
      "delete from public.libros where id = $1",
      [id]
    );
    return (resultado.rowCount ?? 0) > 0;
  },
};
