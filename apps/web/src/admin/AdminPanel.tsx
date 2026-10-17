import { useAuth } from "../hooks/useAuth";
import { LoginScreen } from "../components/LoginScreen";
import { AdminShell } from "./AdminShell";

/** Punto de entrada del panel privado: gestiona sesión y login. */
export function AdminPanel() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="boot-screen">
        <span className="spinner" /> Cargando…
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={login} />;

  return <AdminShell user={user} onLogout={() => void logout()} />;
}
