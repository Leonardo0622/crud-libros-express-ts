import { defineConfig } from "vitest/config";

/**
 * Configuración de pruebas de la API.
 * Las variables de entorno se fijan aquí (NODE_ENV=test) para que:
 *  - los rate limiters se desactiven (skip: isTest),
 *  - morgan no registre,
 *  - no se necesite una base de datos real (los repositorios se mockean),
 *  - las pruebas sean deterministas: las credenciales de Storage se dejan
 *    vacías para que ninguna prueba dependa del `.env` local ni suba archivos
 *    reales a Supabase (dotenv no sobreescribe variables ya definidas y el
 *    esquema trata la cadena vacía como "no definida").
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@127.0.0.1:5432/test",
      JWT_SECRET: "test-secret-test-secret-test-secret-1234",
      CORS_ORIGIN: "http://localhost:5173",
      ADMIN_PATH: "admin-test",
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
    },
  },
});
