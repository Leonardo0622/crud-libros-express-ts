import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// Mockeamos el repositorio: las pruebas no tocan la base de datos.
vi.mock("../src/repositories/librosRepository", () => ({
  librosRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { app } from "../src/app";
import { librosRepository } from "../src/repositories/librosRepository";
import { signToken } from "../src/middleware/auth";

const repo = vi.mocked(librosRepository);
const token = signToken({ id: "u1", email: "admin@libra.local", role: "admin" });
const authCookie = `libra_token=${token}`;

const libro = {
  id: 1,
  titulo: "Cien años de soledad",
  autor: "Gabriel García Márquez",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /libros", () => {
  it("devuelve la lista paginada", async () => {
    repo.findAll.mockResolvedValue({ items: [libro], total: 1 });

    const res = await request(app).get("/libros");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].titulo).toBe("Cien años de soledad");
    expect(res.body.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
  });

  it("calcula totalPages correctamente", async () => {
    repo.findAll.mockResolvedValue({ items: [libro], total: 25 });

    const res = await request(app).get("/libros?page=2&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 });
  });

  it("rechaza una query inválida con 422", async () => {
    const res = await request(app).get("/libros?page=0");
    expect(res.status).toBe(422);
    expect(res.body.error).toBe("Datos inválidos");
  });
});

describe("GET /libros/:id", () => {
  it("devuelve el libro si existe", async () => {
    repo.findById.mockResolvedValue(libro);

    const res = await request(app).get("/libros/1");

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
  });

  it("responde 404 si no existe", async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).get("/libros/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("999");
  });

  it("responde 422 si el id no es válido", async () => {
    const res = await request(app).get("/libros/abc");
    expect(res.status).toBe(422);
  });
});

describe("POST /libros", () => {
  it("responde 401 sin autenticación", async () => {
    const res = await request(app).post("/libros").send({ titulo: "X", autor: "Y" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Se requiere autenticación");
  });

  it("crea el libro con autenticación (201)", async () => {
    repo.create.mockResolvedValue(libro);

    const res = await request(app)
      .post("/libros")
      .set("Cookie", [authCookie])
      .send({ titulo: "Cien años de soledad", autor: "Gabriel García Márquez" });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(1);
    expect(repo.create).toHaveBeenCalledWith({
      titulo: "Cien años de soledad",
      autor: "Gabriel García Márquez",
    });
  });

  it("responde 422 si faltan campos", async () => {
    const res = await request(app)
      .post("/libros")
      .set("Cookie", [authCookie])
      .send({ titulo: "" });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("Datos inválidos");
  });
});

describe("PUT /libros/:id", () => {
  it("actualiza el libro con autenticación", async () => {
    repo.update.mockResolvedValue({ ...libro, titulo: "Editado" });

    const res = await request(app)
      .put("/libros/1")
      .set("Cookie", [authCookie])
      .send({ titulo: "Editado", autor: "Autor" });

    expect(res.status).toBe(200);
    expect(res.body.data.titulo).toBe("Editado");
  });

  it("responde 404 si el libro no existe", async () => {
    repo.update.mockResolvedValue(null);

    const res = await request(app)
      .put("/libros/999")
      .set("Cookie", [authCookie])
      .send({ titulo: "Editado", autor: "Autor" });

    expect(res.status).toBe(404);
  });

  it("responde 401 sin autenticación", async () => {
    const res = await request(app).put("/libros/1").send({ titulo: "X", autor: "Y" });
    expect(res.status).toBe(401);
  });
});

describe("DELETE /libros/:id", () => {
  it("elimina el libro con autenticación (204)", async () => {
    repo.remove.mockResolvedValue(true);

    const res = await request(app).delete("/libros/1").set("Cookie", [authCookie]);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it("responde 404 si el libro no existe", async () => {
    repo.remove.mockResolvedValue(false);

    const res = await request(app).delete("/libros/999").set("Cookie", [authCookie]);

    expect(res.status).toBe(404);
  });

  it("responde 401 sin autenticación", async () => {
    const res = await request(app).delete("/libros/1");
    expect(res.status).toBe(401);
  });
});
