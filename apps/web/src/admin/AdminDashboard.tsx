import { useCallback, useEffect, useState } from "react";
import { BookOpen, Eye, EyeOff, ExternalLink, LayoutDashboard, Plus } from "lucide-react";
import type { Libro, LibroEstadisticas } from "@crud-libros/types";
import { api, ApiError } from "../lib/api";
import { CoverImage } from "../components/CoverImage";
import { Cargando, EstadoVacio, MensajeError } from "../components/Feedback";
import { formatFecha } from "../lib/format";
import { RUTA_CATALOGO } from "../lib/config";

interface Props {
  onLogout: () => void;
  onIrACatalogo: () => void;
  onNuevoLibro: () => void;
}

/** Vista "Resumen": contadores reales y últimos libros gestionados. */
export function AdminDashboard({ onLogout, onIrACatalogo, onNuevoLibro }: Props) {
  const [stats, setStats] = useState<LibroEstadisticas | null>(null);
  const [recientes, setRecientes] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [estadisticas, lista] = await Promise.all([
        api.estadisticasAdmin(),
        api.listarLibrosAdmin({ page: 1, limit: 5 }),
      ]);
      setStats(estadisticas);
      setRecientes(lista.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onLogout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado");
    } finally {
      setCargando(false);
    }
  }, [onLogout]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">PANEL DE ADMINISTRACIÓN</p>
          <h1>Resumen</h1>
          <p className="subtitle">Vista general de tu biblioteca Libra.</p>
        </div>
        <button className="button primary" onClick={onNuevoLibro}>
          <Plus /> Añadir libro
        </button>
      </section>

      {error && <MensajeError>{error}</MensajeError>}

      <section className="stats-grid">
        <StatCard icon={<BookOpen />} label="Libros totales" value={stats?.total ?? "—"} />
        <StatCard icon={<Eye />} label="Publicados" value={stats?.publicados ?? "—"} />
        <StatCard icon={<EyeOff />} label="Borradores" value={stats?.borradores ?? "—"} />
        <StatCard
          icon={<LayoutDashboard />}
          label="Estado de la API"
          value={error ? "Error" : "Conectada"}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Últimos libros</h2>
            <p>Los 5 títulos actualizados más recientemente.</p>
          </div>
          <button className="button ghost" onClick={onIrACatalogo}>
            Gestionar catálogo
          </button>
        </div>

        {cargando ? (
          <Cargando>Cargando resumen…</Cargando>
        ) : recientes.length === 0 ? (
          <EstadoVacio titulo="Todavía no hay libros">
            Añade tu primer libro para empezar.
          </EstadoVacio>
        ) : (
          <ul className="recent-list">
            {recientes.map((libro) => (
              <li key={libro.id} className="recent-item">
                <CoverImage src={libro.imagenUrl} titulo={libro.titulo} className="table-cover" />
                <div className="recent-info">
                  <strong>{libro.titulo}</strong>
                  <small className="muted">{libro.autor}</small>
                </div>
                <span className={`badge badge-${libro.estado}`}>
                  <i />
                  {libro.estado === "publicado" ? "Publicado" : "Borrador"}
                </span>
                <span className="recent-date muted">{formatFecha(libro.updatedAt)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="panel-footer-actions">
          <a className="button ghost" href={RUTA_CATALOGO} target="_blank" rel="noreferrer">
            <ExternalLink /> Ver catálogo público
          </a>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-icon">{icon}</span>
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
