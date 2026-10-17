import { usePathname } from "./lib/router";
import { RUTA_ADMIN, RUTA_AYUDA, RUTA_CATALOGO } from "./lib/config";
import { AdminPanel } from "./admin/AdminPanel";
import { PublicHome } from "./pages/PublicHome";
import { Catalog } from "./pages/Catalog";
import { BookDetail } from "./pages/BookDetail";
import { HelpCenter } from "./pages/HelpCenter";
import { NotFound } from "./pages/NotFound";

/** Normaliza el pathname: sin barras finales, con "/" para la raíz. */
function normalizar(pathname: string): string {
  const sinBarras = pathname.replace(/\/+$/, "");
  return sinBarras === "" ? "/" : sinBarras;
}

function App() {
  const pathname = usePathname();
  const path = normalizar(pathname);

  if (path === RUTA_ADMIN) return <AdminPanel />;
  if (path === "/") return <PublicHome />;
  if (path === RUTA_CATALOGO) return <Catalog />;
  if (path.startsWith(`${RUTA_CATALOGO}/`)) {
    return <BookDetail id={path.slice(RUTA_CATALOGO.length + 1)} />;
  }
  if (path === RUTA_AYUDA) return <HelpCenter />;

  return <NotFound />;
}

export default App;
