import { requireSupabase } from '@/lib/supabase'
import type { Rol } from '@/lib/roles'
import type { EstadoFactor, FactorFormValues, FactorPestel } from '@/types/pestel'
import type { FactorRow } from '@/types/database'
import { ESTADOS_FACTOR } from '@/types/pestel'

export type CanalChat = 'dig_sup' | 'aud_sup' | 'apr_sup'

export type LoteRow = {
  id: string
  empresa_id: string
  creado_por: string
  titulo: string | null
  created_at: string
  updated_at: string
}

export type LoteMensaje = {
  id: string
  lote_id: string
  autor_id: string
  mensaje: string
  canal: CanalChat
  solo_lectura_roles: string[]
  created_at: string
}

export type FactorHistorial = {
  id: string
  factor_id: string
  lote_id: string | null
  usuario_id: string | null
  accion: string
  estado_anterior: string | null
  estado_nuevo: string | null
  diff: Record<string, { antes: unknown; despues: unknown }> | null
  comentario: string | null
  created_at: string
}

export type Notificacion = {
  id: string
  usuario_id: string
  empresa_id: string | null
  tipo: string
  titulo: string
  cuerpo: string | null
  enlace: string | null
  leida: boolean
  created_at: string
}

function assertEstado(value: string | null | undefined): EstadoFactor {
  if (value && (ESTADOS_FACTOR as readonly string[]).includes(value)) {
    return value as EstadoFactor
  }
  return 'borrador'
}

export function enrichmentEstado(row: FactorRow): Pick<FactorPestel, 'estado' | 'loteId' | 'version'> {
  return {
    estado: assertEstado(row.estado),
    loteId: row.lote_id,
    version: row.version ?? 1,
  }
}

function snapshotFactor(values: FactorFormValues & { valorCOP?: number }) {
  return {
    categoria: values.categoria,
    descripcion: values.descripcion,
    tipo: values.tipo,
    impacto: values.impacto,
    plazo: values.plazo,
    sector: values.sector,
    valor_cop: values.valorCOP ?? null,
  }
}

function diffObjects(
  antes: Record<string, unknown>,
  despues: Record<string, unknown>,
): Record<string, { antes: unknown; despues: unknown }> | null {
  const out: Record<string, { antes: unknown; despues: unknown }> = {}
  for (const key of Object.keys(despues)) {
    if (JSON.stringify(antes[key]) !== JSON.stringify(despues[key])) {
      out[key] = { antes: antes[key], despues: despues[key] }
    }
  }
  return Object.keys(out).length ? out : null
}

async function idsPorRol(empresaId: string, roles: Rol[]): Promise<string[]> {
  const { data, error } = await requireSupabase()
    .from('perfiles')
    .select('id, rol')
    .eq('empresa_id', empresaId)
    .eq('activo', true)
    .in('rol', roles)

  if (error) throw error
  return (data ?? []).map((p) => p.id)
}

async function notificar(params: {
  usuarioIds: string[]
  empresaId: string
  tipo: string
  titulo: string
  cuerpo?: string
  enlace?: string
}) {
  const unicos = [...new Set(params.usuarioIds)]
  if (unicos.length === 0) return
  const rows = unicos.map((usuario_id) => ({
    usuario_id,
    empresa_id: params.empresaId,
    tipo: params.tipo,
    titulo: params.titulo,
    cuerpo: params.cuerpo ?? null,
    enlace: params.enlace ?? '/lotes',
  }))
  const { error } = await requireSupabase().from('notificaciones').insert(rows)
  if (error) throw error
}

async function registrarHistorial(params: {
  factorId: string
  loteId?: string | null
  usuarioId: string
  accion: string
  estadoAnterior?: string | null
  estadoNuevo?: string | null
  diff?: Record<string, { antes: unknown; despues: unknown }> | null
  comentario?: string | null
}) {
  const { error } = await requireSupabase().from('factor_historial').insert({
    factor_id: params.factorId,
    lote_id: params.loteId ?? null,
    usuario_id: params.usuarioId,
    accion: params.accion,
    estado_anterior: params.estadoAnterior ?? null,
    estado_nuevo: params.estadoNuevo ?? null,
    diff: (params.diff as import('@/types/database').Json | null) ?? null,
    comentario: params.comentario ?? null,
  })
  if (error) throw error
}

/**
 * Digitador: envía pendientes a revisión.
 * - "Para corregir" con lote_id → vuelven al MISMO lote (chat e historial siguen).
 * - Borradores nuevos → lote nuevo.
 */
export async function enviarLoteAprobacion(params: {
  userId: string
  empresaId: string
}): Promise<{ loteId: string; cantidad: number }> {
  const client = requireSupabase()
  const { data: pendientes, error: fetchError } = await client
    .from('factores')
    .select('id, estado, lote_id')
    .eq('empresa_id', params.empresaId)
    .in('estado', ['borrador', 'para_corregir'])

  if (fetchError) throw fetchError
  if (!pendientes?.length) {
    throw new Error('No hay factores en borrador o para corregir para enviar')
  }

  const reenvios = pendientes.filter((f) => f.estado === 'para_corregir' && f.lote_id)
  const nuevos = pendientes.filter((f) => !(f.estado === 'para_corregir' && f.lote_id))

  const supervisores = await idsPorRol(params.empresaId, ['supervisor'])
  let lotePrincipal: string | null = null
  let cantidad = 0

  // Agrupar correcciones por lote original
  const porLote = new Map<string, typeof reenvios>()
  for (const f of reenvios) {
    const lid = f.lote_id as string
    const lista = porLote.get(lid) ?? []
    lista.push(f)
    porLote.set(lid, lista)
  }

  for (const [loteId, factores] of porLote) {
    const ids = factores.map((f) => f.id)
    const { error: updError } = await client
      .from('factores')
      .update({ estado: 'en_revision_supervisor' })
      .in('id', ids)
      .eq('empresa_id', params.empresaId)
      .eq('estado', 'para_corregir')

    if (updError) throw updError

    for (const f of factores) {
      await registrarHistorial({
        factorId: f.id,
        loteId,
        usuarioId: params.userId,
        accion: 'reenvio_lote',
        estadoAnterior: 'para_corregir',
        estadoNuevo: 'en_revision_supervisor',
      })
    }

    await notificar({
      usuarioIds: supervisores,
      empresaId: params.empresaId,
      tipo: 'lote_reenviado',
      titulo: 'Lote reenviado tras corrección',
      cuerpo: `El digitador reenvió ${ids.length} factor(es) al mismo lote.`,
      enlace: `/lotes?lote=${loteId}`,
    })

    lotePrincipal ??= loteId
    cantidad += ids.length
  }

  if (nuevos.length) {
    const { data: lote, error: loteError } = await client
      .from('lotes')
      .insert({
        empresa_id: params.empresaId,
        creado_por: params.userId,
        titulo: `Envío ${new Date().toLocaleString('es-CO')}`,
      })
      .select('*')
      .single()

    if (loteError) throw loteError

    const ids = nuevos.map((b) => b.id)
    const estadoPorId = new Map(nuevos.map((b) => [b.id, b.estado]))
    const { error: updError } = await client
      .from('factores')
      .update({ estado: 'en_revision_supervisor', lote_id: lote.id })
      .in('id', ids)
      .eq('empresa_id', params.empresaId)
      .in('estado', ['borrador', 'para_corregir'])

    if (updError) throw updError

    for (const id of ids) {
      await registrarHistorial({
        factorId: id,
        loteId: lote.id,
        usuarioId: params.userId,
        accion: 'envio_lote',
        estadoAnterior: estadoPorId.get(id) ?? 'borrador',
        estadoNuevo: 'en_revision_supervisor',
      })
    }

    await notificar({
      usuarioIds: supervisores,
      empresaId: params.empresaId,
      tipo: 'lote_enviado',
      titulo: 'Nuevo lote para revisión',
      cuerpo: `El digitador envió ${ids.length} factor(es) a revisión.`,
      enlace: `/lotes?lote=${lote.id}`,
    })

    lotePrincipal ??= lote.id
    cantidad += ids.length
  }

  if (!lotePrincipal) throw new Error('No se pudo asociar el envío a un lote')
  return { loteId: lotePrincipal, cantidad }
}

export async function decidirFactor(params: {
  userId: string
  empresaId: string
  rol: Rol
  factorId: string
  aprobar: boolean
  comentario?: string
}): Promise<void> {
  const client = requireSupabase()
  const { data: factor, error } = await client
    .from('factores')
    .select('*')
    .eq('id', params.factorId)
    .eq('empresa_id', params.empresaId)
    .single()

  if (error) throw error

  const estado = assertEstado(factor.estado)
  let estadoNuevo: EstadoFactor
  let canal: CanalChat | null = null
  let notificarA: Rol[] = []
  let soloLectura: string[] = []

  if (params.rol === 'supervisor') {
    if (estado !== 'en_revision_supervisor') {
      throw new Error('Este factor no está pendiente de supervisor')
    }
    if (params.aprobar) {
      estadoNuevo = 'en_auditoria'
      notificarA = ['auditor']
    } else {
      if (!params.comentario?.trim()) throw new Error('El rechazo exige un comentario')
      estadoNuevo = 'para_corregir'
      canal = 'dig_sup'
      notificarA = ['digitador']
    }
  } else if (params.rol === 'auditor') {
    if (estado !== 'en_auditoria') throw new Error('Este factor no está pendiente de auditoría')
    if (params.aprobar) {
      estadoNuevo = 'en_aprobacion'
      notificarA = ['aprobador']
    } else {
      if (!params.comentario?.trim()) throw new Error('El rechazo exige un comentario')
      estadoNuevo = 'en_revision_supervisor'
      canal = 'aud_sup'
      notificarA = ['supervisor']
    }
  } else if (params.rol === 'aprobador') {
    if (estado !== 'en_aprobacion' && estado !== 'aprobado') {
      throw new Error('Este factor no está pendiente de aprobación final')
    }
    if (params.aprobar) {
      if (estado === 'aprobado') return
      estadoNuevo = 'aprobado'
      notificarA = ['digitador', 'supervisor', 'auditor']
    } else {
      if (!params.comentario?.trim()) throw new Error('El rechazo exige un comentario')
      // Rechazo o reapertura → supervisor analiza
      estadoNuevo = 'en_revision_supervisor'
      canal = 'apr_sup'
      soloLectura = ['auditor']
      notificarA = ['supervisor', 'auditor']
    }
  } else {
    throw new Error('Su rol no puede decidir sobre factores')
  }

  const { error: updError } = await client
    .from('factores')
    .update({ estado: estadoNuevo })
    .eq('id', params.factorId)
    .eq('empresa_id', params.empresaId)

  if (updError) throw updError

  await registrarHistorial({
    factorId: params.factorId,
    loteId: factor.lote_id,
    usuarioId: params.userId,
    accion: params.aprobar ? 'aprobar' : estado === 'aprobado' ? 'reabrir' : 'rechazar',
    estadoAnterior: estado,
    estadoNuevo,
    comentario: params.comentario?.trim() || null,
  })

  if (!params.aprobar && canal && params.comentario?.trim() && factor.lote_id) {
    const { error: msgError } = await client.from('lote_mensajes').insert({
      lote_id: factor.lote_id,
      autor_id: params.userId,
      mensaje: params.comentario.trim(),
      canal,
      solo_lectura_roles: soloLectura,
    })
    if (msgError) throw msgError
  }

  const destinos = await idsPorRol(params.empresaId, notificarA)
  await notificar({
    usuarioIds: destinos,
    empresaId: params.empresaId,
    tipo: params.aprobar ? 'factor_aprobado' : 'factor_rechazado',
    titulo: params.aprobar
      ? `Factor avanzó a ${estadoNuevo}`
      : `Factor devuelto a ${estadoNuevo}`,
    cuerpo: params.comentario?.trim() || undefined,
    enlace: factor.lote_id ? `/lotes?lote=${factor.lote_id}` : '/lotes',
  })
}

/** Digitador edita borrador: guarda diff en historial. */
export async function registrarDiffEdicion(params: {
  userId: string
  factorId: string
  loteId?: string | null
  antes: FactorFormValues
  despues: FactorFormValues
}) {
  const diff = diffObjects(
    snapshotFactor(params.antes),
    snapshotFactor(params.despues),
  )
  if (!diff) return
  await registrarHistorial({
    factorId: params.factorId,
    loteId: params.loteId,
    usuarioId: params.userId,
    accion: 'edicion',
    diff,
  })
}

export async function listarLotes(empresaId: string): Promise<LoteRow[]> {
  const { data, error } = await requireSupabase()
    .from('lotes')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listarMensajesLote(loteId: string, canal?: CanalChat): Promise<LoteMensaje[]> {
  let q = requireSupabase()
    .from('lote_mensajes')
    .select('*')
    .eq('lote_id', loteId)
    .order('created_at', { ascending: true })
  if (canal) q = q.eq('canal', canal)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as LoteMensaje[]
}

export async function enviarMensajeLote(params: {
  userId: string
  loteId: string
  mensaje: string
  canal: CanalChat
  soloLecturaRoles?: string[]
}): Promise<LoteMensaje> {
  const { data, error } = await requireSupabase()
    .from('lote_mensajes')
    .insert({
      lote_id: params.loteId,
      autor_id: params.userId,
      mensaje: params.mensaje.trim(),
      canal: params.canal,
      solo_lectura_roles: params.soloLecturaRoles ?? [],
    })
    .select('*')
    .single()
  if (error) throw error
  return data as LoteMensaje
}

export async function listarHistorialFactor(factorId: string): Promise<FactorHistorial[]> {
  const { data, error } = await requireSupabase()
    .from('factor_historial')
    .select('*')
    .eq('factor_id', factorId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as FactorHistorial[]
}

export async function listarHistorialLote(loteId: string): Promise<FactorHistorial[]> {
  const { data, error } = await requireSupabase()
    .from('factor_historial')
    .select('*')
    .eq('lote_id', loteId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as FactorHistorial[]
}

export async function listarNotificaciones(userId: string): Promise<Notificacion[]> {
  const { data, error } = await requireSupabase()
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', userId)
    .order('created_at', { ascending: false })
    .limit(40)
  if (error) throw error
  return data ?? []
}

export async function marcarNotificacionLeida(id: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', id)
  if (error) throw error
}

export async function marcarTodasNotificacionesLeidas(userId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('notificaciones')
    .update({ leida: true })
    .eq('usuario_id', userId)
    .eq('leida', false)
  if (error) throw error
}

export function canalParaRol(rol: Rol): CanalChat | null {
  if (rol === 'digitador' || rol === 'supervisor') return 'dig_sup'
  if (rol === 'auditor') return 'aud_sup'
  if (rol === 'aprobador') return 'apr_sup'
  return null
}

export function puedeEscribirCanal(rol: Rol, canal: CanalChat): boolean {
  if (canal === 'dig_sup') return rol === 'digitador' || rol === 'supervisor'
  if (canal === 'aud_sup') return rol === 'auditor' || rol === 'supervisor'
  if (canal === 'apr_sup') return rol === 'aprobador' || rol === 'supervisor'
  return false
}
