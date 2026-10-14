import { useMemo, useState } from "react"
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, BookOpen, Check, ChevronDown,
  CircleHelp, LayoutDashboard, Library, Menu, MoreHorizontal, Pencil,
  Plus, Search, Settings, Trash2, Users, X
} from "lucide-react"

type Book = { id: number; title: string; author: string; category: string; status: "Disponible" | "Prestado"; updated: string }

const initialBooks: Book[] = [
  { id: 1, title: "Cien años de soledad", author: "Gabriel García Márquez", category: "Novela", status: "Disponible", updated: "Hoy, 09:42" },
  { id: 2, title: "El principito", author: "Antoine de Saint-Exupéry", category: "Ficción", status: "Prestado", updated: "Ayer, 16:20" },
  { id: 3, title: "1984", author: "George Orwell", category: "Distopía", status: "Disponible", updated: "12 oct, 11:05" },
  { id: 4, title: "Rayuela", author: "Julio Cortázar", category: "Novela", status: "Disponible", updated: "11 oct, 14:32" },
  { id: 5, title: "La sombra del viento", author: "Carlos Ruiz Zafón", category: "Misterio", status: "Prestado", updated: "10 oct, 08:17" },
]

function App() {
  const [books, setBooks] = useState(initialBooks)
  const [query, setQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Book | null>(null)
  const [selected, setSelected] = useState<Book | null>(null)
  const [deleting, setDeleting] = useState<Book | null>(null)
  const [toast, setToast] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)

  const filtered = useMemo(() => books.filter((book) => `${book.title} ${book.author} ${book.category}`.toLowerCase().includes(query.toLowerCase())), [books, query])
  const openCreate = () => { setEditing(null); setShowForm(true) }
  const openEdit = (book: Book) => { setEditing(book); setShowForm(true); setSelected(null) }
  const saveBook = (book: Book) => { setBooks((current) => editing ? current.map((item) => item.id === book.id ? book : item) : [book, ...current]); setShowForm(false); setToast(editing ? "Libro actualizado correctamente" : "Libro añadido correctamente"); setTimeout(() => setToast(""), 3000) }
  const removeBook = () => { if (!deleting) return; setBooks((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null); setToast("Libro eliminado"); setTimeout(() => setToast(""), 3000) }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="brand"><span className="brand-mark"><Library /></span><span>libra</span><button className="mobile-close" onClick={() => setMobileOpen(false)}><X /></button></div>
      <div className="workspace-label">ESPACIO DE TRABAJO</div>
      <nav className="nav-list">
        <button className="nav-item active"><LayoutDashboard /> <span>Resumen</span></button>
        <button className="nav-item"><BookOpen /> <span>Catálogo</span><span className="nav-count">24</span></button>
        <button className="nav-item"><Users /> <span>Lectores</span></button>
      </nav>
      <div className="sidebar-bottom"><button className="nav-item"><Settings /> <span>Configuración</span></button><button className="help-link"><CircleHelp /> Centro de ayuda</button><div className="user-mini"><div className="avatar">LG</div><div><strong>Laura García</strong><small>Administrador</small></div><MoreHorizontal /></div></div>
    </aside>
    {mobileOpen && <button className="sidebar-overlay" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} />}
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu /></button><div className="breadcrumbs"><span>Libra</span><b>/</b><strong>Resumen</strong></div><div className="topbar-actions"><div className="status-dot"><i /> API conectada</div><div className="avatar avatar-small">LG</div><ChevronDown className="chevron" /></div></header>
      <div className="page-content">
        <section className="page-heading"><div><p className="eyebrow">MARTES, 13 DE OCTUBRE DE 2026</p><h1>Buenos días, Laura <span>✦</span></h1><p className="subtitle">Aquí tienes lo más importante de tu biblioteca hoy.</p></div><button className="button primary" onClick={openCreate}><Plus /> Añadir libro</button></section>
        <section className="stats-grid"><Stat icon={<BookOpen />} label="Libros totales" value={books.length + 19} trend="12.5%" positive /><Stat icon={<Library />} label="Disponibles" value={books.filter((b) => b.status === "Disponible").length + 14} trend="8.2%" positive /><Stat icon={<Users />} label="Préstamos activos" value="38" trend="3.1%" /><Stat icon={<ArrowDownRight />} label="Devoluciones hoy" value="12" trend="4.6%" positive /></section>
        <section className="panel"><div className="panel-header"><div><h2>Catálogo de libros</h2><p>Gestiona y organiza todos los libros de tu biblioteca.</p></div><button className="button ghost">Ver todos <ArrowUpRight /></button></div><div className="toolbar"><div className="search-box"><Search /><input placeholder="Buscar por título, autor..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><button className="filter-button">Todos los estados <ChevronDown /></button></div><div className="table-wrap"><table><thead><tr><th>LIBRO</th><th>AUTOR</th><th>CATEGORÍA</th><th>ESTADO</th><th>ACTUALIZADO</th><th /></tr></thead><tbody>{filtered.map((book) => <tr key={book.id}><td><div className="book-cell"><div className="book-cover">{book.title.charAt(0)}</div><strong>{book.title}</strong></div></td><td className="muted">{book.author}</td><td><span className="category">{book.category}</span></td><td><span className={`status ${book.status === "Disponible" ? "available" : "loaned"}`}><i />{book.status}</span></td><td className="muted">{book.updated}</td><td><button className="icon-button" onClick={() => setSelected(book)} aria-label={`Acciones para ${book.title}`}><MoreHorizontal /></button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty">No encontramos libros con esa búsqueda.</div>}</div><div className="table-footer"><span>Mostrando <strong>1-{filtered.length}</strong> de <strong>{books.length}</strong> libros</span><div className="pagination"><button disabled>‹</button><button className="selected-page">1</button><button>2</button><button>3</button><button>›</button></div></div></section>
        <div className="api-note"><span><Check /></span><div><strong>Vista previa conectable</strong><p>Los datos mostrados son de ejemplo. La interfaz está lista para consumir tu API REST en cuanto integres el servicio.</p></div><button>Ver documentación <ArrowUpRight /></button></div>
      </div>
    </main>
    {selected && <div className="popover"><div className="popover-head"><strong>Acciones</strong><button onClick={() => setSelected(null)}><X /></button></div><button onClick={() => openEdit(selected)}><Pencil /> Editar libro</button><button className="danger-text" onClick={() => { setDeleting(selected); setSelected(null) }}><Trash2 /> Eliminar</button></div>}
    {showForm && <BookForm book={editing} onClose={() => setShowForm(false)} onSave={saveBook} />}
    {deleting && <div className="modal-backdrop"><div className="confirm-dialog"><div className="warning-icon"><AlertTriangle /></div><h2>¿Eliminar este libro?</h2><p>Se eliminará <strong>{deleting.title}</strong> del catálogo. Esta acción no se puede deshacer.</p><div className="dialog-actions"><button className="button ghost" onClick={() => setDeleting(null)}>Cancelar</button><button className="button destructive" onClick={removeBook}>Eliminar libro</button></div></div></div>}
    {toast && <div className="toast"><Check /> {toast}</div>}
  </div>
}

function Stat({ icon, label, value, trend, positive = false }: { icon: React.ReactNode; label: string; value: string | number; trend: string; positive?: boolean }) { return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span><span className={`trend ${positive ? "positive" : "neutral"}`}>{positive ? <ArrowUpRight /> : <ArrowDownRight />} {trend}</span></div><p>{label}</p><strong>{value}</strong><small>vs. mes anterior</small></div> }

function BookForm({ book, onClose, onSave }: { book: Book | null; onClose: () => void; onSave: (book: Book) => void }) { const [title, setTitle] = useState(book?.title ?? ""); const [author, setAuthor] = useState(book?.author ?? ""); const [category, setCategory] = useState(book?.category ?? "Novela"); const [status, setStatus] = useState<Book["status"]>(book?.status ?? "Disponible"); const submit = (e: React.FormEvent) => { e.preventDefault(); if (!title || !author) return; onSave({ id: book?.id ?? Date.now(), title, author, category, status, updated: "Ahora" }) }; return <div className="modal-backdrop"><div className="form-dialog"><div className="dialog-header"><div><p className="eyebrow">CATÁLOGO</p><h2>{book ? "Editar libro" : "Añadir libro"}</h2></div><button onClick={onClose}><X /></button></div><form onSubmit={submit}><label>Título del libro<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. El nombre del viento" required /></label><label>Autor<input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Nombre del autor" required /></label><div className="form-row"><label>Categoría<select value={category} onChange={(e) => setCategory(e.target.value)}><option>Novela</option><option>Ficción</option><option>Distopía</option><option>Misterio</option><option>Ensayo</option></select></label><label>Estado<select value={status} onChange={(e) => setStatus(e.target.value as Book["status"])}><option>Disponible</option><option>Prestado</option></select></label></div><div className="dialog-actions"><button type="button" className="button ghost" onClick={onClose}>Cancelar</button><button type="submit" className="button primary">{book ? "Guardar cambios" : "Añadir libro"}</button></div></form></div></div> }

export default App
