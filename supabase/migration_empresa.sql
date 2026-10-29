-- Lookout · datos de empresa en perfiles
-- Ejecutar en SQL Editor (proyecto ya creado con schema.sql)

alter table public.perfiles
  add column if not exists nombre_empresa text,
  add column if not exists responsable_nombre text,
  add column if not exists responsable_apellido text,
  add column if not exists responsable_cedula text,
  add column if not exists direccion text,
  add column if not exists ciudad text;

-- Al crear el usuario, copiar metadata del signup al perfil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (
    id,
    nombre_empresa,
    responsable_nombre,
    responsable_apellido,
    responsable_cedula,
    direccion,
    ciudad
  )
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'nombre_empresa', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'responsable_nombre', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'responsable_apellido', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'responsable_cedula', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'direccion', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'ciudad', '')), '')
  )
  on conflict (id) do update set
    nombre_empresa = coalesce(excluded.nombre_empresa, public.perfiles.nombre_empresa),
    responsable_nombre = coalesce(excluded.responsable_nombre, public.perfiles.responsable_nombre),
    responsable_apellido = coalesce(excluded.responsable_apellido, public.perfiles.responsable_apellido),
    responsable_cedula = coalesce(excluded.responsable_cedula, public.perfiles.responsable_cedula),
    direccion = coalesce(excluded.direccion, public.perfiles.direccion),
    ciudad = coalesce(excluded.ciudad, public.perfiles.ciudad),
    updated_at = now();
  return new;
end;
$$;
