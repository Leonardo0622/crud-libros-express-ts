/** Ruta del panel de administración (debe coincidir con ADMIN_PATH del API). */
export const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH ?? "admin";
export const RUTA_ADMIN = `/${ADMIN_PATH}`;
export const RUTA_CATALOGO = "/libros";
export const RUTA_AYUDA = "/ayuda";
