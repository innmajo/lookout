import { requireSupabase } from '@/lib/supabase'
import type { EmpresaRow, PerfilRow } from '@/types/database'

export type UsuarioSistema = PerfilRow & {
  empresa_nombre: string | null
  email: string | null
}

export type MetricasSistema = {
  empresas: number
  usuarios: number
  usuariosActivos: number
  factores: number
}

export async function fetchMetricasSistema(): Promise<MetricasSistema> {
  const client = requireSupabase()
  const [empresas, perfiles, factores] = await Promise.all([
    client.from('empresas').select('id', { count: 'exact', head: true }),
    client.from('perfiles').select('activo'),
    client.from('factores').select('id', { count: 'exact', head: true }),
  ])

  if (empresas.error) throw empresas.error
  if (perfiles.error) throw perfiles.error
  if (factores.error) throw factores.error

  const lista = perfiles.data ?? []
  return {
    empresas: empresas.count ?? 0,
    usuarios: lista.length,
    usuariosActivos: lista.filter((p) => p.activo).length,
    factores: factores.count ?? 0,
  }
}

export async function listarEmpresasSistema(): Promise<EmpresaRow[]> {
  const { data, error } = await requireSupabase()
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function listarUsuariosSistema(): Promise<UsuarioSistema[]> {
  const client = requireSupabase()
  const { data: perfiles, error } = await client
    .from('perfiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  const { data: empresas, error: empError } = await client.from('empresas').select('id, nombre')
  if (empError) throw empError

  const nombrePorId = new Map((empresas ?? []).map((e) => [e.id, e.nombre]))

  return (perfiles ?? []).map((p) => ({
    ...p,
    empresa_nombre: p.empresa_id ? (nombrePorId.get(p.empresa_id) ?? null) : null,
    email: null,
  }))
}
