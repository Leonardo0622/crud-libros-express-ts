import type {
  AuthUser,
  EstadoLibro,
  Libro,
  LibroEstadisticas,
  LibroInput,
  LibroListResponse,
  LoginInput,
} from "@crud-libros/types";

/** Base del API: en dev "/api" (proxy de Vite); en prod la URL configurada. */
const BASE = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  status: number;
  detalles?: string[];

  constructor(status: number, message: string, detalles?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detalles = detalles;
  }
}

interface ErrorBody {
  error?: string;
  detalles?: string[];
}

async function parseBody(res: Response): Promise<ErrorBody | null> {
  return (await res.json().catch(() => null)) as ErrorBody | null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
      ...options,
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor");
  }

  if (res.status === 204) return undefined as T;

  const body = await parseBody(res);

  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? `Error ${res.status}`, body?.detalles);
  }

  return body as T;
}

export interface ListarLibrosParams {
  page?: number;
  limit?: number;
  /** Búsqueda combinada por título o autor. */
  q?: string;
  titulo?: string;
  autor?: string;
  estado?: EstadoLibro;
}

function buildQuery(params: ListarLibrosParams): string {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.q) qs.set("q", params.q);
  if (params.titulo) qs.set("titulo", params.titulo);
  if (params.autor) qs.set("autor", params.autor);
  if (params.estado) qs.set("estado", params.estado);
  const query = qs.toString();
  return query ? `?${query}` : "";
}

export const api = {
  /* ------------------------- Catálogo público ------------------------- */

  async listarCatalogo(params: ListarLibrosParams = {}): Promise<LibroListResponse> {
    return request<LibroListResponse>(`/libros${buildQuery(params)}`);
  },

  async obtenerLibroPublico(id: number): Promise<Libro> {
    const { data } = await request<{ data: Libro }>(`/libros/${id}`);
    return data;
  },

  /* ---------------------------- Administración ---------------------------- */

  async listarLibrosAdmin(params: ListarLibrosParams = {}): Promise<LibroListResponse> {
    return request<LibroListResponse>(`/admin/libros${buildQuery(params)}`);
  },

  async estadisticasAdmin(): Promise<LibroEstadisticas> {
    const { data } = await request<{ data: LibroEstadisticas }>("/admin/libros/estadisticas");
    return data;
  },

  async crearLibro(input: LibroInput): Promise<Libro> {
    const { data } = await request<{ data: Libro }>("/admin/libros", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data;
  },

  async actualizarLibro(id: number, input: LibroInput): Promise<Libro> {
    const { data } = await request<{ data: Libro }>(`/admin/libros/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return data;
  },

  async cambiarEstado(id: number, estado: EstadoLibro): Promise<Libro> {
    const { data } = await request<{ data: Libro }>(`/admin/libros/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
    return data;
  },

  async eliminarLibro(id: number): Promise<void> {
    await request<void>(`/admin/libros/${id}`, { method: "DELETE" });
  },

  /**
   * Sube una portada. El cuerpo es el propio archivo (Content-Type = tipo MIME).
   * Devuelve la URL pública devuelta por el almacenamiento.
   */
  async subirImagen(file: File): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${BASE}/admin/uploads`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
    } catch {
      throw new ApiError(0, "No se pudo conectar con el servidor");
    }

    const body = await parseBody(res);
    if (!res.ok) {
      throw new ApiError(res.status, body?.error ?? `Error ${res.status}`, body?.detalles);
    }
    const data = (body as { data?: { url?: string } } | null)?.data;
    if (!data?.url) throw new ApiError(502, "La respuesta del servidor no incluyó la URL de la imagen");
    return data.url;
  },

  /* ------------------------------ Sesión ------------------------------ */

  async login(input: LoginInput): Promise<AuthUser> {
    const { data } = await request<{ data: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data;
  },

  async logout(): Promise<void> {
    await request<void>("/auth/logout", { method: "POST" });
  },

  async me(): Promise<AuthUser> {
    const { data } = await request<{ data: AuthUser }>("/auth/me");
    return data;
  },
};
