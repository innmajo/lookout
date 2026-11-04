-- Lookout · multi-empresa + roles (partida limpia de datos de negocio)

-- 1) Limpiar datos de negocio (auth.users se conserva; conviene recrear cuentas)
truncate table public.factores;
delete from public.perfiles;

-- 2) Empresas
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nit text not null,
  direccion text,
  ciudad text,
  sector text not null check (
    sector in (
      'agro',
      'hidrocarburos',
      'energia',
      'industria',
      'construccion',
      'comercio',
      'financiero',
      'tic'
    )
  ),
  trm_usd numeric not null default 4000 check (trm_usd > 0),
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists empresas_nit_unique on public.empresas (nit);

-- 3) Reestructurar perfiles
alter table public.perfiles
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade,
  add column if not exists rol text,
  add column if not exists activo boolean not null default true,
  add column if not exists nombre text,
  add column if not exists apellido text,
  add column if not exists cedula text;

-- Migrar residuales de columnas viejas si existieran
update public.perfiles
set
  nombre = coalesce(nombre, responsable_nombre),
  apellido = coalesce(apellido, responsable_apellido),
  cedula = coalesce(cedula, responsable_cedula)
where true;

alter table public.perfiles drop column if exists nombre_empresa;
alter table public.perfiles drop column if exists nit;
alter table public.perfiles drop column if exists responsable_nombre;
alter table public.perfiles drop column if exists responsable_apellido;
alter table public.perfiles drop column if exists responsable_cedula;
alter table public.perfiles drop column if exists direccion;
alter table public.perfiles drop column if exists ciudad;
alter table public.perfiles drop column if exists trm_usd;

alter table public.perfiles
  alter column rol set default 'digitador';

update public.perfiles set rol = 'digitador' where rol is null;

alter table public.perfiles
  alter column rol set not null;

alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles
  add constraint perfiles_rol_check check (
    rol in (
      'sistema',
      'admin_empresa',
      'digitador',
      'supervisor',
      'auditor',
      'aprobador'
    )
  );

alter table public.perfiles drop constraint if exists perfiles_empresa_rol_check;
alter table public.perfiles
  add constraint perfiles_empresa_rol_check check (
    (rol = 'sistema' and empresa_id is null)
    or (rol <> 'sistema' and empresa_id is not null)
  );

create index if not exists perfiles_empresa_id_idx on public.perfiles (empresa_id);
create index if not exists perfiles_rol_idx on public.perfiles (rol);

-- 4) Factores por empresa
alter table public.factores
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade,
  add column if not exists creado_por uuid references auth.users (id) on delete set null;

-- user_id histórico: ya no es dueño del dato; se mantiene como creado_por si hace falta
update public.factores
set creado_por = coalesce(creado_por, user_id)
where creado_por is null;

-- Sin empresas no puede haber factores (partida limpia)
alter table public.factores alter column empresa_id drop not null;
-- Tras truncate, empresa_id puede ser null; forzamos not null para inserts nuevos
-- (tabla vacía → ok)
alter table public.factores alter column empresa_id set not null;

create index if not exists factores_empresa_id_idx on public.factores (empresa_id);

-- 5) Helpers RLS
create or replace function public.mi_rol()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid()
$$;

create or replace function public.mi_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from public.perfiles where id = auth.uid() and activo = true
$$;

create or replace function public.es_sistema()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'sistema' and activo = true
  )
$$;

create or replace function public.es_admin_empresa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin_empresa' and activo = true
  )
$$;

-- 6) Trigger updated_at empresas
drop trigger if exists empresas_set_updated_at on public.empresas;
create trigger empresas_set_updated_at
  before update on public.empresas
  for each row execute function public.set_updated_at();

-- 7) Alta de usuario: registro empresa o usuario invitado
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
begin
  -- Admin del sistema (seed / createUser con rol=sistema)
  if v_rol = 'sistema' then
    insert into public.perfiles (id, empresa_id, rol, activo, nombre, apellido, cedula)
    values (new.id, null, 'sistema', true, v_nombre, v_apellido, v_cedula)
    on conflict (id) do update set
      rol = 'sistema',
      empresa_id = null,
      nombre = coalesce(excluded.nombre, public.perfiles.nombre),
      apellido = coalesce(excluded.apellido, public.perfiles.apellido),
      cedula = coalesce(excluded.cedula, public.perfiles.cedula),
      updated_at = now();
    return new;
  end if;

  -- Usuario de empresa creado por admin (metadata.empresa_id + rol)
  if new.raw_user_meta_data ? 'empresa_id' and v_rol is not null then
    v_empresa_id := (new.raw_user_meta_data->>'empresa_id')::uuid;
    if v_rol not in ('digitador', 'supervisor', 'auditor', 'aprobador', 'admin_empresa') then
      raise exception 'Rol inválido para usuario de empresa: %', v_rol;
    end if;
    insert into public.perfiles (id, empresa_id, rol, activo, nombre, apellido, cedula)
    values (new.id, v_empresa_id, v_rol, true, v_nombre, v_apellido, v_cedula)
    on conflict (id) do update set
      empresa_id = excluded.empresa_id,
      rol = excluded.rol,
      nombre = coalesce(excluded.nombre, public.perfiles.nombre),
      apellido = coalesce(excluded.apellido, public.perfiles.apellido),
      cedula = coalesce(excluded.cedula, public.perfiles.cedula),
      updated_at = now();
    return new;
  end if;

  -- Registro público: crea empresa + admin_empresa
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

  insert into public.perfiles (id, empresa_id, rol, activo, nombre, apellido, cedula)
  values (new.id, v_empresa_id, 'admin_empresa', true, v_nombre, v_apellido, v_cedula)
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8) RLS
alter table public.empresas enable row level security;
alter table public.perfiles enable row level security;
alter table public.factores enable row level security;

-- Empresas
drop policy if exists "empresas_select" on public.empresas;
create policy "empresas_select"
  on public.empresas for select
  using (
    public.es_sistema()
    or id = public.mi_empresa_id()
  );

drop policy if exists "empresas_update_admin" on public.empresas;
create policy "empresas_update_admin"
  on public.empresas for update
  using (
    public.es_sistema()
    or (public.es_admin_empresa() and id = public.mi_empresa_id())
  )
  with check (
    public.es_sistema()
    or (public.es_admin_empresa() and id = public.mi_empresa_id())
  );

-- Perfiles
drop policy if exists "perfiles_select_own" on public.perfiles;
drop policy if exists "perfiles_insert_own" on public.perfiles;
drop policy if exists "perfiles_update_own" on public.perfiles;

drop policy if exists "perfiles_select" on public.perfiles;
create policy "perfiles_select"
  on public.perfiles for select
  using (
    public.es_sistema()
    or id = auth.uid()
    or (
      public.es_admin_empresa()
      and empresa_id = public.mi_empresa_id()
    )
  );

drop policy if exists "perfiles_update_admin" on public.perfiles;
create policy "perfiles_update_admin"
  on public.perfiles for update
  using (
    public.es_sistema()
    or (
      public.es_admin_empresa()
      and empresa_id = public.mi_empresa_id()
      and rol <> 'sistema'
    )
    or id = auth.uid()
  )
  with check (
    public.es_sistema()
    or (
      public.es_admin_empresa()
      and empresa_id = public.mi_empresa_id()
      and rol <> 'sistema'
    )
    or id = auth.uid()
  );

-- Factores: lectura por empresa; escritura operativa (no admin_empresa ni sistema por ahora)
drop policy if exists "factores_select_own" on public.factores;
drop policy if exists "factores_insert_own" on public.factores;
drop policy if exists "factores_update_own" on public.factores;
drop policy if exists "factores_delete_own" on public.factores;

drop policy if exists "factores_select" on public.factores;
create policy "factores_select"
  on public.factores for select
  using (
    public.es_sistema()
    or empresa_id = public.mi_empresa_id()
  );

drop policy if exists "factores_insert" on public.factores;
create policy "factores_insert"
  on public.factores for insert
  with check (
    empresa_id = public.mi_empresa_id()
    and public.mi_rol() = 'digitador'
  );

drop policy if exists "factores_update" on public.factores;
create policy "factores_update"
  on public.factores for update
  using (
    empresa_id = public.mi_empresa_id()
    and public.mi_rol() = 'digitador'
  )
  with check (
    empresa_id = public.mi_empresa_id()
    and public.mi_rol() = 'digitador'
  );

drop policy if exists "factores_delete" on public.factores;
create policy "factores_delete"
  on public.factores for delete
  using (
    empresa_id = public.mi_empresa_id()
    and public.mi_rol() = 'digitador'
  );

-- Impedir cambio de sector de la empresa (salvo sistema)
create or replace function public.proteger_sector_empresa()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.sector is distinct from old.sector and not public.es_sistema() then
    raise exception 'El sector de la empresa no se puede cambiar';
  end if;
  return new;
end;
$$;

drop trigger if exists empresas_proteger_sector on public.empresas;
create trigger empresas_proteger_sector
  before update on public.empresas
  for each row execute function public.proteger_sector_empresa();

-- Un rol por usuario: no se cambia después del alta (salvo sistema)
create or replace function public.proteger_perfil_sensible()
returns trigger
language plpgsql
as $$
begin
  if new.rol is distinct from old.rol and not public.es_sistema() then
    raise exception 'El rol del usuario no se puede cambiar';
  end if;
  if new.empresa_id is distinct from old.empresa_id and not public.es_sistema() then
    raise exception 'La empresa del usuario no se puede cambiar';
  end if;
  if new.id = auth.uid()
     and new.activo is distinct from old.activo
     and not public.es_sistema()
     and not public.es_admin_empresa() then
    raise exception 'No puede cambiar su propio estado activo';
  end if;
  return new;
end;
$$;

drop trigger if exists perfiles_proteger_sensible on public.perfiles;
create trigger perfiles_proteger_sensible
  before update on public.perfiles
  for each row execute function public.proteger_perfil_sensible();

grant execute on function public.mi_rol() to authenticated;
grant execute on function public.mi_empresa_id() to authenticated;
grant execute on function public.es_sistema() to authenticated;
grant execute on function public.es_admin_empresa() to authenticated;
