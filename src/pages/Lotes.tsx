import { MessageSquare } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoteChatDialog } from '@/components/workflow/LoteChatDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mensajeErrorSupabase } from '@/lib/factoresApi'
import { esRol, ROL_ETIQUETA, type Rol } from '@/lib/roles'
import { requireSupabase } from '@/lib/supabase'
import {
  decidirFactor,
  listarHistorialLote,
  listarLotes,
  type FactorHistorial,
  type LoteRow,
} from '@/lib/workflowApi'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { usePestelStore } from '@/store/usePestelStore'
import {
  ESTADOS_FACTOR,
  ESTADO_FACTOR_ETIQUETA,
  type EstadoFactor,
  type FactorPestel,
} from '@/types/pestel'

type ActorInfo = { nombre: string; rolEtiqueta: string }

const ACCION_ETIQUETA: Record<string, string> = {
  envio_lote: 'Envió el lote',
  reenvio_lote: 'Reenvió el lote',
  aprobar: 'Aprobó',
  rechazar: 'Rechazó',
  reabrir: 'Reabrió',
  edicion: 'Editó',
}

function etiquetaEstado(estado: string | null): string {
  if (!estado) return '—'
  if ((ESTADOS_FACTOR as readonly string[]).includes(estado)) {
    return ESTADO_FACTOR_ETIQUETA[estado as EstadoFactor]
  }
  return estado
}

type LoteConNumero = LoteRow & { numero: number }

function accionesPara(
  rol: Rol,
  estado: EstadoFactor,
): 'supervisor' | 'auditor' | 'aprobador' | null {
  if (rol === 'supervisor' && estado === 'en_revision_supervisor') return 'supervisor'
  if (rol === 'auditor' && estado === 'en_auditoria') return 'auditor'
  if (rol === 'aprobador' && (estado === 'en_aprobacion' || estado === 'aprobado')) {
    return 'aprobador'
  }
  return null
}

function resumenEstado(factores: FactorPestel[]): string {
  if (factores.length === 0) return 'Sin factores'
  const counts = new Map<string, number>()
  for (const f of factores) {
    counts.set(f.estado, (counts.get(f.estado) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([e, n]) => `${n} ${ESTADO_FACTOR_ETIQUETA[e as EstadoFactor] ?? e}`)
    .join(' · ')
}

export function Lotes() {
  const userId = useAuthStore((s) => s.user?.id)
  const empresaId = useAuthStore((s) => s.empresa?.id)
  const rol = useAuthStore((s) => s.perfil?.rol) as Rol | undefined
  const factores = usePestelStore((s) => s.factores)
  const cargarDesdeNube = usePestelStore((s) => s.cargarDesdeNube)
  const [searchParams, setSearchParams] = useSearchParams()

  const [lotes, setLotes] = useState<LoteConNumero[]>([])
  const [cargando, setCargando] = useState(true)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [chatAbierto, setChatAbierto] = useState(false)
  const [historial, setHistorial] = useState<FactorHistorial[]>([])
  const [actores, setActores] = useState<Record<string, ActorInfo>>({})

  const loteSeleccionadoId = searchParams.get('lote')

  const recargarLotes = useCallback(async () => {
    if (!empresaId) return
    setCargando(true)
    try {
      const rows = await listarLotes(empresaId)
      // Numeración estable: Lote 1 = más antiguo
      const ordenados = [...rows].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      const conNumero: LoteConNumero[] = ordenados.map((l, i) => ({ ...l, numero: i + 1 }))
      // Lista UI: más recientes arriba
      setLotes([...conNumero].reverse())
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    } finally {
      setCargando(false)
    }
  }, [empresaId])

  useEffect(() => {
    void recargarLotes()
  }, [recargarLotes])

  const loteActivo = useMemo(
    () => lotes.find((l) => l.id === loteSeleccionadoId) ?? lotes[0] ?? null,
    [lotes, loteSeleccionadoId],
  )

  useEffect(() => {
    if (!loteSeleccionadoId && lotes[0]) {
      setSearchParams({ lote: lotes[0].id }, { replace: true })
    }
  }, [loteSeleccionadoId, lotes, setSearchParams])

  const factoresDelLote = useMemo(
    () => (loteActivo ? factores.filter((f) => f.loteId === loteActivo.id) : []),
    [factores, loteActivo],
  )

  const esAuditor = rol === 'auditor'

  useEffect(() => {
    if (!loteActivo || !esAuditor) {
      setHistorial([])
      setActores({})
      return
    }
    let cancelado = false
    void listarHistorialLote(loteActivo.id)
      .then(async (lista) => {
        if (cancelado) return
        setHistorial(lista)
        const ids = [...new Set(lista.map((h) => h.usuario_id).filter(Boolean))] as string[]
        if (ids.length === 0) {
          setActores({})
          return
        }
        const { data } = await requireSupabase()
          .from('perfiles')
          .select('id, nombre, apellido, rol')
          .in('id', ids)
        if (cancelado) return
        const map: Record<string, ActorInfo> = {}
        for (const id of ids) {
          const p = data?.find((row) => row.id === id)
          const nombre = p
            ? [p.nombre, p.apellido].filter(Boolean).join(' ').trim()
            : ''
          map[id] = {
            nombre: nombre || 'Usuario',
            rolEtiqueta: p && esRol(p.rol) ? ROL_ETIQUETA[p.rol] : '—',
          }
        }
        setActores(map)
      })
      .catch(() => {
        if (!cancelado) {
          setHistorial([])
          setActores({})
        }
      })
    return () => {
      cancelado = true
    }
  }, [loteActivo, esAuditor])

  function seleccionarLote(id: string) {
    setSearchParams({ lote: id })
    setComentario('')
    setChatAbierto(false)
  }

  async function refrescar() {
    if (!empresaId) return
    await Promise.all([
      cargarDesdeNube(empresaId, true).catch(() => undefined),
      recargarLotes(),
    ])
  }

  async function onDecidir(factorId: string, aprobar: boolean) {
    if (!userId || !empresaId || !rol) return
    if (!aprobar && !comentario.trim()) {
      toast.error('Indique un comentario para rechazar')
      return
    }
    setEnviando(true)
    try {
      await decidirFactor({
        userId,
        empresaId,
        rol,
        factorId,
        aprobar,
        comentario: comentario.trim() || undefined,
      })
      setComentario('')
      toast.success(aprobar ? 'Factor aprobado' : 'Factor rechazado')
      await refrescar()
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    } finally {
      setEnviando(false)
    }
  }

  if (!rol || rol === 'admin_empresa' || rol === 'sistema') {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl text-foreground">Lotes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta vista es para digitador, supervisor, auditor y aprobador.
        </p>
      </div>
    )
  }

  const etiqueta = loteActivo ? `Lote ${loteActivo.numero}` : 'Lote'

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[16rem_1fr]">
      <aside className="space-y-3">
        <header>
          <h1 className="text-2xl text-foreground">Lotes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada envío del digitador es un lote numerado.
          </p>
        </header>

        {cargando ? (
          <p className="text-xs text-muted-foreground">Cargando…</p>
        ) : lotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay lotes enviados.</p>
        ) : (
          <ul className="space-y-1">
            {lotes.map((l) => {
              const delLote = factores.filter((f) => f.loteId === l.id)
              const activo = loteActivo?.id === l.id
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => seleccionarLote(l.id)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left transition-colors',
                      activo
                        ? 'bg-primary/20 text-foreground shadow-glow'
                        : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
                    )}
                  >
                    <p className="text-sm font-medium">Lote {l.numero}</p>
                    <p className="mt-0.5 text-[11px] opacity-80">
                      {new Date(l.created_at).toLocaleString('es-CO')} · {delLote.length} factor(es)
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] opacity-70">
                      {resumenEstado(delLote)}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </aside>

      <div className="min-w-0 space-y-4">
        {!loteActivo ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Seleccione un lote para revisarlo.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{etiqueta}</CardTitle>
                  <CardDescription>
                    {loteActivo.titulo ?? 'Envío para aprobación'} ·{' '}
                    {new Date(loteActivo.created_at).toLocaleString('es-CO')}
                  </CardDescription>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Factores de este lote: {factoresDelLote.length}
                  </p>
                </div>
                {userId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setChatAbierto(true)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                {(rol === 'supervisor' || rol === 'auditor' || rol === 'aprobador') && (
                  <div className="space-y-1.5">
                    <Label htmlFor="comentario-lote">
                      Comentario (obligatorio al rechazar / reabrir)
                    </Label>
                    <Input
                      id="comentario-lote"
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Explique la corrección o el motivo"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {rol === 'supervisor'
                        ? 'Al rechazar, el factor queda “Para corregir” para el digitador.'
                        : 'Al rechazar, el factor vuelve al supervisor.'}
                    </p>
                  </div>
                )}

                <ul className="space-y-2">
                  {factoresDelLote.length === 0 ? (
                    <li className="text-sm text-muted-foreground">
                      Este lote no tiene factores vinculados.
                    </li>
                  ) : (
                    factoresDelLote.map((f) => {
                      const accion = accionesPara(rol, f.estado)
                      return (
                        <li
                          key={f.id}
                          className="flex flex-col gap-2 rounded-lg bg-foreground/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-foreground">{f.descripcion}</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <Badge variant="outline">{ESTADO_FACTOR_ETIQUETA[f.estado]}</Badge>
                              <Badge variant="outline">{f.categoria}</Badge>
                            </div>
                          </div>
                          {accion ? (
                            <div className="flex shrink-0 gap-2">
                              {f.estado !== 'aprobado' ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={enviando}
                                  onClick={() => void onDecidir(f.id, true)}
                                >
                                  Aprobar
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={enviando}
                                onClick={() => void onDecidir(f.id, false)}
                              >
                                {f.estado === 'aprobado' ? 'Reabrir' : 'Rechazar'}
                              </Button>
                            </div>
                          ) : null}
                        </li>
                      )
                    })
                  )}
                </ul>
              </CardContent>
            </Card>

            {esAuditor ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Historial / diffs</CardTitle>
                  <CardDescription>
                    Solo visible para auditoría: cambios y diferencias del lote.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="max-h-64 space-y-2 overflow-y-auto text-[11px] text-muted-foreground">
                    {historial.length === 0 ? (
                      <li>Sin eventos</li>
                    ) : (
                      historial.map((h) => {
                        const actor = h.usuario_id ? actores[h.usuario_id] : null
                        const accion = ACCION_ETIQUETA[h.accion] ?? h.accion
                        return (
                          <li key={h.id} className="rounded bg-foreground/5 px-2 py-1.5">
                            <p className="text-foreground">
                              <span className="font-medium">
                                {actor ? `${actor.nombre} (${actor.rolEtiqueta})` : 'Usuario'}
                              </span>
                              {' · '}
                              {accion}
                            </p>
                            {h.estado_anterior || h.estado_nuevo ? (
                              <p className="mt-0.5">
                                {etiquetaEstado(h.estado_anterior)} →{' '}
                                {etiquetaEstado(h.estado_nuevo)}
                              </p>
                            ) : null}
                            {h.comentario ? (
                              <p className="mt-0.5 italic">“{h.comentario}”</p>
                            ) : null}
                            <p className="mt-0.5 text-[10px] opacity-70">
                              {new Date(h.created_at).toLocaleString('es-CO')}
                            </p>
                            {h.diff ? (
                              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[10px]">
                                {JSON.stringify(h.diff, null, 2)}
                              </pre>
                            ) : null}
                          </li>
                        )
                      })
                    )}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {userId && loteActivo ? (
              <LoteChatDialog
                open={chatAbierto}
                onOpenChange={setChatAbierto}
                loteId={loteActivo.id}
                loteEtiqueta={etiqueta}
                userId={userId}
                rol={rol}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
