import {Request, Response, NextFunction} from "express"
import {AppError} from "../utils/errors"


export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
   console.error("❌ Error:", err)

   if(err instanceof AppError) {
    return res.status(err.statusCode).json({error:err.toResponde()})
   }
    
   const isDev = process.env.NODE_ENV !== "production"

   return res.status(500).json({

    error: "Error interno del servidor",
    ...(isDev && {stack:err.stack})
   })
}
