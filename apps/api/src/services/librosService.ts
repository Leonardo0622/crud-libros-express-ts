import type {
  EstadoLibro,
  Libro,
  LibroEstadisticas,
  LibroInput,
  LibroListResponse,
  LibroQuery,
} from "@crud-libros/types";
import { librosRepository } from "../repositories/librosRepository";
import { NotFoundError } from "../utils/errors";

async function listar(query: LibroQuery): Promise<LibroListResponse> {
  const { items, total } = await librosRepository.findAll(query);
  return {
    data: items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

export const librosService = {
  /** Listado para el catálogo público: solo libros publicados. */
  async listarPublicos(query: LibroQuery): Promise<LibroListResponse> {
    return listar({ ...query, estado: "publicado" });
  },

  /** Listado para el panel de administración: todos los libros (con filtros). */
  async listar(query: LibroQuery): Promise<LibroListResponse> {
    return listar(query);
  },

  /** Detalle público: un borrador se trata como inexistente. */
  async obtenerPublico(id: number): Promise<Libro> {
    const libro = await librosRepository.findById(id, true);
    if (!libro) throw new NotFoundError(`No existe un libro publicado con id ${id}`);
    return libro;
  },

  /** Detalle para el panel: cualquier estado. */
  async obtener(id: number): Promise<Libro> {
    const libro = await librosRepository.findById(id);
    if (!libro) throw new NotFoundError(`No existe un libro con id ${id}`);
    return libro;
  },

  async crear(input: LibroInput): Promise<Libro> {
    return librosRepository.create(input);
  },

  async actualizar(id: number, input: LibroInput): Promise<Libro> {
    const libro = await librosRepository.update(id, input);
    if (!libro) throw new NotFoundError(`No existe un libro con id ${id}`);
    return libro;
  },

  async cambiarEstado(id: number, estado: EstadoLibro): Promise<Libro> {
    const libro = await librosRepository.setEstado(id, estado);
    if (!libro) throw new NotFoundError(`No existe un libro con id ${id}`);
    return libro;
  },

  async estadisticas(): Promise<LibroEstadisticas> {
    return librosRepository.contar();
  },

  async eliminar(id: number): Promise<void> {
    const eliminado = await librosRepository.remove(id);
    if (!eliminado) throw new NotFoundError(`No existe un libro con id ${id}`);
  },
};
