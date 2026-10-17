import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

/**
 * Router mínimo basado en History API (sin dependencias).
 * Las páginas se resuelven por `window.location.pathname` en App.tsx.
 */

export function usePathname(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const alCambiar = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", alCambiar);
    return () => window.removeEventListener("popstate", alCambiar);
  }, []);

  return pathname;
}

/** Navega a una ruta interna y fuerza el re-render. */
export function navigate(to: string): void {
  const destino = to.startsWith("/") ? to : `/${to}`;
  const actual = `${window.location.pathname}${window.location.search}`;
  if (actual === destino) return;
  window.history.pushState({}, "", destino);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0 });
}

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  "aria-label"?: string;
}

/** Enlace interno accesible (respeta ctrl/cmd/click central para abrir en otra pestaña). */
export function Link({ to, children, className, title, onClick, ...rest }: LinkProps) {
  const manejar = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    onClick?.();
    navigate(to);
  };

  return (
    <a href={to} className={className} title={title} onClick={manejar} {...rest}>
      {children}
    </a>
  );
}
