import { calcularPrioridad } from '@/lib/prioridad'
import { ROL_ETIQUETA, type Rol } from '@/lib/roles'
import { SECTORES } from '@/lib/sectores'
import { requireSupabase } from '@/lib/supabase'
import type { EmpresaRow, Json, PerfilRow } from '@/types/database'
import type { FactorPestel, NivelPrioridad } from '@/types/pestel'

export interface InformeMetadatos {
  empresa: string
  nit: string
  sector: string
  sectorNombre: string
  ciudad: string | null
  autor: string
  rol: string
  factores: number
  porNivel: Record<NivelPrioridad, number>
  porCategoria: Record<string, number>
}

export interface InformeVersion {
  id: string
  empresaId: string
  version: number
  texto: string
  metadatos: InformeMetadatos
  creadoPor: string
  createdAt: string
}

const METADATOS_VACIOS: InformeMetadatos = {
  empresa: '',
  nit: '',
  sector: '',
  sectorNombre: '',
  ciudad: null,
  autor: '',
  rol: '',
  factores: 0,
  porNivel: { CRÍTICO: 0, ATENCIÓN: 0, MONITOREAR: 0 },
  porCategoria: {},
}

function leerMetadatos(valor: Json): InformeMetadatos {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor) || !('empresa' in valor)) {
    return METADATOS_VACIOS
  }
  return valor as unknown as InformeMetadatos
}

export function armarMetadatos(
  empresa: EmpresaRow,
  perfil: PerfilRow,
  factores: FactorPestel[],
): InformeMetadatos {
  const porNivel: Record<NivelPrioridad, number> = { CRÍTICO: 0, ATENCIÓN: 0, MONITOREAR: 0 }
  const porCategoria: Record<string, number> = {}
  for (const factor of factores) {
    porNivel[calcularPrioridad(factor).nivel] += 1
    porCategoria[factor.categoria] = (porCategoria[factor.categoria] ?? 0) + 1
  }
  const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ').trim()
  return {
    empresa: empresa.nombre,
    nit: empresa.nit,
    sector: empresa.sector,
    sectorNombre: SECTORES[empresa.sector]?.nombre ?? empresa.sector,
    ciudad: empresa.ciudad,
    autor: nombre || 'Sin nombre',
    rol: ROL_ETIQUETA[perfil.rol as Rol] ?? perfil.rol,
    factores: factores.length,
    porNivel,
    porCategoria,
  }
}

export async function listarInformes(empresaId: string): Promise<InformeVersion[]> {
  const { data, error } = await requireSupabase()
    .from('informes')
    .select('id, empresa_id, version, texto, metadatos, creado_por, created_at')
    .eq('empresa_id', empresaId)
    .order('version', { ascending: false })

  if (error) throw error
  return (data ?? []).map((fila) => ({
    id: fila.id,
    empresaId: fila.empresa_id,
    version: fila.version,
    texto: fila.texto,
    metadatos: leerMetadatos(fila.metadatos),
    creadoPor: fila.creado_por,
    createdAt: fila.created_at,
  }))
}

export async function guardarInforme(input: {
  empresaId: string
  userId: string
  texto: string
  factores: FactorPestel[]
  metadatos: InformeMetadatos
}): Promise<InformeVersion> {
  const client = requireSupabase()
  const { data: ultimo, error: errorVersion } = await client
    .from('informes')
    .select('version')
    .eq('empresa_id', input.empresaId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (errorVersion) throw errorVersion
  const version = (ultimo?.version ?? 0) + 1

  const { data, error } = await client
    .from('informes')
    .insert({
      empresa_id: input.empresaId,
      version,
      texto: input.texto,
      factores: input.factores as unknown as Json,
      metadatos: input.metadatos as unknown as Json,
      creado_por: input.userId,
    })
    .select('id, empresa_id, version, texto, metadatos, creado_por, created_at')
    .single()

  if (error) throw error
  return {
    id: data.id,
    empresaId: data.empresa_id,
    version: data.version,
    texto: data.texto,
    metadatos: input.metadatos,
    creadoPor: data.creado_por,
    createdAt: data.created_at,
  }
}
