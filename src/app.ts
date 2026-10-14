import express from "express"
import librosRouter from "./routes/libros"
import {errorHandler} from "./middleware/errorHandler"

export const app = express()
app.use(express.json())

//Rutas
app.use("/libros",librosRouter)

// Ruta raíz (health check para Vercel)
app.get("/", (_req, res) => {
  res.json({
    message: "API CRUD Libros funcionando",
    version: "1.0.0",
    endpoints: {
      libros: "/libros",
      docs: "https://github.com/Leonardo0622/crud-libros-express-ts"
    }
  })
})

// 404 para rutas no encontradas
app.use((_req, res)=>{
    res.status(404).json(({error:"Ruta no encontrada"}))
})

//Error handler 
app.use(errorHandler)