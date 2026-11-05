-- Biblioteca de versiones del informe PESTEL generado

create table if not exists public.informes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  version integer not null check (version > 0),
  texto text not null,
  factores jsonb not null default '[]'::jsonb,
  metadatos jsonb not null default '{}'::jsonb,
  creado_por uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  unique (empresa_id, version)
);

create index if not exists informes_empresa_version_idx
  on public.informes (empresa_id, version desc);

alter table public.informes enable row level security;

drop policy if exists "informes_select" on public.informes;
create policy "informes_select"
  on public.informes for select
  using (
    public.es_sistema()
    or (
      empresa_id = public.mi_empresa_id()
      and public.mi_rol() in ('admin_empresa', 'supervisor', 'auditor', 'aprobador')
    )
  );

drop policy if exists "informes_insert" on public.informes;
create policy "informes_insert"
  on public.informes for insert
  with check (
    empresa_id = public.mi_empresa_id()
    and creado_por = auth.uid()
    and public.mi_rol() in ('admin_empresa', 'supervisor', 'auditor', 'aprobador')
  );
