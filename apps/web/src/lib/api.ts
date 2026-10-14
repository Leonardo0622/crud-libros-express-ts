import type {
  AuthUser,
  Libro,
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

  const body = (await res.json().catch(() => null)) as
    | { error?: string; detalles?: string[] }
    | null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error ?? `Error ${res.status}`,
      body?.detalles
    );
  }

  return body as T;
}

export const api = {
  async listarLibros(params: {
    page?: number;
    limit?: number;
    titulo?: string;
    autor?: string;
  } = {}): Promise<LibroListResponse> {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.titulo) qs.set("titulo", params.titulo);
    if (params.autor) qs.set("autor", params.autor);
    const query = qs.toString();
    return request<LibroListResponse>(`/libros${query ? `?${query}` : ""}`);
  },

  async crearLibro(input: LibroInput): Promise<Libro> {
    const { data } = await request<{ data: Libro }>("/libros", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data;
  },

  async actualizarLibro(id: number, input: LibroInput): Promise<Libro> {
    const { data } = await request<{ data: Libro }>(`/libros/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return data;
  },

  async eliminarLibro(id: number): Promise<void> {
    await request<void>(`/libros/${id}`, { method: "DELETE" });
  },

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
