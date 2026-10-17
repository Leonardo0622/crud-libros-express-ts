import { randomUUID } from "node:crypto";
import {
  PORTADA_MAX_BYTES,
  PORTADA_MIME_TIPOS,
  type PortadaMime,
} from "@crud-libros/types";
import { env, isStorageConfigured } from "../config/env";
import { AppError } from "../utils/errors";

const EXTENSION_POR_MIME: Record<PortadaMime, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Firma (magic bytes) esperada al inicio de cada tipo de imagen. */
const FIRMAS: Array<{ mime: PortadaMime; bytes: number[] }> = [
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  // WEBP: "RIFF" .... "WEBP"
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

/** Comprueba que el contenido del archivo coincide con una firma de imagen conocida. */
export function detectarMimeReal(buffer: Buffer): PortadaMime | null {
  for (const { mime, bytes } of FIRMAS) {
    if (buffer.length < bytes.length) continue;
    const coincide = bytes.every((byte, i) => buffer[i] === byte);
    if (!coincide) continue;
    if (mime === "image/webp") {
      // Verifica además la etiqueta "WEBP" en el offset 8.
      const etiqueta = buffer.subarray(8, 12).toString("ascii");
      if (etiqueta !== "WEBP") continue;
    }
    return mime;
  }
  return null;
}

export interface PortadaValidada {
  mime: PortadaMime;
  buffer: Buffer;
}

/**
 * Valida el tipo y el tamaño de una portada recibida.
 * Lanza AppError con un mensaje comprensible si algo no cuadra.
 */
export function validarPortada(contenido: unknown): PortadaValidada {
  if (!Buffer.isBuffer(contenido) || contenido.length === 0) {
    throw new AppError("No se recibió ninguna imagen válida", 400);
  }

  if (contenido.length > PORTADA_MAX_BYTES) {
    throw new AppError(
      `La imagen supera el tamaño máximo de ${Math.round(PORTADA_MAX_BYTES / (1024 * 1024))} MB`,
      413
    );
  }

  const mime = detectarMimeReal(contenido);
  if (!mime) {
    throw new AppError(
      `Formato de imagen no permitido. Usa: ${PORTADA_MIME_TIPOS.map((t) => t.replace("image/", "")).join(", ")}.`,
      415
    );
  }

  return { mime, buffer: contenido };
}

/**
 * Sube una portada a Supabase Storage usando el Service Role (solo servidor).
 * Devuelve la URL pública del objeto.
 *
 * Implementado con la API REST de Storage (fetch) para no añadir dependencias.
 */
export async function subirPortada({ mime, buffer }: PortadaValidada): Promise<string> {
  if (!isStorageConfigured || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError(
      "El almacenamiento de imágenes no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el servidor.",
      503
    );
  }

  const bucket = env.SUPABASE_STORAGE_BUCKET;
  const extension = EXTENSION_POR_MIME[mime];
  const nombre = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;

  const endpoint = `${env.SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/${bucket}/${nombre}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        "x-upsert": "false",
      },
      body: new Uint8Array(buffer),
    });
  } catch {
    throw new AppError("No se pudo conectar con el almacenamiento de imágenes", 502);
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    throw new AppError("No se pudo subir la portada", 502, [
      `Almacenamiento respondió ${respuesta.status}${detalle ? `: ${detalle.slice(0, 200)}` : ""}`,
    ]);
  }

  return `${env.SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${nombre}`;
}
