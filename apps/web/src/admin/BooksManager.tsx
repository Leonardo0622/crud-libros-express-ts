import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { Libro, LibroInput, Pagination } from "@crud-libros/types";
import { api, ApiError } from "../lib/api";
import { CoverImage } from "../components/CoverImage";
import { Cargando, EstadoVacio, MensajeError } from "../components/Feedback";
import { formatFecha } from "../lib/format";
import { BookForm } from "./BookForm";

const LIMIT = 10;

interface Props {
  onLogout: () => void;
  /** Se pone a true desde el Resumen para abrir directamente "Añadir libro". */
  abrirNuevo: boolean;
  onAbrirNuevoConsumido: () => void;
}

/** Gestión del catálogo: crear, editar, publicar/retirar y eliminar libros. */
export function BooksManager({ onLogout, abrirNuevo, onAbrirNuevoConsumido }: Props) {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Libro | null>(null);
  const [deleting, setDeleting] = useState<Libro | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const notificar = useCallback((mensaje: string) => {
    setToast(mensaje);
    setTimeout(() => setToast(""), 3000);
  }, []);

  const manejarError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        onLogout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado");
    },
    [onLogout]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(query.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const res = await api.listarLibrosAdmin({ page, limit: LIMIT, q: busqueda || undefined });
      setLibros(res.data);
      setPagination(res.pagination);
    } catch (err) {
      manejarError(err);
    } finally {
      setCargando(false);
    }
  }, [page, busqueda, manejarError]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setShowForm(true);
    setMenuId(null);
  }, []);

  // Abre el formulario si el Resumen lo solicitó.
  useEffect(() => {
    if (abrirNuevo) {
      openCreate();
      onAbrirNuevoConsumido();
    }
  }, [abrirNuevo, openCreate, onAbrirNuevoConsumido]);

  const saveBook = async (input: LibroInput) => {
    try {
      if (editing) {
        await api.actualizarLibro(editing.id, input);
        notificar("Libro actualizado correctamente");
      } else {
        await api.crearLibro(input);
        notificar("Libro añadido correctamente");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onLogout();
        return;
      }
      throw err;
    }
    setShowForm(false);
    setEditing(null);
    await cargar();
  };

  const cambiarEstado = async (libro: Libro) => {
    const nuevo = libro.estado === "publicado" ? "borrador" : "publicado";
    try {
      await api.cambiarEstado(libro.id, nuevo);
      notificar(nuevo === "publicado" ? "Libro publicado" : "Libro retirado del catálogo");
      setMenuId(null);
      await cargar();
    } catch (err) {
      manejarError(err);
    }
  };

  const removeBook = async () => {
    if (!deleting) return;
    try {
      await api.eliminarLibro(deleting.id);
      setDeleting(null);
      notificar("Libro eliminado");
      await cargar();
    } catch (err) {
      setDeleting(null);
      manejarError(err);
    }
  };

  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">GESTIÓN</p>
          <h1>Catálogo de libros</h1>
          <p className="subtitle">Crea, edita, publica o retira los libros de la biblioteca.</p>
        </div>
        <button className="button primary" onClick={openCreate}>
          <Plus /> Añadir libro
        </button>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Libros</h2>
            <p>Administra todos los títulos, publicados y en borrador.</p>
          </div>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <Search />
            <input
              placeholder="Buscar por título o autor…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar libros"
            />
          </div>
        </div>

        {error && <MensajeError>{error}</MensajeError>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>LIBRO</th>
                <th>AUTOR</th>
                <th>ESTADO</th>
                <th>ACTUALIZADO</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {libros.map((libro) => (
                <tr key={libro.id}>
                  <td>
                    <div className="book-cell">
                      <CoverImage src={libro.imagenUrl} titulo={libro.titulo} className="table-cover" />
                      <strong>{libro.titulo}</strong>
                    </div>
                  </td>
                  <td className="muted">{libro.autor}</td>
                  <td>
                    <span className={`badge badge-${libro.estado}`}>
                      <i />
                      {libro.estado === "publicado" ? "Publicado" : "Borrador"}
                    </span>
                  </td>
                  <td className="muted">{formatFecha(libro.updatedAt)}</td>
                  <td className="row-actions">
                    <button
                      className="icon-button"
                      onClick={() => setMenuId((id) => (id === libro.id ? null : libro.id))}
                      aria-label={`Acciones para ${libro.titulo}`}
                      aria-haspopup="menu"
                      aria-expanded={menuId === libro.id}
                    >
                      <MoreHorizontal />
                    </button>
                    {menuId === libro.id && (
                      <RowMenu
                        onClose={() => setMenuId(null)}
                        onEdit={() => {
                          setEditing(libro);
                          setShowForm(true);
                          setMenuId(null);
                        }}
                        onToggleEstado={() => void cambiarEstado(libro)}
                        onDelete={() => {
                          setDeleting(libro);
                          setMenuId(null);
                        }}
                        estado={libro.estado}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {cargando && <Cargando>Cargando libros…</Cargando>}
          {!cargando && libros.length === 0 && (
            <EstadoVacio titulo="No hay libros">
              {busqueda
                ? `No encontramos resultados para “${busqueda}”.`
                : "Todavía no has añadido ningún libro. Usa “Añadir libro”."}
            </EstadoVacio>
          )}
        </div>

        <div className="table-footer">
          <span>
            Mostrando <strong>{libros.length}</strong> de <strong>{total}</strong> libros
          </span>
          <div className="pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              <ChevronLeft />
            </button>
            <button className="selected-page" aria-current="page">
              {page}
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Página siguiente"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </section>

      {showForm && (
        <BookForm
          libro={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={saveBook}
        />
      )}

      {deleting && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <div className="warning-icon">
              <AlertTriangle />
            </div>
            <h2>¿Eliminar este libro?</h2>
            <p>
              Se eliminará <strong>{deleting.titulo}</strong> del catálogo. Esta acción no se puede
              deshacer.
            </p>
            <div className="dialog-actions">
              <button className="button ghost" onClick={() => setDeleting(null)}>
                Cancelar
              </button>
              <button className="button destructive" onClick={removeBook}>
                Eliminar libro
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <Check /> {toast}
        </div>
      )}
    </div>
  );
}

/** Menú de acciones de una fila. */
function RowMenu({
  onClose,
  onEdit,
  onToggleEstado,
  onDelete,
  estado,
}: {
  onClose: () => void;
  onEdit: () => void;
  onToggleEstado: () => void;
  onDelete: () => void;
  estado: Libro["estado"];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alClicarFuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", alClicarFuera);
    document.addEventListener("keydown", alPulsarTecla);
    return () => {
      document.removeEventListener("mousedown", alClicarFuera);
      document.removeEventListener("keydown", alPulsarTecla);
    };
  }, [onClose]);

  return (
    <div className="row-menu" ref={ref} role="menu">
      <button role="menuitem" onClick={onEdit}>
        <Pencil /> Editar
      </button>
      <button role="menuitem" onClick={onToggleEstado}>
        {estado === "publicado" ? (
          <>
            <EyeOff /> Retirar del catálogo
          </>
        ) : (
          <>
            <Eye /> Publicar
          </>
        )}
      </button>
      <button role="menuitem" className="danger-text" onClick={onDelete}>
        <Trash2 /> Eliminar
      </button>
    </div>
  );
}
