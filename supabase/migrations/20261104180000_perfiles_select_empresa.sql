-- Permite a roles de la misma empresa ver nombre/apellido de colegas (chat, etc.)
drop policy if exists "perfiles_select" on public.perfiles;
create policy "perfiles_select"
  on public.perfiles for select
  using (
    public.es_sistema()
    or id = auth.uid()
    or (
      empresa_id is not null
      and empresa_id = public.mi_empresa_id()
    )
  );
