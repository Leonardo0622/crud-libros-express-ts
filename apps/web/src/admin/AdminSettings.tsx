import { LogOut, Shield, UserRound } from "lucide-react";
import type { AuthUser } from "@crud-libros/types";
import { RUTA_ADMIN } from "../lib/config";

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

/** Vista "Configuración": datos reales de la sesión actual. */
export function AdminSettings({ user, onLogout }: Props) {
  const apiUrl = import.meta.env.VITE_API_URL || "(proxy /api en desarrollo)";

  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">CONFIGURACIÓN</p>
          <h1>Tu sesión</h1>
          <p className="subtitle">Información de la cuenta autenticada y opciones disponibles.</p>
        </div>
        <button className="button destructive" onClick={onLogout}>
          <LogOut /> Cerrar sesión
        </button>
      </section>

      <section className="panel settings-panel">
        <div className="settings-row">
          <span className="stat-icon">
            <UserRound />
          </span>
          <div>
            <p className="settings-label">Email</p>
            <strong>{user.email}</strong>
          </div>
        </div>
        <div className="settings-row">
          <span className="stat-icon">
            <Shield />
          </span>
          <div>
            <p className="settings-label">Rol</p>
            <strong>{user.role}</strong>
          </div>
        </div>
        <div className="settings-row">
          <span className="stat-icon">
            <Shield />
          </span>
          <div>
            <p className="settings-label">Identificador de sesión</p>
            <strong className="mono">{user.id}</strong>
          </div>
        </div>
        <div className="settings-row">
          <span className="stat-icon">
            <Shield />
          </span>
          <div>
            <p className="settings-label">Ruta del panel</p>
            <strong className="mono">{RUTA_ADMIN}</strong>
          </div>
        </div>
        <div className="settings-row">
          <span className="stat-icon">
            <Shield />
          </span>
          <div>
            <p className="settings-label">API configurada</p>
            <strong className="mono">{apiUrl}</strong>
          </div>
        </div>
      </section>

      <p className="settings-note">
        Libra no guarda preferencias por usuario. Las únicas acciones disponibles son consultar esta
        sesión y cerrarla.
      </p>
    </div>
  );
}
