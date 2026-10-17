import type { ReactNode } from "react";
import { Library, Shield } from "lucide-react";
import { Link } from "../lib/router";
import { RUTA_ADMIN, RUTA_AYUDA, RUTA_CATALOGO } from "../lib/config";

interface Props {
  children: ReactNode;
  /** Resalta el enlace activo ("inicio" | "catalogo" | "ayuda"). */
  activo?: "inicio" | "catalogo" | "ayuda";
}

/** Cabecera y pie para las páginas públicas (catálogo para lectores). */
export function PublicLayout({ children, activo }: Props) {
  return (
    <div className="public-shell">
      <header className="public-header">
        <div className="public-header-inner">
          <Link to="/" className="public-brand" aria-label="Libra, inicio">
            <span className="brand-mark">
              <Library />
            </span>
            <span className="public-brand-name">libra</span>
          </Link>

          <nav className="public-nav" aria-label="Navegación principal">
            <Link to="/" className={`public-nav-link ${activo === "inicio" ? "active" : ""}`}>
              Inicio
            </Link>
            <Link
              to={RUTA_CATALOGO}
              className={`public-nav-link ${activo === "catalogo" ? "active" : ""}`}
            >
              Catálogo
            </Link>
            <Link
              to={RUTA_AYUDA}
              className={`public-nav-link ${activo === "ayuda" ? "active" : ""}`}
            >
              Ayuda
            </Link>
          </nav>

          <Link to={RUTA_ADMIN} className="public-admin-link">
            <Shield />
            <span>Acceso administrador</span>
          </Link>
        </div>
      </header>

      <main className="public-main">{children}</main>

      <footer className="public-footer">
        <div className="public-footer-inner">
          <div className="public-brand public-brand-small">
            <span className="brand-mark">
              <Library />
            </span>
            <span className="public-brand-name">libra</span>
          </div>
          <p>Biblioteca digital · Catálogo público para lectores.</p>
          <nav className="public-footer-nav" aria-label="Enlaces del pie">
            <Link to={RUTA_CATALOGO}>Catálogo</Link>
            <Link to={RUTA_AYUDA}>Ayuda</Link>
            <Link to={RUTA_ADMIN}>Administración</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
