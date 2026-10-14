import express from "express"
import librosRouter from "./routes/libros"
import {errorHandler} from "./middleware/errorHandler"

export const app = express()
app.use(express.json())

//Rutas
app.use("/libros",librosRouter)

// 404 para rutas no encontradas
app.use((_req, res)=>{
    res.status(404).json(({error:"Ruta no encontrada"}))
})

//Error handler 
app.use(errorHandler)