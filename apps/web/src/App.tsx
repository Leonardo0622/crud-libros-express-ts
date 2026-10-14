import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, LayoutDashboard, Library, LogOut, Menu, MoreHorizontal, Pencil,
  Plus, Search, Settings, Trash2, Users, X
} from "lucide-react"
import type { Libro, LibroInput, Pagination } from "@crud-libros/types"
import { api, ApiError } from "./lib/api"
import { useAuth } from "./hooks/useAuth"
import { LoginScreen } from "./components/LoginScreen"

const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH ?? "admin"
const LIMIT = 10

function formatFecha(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
}

function App() {
  const rutaActual = window.location.pathname.replace(/\/+$/, "")
  const esRutaAdmin = rutaActual === `/${ADMIN_PATH}`

  if (!esRutaAdmin) return <NotFound />

  return <AdminPanel />
}

function AdminPanel() {
  const { user, loading: cargandoSesion, login, logout } = useAuth()

  if (cargandoSesion) {
    return <div className="boot-screen"><span className="spinner" /> Cargando…</div>
  }

  if (!user) return <LoginScreen onLogin={login} />

  return <Dashboard user={user} onLogout={logout} />
}

function Dashboard({ user, onLogout }: { user: { email: string; role: string }; onLogout: () => void }) {
  const [libros, setLibros] = useState<Libro[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Libro | null>(null)
  const [selected, setSelected] = useState<Libro | null>(null)
  const [deleting, setDeleting] = useState<Libro | null>(null)
  const [toast, setToast] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)

  const notificar = useCallback((mensaje: string) => {
    setToast(mensaje)
    setTimeout(() => setToast(""), 3000)
  }, [])

  const manejarError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        onLogout()
        return
      }
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado")
    },
    [onLogout]
  )

  // Debounce de la búsqueda
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(query.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError("")
    try {
      const res = await api.listarLibros({ page, limit: LIMIT, titulo: busqueda || undefined })
      setLibros(res.data)
      setPagination(res.pagination)
    } catch (err) {
      manejarError(err)
    } finally {
      setCargando(false)
    }
  }, [page, busqueda, manejarError])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const openCreate = () => { setEditing(null); setShowForm(true) }
  const openEdit = (libro: Libro) => { setEditing(libro); setShowForm(true); setSelected(null) }

  const saveBook = async (input: LibroInput) => {
    try {
      if (editing) {
        await api.actualizarLibro(editing.id, input)
        notificar("Libro actualizado correctamente")
      } else {
        await api.crearLibro(input)
        notificar("Libro añadido correctamente")
      }
      setShowForm(false)
      await cargar()
    } catch (err) {
      manejarError(err)
    }
  }

  const removeBook = async () => {
    if (!deleting) return
    try {
      await api.eliminarLibro(deleting.id)
      setDeleting(null)
      notificar("Libro eliminado")
      await cargar()
    } catch (err) {
      manejarError(err)
    }
  }

  const total = pagination?.total ?? 0
  const totalPages = pagination?.totalPages ?? 0
  const ultimaActualizacion = useMemo(() => {
    if (libros.length === 0) return "—"
    return formatFecha(libros.reduce((max, l) => (l.updatedAt > max ? l.updatedAt : max), libros[0]!.updatedAt))
  }, [libros])

  const iniciales = user.email.slice(0, 2).toUpperCase()

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="brand"><span className="brand-mark"><Library /></span><span>libra</span><button className="mobile-close" onClick={() => setMobileOpen(false)}><X /></button></div>
      <div className="workspace-label">ESPACIO DE TRABAJO</div>
      <nav className="nav-list">
        <button className="nav-item active"><LayoutDashboard /> <span>Resumen</span></button>
        <button className="nav-item"><BookOpen /> <span>Catálogo</span><span className="nav-count">{total}</span></button>
        <button className="nav-item"><Users /> <span>Lectores</span></button>
      </nav>
      <div className="sidebar-bottom">
        <button className="nav-item"><Settings /> <span>Configuración</span></button>
        <button className="help-link"><CircleHelp /> Centro de ayuda</button>
        <div className="user-mini"><div className="avatar">{iniciales}</div><div><strong>{user.email}</strong><small>{user.role}</small></div><button className="icon-button" onClick={onLogout} aria-label="Cerrar sesión"><LogOut /></button></div>
      </div>
    </aside>
    {mobileOpen && <button className="sidebar-overlay" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} />}
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu /></button><div className="breadcrumbs"><span>Libra</span><b>/</b><strong>Resumen</strong></div><div className="topbar-actions"><div className="status-dot"><i /> API conectada</div><div className="avatar avatar-small">{iniciales}</div><ChevronDown className="chevron" /></div></header>
      <div className="page-content">
        <section className="page-heading"><div><p className="eyebrow">PANEL DE ADMINISTRACIÓN</p><h1>Catálogo de libros</h1><p className="subtitle">Gestiona y organiza todos los libros de tu biblioteca.</p></div><button className="button primary" onClick={openCreate}><Plus /> Añadir libro</button></section>
        <section className="stats-grid">
          <Stat icon={<BookOpen />} label="Libros totales" value={total} />
          <Stat icon={<Library />} label="En esta página" value={libros.length} />
          <Stat icon={<LayoutDashboard />} label="Página" value={totalPages === 0 ? "0 / 0" : `${page} / ${totalPages}`} />
          <Stat icon={<Check />} label="Última actualización" value={ultimaActualizacion} />
        </section>
        <section className="panel">
          <div className="panel-header"><div><h2>Catálogo de libros</h2><p>Gestiona y organiza todos los libros de tu biblioteca.</p></div></div>
          <div className="toolbar"><div className="search-box"><Search /><input placeholder="Buscar por título..." value={query} onChange={(e) => setQuery(e.target.value)} /></div></div>
          {error && <div className="panel-error">{error}</div>}
          <div className="table-wrap">
            <table>
              <thead><tr><th>LIBRO</th><th>AUTOR</th><th>ACTUALIZADO</th><th /></tr></thead>
              <tbody>
                {libros.map((libro) => <tr key={libro.id}>
                  <td><div className="book-cell"><div className="book-cover">{libro.titulo.charAt(0)}</div><strong>{libro.titulo}</strong></div></td>
                  <td className="muted">{libro.autor}</td>
                  <td className="muted">{formatFecha(libro.updatedAt)}</td>
                  <td><button className="icon-button" onClick={() => setSelected(libro)} aria-label={`Acciones para ${libro.titulo}`}><MoreHorizontal /></button></td>
                </tr>)}
              </tbody>
            </table>
            {cargando && <div className="empty"><span className="spinner" /> Cargando libros…</div>}
            {!cargando && libros.length === 0 && <div className="empty">No encontramos libros con esa búsqueda.</div>}
          </div>
          <div className="table-footer">
            <span>Mostrando <strong>{libros.length}</strong> de <strong>{total}</strong> libros</span>
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft /></button>
              <button className="selected-page">{page}</button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></button>
            </div>
          </div>
        </section>
      </div>
    </main>
    {selected && <div className="popover"><div className="popover-head"><strong>Acciones</strong><button onClick={() => setSelected(null)}><X /></button></div><button onClick={() => openEdit(selected)}><Pencil /> Editar libro</button><button className="danger-text" onClick={() => { setDeleting(selected); setSelected(null) }}><Trash2 /> Eliminar</button></div>}
    {showForm && <BookForm libro={editing} onClose={() => setShowForm(false)} onSave={saveBook} />}
    {deleting && <div className="modal-backdrop"><div className="confirm-dialog"><div className="warning-icon"><AlertTriangle /></div><h2>¿Eliminar este libro?</h2><p>Se eliminará <strong>{deleting.titulo}</strong> del catálogo. Esta acción no se puede deshacer.</p><div className="dialog-actions"><button className="button ghost" onClick={() => setDeleting(null)}>Cancelar</button><button className="button destructive" onClick={removeBook}>Eliminar libro</button></div></div></div>}
    {toast && <div className="toast"><Check /> {toast}</div>}
  </div>
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span></div><p>{label}</p><strong>{value}</strong></div>
}

function BookForm({ libro, onClose, onSave }: { libro: Libro | null; onClose: () => void; onSave: (input: LibroInput) => void }) {
  const [titulo, setTitulo] = useState(libro?.titulo ?? "")
  const [autor, setAutor] = useState(libro?.autor ?? "")
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim() || !autor.trim()) return
    onSave({ titulo: titulo.trim(), autor: autor.trim() })
  }
  return <div className="modal-backdrop"><div className="form-dialog">
    <div className="dialog-header"><div><p className="eyebrow">CATÁLOGO</p><h2>{libro ? "Editar libro" : "Añadir libro"}</h2></div><button onClick={onClose}><X /></button></div>
    <form onSubmit={submit}>
      <label>Título del libro<input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. El nombre del viento" required maxLength={200} /></label>
      <label>Autor<input value={autor} onChange={(e) => setAutor(e.target.value)} placeholder="Nombre del autor" required maxLength={120} /></label>
      <div className="dialog-actions"><button type="button" className="button ghost" onClick={onClose}>Cancelar</button><button type="submit" className="button primary">{libro ? "Guardar cambios" : "Añadir libro"}</button></div>
    </form>
  </div></div>
}

function NotFound() {
  return <div className="boot-screen"><div className="notfound"><h1>404</h1><p>Página no encontrada.</p></div></div>
}

export default App
