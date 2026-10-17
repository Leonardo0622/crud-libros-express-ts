import type { Libro } from "@crud-libros/types";
import { CoverImage } from "./CoverImage";
import { extracto } from "../lib/format";
import { Link } from "../lib/router";

/** Tarjeta de un libro para el catálogo público. */
export function BookCard({ libro }: { libro: Libro }) {
  return (
    <article className="book-card">
      <Link to={`/libros/${libro.id}`} className="book-card-link" aria-label={`Ver ${libro.titulo}`}>
        <CoverImage src={libro.imagenUrl} titulo={libro.titulo} className="card-cover" />
        <div className="book-card-body">
          <h3 className="book-card-title">{libro.titulo}</h3>
          <p className="book-card-author">{libro.autor}</p>
          {libro.descripcion ? (
            <p className="book-card-desc">{extracto(libro.descripcion, 110)}</p>
          ) : (
            <p className="book-card-desc muted">Sin descripción.</p>
          )}
        </div>
      </Link>
    </article>
  );
}
