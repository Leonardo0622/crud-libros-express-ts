import { useState } from "react";
import { Library, Lock, Mail } from "lucide-react";
import type { LoginInput } from "@crud-libros/types";
import { ApiError } from "../lib/api";

interface Props {
  onLogin: (input: LoginInput) => Promise<unknown>;
}

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await onLogin({ email, password });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detalles?.join(" · ") ?? err.message);
      } else {
        setError("No se pudo iniciar sesión");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <span className="brand-mark">
            <Library />
          </span>
          <span>libra</span>
        </div>
        <h1>Panel de administración</h1>
        <p className="login-subtitle">Inicia sesión para gestionar el catálogo.</p>

        <label>
          Email
          <div className="input-with-icon">
            <Mail />
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoFocus
            />
          </div>
        </label>

        <label>
          Contraseña
          <div className="input-with-icon">
            <Lock />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
        </label>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="button primary login-submit" disabled={enviando}>
          {enviando ? "Entrando…" : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
