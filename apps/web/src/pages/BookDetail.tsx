import { useEffect, useState } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
import type { Libro } from "@crud-libros/types";
import { api, ApiError } from "../lib/api";
import { PublicLayout } from "../components/PublicLayout";
import { CoverImage } from "../components/CoverImage";
import { Cargando, EstadoVacio, MensajeError } from "../components/Feedback";
import { Link } from "../lib/router";
import { RUTA_CATALOGO } from "../lib/config";
import { formatFecha } from "../lib/format";

/** Detalle público de un libro publicado. */
export function BookDetail({ id }: { id: string }) {
  const [libro, setLibro] = useState<Libro | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [noExiste, setNoExiste] = useState(false);

  useEffect(() => {
    const numerico = Number(id);
    if (!Number.isInteger(numerico) || numerico <= 0) {
      setNoExiste(true);
      setCargando(false);
      return;
    }

    let activo = true;
    setCargando(true);
    setError("");
    setNoExiste(false);

    api
      .obtenerLibroPublico(numerico)
      .then((data) => {
        if (activo) setLibro(data);
      })
      .catch((err) => {
        if (!activo) return;
        if (err instanceof ApiError && err.status === 404) setNoExiste(true);
        else setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  return (
    <PublicLayout activo="catalogo">
      <div className="detail-wrap">
        <Link to={RUTA_CATALOGO} className="detail-back">
          <ArrowLeft /> Volver al catálogo
        </Link>

        {error ? (
          <MensajeError>{error}</MensajeError>
        ) : cargando ? (
          <Cargando>Cargando libro…</Cargando>
        ) : noExiste || !libro ? (
          <EstadoVacio titulo="Libro no encontrado">
            Este libro no existe o ya no está publicado en el catálogo.
          </EstadoVacio>
        ) : (
          <article className="detail-card">
            <CoverImage src={libro.imagenUrl} titulo={libro.titulo} className="detail-cover" />
            <div className="detail-body">
              <p className="eyebrow">LIBRO</p>
              <h1>{libro.titulo}</h1>
              <p className="detail-author">{libro.autor}</p>
              {libro.descripcion ? (
                <p className="detail-desc">{libro.descripcion}</p>
              ) : (
                <p className="detail-desc muted">Este libro todavía no tiene una descripción.</p>
              )}
              <p className="detail-meta">
                <Calendar aria-hidden="true" /> Publicado el {formatFecha(libro.createdAt)}
              </p>
            </div>
          </article>
        )}
      </div>
    </PublicLayout>
  );
}
