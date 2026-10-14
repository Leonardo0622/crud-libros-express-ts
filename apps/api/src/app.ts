import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { corsOrigins, isProduction, isTest } from "./config/env";
import { apiRateLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import { NotFoundError } from "./utils/errors";
import { librosRouter } from "./routes/libros";
import { authRouter } from "./routes/auth";

export const app = express();

// Detrás de proxies (Vercel/Railway/Render) para que req.ip y cookies funcionen.
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

if (!isTest && !isProduction) {
  app.use(morgan("dev"));
}

if (isProduction) {
  app.use(apiRateLimiter);
}

// Ruta raíz (health check)
app.get("/", (_req, res) => {
  res.json({
    message: "API CRUD Libros funcionando",
    version: "1.0.0",
    endpoints: {
      libros: "/libros",
      auth: "/auth",
    },
  });
});

// Health check para orquestadores
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Rutas
app.use("/libros", librosRouter);
app.use("/auth", authRouter);

// 404 para rutas no encontradas
app.use((_req, _res, next) => {
  next(new NotFoundError("Ruta no encontrada"));
});

// Manejador de errores (siempre al final)
app.use(errorHandler);
