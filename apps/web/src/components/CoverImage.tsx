import { useEffect, useState } from "react";

interface Props {
  src: string | null;
  titulo: string;
  /** Clase extra para variar el tamaño (p. ej. "card-cover" o "detail-cover"). */
  className?: string;
}

/**
 * Portada de un libro con imagen de reemplazo accesible si no hay imagen
 * o si la imagen no carga.
 */
export function CoverImage({ src, titulo, className }: Props) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const mostrarImagen = Boolean(src) && !error;
  const inicial = titulo.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className={`cover ${className ?? ""}`} data-vacia={!mostrarImagen}>
      {mostrarImagen ? (
        <img
          src={src as string}
          alt={`Portada de ${titulo}`}
          loading="lazy"
          decoding="async"
          onError={() => setError(true)}
        />
      ) : (
        <span className="cover-fallback" aria-hidden="true">
          {inicial}
        </span>
      )}
    </div>
  );
}
