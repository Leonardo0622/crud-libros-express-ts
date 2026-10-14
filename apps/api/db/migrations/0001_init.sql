-- =============================================================================
-- 0001_init.sql — Esquema inicial de "Libra · Gestión de biblioteca"
-- =============================================================================
-- Fuente de verdad del esquema. Es un script idempotente y seguro de re-ejecutar.
-- Se aplica:
--   * En producción / Supabase: vía el runner de migraciones (npm run db:migrate)
--     o con la herramienta MCP de Supabase.
--   * Registra su propia versión en public.schema_migrations para no repetirse.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Extensión para búsquedas por subcadena eficientes (ILIKE '%texto%')
-- ----------------------------------------------------------------------------
create extension if not exists pg_trgm with schema extensions;

-- ----------------------------------------------------------------------------
-- Autolibros
-- ----------------------------------------------------------------------------
create table if not exists public.libros (
  id         bigint generated always as identity primary key,
  titulo     varchar(200) not null,
  autor      varchar(120) not null,
  created_at timestamptz  not null default now(),
  updated_at timestamptz  not null default now(),
  constraint libros_titulo_no_vacio check (btrim(titulo) <> ''),
  constraint libros_autor_no_vacio  check (btrim(autor)  <> '')
);

create index if not exists libros_titulo_trgm_idx
  on public.libros using gin (titulo extensions.gin_trgm_ops);
create index if not exists libros_autor_trgm_idx
  on public.libros using gin (autor extensions.gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- Usuarios administradores (autenticación propia con hash + JWT)
-- ----------------------------------------------------------------------------
create table if not exists public.admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         varchar(160) not null unique,
  password_hash text         not null,
  role          varchar(20)  not null default 'admin',
  created_at    timestamptz  not null default now(),
  constraint admin_users_email_no_vacio check (btrim(email) <> '')
);

create index if not exists admin_users_email_lower_idx
  on public.admin_users (lower(email));

-- ----------------------------------------------------------------------------
-- Trigger genérico para mantener updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists libros_set_updated_at on public.libros;
create trigger libros_set_updated_at
  before update on public.libros
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
--   El backend se conecta con un rol privilegiado (bypassa RLS). RLS protege
--   el acceso directo vía la API REST autogenerada de Supabase (anon/authenticated).
-- ----------------------------------------------------------------------------
alter table public.libros      enable row level security;
alter table public.admin_users enable row level security;

-- Lectura pública del catálogo; la escritura queda restringida al backend.
drop policy if exists libros_select_public on public.libros;
create policy libros_select_public
  on public.libros for select
  using (true);

-- admin_users: sin políticas => nadie salvo el backend puede leer/escribir.

-- ----------------------------------------------------------------------------
-- Registro de migraciones aplicadas (lo usa src/db/migrate.ts)
-- ----------------------------------------------------------------------------
create table if not exists public.schema_migrations (
  version    text primary key,
  applied_at timestamptz not null default now()
);

-- Tabla interna: deny-all para anon/authenticated (el backend usa el rol dueño).
alter table public.schema_migrations enable row level security;

insert into public.schema_migrations (version)
values ('0001_init')
on conflict (version) do nothing;
