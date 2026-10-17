import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// Mockeamos el repositorio: las pruebas no tocan la base de datos.
vi.mock("../src/repositories/librosRepository", () => ({
  librosRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setEstado: vi.fn(),
    contar: vi.fn(),
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
  descripcion: "Novela del realismo mágico.",
  imagenUrl: null,
  estado: "publicado" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /libros (público)", () => {
  it("devuelve la lista paginada", async () => {
    repo.findAll.mockResolvedValue({ items: [libro], total: 1 });

    const res = await request(app).get("/libros");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].titulo).toBe("Cien años de soledad");
    expect(res.body.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
  });

  it("solo pide libros publicados al repositorio", async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0 });

    await request(app).get("/libros?q=quijote&page=2&limit=5");

    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ estado: "publicado", q: "quijote", page: 2, limit: 5 })
    );
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

  it("no permite crear libros sin autenticación (no existe la ruta pública)", async () => {
    const res = await request(app).post("/libros").send({ titulo: "X", autor: "Y" });
    expect(res.status).toBe(404);
  });
});

describe("GET /libros/:id (público)", () => {
  it("devuelve el libro si está publicado", async () => {
    repo.findById.mockResolvedValue(libro);

    const res = await request(app).get("/libros/1");

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
    expect(repo.findById).toHaveBeenCalledWith(1, true);
  });

  it("responde 404 si no existe o es borrador", async () => {
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

describe("GET /admin/libros (privado)", () => {
  it("responde 401 sin autenticación", async () => {
    const res = await request(app).get("/admin/libros");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Se requiere autenticación");
  });

  it("devuelve todos los libros con sesión", async () => {
    repo.findAll.mockResolvedValue({ items: [libro], total: 1 });

    const res = await request(app).get("/admin/libros").set("Cookie", [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(repo.findAll).toHaveBeenCalled();
  });
});

describe("POST /admin/libros", () => {
  it("responde 401 sin autenticación", async () => {
    const res = await request(app).post("/admin/libros").send({ titulo: "X", autor: "Y" });
    expect(res.status).toBe(401);
  });

  it("crea el libro con autenticación (201) aplicando valores por defecto", async () => {
    repo.create.mockResolvedValue(libro);

    const res = await request(app)
      .post("/admin/libros")
      .set("Cookie", [authCookie])
      .send({ titulo: "Cien años de soledad", autor: "Gabriel García Márquez" });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(1);
    expect(repo.create).toHaveBeenCalledWith({
      titulo: "Cien años de soledad",
      autor: "Gabriel García Márquez",
      descripcion: "",
      imagenUrl: null,
      estado: "borrador",
    });
  });

  it("responde 422 si faltan campos", async () => {
    const res = await request(app)
      .post("/admin/libros")
      .set("Cookie", [authCookie])
      .send({ titulo: "" });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("Datos inválidos");
  });

  it("responde 422 si el estado no es válido", async () => {
    const res = await request(app)
      .post("/admin/libros")
      .set("Cookie", [authCookie])
      .send({ titulo: "T", autor: "A", estado: "oculto" });

    expect(res.status).toBe(422);
  });
});

describe("PUT /admin/libros/:id", () => {
  it("actualiza el libro con autenticación", async () => {
    repo.update.mockResolvedValue({ ...libro, titulo: "Editado" });

    const res = await request(app)
      .put("/admin/libros/1")
      .set("Cookie", [authCookie])
      .send({ titulo: "Editado", autor: "Autor" });

    expect(res.status).toBe(200);
    expect(res.body.data.titulo).toBe("Editado");
  });

  it("responde 404 si el libro no existe", async () => {
    repo.update.mockResolvedValue(null);

    const res = await request(app)
      .put("/admin/libros/999")
      .set("Cookie", [authCookie])
      .send({ titulo: "Editado", autor: "Autor" });

    expect(res.status).toBe(404);
  });

  it("responde 401 sin autenticación", async () => {
    const res = await request(app).put("/admin/libros/1").send({ titulo: "X", autor: "Y" });
    expect(res.status).toBe(401);
  });
});

describe("PATCH /admin/libros/:id/estado", () => {
  it("publica un libro", async () => {
    repo.setEstado.mockResolvedValue({ ...libro, estado: "publicado" });

    const res = await request(app)
      .patch("/admin/libros/1/estado")
      .set("Cookie", [authCookie])
      .send({ estado: "publicado" });

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe("publicado");
    expect(repo.setEstado).toHaveBeenCalledWith(1, "publicado");
  });

  it("rechaza un estado inválido con 422", async () => {
    const res = await request(app)
      .patch("/admin/libros/1/estado")
      .set("Cookie", [authCookie])
      .send({ estado: "loquesea" });

    expect(res.status).toBe(422);
  });

  it("responde 401 sin autenticación", async () => {
    const res = await request(app).patch("/admin/libros/1/estado").send({ estado: "publicado" });
    expect(res.status).toBe(401);
  });
});

describe("GET /admin/libros/estadisticas", () => {
  it("devuelve los contadores", async () => {
    repo.contar.mockResolvedValue({ total: 5, publicados: 3, borradores: 2 });

    const res = await request(app).get("/admin/libros/estadisticas").set("Cookie", [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ total: 5, publicados: 3, borradores: 2 });
  });

  it("responde 401 sin autenticación", async () => {
    const res = await request(app).get("/admin/libros/estadisticas");
    expect(res.status).toBe(401);
  });
});

describe("DELETE /admin/libros/:id", () => {
  it("elimina el libro con autenticación (204)", async () => {
    repo.remove.mockResolvedValue(true);

    const res = await request(app).delete("/admin/libros/1").set("Cookie", [authCookie]);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it("responde 404 si el libro no existe", async () => {
    repo.remove.mockResolvedValue(false);

    const res = await request(app).delete("/admin/libros/999").set("Cookie", [authCookie]);

    expect(res.status).toBe(404);
  });

  it("responde 401 sin autenticación", async () => {
    const res = await request(app).delete("/admin/libros/1");
    expect(res.status).toBe(401);
  });
});
