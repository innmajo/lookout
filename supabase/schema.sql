-- Lookout · esquema Supabase
-- Ejecutar en: SQL Editor del proyecto (o supabase db push si usas CLI)

-- Perfil por usuario (empresa, responsable, TRM)
create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  trm_usd numeric not null default 4000 check (trm_usd > 0),
  nombre_empresa text,
  responsable_nombre text,
  responsable_apellido text,
  responsable_cedula text,
  direccion text,
  ciudad text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Factores PESTEL
create table if not exists public.factores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  categoria text not null check (
    categoria in ('Político', 'Económico', 'Social', 'Tecnológico', 'Ecológico', 'Legal')
  ),
  descripcion text not null check (char_length(trim(descripcion)) between 10 and 500),
  tipo text not null check (tipo in ('Amenaza', 'Oportunidad')),
  impacto text not null check (impacto in ('Alto', 'Medio', 'Bajo')),
  plazo text not null check (plazo in ('Corto plazo', 'Mediano plazo', 'Largo plazo')),
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
  valor_cop numeric check (valor_cop is null or valor_cop >= 0),
  fecha_registro timestamptz not null default now(),
  es_ejemplo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists factores_user_id_idx on public.factores (user_id);
create index if not exists factores_fecha_registro_idx on public.factores (user_id, fecha_registro desc);

alter table public.perfiles enable row level security;
alter table public.factores enable row level security;

-- Políticas: cada usuario solo ve y edita lo suyo
drop policy if exists "perfiles_select_own" on public.perfiles;
create policy "perfiles_select_own"
  on public.perfiles for select
  using (auth.uid() = id);

drop policy if exists "perfiles_insert_own" on public.perfiles;
create policy "perfiles_insert_own"
  on public.perfiles for insert
  with check (auth.uid() = id);

drop policy if exists "perfiles_update_own" on public.perfiles;
create policy "perfiles_update_own"
  on public.perfiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "factores_select_own" on public.factores;
create policy "factores_select_own"
  on public.factores for select
  using (auth.uid() = user_id);

drop policy if exists "factores_insert_own" on public.factores;
create policy "factores_insert_own"
  on public.factores for insert
  with check (auth.uid() = user_id);

drop policy if exists "factores_update_own" on public.factores;
create policy "factores_update_own"
  on public.factores for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "factores_delete_own" on public.factores;
create policy "factores_delete_own"
  on public.factores for delete
  using (auth.uid() = user_id);

-- Crear perfil al registrarse (datos de empresa desde user_metadata)
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists perfiles_set_updated_at on public.perfiles;
create trigger perfiles_set_updated_at
  before update on public.perfiles
  for each row execute function public.set_updated_at();

drop trigger if exists factores_set_updated_at on public.factores;
create trigger factores_set_updated_at
  before update on public.factores
  for each row execute function public.set_updated_at();
