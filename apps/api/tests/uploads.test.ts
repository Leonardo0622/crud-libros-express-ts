import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { signToken } from "../src/middleware/auth";
import { AppError } from "../src/utils/errors";

/**
 * Se mockea SOLO `subirPortada` (la parte que habla con Supabase Storage),
 * manteniendo real `validarPortada` para seguir probando la validación.
 * Así las pruebas son deterministas y nunca tocan la red ni dependen del
 * `.env` local del desarrollador.
 */
vi.mock("../src/services/storageService", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/services/storageService")>();
  return { ...real, subirPortada: vi.fn() };
});

import { subirPortada } from "../src/services/storageService";

const subirPortadaMock = vi.mocked(subirPortada);

const token = signToken({ id: "u1", email: "admin@libra.local", role: "admin" });
const authCookie = `libra_token=${token}`;

/** Cabecera de un PNG mínimo válido (solo firma). */
const PNG_FIRMA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const NO_IMAGEN = Buffer.from("esto no es una imagen", "utf8");

describe("POST /admin/uploads", () => {
  beforeEach(() => {
    subirPortadaMock.mockReset();
    // Por defecto se simula que el almacenamiento no está configurado.
    subirPortadaMock.mockRejectedValue(
      new AppError("El almacenamiento de imágenes no está configurado.", 503)
    );
  });

  it("responde 401 sin autenticación", async () => {
    const res = await request(app)
      .post("/admin/uploads")
      .set("Content-Type", "image/png")
      .send(PNG_FIRMA);

    expect(res.status).toBe(401);
  });

  it("responde 400 si el cuerpo no es una imagen (Content-Type no soportado)", async () => {
    const res = await request(app)
      .post("/admin/uploads")
      .set("Cookie", [authCookie])
      .set("Content-Type", "text/plain")
      .send("texto plano");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No se recibió ninguna imagen válida");
  });

  it("responde 415 si el contenido no coincide con una firma de imagen", async () => {
    const res = await request(app)
      .post("/admin/uploads")
      .set("Cookie", [authCookie])
      .set("Content-Type", "image/png")
      .send(NO_IMAGEN);

    expect(res.status).toBe(415);
    expect(subirPortadaMock).not.toHaveBeenCalled(); // no se sube nada inválido
  });

  it("responde 503 (almacenamiento no configurado) con una imagen PNG válida", async () => {
    const res = await request(app)
      .post("/admin/uploads")
      .set("Cookie", [authCookie])
      .set("Content-Type", "image/png")
      .send(PNG_FIRMA);

    expect(res.status).toBe(503);
    expect(res.body.error).toContain("no está configurado");
  });

  it("responde 201 con la URL pública cuando la subida funciona", async () => {
    const url = "https://ejemplo.supabase.co/storage/v1/object/public/portadas/2026/01/x.png";
    subirPortadaMock.mockResolvedValueOnce(url);

    const res = await request(app)
      .post("/admin/uploads")
      .set("Cookie", [authCookie])
      .set("Content-Type", "image/png")
      .send(PNG_FIRMA);

    expect(res.status).toBe(201);
    expect(res.body.data.url).toBe(url);
    // La imagen se valida (mime real) antes de delegar en el servicio de subida.
    expect(subirPortadaMock).toHaveBeenCalledWith(
      expect.objectContaining({ mime: "image/png", buffer: PNG_FIRMA })
    );
  });
});

describe("subirPortada (implementación real, sin configurar)", () => {
  it("rechaza con 503 si faltan SUPABASE_URL y la clave", async () => {
    // En las pruebas estas variables se fijan vacías (vitest.config.mts), por lo
    // que el servicio real debe negarse a subir en lugar de tocar la red.
    const real = await vi.importActual<typeof import("../src/services/storageService")>(
      "../src/services/storageService"
    );

    await expect(real.subirPortada({ mime: "image/png", buffer: PNG_FIRMA })).rejects.toThrow(
      /no está configurado/i
    );
  });
});
