import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CircleHelp,
  ExternalLink,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import type { AuthUser } from "@crud-libros/types";
import { navigate } from "../lib/router";
import { RUTA_AYUDA, RUTA_CATALOGO } from "../lib/config";
import { AdminDashboard } from "./AdminDashboard";
import { BooksManager } from "./BooksManager";
import { AdminSettings } from "./AdminSettings";

type Vista = "resumen" | "catalogo" | "configuracion";

const TITULO_VISTA: Record<Vista, string> = {
  resumen: "Resumen",
  catalogo: "Catálogo",
  configuracion: "Configuración",
};

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

/** Estructura del panel: sidebar de navegación, cabecera y vistas. */
export function AdminShell({ user, onLogout }: Props) {
  const [vista, setVista] = useState<Vista>("resumen");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [abrirNuevo, setAbrirNuevo] = useState(false);

  const iniciales = user.email.slice(0, 2).toUpperCase();

  const irA = (destino: Vista) => {
    setVista(destino);
    setMobileOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <Library />
          </span>
          <span>libra</span>
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
            <X />
          </button>
        </div>

        <div className="workspace-label">ESPACIO DE TRABAJO</div>
        <nav className="nav-list" aria-label="Navegación del panel">
          <button
            className={`nav-item ${vista === "resumen" ? "active" : ""}`}
            onClick={() => irA("resumen")}
            aria-current={vista === "resumen" ? "page" : undefined}
          >
            <LayoutDashboard /> <span>Resumen</span>
          </button>
          <button
            className={`nav-item ${vista === "catalogo" ? "active" : ""}`}
            onClick={() => irA("catalogo")}
            aria-current={vista === "catalogo" ? "page" : undefined}
          >
            <BookOpen /> <span>Catálogo</span>
          </button>
          <a className="nav-item" href={RUTA_CATALOGO} target="_blank" rel="noreferrer">
            <ExternalLink /> <span>Catálogo público</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${vista === "configuracion" ? "active" : ""}`}
            onClick={() => irA("configuracion")}
            aria-current={vista === "configuracion" ? "page" : undefined}
          >
            <Settings /> <span>Configuración</span>
          </button>
          <button className="nav-item" onClick={() => navigate(RUTA_AYUDA)}>
            <CircleHelp /> <span>Centro de ayuda</span>
          </button>
          <div className="user-mini">
            <div className="avatar">{iniciales}</div>
            <div>
              <strong>{user.email}</strong>
              <small>{user.role}</small>
            </div>
            <button className="icon-button" onClick={onLogout} aria-label="Cerrar sesión">
              <LogOut />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <button className="sidebar-overlay" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} />
      )}

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
            <Menu />
          </button>
          <div className="breadcrumbs">
            <span>Libra</span>
            <b>/</b>
            <strong>{TITULO_VISTA[vista]}</strong>
          </div>
          <div className="topbar-actions">
            <div className="status-dot">
              <i /> API conectada
            </div>
            <PerfilMenu user={user} onLogout={onLogout} iniciales={iniciales} />
          </div>
        </header>

        {vista === "resumen" && (
          <AdminDashboard
            onLogout={onLogout}
            onIrACatalogo={() => setVista("catalogo")}
            onNuevoLibro={() => {
              setVista("catalogo");
              setAbrirNuevo(true);
            }}
          />
        )}
        {vista === "catalogo" && (
          <BooksManager
            onLogout={onLogout}
            abrirNuevo={abrirNuevo}
            onAbrirNuevoConsumido={() => setAbrirNuevo(false)}
          />
        )}
        {vista === "configuracion" && <AdminSettings user={user} onLogout={onLogout} />}
      </main>
    </div>
  );
}

/** Menú del perfil en la cabecera. */
function PerfilMenu({
  user,
  onLogout,
  iniciales,
}: {
  user: AuthUser;
  onLogout: () => void;
  iniciales: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const alClicarFuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", alClicarFuera);
    document.addEventListener("keydown", alPulsarTecla);
    return () => {
      document.removeEventListener("mousedown", alClicarFuera);
      document.removeEventListener("keydown", alPulsarTecla);
    };
  }, [abierto]);

  return (
    <div className="profile-menu" ref={ref}>
      <button
        className="profile-trigger"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de perfil"
      >
        <span className="avatar avatar-small">{iniciales}</span>
      </button>

      {abierto && (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown-head">
            <span className="avatar">{iniciales}</span>
            <div>
              <strong>{user.email}</strong>
              <small>{user.role}</small>
            </div>
          </div>
          <div className="profile-dropdown-divider" />
          <button
            role="menuitem"
            onClick={() => {
              setAbierto(false);
              navigate(RUTA_AYUDA);
            }}
          >
            <CircleHelp /> Centro de ayuda
          </button>
          <button
            role="menuitem"
            className="danger-text"
            onClick={() => {
              setAbierto(false);
              onLogout();
            }}
          >
            <LogOut /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
