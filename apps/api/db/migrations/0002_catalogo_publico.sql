-- =============================================================================
-- 0002_catalogo_publico.sql — Catálogo público, portadas y estado de publicación
-- =============================================================================
-- Migración ADITIVA y segura de re-ejecutar. NO destruye datos:
--   * Agrega descripcion, imagen_url y estado a public.libros.
--   * Los libros existentes se conservan y quedan como 'publicado' (antes ya eran
--     visibles: GET /libros era público y sin filtro). Los NUEVOS libros nacen
--     como 'borrador' gracias al DEFAULT de la columna.
--   * Restringe la política RLS de lectura para no exponer borradores vía la API
--     REST autogenerada de Supabase.
--   * Crea (mejor esfuerzo) el bucket público de Storage 'portadas'.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Nuevas columnas
-- ----------------------------------------------------------------------------
alter table public.libros add column if not exists descripcion text not null default '';
alter table public.libros add column if not exists imagen_url  text;

-- estado + migración de datos existentes (solo la primera vez, si no existía).
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'libros' and column_name = 'estado'
  ) then
    -- Las filas existentes se rellenan con 'publicado' (conserva la visibilidad
    -- previa del catálogo) y el valor por defecto queda en 'borrador' para los
    -- libros nuevos. Usamos ADD COLUMN con DEFAULT para no disparar el trigger
    -- updated_at sobre los registros existentes.
    execute 'alter table public.libros add column estado varchar(20) not null default ''publicado''';
    execute 'alter table public.libros alter column estado set default ''borrador''';
  end if;
end $$;

-- Restricción de valores válidos (idempotente, Postgres no soporta ADD CONSTRAINT IF NOT EXISTS).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'libros_estado_valido'
  ) then
    execute 'alter table public.libros add constraint libros_estado_valido check (estado in (''borrador'', ''publicado''))';
  end if;
end $$;

create index if not exists libros_estado_idx on public.libros (estado);

-- ----------------------------------------------------------------------------
-- RLS: solo los libros publicados son visibles con la clave anónima de Supabase.
-- (El backend sigue conectándose con un rol privilegiado y no se ve afectado.)
-- ----------------------------------------------------------------------------
drop policy if exists libros_select_public on public.libros;
create policy libros_select_public
  on public.libros for select
  using (estado = 'publicado');

-- ----------------------------------------------------------------------------
-- Supabase Storage: bucket público "portadas".
-- Se hace "mejor esfuerzo": si el esquema storage no existe o el rol no puede
-- gestionarlo, la migración continúa (la creación manual se documenta en README).
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    begin
      insert into storage.buckets (id, name, public)
      values ('portadas', 'portadas', true)
      on conflict (id) do nothing;
    exception when others then
      raise notice 'No se pudo crear el bucket "portadas": %', sqlerrm;
    end;

    -- Lectura pública de las portadas (la escritura queda solo para el service role).
    begin
      if not exists (
        select 1 from pg_policies
         where schemaname = 'storage' and tablename = 'objects'
           and policyname = 'portadas_lectura_publica'
      ) then
        execute 'create policy portadas_lectura_publica on storage.objects for select using (bucket_id = ''portadas'')';
      end if;
    exception when others then
      raise notice 'No se pudo crear la política de lectura de portadas: %', sqlerrm;
    end;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Registro de la migración (por si se aplica desde el editor SQL de Supabase).
-- ----------------------------------------------------------------------------
insert into public.schema_migrations (version)
values ('0002_catalogo_publico')
on conflict (version) do nothing;
