# Libra · Biblioteca digital (Express + TypeScript + React)

Monorepo con una API REST (Express + TypeScript) respaldada por **PostgreSQL (Supabase)** y una
aplicación web en React (Vite) que incluye:

- **Catálogo público** para lectores (sin cuenta): inicio, listado con buscador y paginación,
  y detalle de cada libro.
- **Panel de administración** privado: gestión completa del catálogo (crear, editar, publicar,
  retirar y eliminar) y subida de portadas.

Incluye autenticación de administrador con JWT en cookie `httpOnly`, validación con Zod,
migraciones SQL versionadas y pruebas con Vitest + Supertest.

## Stack

| Capa       | Tecnología                                                         |
| ---------- | ----------------------------------------------------------------- |
| Backend    | Node.js, Express 5, TypeScript, `pg` (node-postgres), Zod, JWT     |
| Frontend   | React 19, Vite, TypeScript                                         |
| Base datos | PostgreSQL (Supabase)                                              |
| Portadas   | Supabase Storage (API REST, Service Role solo en el servidor)      |
| Pruebas    | Vitest + Supertest                                                 |
| Deploy     | Frontend en Vercel · API en Render / Railway                       |

## Estructura

```
crud-libros/
├─ apps/
│  ├─ api/                       # API REST (Express + TypeScript)
│  │  ├─ db/migrations/          # Migraciones SQL versionadas
│  │  ├─ src/
│  │  │  ├─ config/              # Validación de variables de entorno (Zod)
│  │  │  ├─ controllers/         # Público (libros), admin (adminLibros, uploads), auth
│  │  │  ├─ services/            # Lógica de negocio + storage (Supabase)
│  │  │  ├─ repositories/        # Acceso a datos (SQL parametrizado)
│  │  │  ├─ middleware/          # auth, errorHandler, rateLimit
│  │  │  ├─ routes/              # libros (público), admin (privado), auth
│  │  │  ├─ db/                  # Pool de conexión + runner de migraciones
│  │  │  └─ scripts/             # seedAdmin
│  │  └─ tests/                  # Pruebas (Vitest + Supertest)
│  └─ web/                       # App web (React + Vite)
│     └─ src/
│        ├─ pages/               # Páginas públicas (inicio, catálogo, detalle, ayuda)
│        ├─ admin/               # Panel privado (shell, resumen, catálogo, ajustes, formulario)
│        ├─ components/          # Portadas, tarjetas, feedback, layout público, login
│        └─ lib/                 # Cliente API, router, formato, config
└─ packages/
   └─ types/                     # Tipos y esquemas Zod compartidos
```

## Rutas de la aplicación web

| Ruta                 | Acceso   | Descripción                                             |
| -------------------- | -------- | ------------------------------------------------------- |
| `/`                  | Público  | Página de inicio pública de Libra.                      |
| `/libros`            | Público  | Catálogo: buscador por título/autor y paginación.       |
| `/libros/:id`        | Público  | Detalle de un libro publicado.                          |
| `/ayuda`             | Público  | Centro de ayuda con instrucciones de uso.               |
| `/<VITE_ADMIN_PATH>` | Privado  | Panel de administración (login si no hay sesión).       |

> La ruta del panel se define con `VITE_ADMIN_PATH` en el frontend y `ADMIN_PATH` en el backend
> (deben coincidir). No es un mecanismo de seguridad: la protección real es el JWT.

## Endpoints de la API

### Públicos (sin autenticación, solo lectura)

| Método | Ruta          | Descripción                                                        |
| ------ | ------------- | ------------------------------------------------------------------ |
| `GET`  | `/libros`     | Lista **solo libros publicados**. Filtros: `page`, `limit`, `q` (título o autor), `titulo`, `autor`. |
| `GET`  | `/libros/:id` | Detalle de un libro **publicado** (`404` si es borrador o no existe). |
| `GET`  | `/health`     | Health check.                                                      |

### Privados (requieren sesión: cookie `libra_token` o `Authorization: Bearer`)

| Método   | Ruta                           | Descripción                                    |
| -------- | ------------------------------ | ---------------------------------------------- |
| `GET`    | `/admin/libros`                | Lista **todos** los libros (con filtros y `estado`). |
| `GET`    | `/admin/libros/estadisticas`   | Contadores: total, publicados, borradores.     |
| `GET`    | `/admin/libros/:id`            | Detalle de cualquier libro.                    |
| `POST`   | `/admin/libros`                | Crea un libro.                                 |
| `PUT`    | `/admin/libros/:id`            | Actualiza un libro.                            |
| `PATCH`  | `/admin/libros/:id/estado`     | Publica (`publicado`) o retira (`borrador`).   |
| `DELETE` | `/admin/libros/:id`            | Elimina un libro.                              |
| `POST`   | `/admin/uploads`               | Sube una portada (cuerpo = binario de la imagen). |

### Autenticación

| Método | Ruta            | Descripción                          |
| ------ | --------------- | ------------------------------------ |
| `POST` | `/auth/login`   | Inicia sesión y fija la cookie.      |
| `POST` | `/auth/logout`  | Cierra sesión y limpia la cookie.    |
| `GET`  | `/auth/me`      | Datos de la sesión actual.           |

## Modelo de datos

`public.libros`:

| Columna       | Tipo          | Notas                                                        |
| ------------- | ------------- | ------------------------------------------------------------ |
| `id`          | bigint        | PK autoincremental.                                          |
| `titulo`      | varchar(200)  | Obligatorio, no vacío.                                       |
| `autor`       | varchar(120)  | Obligatorio, no vacío.                                       |
| `descripcion` | text          | Por defecto `''`.                                            |
| `imagen_url`  | text          | URL pública de la portada (o `NULL`).                        |
| `estado`      | varchar(20)   | `borrador` \| `publicado` (CHECK). Default `borrador`.       |
| `created_at`  | timestamptz   | Autogenerado.                                                |
| `updated_at`  | timestamptz   | Mantenido por trigger.                                       |

**¿Qué significa "publicado"?** Un libro `publicado` aparece en el catálogo público (`/libros`,
`/libros/:id`) y es visible con la clave anónima de Supabase (política RLS de solo lectura).
Un `borrador` **solo** es accesible desde el panel autenticado. El backend sirve el catálogo con
un rol privilegiado y filtra por `estado = 'publicado'`; la política RLS también lo restringe.

## Requisitos

- Node.js ≥ 20 (probado con Node 24)
- npm ≥ 10 (el proyecto usa **npm workspaces**)
- Una base de datos PostgreSQL (Supabase u otra)
- (Opcional, para portadas) Un proyecto de Supabase con Storage

## Puesta en marcha local

```bash
# 1. Instalar dependencias (desde la raíz)
npm install

# 2. Compilar los tipos compartidos (necesario para la API)
npm run build:types

# 3. Configurar variables de entorno (ver sección siguiente)
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env

# 4. Aplicar migraciones y crear el administrador
npm run db:migrate
npm run db:seed-admin

# 5. Arrancar API + Web en paralelo
npm run dev
```

- API: `http://localhost:3000`
- App web:
  - Catálogo público: `http://localhost:5173/`
  - Panel admin: `http://localhost:5173/<VITE_ADMIN_PATH>`

## Variables de entorno

### API — `apps/api/.env`

| Variable                    | Descripción                                                                 | Obligatoria |
| --------------------------- | --------------------------------------------------------------------------- | ----------- |
| `NODE_ENV`                  | `development` \| `production` \| `test`                                     | Sí          |
| `PORT`                      | Puerto de escucha (por defecto `3000`)                                      | No          |
| `DATABASE_URL`              | Cadena de conexión a PostgreSQL (ver nota de Supabase)                      | Sí          |
| `CORS_ORIGIN`               | Orígenes permitidos, separados por comas                                    | Sí          |
| `JWT_SECRET`                | Secreto de firma JWT (**mínimo 32 caracteres**)                             | Sí          |
| `JWT_EXPIRES_IN`            | Caducidad del token (por defecto `2h`)                                      | No          |
| `BCRYPT_ROUNDS`             | Coste de bcrypt (por defecto `12`)                                          | No          |
| `COOKIE_SAMESITE`           | `lax` (def.) \\| `strict` \\| `none`. Usa `none` si frontend y API están en dominios distintos | No |
| `ADMIN_PATH`                | Ruta aleatoria del panel admin (p. ej. `admin-k7m2x9p4`)                    | Sí          |
| `ADMIN_EMAIL`               | Email del admin inicial (solo para `db:seed-admin`)                         | No          |
| `ADMIN_PASSWORD`            | Contraseña del admin inicial (solo para `db:seed-admin`)                    | No          |
| `SUPABASE_URL`              | URL del proyecto Supabase (`https://<ref>.supabase.co`) para Storage        | Para portadas |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave **service_role** (solo servidor). **Nunca** en el frontend            | Para portadas |
| `SUPABASE_STORAGE_BUCKET`   | Bucket de portadas (por defecto `portadas`)                                 | No          |
| `UPLOAD_MAX_BYTES`          | Tamaño máximo de subida en bytes (por defecto `5242880` = 5 MB)             | No          |

Genera un `JWT_SECRET` con: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

> Si `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` no están definidas, la **subida de portadas**
> queda deshabilitada con un error claro; el resto de la aplicación funciona con normalidad.

### Web — `apps/web/.env`

| Variable          | Descripción                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `VITE_API_URL`    | URL base del API. Vacío en dev (usa el proxy de Vite). En prod: URL pública. |
| `VITE_ADMIN_PATH` | Ruta del panel admin. **Debe coincidir** con `ADMIN_PATH` del API.           |

> `.env` está en `.gitignore`. Nunca subas secretos al repositorio.

### Nota sobre Supabase (conexión)

El host directo (`db.<ref>.supabase.co`) resuelve **solo a IPv6** y falla en redes sin IPv6.
Usa la cadena del **Session pooler** (IPv4):

```
postgresql://postgres.<PROJECT-REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres
```

Cópiala desde el panel de Supabase: **Connect → Session pooler**.

## Migraciones

Las migraciones viven en `apps/api/db/migrations/` y las aplica el runner (`src/db/migrate.ts`),
que registra cada versión en `public.schema_migrations` y ejecuta cada archivo en una transacción.

| Migración                 | Contenido                                                                  |
| ------------------------- | -------------------------------------------------------------------------- |
| `0001_init`               | Tablas `libros`, `admin_users`, trigger `updated_at`, RLS y `pg_trgm`.     |
| `0002_catalogo_publico`   | Añade `descripcion`, `imagen_url`, `estado`; restringe la RLS de lectura a publicados; crea el bucket `portadas`. |

```bash
# Desarrollo (tsx)
npm run db:migrate

# Producción (código compilado)
npm run db:migrate:prod
```

**Compatibilidad con datos existentes.** `0002` es **aditiva e idempotente**: no borra ni
reinicializa datos. Los libros que ya existían quedan como `publicado` (antes ya eran visibles,
porque `GET /libros` era público y sin filtro); los **nuevos** libros nacen como `borrador`
gracias al `DEFAULT` de la columna.

## Portadas (Supabase Storage)

1. En Supabase, crea un bucket **público** llamado `portadas`
   (Storage → New bucket → Public bucket). La migración `0002` intenta crearlo, pero si el rol no
   puede gestionar `storage.*`, hazlo manualmente desde el panel.
2. Permisos mínimos:
   - **Lectura pública** de las portadas (bucket público + política de `SELECT`).
   - **Escritura**: solo el backend, que usa la `service_role` key (no requiere políticas públicas
     de `INSERT`/`UPDATE`/`DELETE`). Ningún visitante puede subir, sobrescribir ni borrar.
3. Define `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el entorno del **servidor** (Render).
   No las expongas en Vercel ni en el frontend.

Validaciones aplicadas (frontend y backend):

- Tipos permitidos: **PNG, JPG, WEBP, GIF** (comprobados por firma/magic bytes en el servidor).
- Tamaño máximo: **5 MB** (configurable con `UPLOAD_MAX_BYTES`).
- La URL guardada en `imagen_url` es la que devuelve el almacenamiento, por lo que siempre apunta a
  una imagen accesible.

## Scripts

Ejecutar desde la raíz:

| Script                    | Descripción                                              |
| ------------------------- | -------------------------------------------------------- |
| `npm run dev`             | API + Web en modo desarrollo (concurrently)              |
| `npm run dev:api`         | Solo la API (`tsx watch`)                                |
| `npm run dev:web`         | Solo la web (Vite)                                       |
| `npm run build`           | Compila tipos + API + web                                |
| `npm run build:types`     | Compila `packages/types`                                 |
| `npm run build:api`       | Compila la API a `apps/api/dist`                         |
| `npm run build:web`       | Compila la web a `apps/web/dist`                         |
| `npm run start:api`       | Arranca la API compilada (`node apps/api/dist/index.js`) |
| `npm run db:migrate`      | Aplica migraciones (dev, con `tsx`)                      |
| `npm run db:migrate:prod` | Aplica migraciones compiladas (producción)               |
| `npm run db:seed-admin`   | Crea/actualiza el administrador inicial                  |
| `npm test`                | Ejecuta las pruebas (Vitest)                             |
| `npm run typecheck`       | Verifica tipos en todos los workspaces                   |

## Pruebas

Las pruebas usan **Vitest + Supertest** y **mockean los repositorios**, por lo que **no necesitan
una base de datos real** (las variables se fijan en `apps/api/vitest.config.mts`).

```bash
npm test            # Ejecuta toda la suite
npm run test -w @crud-libros/api -- --watch   # Modo watch
```

Cobertura: rutas base/health, catálogo público (solo publicados), CRUD de administración con
autenticación, cambio de estado, estadísticas, validación/seguridad de la subida de portadas y
autenticación (login/me/logout).

## Despliegue

### Frontend (Vercel)

1. Importa el repositorio en Vercel.
2. **Root Directory**: `apps/web` (Vercel detecta Vite automáticamente).
3. **Build Command**: `npm run build` · **Output Directory**: `dist`.
4. Variables de entorno:
   - `VITE_API_URL` = URL pública de la API (p. ej. `https://libra-api.onrender.com`)
   - `VITE_ADMIN_PATH` = mismo valor que `ADMIN_PATH` del API
5. El `vercel.json` incluido añade el rewrite SPA (todas las rutas → `index.html`), necesario para
   `/libros/:id` y `/<admin-path>`.

### API (Render)

1. Crea un **Web Service** apuntando al repositorio (Root Directory: raíz del repo).
2. **Build Command**: `npm ci && npm run build:types && npm run build:api`
3. **Start Command**: `npm run start:api` (equivale a `node apps/api/dist/index.js`)
4. Variables de entorno (en el panel de Render):
   `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (dominio exacto de Vercel),
   `ADMIN_PATH`, `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS` y, para portadas, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`.
5. Aplica las migraciones una vez: `npm run db:migrate:prod`, y crea el admin con
   `npm run db:seed-admin` (define antes `ADMIN_EMAIL` y `ADMIN_PASSWORD`).

> En producción la cookie de sesión se emite con `Secure` (requiere HTTPS).
> Configura `CORS_ORIGIN` con el dominio exacto del frontend para permitir credenciales.
>
> **Cookies entre dominios distintos:** si el frontend está en `*.vercel.app` y la API en
> `*.onrender.com` (dominios registrables diferentes), el navegador **no enviará** una cookie
> `SameSite=Lax` en peticiones `fetch` cruzadas y el login no persistirá. En ese caso define
> `COOKIE_SAMESITE=none` en la API (fuerza `Secure`). Si ambos comparten un dominio propio
> (p. ej. `app.midominio.com` y `api.midominio.com`), `lax` es suficiente y más seguro.

## Seguridad

- Contraseñas con hash **bcrypt**; comparación con hash *dummy* para evitar enumeración de usuarios.
- JWT en cookie `httpOnly` / `sameSite=lax` / `secure` en producción.
- **Helmet**, CORS con credenciales y **rate limiting** en producción.
- Validación de entrada con **Zod** (ZodError → 422) en todos los endpoints.
- SQL siempre **parametrizado** (`$1, $2, …`); sin concatenación.
- Rutas separadas por superficie de confianza: `/libros` (público, solo lectura) y `/admin`
  (requiere sesión). El catálogo público solo expone libros `publicado`.
- RLS de Supabase restringida a `estado = 'publicado'` para la clave anónima.
- Subida de portadas validada por tipo (firma) y tamaño; el `service_role` nunca sale del servidor.
- `ADMIN_PATH` ofrece solo *obscuridad*, no seguridad: la protección real es el JWT.
