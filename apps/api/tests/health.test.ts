import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Health y rutas base", () => {
  it("GET / responde con la info de la API", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("API CRUD Libros");
    expect(res.body.endpoints).toEqual({
      catalogoPublico: "/libros",
      admin: "/admin",
      auth: "/auth",
      health: "/health",
    });
  });

  it("GET /health responde ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("una ruta desconocida responde 404", async () => {
    const res = await request(app).get("/no-existe");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Ruta no encontrada");
  });
});
