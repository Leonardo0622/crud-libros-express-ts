import {Request, Response, NextFunction} from "express"
import {badRequest} from "../utils/errors"

export const validarLibro = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const {titulo, autor} = req.body
    const errores: string[] = []

    if(!titulo || typeof titulo !== "string" || titulo.trim().length===0){
        errores.push("Titulo es requerido y debe ser texto no vacio")
    } else if (titulo.trim().length>100){
        errores.push("Titulo no puede exceder 100 caraceteres")
    }

    if(!autor || typeof autor !=="string" || autor.trim().length===0){
        errores.push("Autor es requerido y debe ser textto no vacio")
    } else if(autor.trim().length>100){
        errores.push("Titulo no puede exceder 100 caraceteres")
    }

    if(errores.length> 0 ){
        return next(badRequest("Datos  de Libro invalido", errores))
    }


    req.body.titulo = titulo.trim()
    req.body.autor = autor.trim()
    
    next()
}