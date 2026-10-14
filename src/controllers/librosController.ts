// src/controllers/librosController.ts
import { Request, Response, NextFunction } from "express";
import { libros, ids } from "../models/Libro";
import { notFound, badRequest } from "../utils/errors";

export const getAll = (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 10);
  const autor = (req.query.autor as string)?.toLocaleLowerCase().trim();
  const titulo = (req.query.titulo as string)?.toLocaleLowerCase().trim();


  let resultado = libros;

  if(autor){
    resultado = resultado.filter(l => 
      l.autor.toLocaleLowerCase().includes(autor))
  }
  if(titulo){
    resultado = resultado.filter(l => 
      l.titulo.toLocaleLowerCase().includes(titulo))
  }

// Implementación de paginación
  const total = resultado.length; 
  const totalPages = Math.ceil(total / limit);
  const start = (page -1)* limit;
  const data = resultado.slice(start, start + limit);

// Enviar la respuesta con los datos paginados y la información de paginación\
  res.status(200).json({ 
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  });

};

export const getOne = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = Number(req.params.id);
  const libro = libros.find(l => l.id === id);

  if (!libro) {
    return next(notFound("Libro"));
  }

  res.status(200).json({ data: libro });
};


export const create = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    const {titulo, autor} = req.body

    const nuevoLibro = {
        id: ids.siguiente,
        titulo,
        autor
    }

    libros.push(nuevoLibro)
    ids.siguiente++

    res.status(201).json({data: nuevoLibro})

}

export const update = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const id = Number(req.params.id)
  const index = libros.findIndex(l => l.id === id)

  if(index === -1){
    return next(notFound("Libro"))
  }

  const {titulo, autor} = req.body  

  libros[index] = {id,titulo, autor}
  res.status(200).json({data: libros[index]})
}


export const remove = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = Number(req.params.id)
  const index = libros.findIndex(l => l.id === id)

  if(index === -1){
    return next(notFound("Libro"))
  }

  libros.splice(index, 1)
  res.status(204).send()
}