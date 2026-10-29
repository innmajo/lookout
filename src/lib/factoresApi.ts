import { esSectorId } from '@/lib/sectores'
import { requireSupabase } from '@/lib/supabase'
import type { FactorInsert, FactorRow } from '@/types/database'
import type { FactorFormValues, FactorPestel } from '@/types/pestel'
import { CATEGORIAS, IMPACTOS, PLAZOS, TIPOS } from '@/types/pestel'

function assertCategoria(value: string): FactorPestel['categoria'] {
  if ((CATEGORIAS as readonly string[]).includes(value)) {
    return value as FactorPestel['categoria']
  }
  return 'Económico'
}

function assertTipo(value: string): FactorPestel['tipo'] {
  if ((TIPOS as readonly string[]).includes(value)) return value as FactorPestel['tipo']
  return 'Amenaza'
}

function assertImpacto(value: string): FactorPestel['impacto'] {
  if ((IMPACTOS as readonly string[]).includes(value)) return value as FactorPestel['impacto']
  return 'Medio'
}

function assertPlazo(value: string): FactorPestel['plazo'] {
  if ((PLAZOS as readonly string[]).includes(value)) return value as FactorPestel['plazo']
  return 'Mediano plazo'
}

export function rowToFactor(row: FactorRow): FactorPestel {
  return {
    id: row.id,
    categoria: assertCategoria(row.categoria),
    descripcion: row.descripcion,
    tipo: assertTipo(row.tipo),
    impacto: assertImpacto(row.impacto),
    plazo: assertPlazo(row.plazo),
    sector: esSectorId(row.sector) ? row.sector : 'agro',
    valorCOP:
      typeof row.valor_cop === 'number' && Number.isFinite(row.valor_cop)
        ? row.valor_cop
        : undefined,
    fechaRegistro: row.fecha_registro,
    esEjemplo: row.es_ejemplo,
  }
}

function valuesToInsert(userId: string, values: FactorFormValues, extras?: Partial<FactorInsert>): FactorInsert {
  return {
    user_id: userId,
    categoria: values.categoria,
    descripcion: values.descripcion.trim(),
    tipo: values.tipo,
    impacto: values.impacto,
    plazo: values.plazo,
    sector: values.sector,
    valor_cop: values.valorCOP ?? null,
    es_ejemplo: false,
    ...extras,
  }
}

export async function fetchFactores(userId: string): Promise<FactorPestel[]> {
  const { data, error } = await requireSupabase()
    .from('factores')
    .select('*')
    .eq('user_id', userId)
    .order('fecha_registro', { ascending: false })

  if (error) throw error
  return (data ?? []).map(rowToFactor)
}

export async function insertFactor(userId: string, values: FactorFormValues): Promise<FactorPestel> {
  const { data, error } = await requireSupabase()
    .from('factores')
    .insert(valuesToInsert(userId, values))
    .select('*')
    .single()

  if (error) throw error
  return rowToFactor(data)
}

export async function updateFactor(
  userId: string,
  id: string,
  values: FactorFormValues,
): Promise<FactorPestel> {
  const { data, error } = await requireSupabase()
    .from('factores')
    .update({
      ...valuesToInsert(userId, values),
      user_id: userId,
      es_ejemplo: false,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return rowToFactor(data)
}

export async function deleteFactor(userId: string, id: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('factores')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function deleteAllFactores(userId: string): Promise<void> {
  const { error } = await requireSupabase().from('factores').delete().eq('user_id', userId)
  if (error) throw error
}

export async function replaceWithEjemplos(
  userId: string,
  ejemplos: FactorPestel[],
): Promise<FactorPestel[]> {
  const client = requireSupabase()
  const { error: delError } = await client.from('factores').delete().eq('user_id', userId)
  if (delError) throw delError

  if (ejemplos.length === 0) return []

  const rows: FactorInsert[] = ejemplos.map((f) => ({
    user_id: userId,
    categoria: f.categoria,
    descripcion: f.descripcion,
    tipo: f.tipo,
    impacto: f.impacto,
    plazo: f.plazo,
    sector: f.sector,
    valor_cop: f.valorCOP ?? null,
    fecha_registro: f.fechaRegistro,
    es_ejemplo: true,
  }))

  const { data, error } = await client.from('factores').insert(rows).select('*')
  if (error) throw error
  return (data ?? []).map(rowToFactor)
}

export async function fetchTrm(userId: string): Promise<number | null> {
  const { data, error } = await requireSupabase()
    .from('perfiles')
    .select('trm_usd')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  const n = Number(data.trm_usd)
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function upsertTrm(userId: string, trmUsd: number): Promise<void> {
  const { error } = await requireSupabase()
    .from('perfiles')
    .upsert({ id: userId, trm_usd: trmUsd }, { onConflict: 'id' })

  if (error) throw error
}

export function mensajeErrorSupabase(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message)
  }
  if (error instanceof Error) return error.message
  return 'Error inesperado al hablar con Supabase'
}
