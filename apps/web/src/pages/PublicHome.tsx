import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import type { Libro } from "@crud-libros/types";
import { api, ApiError } from "../lib/api";
import { PublicLayout } from "../components/PublicLayout";
import { BookCard } from "../components/BookCard";
import { Cargando, EstadoVacio, MensajeError } from "../components/Feedback";
import { Link, navigate } from "../lib/router";
import { RUTA_CATALOGO } from "../lib/config";

/** Página de inicio pública. */
export function PublicHome() {
  const [q, setQ] = useState("");
  const [libros, setLibros] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    api
      .listarCatalogo({ page: 1, limit: 6 })
      .then((res) => {
        if (activo) setLibros(res.data);
      })
      .catch((err) => {
        if (activo) setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    const termino = q.trim();
    navigate(termino ? `${RUTA_CATALOGO}?q=${encodeURIComponent(termino)}` : RUTA_CATALOGO);
  };

  return (
    <PublicLayout activo="inicio">
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="eyebrow">BIBLIOTECA DIGITAL</p>
          <h1>
            Bienvenido a <span>Libra</span>
          </h1>
          <p className="home-hero-sub">
            Explora el catálogo de la biblioteca, descubre nuevos títulos y consulta la información
            de cada libro. Sin cuentas, sin registros: solo lectura.
          </p>

          <form className="home-search" onSubmit={buscar} role="search">
            <Search aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título o autor…"
              aria-label="Buscar libros por título o autor"
            />
            <button type="submit" className="button primary">
              Buscar
            </button>
          </form>

          <div className="home-hero-actions">
            <Link to={RUTA_CATALOGO} className="button primary">
              <BookOpen /> Ver catálogo completo
            </Link>
            <Link to="/ayuda" className="button ghost">
              Cómo usar Libra
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <div>
            <h2>Últimos títulos publicados</h2>
            <p>Una selección de los libros más recientes del catálogo.</p>
          </div>
          <Link to={RUTA_CATALOGO} className="home-section-link">
            Ver todo <ArrowRight />
          </Link>
        </div>

        {error ? (
          <MensajeError>{error}</MensajeError>
        ) : cargando ? (
          <Cargando>Cargando catálogo…</Cargando>
        ) : libros.length === 0 ? (
          <EstadoVacio titulo="Aún no hay libros publicados">
            Cuando el equipo publique títulos, aparecerán aquí.
          </EstadoVacio>
        ) : (
          <div className="book-grid">
            {libros.map((libro) => (
              <BookCard key={libro.id} libro={libro} />
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
