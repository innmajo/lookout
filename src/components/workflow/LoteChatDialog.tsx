import { MessageSquare } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { mensajeErrorSupabase } from '@/lib/factoresApi'
import type { Rol } from '@/lib/roles'
import { requireSupabase } from '@/lib/supabase'
import {
  enviarMensajeLote,
  listarMensajesLote,
  type CanalChat,
  type LoteMensaje,
} from '@/lib/workflowApi'
import { cn } from '@/lib/utils'

type Hilo = {
  canal: CanalChat
  titulo: string
  subtitulo: string
  puedeVer: boolean
  puedeEscribir: boolean
}

function hilosParaRol(rol: Rol): Hilo[] {
  const dig: Hilo = {
    canal: 'dig_sup',
    titulo: 'Supervisor ↔ Digitador',
    subtitulo: 'Correcciones y observaciones del lote',
    puedeVer: rol === 'digitador' || rol === 'supervisor' || rol === 'auditor',
    puedeEscribir: rol === 'digitador' || rol === 'supervisor',
  }
  const aud: Hilo = {
    canal: 'aud_sup',
    titulo: 'Supervisor ↔ Auditor',
    subtitulo: 'Devoluciones y comentarios de auditoría',
    puedeVer: rol === 'supervisor' || rol === 'auditor',
    puedeEscribir: rol === 'supervisor' || rol === 'auditor',
  }
  // Aprobador escribe al supervisor; el auditor solo ve esta conversación
  const apr: Hilo = {
    canal: 'apr_sup',
    titulo: 'Supervisor ↔ Aprobador',
    subtitulo:
      rol === 'auditor'
        ? 'Correcciones del aprobador · solo lectura'
        : 'Correcciones finales del aprobador',
    puedeVer: rol === 'supervisor' || rol === 'aprobador' || rol === 'auditor',
    puedeEscribir: rol === 'supervisor' || rol === 'aprobador',
  }
  if (rol === 'digitador') return [dig]
  if (rol === 'aprobador') return [apr]
  return [dig, aud, apr].filter((h) => h.puedeVer)
}

function previewMensaje(mensajes: LoteMensaje[]): string {
  if (!mensajes.length) return 'Sin mensajes aún'
  const ultimo = mensajes[mensajes.length - 1]
  return ultimo.mensaje.length > 48 ? `${ultimo.mensaje.slice(0, 48)}…` : ultimo.mensaje
}

/** Chat tipo mensajería: lista de hilos + burbujas. */
export function LoteChatDialog({
  open,
  onOpenChange,
  loteId,
  loteEtiqueta,
  userId,
  rol,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  loteId: string
  loteEtiqueta: string
  userId: string
  rol: Rol
}) {
  const hilos = useMemo(() => hilosParaRol(rol), [rol])
  const [canalActivo, setCanalActivo] = useState<CanalChat>(hilos[0]?.canal ?? 'dig_sup')
  const [porCanal, setPorCanal] = useState<Record<string, LoteMensaje[]>>({})
  const [nombres, setNombres] = useState<Record<string, string>>({})
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const listaRef = useRef<HTMLUListElement>(null)

  const hiloActivo = hilos.find((h) => h.canal === canalActivo) ?? hilos[0]
  const mensajes = porCanal[canalActivo] ?? []

  const autorIds = useMemo(() => {
    const ids = new Set<string>()
    for (const lista of Object.values(porCanal)) {
      for (const m of lista) ids.add(m.autor_id)
    }
    return [...ids]
  }, [porCanal])

  const recargar = useCallback(async () => {
    try {
      const entradas = await Promise.all(
        hilos.map(async (h) => [h.canal, await listarMensajesLote(loteId, h.canal)] as const),
      )
      setPorCanal(Object.fromEntries(entradas))
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    }
  }, [loteId, hilos])

  useEffect(() => {
    if (!open) return
    if (!hilos.some((h) => h.canal === canalActivo)) {
      setCanalActivo(hilos[0]?.canal ?? 'dig_sup')
    }
  }, [open, hilos, canalActivo])

  useEffect(() => {
    if (!open) return
    void recargar()
    const id = window.setInterval(() => void recargar(), 8000)
    return () => window.clearInterval(id)
  }, [open, recargar])

  useEffect(() => {
    if (!open || autorIds.length === 0) return
    const faltantes = autorIds.filter((id) => !(id in nombres))
    if (faltantes.length === 0) return
    let cancelado = false
    void requireSupabase()
      .from('perfiles')
      .select('id, nombre, apellido')
      .in('id', faltantes)
      .then(({ data }) => {
        if (cancelado) return
        setNombres((prev) => {
          const next = { ...prev }
          for (const id of faltantes) {
            const p = data?.find((row) => row.id === id)
            const label = p
              ? [p.nombre, p.apellido].filter(Boolean).join(' ').trim()
              : ''
            next[id] = label || 'Usuario'
          }
          return next
        })
      })
    return () => {
      cancelado = true
    }
  }, [open, autorIds, nombres])

  useEffect(() => {
    const el = listaRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [mensajes, canalActivo, open])

  async function onEnviar() {
    if (!texto.trim() || !hiloActivo?.puedeEscribir) return
    setEnviando(true)
    try {
      await enviarMensajeLote({
        userId,
        loteId,
        mensaje: texto,
        canal: hiloActivo.canal,
        soloLecturaRoles: hiloActivo.canal === 'apr_sup' ? ['auditor'] : [],
      })
      setTexto('')
      await recargar()
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    } finally {
      setEnviando(false)
    }
  }

  function etiquetaAutor(autorId: string) {
    if (autorId === userId) return 'Usted'
    return nombres[autorId] ?? 'Usuario'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(85vh,40rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Chat · {loteEtiqueta}
          </DialogTitle>
          <DialogDescription>
            Hilos del lote. Elija una conversación a la izquierda.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 md:grid-cols-[15rem_1fr]">
          {/* Lista de conversaciones (tipo burbujas / canales) */}
          <aside className="flex min-h-0 flex-col border-b border-border md:border-b-0 md:border-r">
            <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Conversaciones
            </p>
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {hilos.map((h) => {
                const lista = porCanal[h.canal] ?? []
                const activo = canalActivo === h.canal
                return (
                  <li key={h.canal}>
                    <button
                      type="button"
                      onClick={() => {
                        setCanalActivo(h.canal)
                        setTexto('')
                      }}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2.5 text-left transition-colors',
                        activo
                          ? 'border-primary/50 bg-primary/15 shadow-glow'
                          : 'border-transparent bg-foreground/[0.03] hover:bg-foreground/5',
                      )}
                    >
                      <p className="text-sm font-medium text-foreground">{h.titulo}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                        {previewMensaje(lista)}
                      </p>
                      {lista.length > 0 ? (
                        <p className="mt-1 text-[10px] text-primary/80">
                          {lista.length} mensaje{lista.length === 1 ? '' : 's'}
                        </p>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          {/* Ventana de chat con burbujas */}
          <section className="flex min-h-0 flex-col">
            <header className="shrink-0 border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                {hiloActivo?.titulo ?? 'Conversación'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {hiloActivo?.subtitulo}
                {!hiloActivo?.puedeEscribir ? ' · Solo lectura' : ''}
              </p>
            </header>

            <ul
              ref={listaRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-foreground/[0.02] px-4 py-4"
            >
              {mensajes.length === 0 ? (
                <li className="flex h-full min-h-[10rem] items-center justify-center">
                  <p className="text-center text-sm text-muted-foreground">
                    Aún no hay mensajes en esta conversación
                  </p>
                </li>
              ) : (
                mensajes.map((m) => {
                  const mio = m.autor_id === userId
                  return (
                    <li
                      key={m.id}
                      className={cn('flex w-full', mio ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[min(85%,22rem)] rounded-2xl px-3.5 py-2.5 shadow-sm',
                          mio
                            ? 'rounded-br-md bg-primary text-white'
                            : 'rounded-bl-md border border-border bg-surface text-foreground',
                        )}
                      >
                        <p
                          className={cn(
                            'text-[10px] font-semibold',
                            mio ? 'text-white/80' : 'text-muted-foreground',
                          )}
                        >
                          {etiquetaAutor(m.autor_id)}
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-snug">
                          {m.mensaje}
                        </p>
                        <p
                          className={cn(
                            'mt-1 text-right text-[10px]',
                            mio ? 'text-white/65' : 'text-muted-foreground',
                          )}
                        >
                          {new Date(m.created_at).toLocaleString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: 'short',
                          })}
                        </p>
                      </div>
                    </li>
                  )
                })
              )}
            </ul>

            <footer className="shrink-0 border-t border-border p-3">
              {hiloActivo?.puedeEscribir ? (
                <div className="flex gap-2">
                  <Input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Escriba un mensaje…"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void onEnviar()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    disabled={enviando || !texto.trim()}
                    onClick={() => void onEnviar()}
                  >
                    Enviar
                  </Button>
                </div>
              ) : (
                <p className="py-1 text-center text-xs text-muted-foreground">
                  Su rol solo puede leer este hilo.
                </p>
              )}
            </footer>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
