-- Contraseña temporal: forzar cambio en el primer ingreso
alter table public.perfiles
  add column if not exists debe_cambiar_password boolean not null default false;

-- Usuarios invitados (con empresa_id en metadata) deben cambiar la clave temporal
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text := nullif(trim(coalesce(new.raw_user_meta_data->>'rol', '')), '');
  v_empresa_id uuid;
  v_nombre_empresa text := nullif(trim(coalesce(new.raw_user_meta_data->>'nombre_empresa', '')), '');
  v_nit text := nullif(trim(coalesce(new.raw_user_meta_data->>'nit', '')), '');
  v_sector text := nullif(trim(coalesce(new.raw_user_meta_data->>'sector', '')), '');
  v_direccion text := nullif(trim(coalesce(new.raw_user_meta_data->>'direccion', '')), '');
  v_ciudad text := nullif(trim(coalesce(new.raw_user_meta_data->>'ciudad', '')), '');
  v_nombre text := nullif(trim(coalesce(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'responsable_nombre', '')), '');
  v_apellido text := nullif(trim(coalesce(new.raw_user_meta_data->>'apellido', new.raw_user_meta_data->>'responsable_apellido', '')), '');
  v_cedula text := nullif(trim(coalesce(new.raw_user_meta_data->>'cedula', new.raw_user_meta_data->>'responsable_cedula', '')), '');
  v_debe_cambiar boolean := coalesce((new.raw_user_meta_data->>'debe_cambiar_password')::boolean, false);
begin
  if v_rol = 'sistema' then
    insert into public.perfiles (id, empresa_id, rol, activo, nombre, apellido, cedula, debe_cambiar_password)
    values (new.id, null, 'sistema', true, v_nombre, v_apellido, v_cedula, false)
    on conflict (id) do update set
      rol = 'sistema',
      empresa_id = null,
      nombre = coalesce(excluded.nombre, public.perfiles.nombre),
      apellido = coalesce(excluded.apellido, public.perfiles.apellido),
      cedula = coalesce(excluded.cedula, public.perfiles.cedula),
      updated_at = now();
    return new;
  end if;

  if new.raw_user_meta_data ? 'empresa_id'
     and nullif(trim(coalesce(new.raw_user_meta_data->>'empresa_id', '')), '') is not null
     and v_rol is not null then
    v_empresa_id := (new.raw_user_meta_data->>'empresa_id')::uuid;
    if v_rol not in ('digitador', 'supervisor', 'auditor', 'aprobador', 'admin_empresa') then
      raise exception 'Rol inválido para usuario de empresa: %', v_rol;
    end if;
    insert into public.perfiles (id, empresa_id, rol, activo, nombre, apellido, cedula, debe_cambiar_password)
    values (new.id, v_empresa_id, v_rol, true, v_nombre, v_apellido, v_cedula, true)
    on conflict (id) do update set
      empresa_id = excluded.empresa_id,
      rol = excluded.rol,
      nombre = coalesce(excluded.nombre, public.perfiles.nombre),
      apellido = coalesce(excluded.apellido, public.perfiles.apellido),
      cedula = coalesce(excluded.cedula, public.perfiles.cedula),
      debe_cambiar_password = true,
      updated_at = now();
    return new;
  end if;

  if v_nombre_empresa is null or v_nit is null or v_sector is null then
    raise exception 'Registro incompleto: nombre_empresa, nit y sector son obligatorios';
  end if;

  if v_sector not in (
    'agro', 'hidrocarburos', 'energia', 'industria',
    'construccion', 'comercio', 'financiero', 'tic'
  ) then
    raise exception 'Sector inválido: %', v_sector;
  end if;

  insert into public.empresas (nombre, nit, direccion, ciudad, sector)
  values (v_nombre_empresa, v_nit, v_direccion, v_ciudad, v_sector)
  returning id into v_empresa_id;

  insert into public.perfiles (id, empresa_id, rol, activo, nombre, apellido, cedula, debe_cambiar_password)
  values (new.id, v_empresa_id, 'admin_empresa', true, v_nombre, v_apellido, v_cedula, coalesce(v_debe_cambiar, false))
  on conflict (id) do update set
    empresa_id = excluded.empresa_id,
    rol = 'admin_empresa',
    nombre = coalesce(excluded.nombre, public.perfiles.nombre),
    apellido = coalesce(excluded.apellido, public.perfiles.apellido),
    cedula = coalesce(excluded.cedula, public.perfiles.cedula),
    updated_at = now();

  return new;
end;
$$;
