/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del API. Vacío en desarrollo para usar el proxy de Vite (/api). */
  readonly VITE_API_URL?: string;
  /** Ruta del panel de administración (debe coincidir con ADMIN_PATH del API). */
  readonly VITE_ADMIN_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
