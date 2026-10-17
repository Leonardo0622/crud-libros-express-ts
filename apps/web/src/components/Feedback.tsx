import type { ReactNode } from "react";
import { AlertTriangle, BookX } from "lucide-react";

/** Spinner + texto para estados de carga. */
export function Cargando({ children = "Cargando…" }: { children?: ReactNode }) {
  return (
    <div className="feedback" role="status" aria-live="polite">
      <span className="spinner" />
      <span>{children}</span>
    </div>
  );
}

/** Bloque de error reutilizable. */
export function MensajeError({ children }: { children: ReactNode }) {
  return (
    <div className="feedback error" role="alert">
      <AlertTriangle />
      <span>{children}</span>
    </div>
  );
}

/** Estado vacío reutilizable. */
export function EstadoVacio({
  titulo,
  children,
}: {
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <div className="feedback empty-state">
      <BookX aria-hidden="true" />
      <strong>{titulo}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}
