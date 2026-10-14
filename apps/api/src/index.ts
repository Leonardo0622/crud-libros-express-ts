import { app } from "./app";
import { env, isProduction } from "./config/env";
import { closePool, getPool } from "./db/pool";

// Arrancamos a escuchar de inmediato para que los health checks respondan.
const server = app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

// Verificación de la base de datos en segundo plano (no bloquea el arranque).
void (async () => {
  try {
    await getPool().query("select 1");
    console.log("Conexión a la base de datos verificada");
  } catch (error) {
    console.error("No se pudo conectar a la base de datos:", error);
    if (isProduction) {
      console.error("Abortando: la base de datos es obligatoria en producción.");
      process.exit(1);
    }
  }
})();

const shutdown = (senal: string) => {
  console.log(`\n${senal} recibido, cerrando servidor...`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
