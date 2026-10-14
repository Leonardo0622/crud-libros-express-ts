import { defineConfig } from "vitest/config";

/**
 * Configuración de pruebas de la API.
 * Las variables de entorno se fijan aquí (NODE_ENV=test) para que:
 *  - los rate limiters se desactiven (skip: isTest),
 *  - morgan no registre,
 *  - no se necesite una base de datos real (los repositorios se mockean).
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
    },
  },
});
