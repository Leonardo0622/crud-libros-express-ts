import type { EstadoLibro, Libro, LibroEstadisticas, LibroInput, LibroQuery } from "@crud-libros/types";
import { getPool } from "../db/pool";

interface LibroRow {
  id: string;
  titulo: string;
  autor: string;
  descripcion: string;
  imagen_url: string | null;
  estado: EstadoLibro;
  created_at: Date;
  updated_at: Date;
}

const COLUMNAS = "id, titulo, autor, descripcion, imagen_url, estado, created_at, updated_at";

/** pg devuelve bigint como string; lo normalizamos a number. */
function mapRow(row: LibroRow): Libro {
  return {
    id: Number(row.id),
    titulo: row.titulo,
    autor: row.autor,
    descripcion: row.descripcion ?? "",
    imagenUrl: row.imagen_url ?? null,
    estado: row.estado,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const librosRepository = {
  async findAll({
    page,
    limit,
    q,
    titulo,
    autor,
    estado,
  }: LibroQuery): Promise<{ items: Libro[]; total: number }> {
    const condiciones: string[] = [];
    const valores: unknown[] = [];

    if (q) {
      valores.push(`%${q}%`);
      const indice = valores.length;
      condiciones.push(`(titulo ilike $${indice} or autor ilike $${indice})`);
    }
    if (titulo) {
      valores.push(`%${titulo}%`);
      condiciones.push(`titulo ilike $${valores.length}`);
    }
    if (autor) {
      valores.push(`%${autor}%`);
      condiciones.push(`autor ilike $${valores.length}`);
    }
    if (estado) {
      valores.push(estado);
      condiciones.push(`estado = $${valores.length}`);
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
      `select ${COLUMNAS}
         from public.libros
         ${where}
        order by created_at desc, id desc
        limit $${valores.length + 1} offset $${valores.length + 2}`,
      [...valores, limit, offset]
    );

    return { items: filas.rows.map(mapRow), total };
  },

  /**
   * Busca un libro por id.
   * @param soloPublicados si es true, los borradores se tratan como inexistentes.
   */
  async findById(id: number, soloPublicados = false): Promise<Libro | null> {
    const filtroEstado = soloPublicados ? " and estado = 'publicado'" : "";
    const { rows } = await getPool().query<LibroRow>(
      `select ${COLUMNAS} from public.libros where id = $1${filtroEstado}`,
      [id]
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  },

  async create({ titulo, autor, descripcion, imagenUrl, estado }: LibroInput): Promise<Libro> {
    const { rows } = await getPool().query<LibroRow>(
      `insert into public.libros (titulo, autor, descripcion, imagen_url, estado)
       values ($1, $2, $3, $4, $5)
       returning ${COLUMNAS}`,
      [titulo, autor, descripcion, imagenUrl, estado]
    );
    const row = rows[0];
    if (!row) throw new Error("No se pudo crear el libro");
    return mapRow(row);
  },

  async update(
    id: number,
    { titulo, autor, descripcion, imagenUrl, estado }: LibroInput
  ): Promise<Libro | null> {
    const { rows } = await getPool().query<LibroRow>(
      `update public.libros
          set titulo = $1, autor = $2, descripcion = $3, imagen_url = $4, estado = $5
        where id = $6
        returning ${COLUMNAS}`,
      [titulo, autor, descripcion, imagenUrl, estado, id]
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  },

  async setEstado(id: number, estado: EstadoLibro): Promise<Libro | null> {
    const { rows } = await getPool().query<LibroRow>(
      `update public.libros set estado = $1 where id = $2 returning ${COLUMNAS}`,
      [estado, id]
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  },

  async contar(): Promise<LibroEstadisticas> {
    const { rows } = await getPool().query<{ estado: EstadoLibro; total: string }>(
      "select estado, count(*)::text as total from public.libros group by estado"
    );
    let publicados = 0;
    let borradores = 0;
    for (const fila of rows) {
      if (fila.estado === "publicado") publicados = Number(fila.total);
      else if (fila.estado === "borrador") borradores = Number(fila.total);
    }
    return { total: publicados + borradores, publicados, borradores };
  },

  async remove(id: number): Promise<boolean> {
    const resultado = await getPool().query(
      "delete from public.libros where id = $1",
      [id]
    );
    return (resultado.rowCount ?? 0) > 0;
  },
};
