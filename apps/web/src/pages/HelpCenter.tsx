import { BookOpen, Search, Shield, Upload } from "lucide-react";
import { PublicLayout } from "../components/PublicLayout";
import { Link } from "../lib/router";
import { RUTA_ADMIN, RUTA_CATALOGO } from "../lib/config";

/** Centro de ayuda con instrucciones reales de uso de Libra. */
export function HelpCenter() {
  return (
    <PublicLayout activo="ayuda">
      <div className="help-wrap">
        <p className="eyebrow">CENTRO DE AYUDA</p>
        <h1>Cómo usar Libra</h1>
        <p className="help-intro">
          Libra es la biblioteca digital de la organización. Tiene dos áreas: un{" "}
          <strong>catálogo público</strong> para lectores y un <strong>panel de administración</strong>{" "}
          privado para gestionar los libros.
        </p>

        <section className="help-card">
          <div className="help-card-head">
            <span className="stat-icon">
              <BookOpen />
            </span>
            <h2>Para lectores (catálogo público)</h2>
          </div>
          <ol className="help-steps">
            <li>
              Entra en <Link to={RUTA_CATALOGO}>Catálogo</Link> para ver todos los libros publicados.
            </li>
            <li>
              Usa el buscador para filtrar por <strong>título</strong> o <strong>autor</strong>.
            </li>
            <li>Haz clic en un libro para leer su descripción completa y ver su portada.</li>
            <li>No necesitas cuenta: el catálogo es de solo lectura y abierto a cualquier visitante.</li>
          </ol>
          <p className="help-note">
            <Search aria-hidden="true" /> Solo aparecen los libros marcados como <em>publicados</em>.
            Los borradores son privados del equipo administrativo.
          </p>
        </section>

        <section className="help-card">
          <div className="help-card-head">
            <span className="stat-icon">
              <Shield />
            </span>
            <h2>Para administradores (panel privado)</h2>
          </div>
          <ol className="help-steps">
            <li>
              Inicia sesión en el <Link to={RUTA_ADMIN}>panel de administración</Link> con tu email y
              contraseña.
            </li>
            <li>
              En <strong>Catálogo</strong> puedes crear, editar y eliminar libros, y cambiar su estado.
            </li>
            <li>
              <Upload aria-hidden="true" /> Sube una portada desde el formulario (PNG, JPG, WEBP o GIF,
              hasta 5 MB) y verás una vista previa antes de guardar.
            </li>
            <li>
              Un libro en estado <strong>borrador</strong> no aparece en el catálogo público. Cámbialo a{" "}
              <strong>publicado</strong> para que los lectores puedan verlo.
            </li>
            <li>
              En <strong>Configuración</strong> consultas tu sesión actual y puedes cerrar sesión.
            </li>
          </ol>
        </section>

        <section className="help-card">
          <div className="help-card-head">
            <span className="stat-icon">
              <BookOpen />
            </span>
            <h2>Preguntas frecuentes</h2>
          </div>
          <dl className="help-faq">
            <dt>¿Necesito registrarme para leer el catálogo?</dt>
            <dd>No. El catálogo público es abierto; solo la administración requiere iniciar sesión.</dd>
            <dt>¿Por qué no veo un libro que el equipo ha añadido?</dt>
            <dd>Probablemente sigue en borrador. Aparecerá al publicarlo.</dd>
            <dt>¿Puedo descargar o pedir prestado un libro?</dt>
            <dd>Por ahora Libra es solo un catálogo de consulta; no incluye préstamos ni descargas.</dd>
          </dl>
        </section>
      </div>
    </PublicLayout>
  );
}
