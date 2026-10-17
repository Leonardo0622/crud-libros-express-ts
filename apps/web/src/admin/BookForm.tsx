import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImageOff, ImagePlus, Upload, X } from "lucide-react";
import {
  PORTADA_MAX_BYTES,
  PORTADA_MIME_TIPOS,
  type EstadoLibro,
  type Libro,
  type LibroInput,
  type PortadaMime,
} from "@crud-libros/types";
import { api, ApiError } from "../lib/api";

interface Props {
  libro: Libro | null;
  onClose: () => void;
  /** Persiste el libro. Si lanza, el formulario permanece abierto con el error. */
  onSave: (input: LibroInput) => Promise<void>;
}

const MB = 1024 * 1024;

function validarArchivo(file: File): string | null {
  if (!PORTADA_MIME_TIPOS.includes(file.type as PortadaMime)) {
    return "Formato no permitido. Usa PNG, JPG, WEBP o GIF.";
  }
  if (file.size > PORTADA_MAX_BYTES) {
    return `La imagen no puede superar los ${Math.round(PORTADA_MAX_BYTES / MB)} MB.`;
  }
  return null;
}

/** Formulario de creación/edición de un libro (panel de administración). */
export function BookForm({ libro, onClose, onSave }: Props) {
  const [titulo, setTitulo] = useState(libro?.titulo ?? "");
  const [autor, setAutor] = useState(libro?.autor ?? "");
  const [descripcion, setDescripcion] = useState(libro?.descripcion ?? "");
  const [estado, setEstado] = useState<EstadoLibro>(libro?.estado ?? "borrador");

  const [imagenUrl, setImagenUrl] = useState<string | null>(libro?.imagenUrl ?? null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(libro?.imagenUrl ?? null);
  const objetoUrlRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [estadoEnvio, setEstadoEnvio] = useState<"idle" | "subiendo" | "guardando">("idle");

  // Libera la URL de objeto del preview al desmontar o reemplazarla.
  useEffect(() => {
    return () => {
      if (objetoUrlRef.current) URL.revokeObjectURL(objetoUrlRef.current);
    };
  }, []);

  const seleccionarArchivo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const problema = validarArchivo(file);
    if (problema) {
      setError(problema);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (objetoUrlRef.current) URL.revokeObjectURL(objetoUrlRef.current);
    const url = URL.createObjectURL(file);
    objetoUrlRef.current = url;
    setError("");
    setArchivo(file);
    setPreview(url);
  };

  const quitarImagen = () => {
    if (objetoUrlRef.current) {
      URL.revokeObjectURL(objetoUrlRef.current);
      objetoUrlRef.current = null;
    }
    setArchivo(null);
    setPreview(null);
    setImagenUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    const tituloLimpio = titulo.trim();
    const autorLimpio = autor.trim();
    if (!tituloLimpio) return setError("El título es obligatorio.");
    if (tituloLimpio.length > 200) return setError("El título no puede superar los 200 caracteres.");
    if (!autorLimpio) return setError("El autor es obligatorio.");
    if (autorLimpio.length > 120) return setError("El autor no puede superar los 120 caracteres.");
    if (descripcion.trim().length > 2000) {
      return setError("La descripción no puede superar los 2000 caracteres.");
    }

    setError("");
    try {
      let urlFinal = imagenUrl;
      if (archivo) {
        setEstadoEnvio("subiendo");
        urlFinal = await api.subirImagen(archivo);
      }
      setEstadoEnvio("guardando");
      await onSave({
        titulo: tituloLimpio,
        autor: autorLimpio,
        descripcion: descripcion.trim(),
        imagenUrl: urlFinal,
        estado,
      });
    } catch (err) {
      setEstadoEnvio("idle");
      setError(
        err instanceof ApiError
          ? err.detalles?.join(" · ") ?? err.message
          : "No se pudo guardar el libro."
      );
    }
  };

  const ocupado = estadoEnvio !== "idle";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={libro ? "Editar libro" : "Añadir libro"}>
      <div className="form-dialog">
        <div className="dialog-header">
          <div>
            <p className="eyebrow">CATÁLOGO</p>
            <h2>{libro ? "Editar libro" : "Añadir libro"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" disabled={ocupado}>
            <X />
          </button>
        </div>

        <form onSubmit={submit}>
          <label>
            Título del libro
            <input
              autoFocus
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. El nombre del viento"
              required
              maxLength={200}
              disabled={ocupado}
            />
          </label>

          <label>
            Autor
            <input
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              placeholder="Nombre del autor"
              required
              maxLength={120}
              disabled={ocupado}
            />
          </label>

          <label>
            Descripción
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve resumen del libro (opcional)"
              rows={4}
              maxLength={2000}
              disabled={ocupado}
            />
          </label>

          <label>
            Estado de publicación
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoLibro)}
              disabled={ocupado}
            >
              <option value="borrador">Borrador (no visible en el catálogo público)</option>
              <option value="publicado">Publicado (visible para los lectores)</option>
            </select>
          </label>

          <div className="cover-field">
            <span className="cover-field-label">Imagen de portada</span>
            <div className="cover-field-body">
              <div className="cover-preview" data-vacia={!preview}>
                {preview ? (
                  <img src={preview} alt="Vista previa de la portada" />
                ) : (
                  <span className="cover-preview-empty">
                    <ImageOff />
                    Sin portada
                  </span>
                )}
              </div>

              <div className="cover-field-actions">
                <input
                  ref={inputRef}
                  id="portada-input"
                  type="file"
                  accept={PORTADA_MIME_TIPOS.join(",")}
                  onChange={seleccionarArchivo}
                  disabled={ocupado}
                  hidden
                />
                <label htmlFor="portada-input" className={`button ghost ${ocupado ? "disabled" : ""}`}>
                  <ImagePlus /> {preview ? "Cambiar imagen" : "Seleccionar imagen"}
                </label>
                {preview && (
                  <button type="button" className="button ghost" onClick={quitarImagen} disabled={ocupado}>
                    <X /> Quitar
                  </button>
                )}
                <p className="cover-field-hint">PNG, JPG, WEBP o GIF · máx. 5 MB.</p>
              </div>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="dialog-actions">
            <button type="button" className="button ghost" onClick={onClose} disabled={ocupado}>
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={ocupado}>
              {estadoEnvio === "subiendo" ? (
                <>
                  <Upload /> Subiendo portada…
                </>
              ) : estadoEnvio === "guardando" ? (
                <>
                  <span className="spinner" /> Guardando…
                </>
              ) : libro ? (
                "Guardar cambios"
              ) : (
                "Añadir libro"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
