import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";

// Mockeamos el repositorio de usuarios: las pruebas no tocan la base de datos.
vi.mock("../src/repositories/adminUsersRepository", () => ({
  adminUsersRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));

import { app } from "../src/app";
import { adminUsersRepository } from "../src/repositories/adminUsersRepository";
import { signToken } from "../src/middleware/auth";

const repo = vi.mocked(adminUsersRepository);

const PASSWORD = "password123";
const row = {
  id: "u1",
  email: "admin@libra.local",
  password_hash: bcrypt.hashSync(PASSWORD, 10),
  role: "admin" as const,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /auth/login", () => {
  it("responde 200 y fija la cookie con credenciales válidas", async () => {
    repo.findByEmail.mockResolvedValue(row);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@libra.local", password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id: "u1", email: "admin@libra.local", role: "admin" });
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies?.[0]).toContain("libra_token=");
    expect(cookies?.[0]).toContain("HttpOnly");
  });

  it("responde 401 con contraseña incorrecta", async () => {
    repo.findByEmail.mockResolvedValue(row);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@libra.local", password: "incorrecta123" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Credenciales inválidas");
  });

  it("responde 401 si el usuario no existe", async () => {
    repo.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nadie@libra.local", password: PASSWORD });

    expect(res.status).toBe(401);
  });

  it("responde 422 con un email inválido", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "no-es-email", password: PASSWORD });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("Datos inválidos");
  });
});

describe("GET /auth/me", () => {
  it("responde 200 con una cookie válida", async () => {
    repo.findById.mockResolvedValue(row);
    const token = signToken({ id: "u1", email: "admin@libra.local", role: "admin" });

    const res = await request(app).get("/auth/me").set("Cookie", [`libra_token=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("admin@libra.local");
    expect(res.body.data.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("responde 401 sin cookie", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("responde 401 con un token inválido", async () => {
    const res = await request(app).get("/auth/me").set("Cookie", ["libra_token=token-falso"]);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token inválido o expirado");
  });
});

describe("POST /auth/logout", () => {
  it("responde 204 y limpia la cookie", async () => {
    const res = await request(app).post("/auth/logout");

    expect(res.status).toBe(204);
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies?.[0]).toContain("libra_token=;");
  });
});
