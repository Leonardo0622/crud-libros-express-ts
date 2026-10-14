import type { Libro, LibroInput, LibroListResponse, LibroQuery } from "@crud-libros/types";
import { librosRepository } from "../repositories/librosRepository";
import { NotFoundError } from "../utils/errors";

export const librosService = {
  async listar(query: LibroQuery): Promise<LibroListResponse> {
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
  },

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

  async eliminar(id: number): Promise<void> {
    const eliminado = await librosRepository.remove(id);
    if (!eliminado) throw new NotFoundError(`No existe un libro con id ${id}`);
  },
};
