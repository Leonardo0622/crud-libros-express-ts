-- =============================================================================
-- 0003_endurecer_seguridad.sql — Endurecimiento posterior a 0002
-- =============================================================================
-- Aditiva e idempotente. No modifica ni elimina datos.
--   1. Fija el search_path del trigger updated_at (corrige el aviso de seguridad
--      "function_search_path_mutable").
--   2. Aplica límites de defensa en profundidad al bucket de portadas
--      (tamaño máximo y tipos MIME permitidos) además de la validación del API.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1) search_path inmutable en public.set_updated_at()
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) then
    execute 'alter function public.set_updated_at() set search_path = ''''';
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2) Límites del bucket público "portadas"
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    begin
      update storage.buckets
         set file_size_limit = 5242880,
             allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
       where id = 'portadas';
    exception when others then
      raise notice 'No se pudieron aplicar límites al bucket "portadas": %', sqlerrm;
    end;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Registro de la migración (por si se aplica desde el editor SQL de Supabase).
-- ----------------------------------------------------------------------------
insert into public.schema_migrations (version)
values ('0003_endurecer_seguridad')
on conflict (version) do nothing;
