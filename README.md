# CRUD de Libros — Express + TypeScript + React

Monorepo con una API REST (Express + TypeScript) respaldada por **PostgreSQL (Supabase)** y un
**panel de administración** en React (Vite). Incluye autenticación de administrador con JWT en
cookie `httpOnly`, validación con Zod y migraciones SQL versionadas.

## Stack

| Capa        | Tecnología                                                        |
| ----------- | ----------------------------------------------------------------- |
| Backend     | Node.js, Express 5, TypeScript, `pg` (node-postgres), Zod, JWT    |
| Frontend    | React 19, Vite, TypeScript                                        |
| Base datos  | PostgreSQL (Supabase)                                             |
| Pruebas     | Vitest + Supertest                                                |
| Deploy      | Frontend en Vercel · API en Railway / Render                      |

## Estructura

```
crud-libros/
├─ apps/
│  ├─ api/              # API REST (Express + TypeScript)
│  │  ├─ db/migrations/ # Migraciones SQL versionadas
│  │  ├─ src/
│  │  │  ├─ config/     # Validación de variables de entorno (Zod)
│  │  │  ├─ controllers # Manejo HTTP + validación de entrada
│  │  │  ├─ services/   # Lógica de negocio
│  │  │  ├─ repositories# Acceso a datos (SQL parametrizado)
│  │  │  ├─ middleware/ # auth, errorHandler, rateLimit
│  │  │  ├─ routes/     # Definición de rutas
│  │  │  ├─ db/         # Pool de conexión + runner de migraciones
│  │  │  └─ scripts/    # seedAdmin
│  │  └─ tests/         # Pruebas (Vitest + Supertest)
│  └─ web/              # Panel de administración (React + Vite)
└─ packages/
   └─ types/            # Tipos y esquemas Zod compartidos
```

## Requisitos

- Node.js ≥ 20 (probado con Node 24)
- npm ≥ 10 (el proyecto usa **npm workspaces**)
- Una base de datos PostgreSQL (Supabase u otra)

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
- Web (panel admin): `http://localhost:5173/<VITE_ADMIN_PATH>` (por defecto `admin-<sufijo>`)

## Variables de entorno

### API — `apps/api/.env`

| Variable         | Descripción                                                                 | Obligatoria |
| ---------------- | --------------------------------------------------------------------------- | ----------- |
| `NODE_ENV`       | `development` \| `production` \| `test`                                     | Sí          |
| `PORT`           | Puerto de escucha (por defecto `3000`)                                      | No          |
| `DATABASE_URL`   | Cadena de conexión a PostgreSQL (ver nota de Supabase)                      | Sí          |
| `CORS_ORIGIN`    | Orígenes permitidos, separados por comas                                    | Sí          |
| `JWT_SECRET`     | Secreto de firma JWT (**mínimo 32 caracteres**)                             | Sí          |
| `JWT_EXPIRES_IN` | Caducidad del token (por defecto `2h`)                                      | No          |
| `BCRYPT_ROUNDS`  | Coste de bcrypt (por defecto `12`)                                          | No          |
| `ADMIN_PATH`     | Ruta aleatoria del panel admin (p. ej. `admin-k7m2x9p4`)                    | Sí          |
| `ADMIN_EMAIL`    | Email del admin inicial (solo para `db:seed-admin`)                         | No          |
| `ADMIN_PASSWORD` | Contraseña del admin inicial (solo para `db:seed-admin`)                    | No          |

Genera un `JWT_SECRET` con: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### Web — `apps/web/.env`

| Variable          | Descripción                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `VITE_API_URL`    | URL base del API. Vacío en dev (usa el proxy de Vite). En prod: URL pública. |
| `VITE_ADMIN_PATH` | Ruta del panel admin. **Debe coincidir** con `ADMIN_PATH` del API.           |

> `.env` está en `.gitignore`. Nunca subas secretos al repositorio.

### Nota sobre Supabase

El host directo (`db.<ref>.supabase.co`) resuelve **solo a IPv6** y falla en redes sin IPv6.
Usa la cadena del **Session pooler** (IPv4):

```
postgresql://postgres.<PROJECT-REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres
```

Cópiala desde el panel de Supabase: **Connect → Session pooler**.

## Scripts

Ejecutar desde la raíz:

| Script                  | Descripción                                            |
| ----------------------- | ------------------------------------------------------ |
| `npm run dev`           | API + Web en modo desarrollo (concurrently)            |
| `npm run dev:api`       | Solo la API (`tsx watch`)                              |
| `npm run dev:web`       | Solo el panel web (Vite)                               |
| `npm run build`         | Compila tipos + API + web                              |
| `npm run build:types`   | Compila `packages/types`                               |
| `npm run build:api`     | Compila la API a `apps/api/dist`                       |
| `npm run build:web`     | Compila el panel a `apps/web/dist`                     |
| `npm run start:api`     | Arranca la API compilada (`node apps/api/dist/index.js`) |
| `npm run db:migrate`    | Aplica migraciones (dev, con `tsx`)                    |
| `npm run db:migrate:prod` | Aplica migraciones compiladas (producción)           |
| `npm run db:seed-admin` | Crea/actualiza el administrador inicial                |
| `npm test`              | Ejecuta las pruebas (Vitest)                           |
| `npm run typecheck`     | Verifica tipos en todos los workspaces                 |

## Pruebas

Las pruebas usan **Vitest + Supertest** y **mockean los repositorios**, por lo que **no necesitan
una base de datos real** (las variables se fijan en `apps/api/vitest.config.mts`).

```bash
npm test            # Ejecuta toda la suite
npm run test -w @crud-libros/api -- --watch   # Modo watch
```

Cobertura actual: rutas base/health, CRUD de libros (validación, auth, 404) y autenticación
(login/me/logout).

## Despliegue

### Frontend (Vercel)

1. Importa el repositorio en Vercel.
2. **Root Directory**: `apps/web` (Vercel detecta Vite automáticamente).
3. **Build Command**: `npm run build` · **Output Directory**: `dist`.
4. Variables de entorno:
   - `VITE_API_URL` = URL pública de la API (p. ej. `https://tu-api.up.railway.app`)
   - `VITE_ADMIN_PATH` = mismo valor que `ADMIN_PATH` del API
5. El `vercel.json` incluido añade el rewrite SPA (todas las rutas → `index.html`).

### API (Railway / Render)

1. Crea el servicio apuntando al **repositorio** (Root Directory: raíz del repo).
2. **Build Command**: `npm ci && npm run build:types && npm run build:api`
3. **Start Command**: `npm run start:api` (equivale a `node apps/api/dist/index.js`)
4. Variables de entorno (en el panel del proveedor):
   `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (dominio de Vercel),
   `ADMIN_PATH`, `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`.
5. Aplica las migraciones una vez: `npm run db:migrate:prod`, y crea el admin con
   `npm run db:seed-admin` (define antes `ADMIN_EMAIL` y `ADMIN_PASSWORD`).

> En producción la cookie de sesión se emite con `Secure` (requiere HTTPS).
> Configura `CORS_ORIGIN` con el dominio exacto del frontend para permitir credenciales.

## Seguridad

- Contraseñas con hash **bcrypt**; comparación con hash *dummy* para evitar enumeración de usuarios.
- JWT en cookie `httpOnly` / `sameSite=lax` / `secure` en producción.
- **Helmet**, CORS con credenciales y **rate limiting** en producción.
- Validación de entrada con **Zod** (ZodError → 422).
- SQL siempre **parametrizado** (`$1, $2, …`); sin concatenación.
- `ADMIN_PATH` ofrece solo *obscuridad*, no seguridad: la protección real es el JWT.
