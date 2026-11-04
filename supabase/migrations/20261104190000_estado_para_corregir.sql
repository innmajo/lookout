-- Estado "para_corregir": rechazo al digitador (distinto de borrador nuevo)

alter table public.factores drop constraint if exists factores_estado_check;
alter table public.factores
  add constraint factores_estado_check check (
    estado in (
      'borrador',
      'para_corregir',
      'en_revision_supervisor',
      'en_auditoria',
      'en_aprobacion',
      'aprobado'
    )
  );

drop policy if exists "factores_update" on public.factores;
create policy "factores_update"
  on public.factores for update
  using (
    empresa_id = public.mi_empresa_id()
    and (
      (public.mi_rol() = 'digitador' and estado in ('borrador', 'para_corregir'))
      or public.mi_rol() in ('supervisor', 'auditor', 'aprobador')
    )
  )
  with check (
    empresa_id = public.mi_empresa_id()
    and (
      (
        public.mi_rol() = 'digitador'
        and estado in ('borrador', 'para_corregir', 'en_revision_supervisor')
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
    and estado in ('borrador', 'para_corregir')
  );
