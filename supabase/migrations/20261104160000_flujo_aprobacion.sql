-- Flujo de aprobación PESTEL: lotes, estados, chat, historial, notificaciones

-- 1) Estados en factores
alter table public.factores
  add column if not exists estado text,
  add column if not exists lote_id uuid,
  add column if not exists version integer not null default 1;

update public.factores set estado = 'borrador' where estado is null;

alter table public.factores
  alter column estado set default 'borrador',
  alter column estado set not null;

alter table public.factores drop constraint if exists factores_estado_check;
alter table public.factores
  add constraint factores_estado_check check (
    estado in (
      'borrador',
      'en_revision_supervisor',
      'en_auditoria',
      'en_aprobacion',
      'aprobado'
    )
  );

-- 2) Lotes de envío
create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  creado_por uuid not null references auth.users (id) on delete cascade,
  titulo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lotes_empresa_id_idx on public.lotes (empresa_id);

alter table public.factores drop constraint if exists factores_lote_id_fkey;
alter table public.factores
  add constraint factores_lote_id_fkey
  foreign key (lote_id) references public.lotes (id) on delete set null;

create index if not exists factores_lote_id_idx on public.factores (lote_id);
create index if not exists factores_estado_idx on public.factores (empresa_id, estado);

-- 3) Mensajes de chat por lote
create table if not exists public.lote_mensajes (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes (id) on delete cascade,
  autor_id uuid not null references auth.users (id) on delete cascade,
  mensaje text not null check (char_length(trim(mensaje)) between 1 and 4000),
  -- dig_sup | aud_sup | apr_sup (auditor solo lectura en apr_sup)
  canal text not null check (canal in ('dig_sup', 'aud_sup', 'apr_sup')),
  solo_lectura_roles text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists lote_mensajes_lote_id_idx on public.lote_mensajes (lote_id, created_at);

-- 4) Historial / diffs de factores
create table if not exists public.factor_historial (
  id uuid primary key default gen_random_uuid(),
  factor_id uuid not null references public.factores (id) on delete cascade,
  lote_id uuid references public.lotes (id) on delete set null,
  usuario_id uuid references auth.users (id) on delete set null,
  accion text not null,
  estado_anterior text,
  estado_nuevo text,
  diff jsonb,
  comentario text,
  created_at timestamptz not null default now()
);

create index if not exists factor_historial_factor_id_idx on public.factor_historial (factor_id, created_at);
create index if not exists factor_historial_lote_id_idx on public.factor_historial (lote_id);

-- 5) Notificaciones UI
create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  empresa_id uuid references public.empresas (id) on delete cascade,
  tipo text not null,
  titulo text not null,
  cuerpo text,
  enlace text,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notificaciones_usuario_id_idx
  on public.notificaciones (usuario_id, leida, created_at desc);

-- 6) updated_at lotes
drop trigger if exists lotes_set_updated_at on public.lotes;
create trigger lotes_set_updated_at
  before update on public.lotes
  for each row execute function public.set_updated_at();

-- 7) RLS
alter table public.lotes enable row level security;
alter table public.lote_mensajes enable row level security;
alter table public.factor_historial enable row level security;
alter table public.notificaciones enable row level security;

drop policy if exists "lotes_select" on public.lotes;
create policy "lotes_select"
  on public.lotes for select
  using (public.es_sistema() or empresa_id = public.mi_empresa_id());

drop policy if exists "lotes_insert" on public.lotes;
create policy "lotes_insert"
  on public.lotes for insert
  with check (
    empresa_id = public.mi_empresa_id()
    and public.mi_rol() = 'digitador'
    and creado_por = auth.uid()
  );

drop policy if exists "lote_mensajes_select" on public.lote_mensajes;
create policy "lote_mensajes_select"
  on public.lote_mensajes for select
  using (
    exists (
      select 1 from public.lotes l
      where l.id = lote_id
        and (public.es_sistema() or l.empresa_id = public.mi_empresa_id())
    )
  );

drop policy if exists "lote_mensajes_insert" on public.lote_mensajes;
create policy "lote_mensajes_insert"
  on public.lote_mensajes for insert
  with check (
    autor_id = auth.uid()
    and exists (
      select 1 from public.lotes l
      where l.id = lote_id and l.empresa_id = public.mi_empresa_id()
    )
    and (
      (canal = 'dig_sup' and public.mi_rol() in ('digitador', 'supervisor'))
      or (canal = 'aud_sup' and public.mi_rol() in ('auditor', 'supervisor'))
      -- Auditor solo lectura en apr_sup
      or (canal = 'apr_sup' and public.mi_rol() in ('aprobador', 'supervisor'))
    )
  );

drop policy if exists "factor_historial_select" on public.factor_historial;
create policy "factor_historial_select"
  on public.factor_historial for select
  using (
    exists (
      select 1 from public.factores f
      where f.id = factor_id
        and (public.es_sistema() or f.empresa_id = public.mi_empresa_id())
    )
  );

drop policy if exists "factor_historial_insert" on public.factor_historial;
create policy "factor_historial_insert"
  on public.factor_historial for insert
  with check (
    exists (
      select 1 from public.factores f
      where f.id = factor_id and f.empresa_id = public.mi_empresa_id()
    )
  );

drop policy if exists "notificaciones_select" on public.notificaciones;
create policy "notificaciones_select"
  on public.notificaciones for select
  using (usuario_id = auth.uid() or public.es_sistema());

drop policy if exists "notificaciones_update" on public.notificaciones;
create policy "notificaciones_update"
  on public.notificaciones for update
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

drop policy if exists "notificaciones_insert" on public.notificaciones;
create policy "notificaciones_insert"
  on public.notificaciones for insert
  with check (
    public.es_sistema()
    or empresa_id = public.mi_empresa_id()
  );

-- 8) Escritura de factores: digitador solo borrador; roles de revisión pueden cambiar estado
drop policy if exists "factores_insert" on public.factores;
create policy "factores_insert"
  on public.factores for insert
  with check (
    empresa_id = public.mi_empresa_id()
    and public.mi_rol() = 'digitador'
    and coalesce(estado, 'borrador') = 'borrador'
  );

drop policy if exists "factores_update" on public.factores;
create policy "factores_update"
  on public.factores for update
  using (
    empresa_id = public.mi_empresa_id()
    and (
      -- Digitador solo toca filas que aún están en borrador
      (public.mi_rol() = 'digitador' and estado = 'borrador')
      or public.mi_rol() in ('supervisor', 'auditor', 'aprobador')
    )
  )
  with check (
    empresa_id = public.mi_empresa_id()
    and (
      -- Permite editar borrador o enviar el lote (borrador → en_revision_supervisor)
      (
        public.mi_rol() = 'digitador'
        and estado in ('borrador', 'en_revision_supervisor')
      )
      or public.mi_rol() in ('supervisor', 'auditor', 'aprobador')
    )
  );

drop policy if exists "factores_delete" on public.factores;
create policy "factores_delete"
  on public.factores for delete
  using (
    empresa_id = public.mi_empresa_id()
    and public.mi_rol() = 'digitador'
    and estado = 'borrador'
  );
