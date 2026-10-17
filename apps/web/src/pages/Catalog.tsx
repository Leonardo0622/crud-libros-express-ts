import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { Libro, Pagination } from "@crud-libros/types";
import { api, ApiError } from "../lib/api";
import { PublicLayout } from "../components/PublicLayout";
import { BookCard } from "../components/BookCard";
import { Cargando, EstadoVacio, MensajeError } from "../components/Feedback";

const LIMIT = 12;

function leerParametro(nombre: string): string {
  return new URLSearchParams(window.location.search).get(nombre) ?? "";
}

/** Catálogo público: listado, búsqueda y paginación de libros publicados. */
export function Catalog() {
  const [q, setQ] = useState(() => leerParametro("q"));
  const [busqueda, setBusqueda] = useState(() => leerParametro("q").trim());
  const [page, setPage] = useState(() => Math.max(1, Number(leerParametro("page")) || 1));
  const [libros, setLibros] = useState<Libro[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Debounce de la búsqueda (se salta el primer render para respetar la URL).
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      setBusqueda(q.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const res = await api.listarCatalogo({ page, limit: LIMIT, q: busqueda || undefined });
      setLibros(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado");
      setLibros([]);
      setPagination(null);
    } finally {
      setCargando(false);
    }
  }, [page, busqueda]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Mantén la URL sincronizada (enlaces compartibles).
  useEffect(() => {
    const qs = new URLSearchParams();
    if (busqueda) qs.set("q", busqueda);
    if (page > 1) qs.set("page", String(page));
    const query = qs.toString();
    window.history.replaceState({}, "", `/libros${query ? `?${query}` : ""}`);
  }, [busqueda, page]);

  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <PublicLayout activo="catalogo">
      <div className="catalog-hero">
        <p className="eyebrow">CATÁLOGO PÚBLICO</p>
        <h1>Explora la biblioteca</h1>
        <p className="catalog-hero-sub">
          Descubre los títulos publicados. Busca por título o autor y abre cualquier libro para
          leer su descripción completa.
        </p>

        <div className="catalog-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título o autor…"
            aria-label="Buscar libros por título o autor"
          />
        </div>
      </div>

      <section className="catalog-results" aria-live="polite">
        {error ? (
          <MensajeError>{error}</MensajeError>
        ) : cargando ? (
          <Cargando>Cargando libros…</Cargando>
        ) : libros.length === 0 ? (
          <EstadoVacio titulo="No encontramos libros">
            {busqueda
              ? `No hay resultados para “${busqueda}”. Prueba con otro término.`
              : "Todavía no hay libros publicados en el catálogo."}
          </EstadoVacio>
        ) : (
          <>
            <p className="catalog-count">
              {total} {total === 1 ? "libro" : "libros"}
              {busqueda ? ` para “${busqueda}”` : ""}
            </p>
            <div className="book-grid">
              {libros.map((libro) => (
                <BookCard key={libro.id} libro={libro} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="catalog-pagination" aria-label="Paginación del catálogo">
                <button
                  className="button ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft /> Anterior
                </button>
                <span>
                  Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                </span>
                <button
                  className="button ghost"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente <ChevronRight />
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </PublicLayout>
  );
}
