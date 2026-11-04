import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mensajeErrorSupabase } from '@/lib/factoresApi'
import type { Rol } from '@/lib/roles'
import {
  canalParaRol,
  decidirFactor,
  enviarMensajeLote,
  listarHistorialLote,
  listarMensajesLote,
  puedeEscribirCanal,
  type CanalChat,
  type FactorHistorial,
  type LoteMensaje,
} from '@/lib/workflowApi'
import { ESTADO_FACTOR_ETIQUETA, type EstadoFactor, type FactorPestel } from '@/types/pestel'

export function LotePanel({
  loteId,
  factores,
  userId,
  empresaId,
  rol,
  onChanged,
}: {
  loteId: string
  factores: FactorPestel[]
  userId: string
  empresaId: string
  rol: Rol
  onChanged: () => void
}) {
  const delLote = useMemo(() => factores.filter((f) => f.loteId === loteId), [factores, loteId])
  const canalPreferido = canalParaRol(rol)
  const [canal, setCanal] = useState<CanalChat>(canalPreferido ?? 'dig_sup')
  const [mensajes, setMensajes] = useState<LoteMensaje[]>([])
  const [historial, setHistorial] = useState<FactorHistorial[]>([])
  const [texto, setTexto] = useState('')
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)

  const recargar = useCallback(async () => {
    try {
      const [msgs, hist] = await Promise.all([
        listarMensajesLote(loteId, canal),
        listarHistorialLote(loteId),
      ])
      setMensajes(msgs)
      setHistorial(hist)
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    }
  }, [loteId, canal])

  useEffect(() => {
    void recargar()
  }, [recargar])

  useEffect(() => {
    if (canalPreferido) setCanal(canalPreferido)
  }, [canalPreferido])

  async function onEnviarMensaje() {
    if (!texto.trim() || !puedeEscribirCanal(rol, canal)) return
    setEnviando(true)
    try {
      await enviarMensajeLote({
        userId,
        loteId,
        mensaje: texto,
        canal,
        soloLecturaRoles: canal === 'apr_sup' ? ['auditor'] : [],
      })
      setTexto('')
      await recargar()
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    } finally {
      setEnviando(false)
    }
  }

  async function onDecidir(factorId: string, aprobar: boolean) {
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
      onChanged()
      await recargar()
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    } finally {
      setEnviando(false)
    }
  }

  function accionesPara(estado: EstadoFactor): 'supervisor' | 'auditor' | 'aprobador' | null {
    if (rol === 'supervisor' && estado === 'en_revision_supervisor') return 'supervisor'
    if (rol === 'auditor' && estado === 'en_auditoria') return 'auditor'
    if (rol === 'aprobador' && (estado === 'en_aprobacion' || estado === 'aprobado')) {
      return 'aprobador'
    }
    return null
  }

  const puedeChat = puedeEscribirCanal(rol, canal)

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <header>
        <h3 className="text-sm font-semibold text-foreground">Lote de revisión</h3>
        <p className="text-xs text-muted-foreground">{delLote.length} factor(es) en este envío</p>
      </header>

      <ul className="space-y-2">
        {delLote.map((f) => {
          const accion = accionesPara(f.estado)
          return (
            <li
              key={f.id}
              className="flex flex-col gap-2 rounded-lg bg-foreground/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{f.descripcion}</p>
                <Badge variant="outline" className="mt-1">
                  {ESTADO_FACTOR_ETIQUETA[f.estado]}
                </Badge>
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
        })}
      </ul>

      {(rol === 'supervisor' || rol === 'auditor' || rol === 'aprobador') && (
        <div className="space-y-1.5">
          <Label htmlFor="comentario-rechazo">Comentario (obligatorio al rechazar / reabrir)</Label>
          <Input
            id="comentario-rechazo"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Explique la corrección o el motivo"
          />
        </div>
      )}

      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex flex-wrap gap-2">
          {(['dig_sup', 'aud_sup', 'apr_sup'] as CanalChat[]).map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={canal === c ? 'default' : 'outline'}
              onClick={() => setCanal(c)}
            >
              {c === 'dig_sup'
                ? 'Digitador ↔ Supervisor'
                : c === 'aud_sup'
                  ? 'Auditor ↔ Supervisor'
                  : 'Aprobador ↔ Supervisor'}
            </Button>
          ))}
        </div>
        <ul className="max-h-40 space-y-2 overflow-y-auto rounded-lg bg-foreground/5 p-2 text-xs">
          {mensajes.length === 0 ? (
            <li className="text-muted-foreground">Sin mensajes en este canal</li>
          ) : (
            mensajes.map((m) => (
              <li key={m.id}>
                <span className="text-muted-foreground">
                  {new Date(m.created_at).toLocaleString('es-CO')}:
                </span>{' '}
                <span className="text-foreground">{m.mensaje}</span>
                {m.solo_lectura_roles?.includes('auditor') ? (
                  <span className="ml-1 text-[10px] text-muted-foreground">(auditor en copia)</span>
                ) : null}
              </li>
            ))
          )}
        </ul>
        {puedeChat ? (
          <div className="flex gap-2">
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escriba una observación…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void onEnviarMensaje()
                }
              }}
            />
            <Button type="button" size="sm" disabled={enviando || !texto.trim()} onClick={() => void onEnviarMensaje()}>
              Enviar
            </Button>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">Solo lectura en este canal.</p>
        )}
      </div>

      {rol === 'auditor' || rol === 'aprobador' || rol === 'supervisor' ? (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-foreground">Historial / diffs del lote</p>
          <ul className="max-h-48 space-y-2 overflow-y-auto text-[11px] text-muted-foreground">
            {historial.length === 0 ? (
              <li>Sin eventos</li>
            ) : (
              historial.map((h) => (
                <li key={h.id} className="rounded bg-foreground/5 px-2 py-1">
                  <span className="text-foreground">{h.accion}</span>
                  {h.estado_anterior && h.estado_nuevo
                    ? ` · ${h.estado_anterior} → ${h.estado_nuevo}`
                    : null}
                  {h.comentario ? ` · “${h.comentario}”` : null}
                  {h.diff ? (
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[10px]">
                      {JSON.stringify(h.diff, null, 2)}
                    </pre>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
