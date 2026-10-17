import { PublicLayout } from "../components/PublicLayout";
import { Link } from "../lib/router";
import { RUTA_ADMIN, RUTA_CATALOGO } from "../lib/config";

/** Página 404. */
export function NotFound() {
  return (
    <PublicLayout>
      <div className="notfound">
        <p className="eyebrow">ERROR 404</p>
        <h1>404</h1>
        <p>No encontramos esta página.</p>
        <div className="notfound-actions">
          <Link to="/" className="button primary">
            Ir al inicio
          </Link>
          <Link to={RUTA_CATALOGO} className="button ghost">
            Ver catálogo
          </Link>
          <Link to={RUTA_ADMIN} className="button ghost">
            Panel de administración
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
