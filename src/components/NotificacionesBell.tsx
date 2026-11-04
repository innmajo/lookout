import { Bell } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  type Notificacion,
} from '@/lib/workflowApi'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

export function NotificacionesBell({
  placement = 'header',
}: {
  /** sidebar: panel hacia la derecha/arriba del botón; header: debajo */
  placement?: 'sidebar' | 'header'
}) {
  const userId = useAuthStore((s) => s.user?.id)
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [items, setItems] = useState<Notificacion[]>([])
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const recargar = useCallback(async () => {
    if (!userId) return
    try {
      const lista = await listarNotificaciones(userId)
      setItems(lista)
    } catch {
      // silencioso
    }
  }, [userId])

  useEffect(() => {
    void recargar()
    const id = window.setInterval(() => void recargar(), 30000)
    return () => window.clearInterval(id)
  }, [recargar])

  const medir = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const panelW = Math.min(320, window.innerWidth - 16)
    if (placement === 'sidebar') {
      let left = r.right + 8
      if (left + panelW > window.innerWidth - 8) left = Math.max(8, r.left - panelW - 8)
      const top = Math.max(8, Math.min(r.bottom - 8, window.innerHeight - 320))
      setCoords({ top, left })
    } else {
      let left = r.right - panelW
      left = Math.max(8, Math.min(left, window.innerWidth - panelW - 8))
      setCoords({ top: r.bottom + 8, left })
    }
  }, [placement])

  useLayoutEffect(() => {
    if (!abierto) {
      setCoords(null)
      return
    }
    medir()
    window.addEventListener('resize', medir)
    window.addEventListener('scroll', medir, true)
    return () => {
      window.removeEventListener('resize', medir)
      window.removeEventListener('scroll', medir, true)
    }
  }, [abierto, medir])

  useEffect(() => {
    if (!abierto) return
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setAbierto(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [abierto])

  const noLeidas = items.filter((n) => !n.leida).length

  async function abrirItem(n: Notificacion) {
    if (!n.leida) {
      await marcarNotificacionLeida(n.id).catch(() => undefined)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)))
    }
    setAbierto(false)
    if (n.enlace) navigate(n.enlace)
  }

  async function marcarTodas() {
    if (!userId) return
    await marcarTodasNotificacionesLeidas(userId).catch(() => undefined)
    setItems((prev) => prev.map((x) => ({ ...x, leida: true })))
  }

  if (!userId) return null

  return (
    <>
      <div className="relative inline-flex">
        <Button
          ref={btnRef}
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Notificaciones"
          aria-expanded={abierto}
          onClick={() => {
            setAbierto((v) => !v)
            void recargar()
          }}
        >
          <Bell className="h-4 w-4" />
        </Button>
        {noLeidas > 0 ? (
          <span className="pointer-events-none absolute -right-0.5 -top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-critico px-1 text-[10px] text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        ) : null}
      </div>

      {abierto && coords
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Avisos"
              className="fixed z-[80] w-80 max-w-[calc(100vw-1rem)] rounded-xl border border-border bg-surface p-2 shadow-lg"
              style={{ top: coords.top, left: coords.left }}
            >
              <div className="mb-2 flex items-center justify-between px-2">
                <p className="text-xs font-medium text-foreground">Avisos</p>
                {noLeidas > 0 ? (
                  <button
                    type="button"
                    className="text-[11px] text-primary hover:underline"
                    onClick={() => void marcarTodas()}
                  >
                    Marcar todas leídas
                  </button>
                ) : null}
              </div>
              <ul className="max-h-72 space-y-1 overflow-y-auto">
                {items.length === 0 ? (
                  <li className="px-2 py-4 text-center text-xs text-muted-foreground">
                    Sin notificaciones
                  </li>
                ) : (
                  items.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={cn(
                          'w-full rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-foreground/5',
                          !n.leida && 'bg-primary/10',
                        )}
                        onClick={() => void abrirItem(n)}
                      >
                        <p className="font-medium text-foreground">{n.titulo}</p>
                        {n.cuerpo ? (
                          <p className="mt-0.5 line-clamp-2 text-muted-foreground">{n.cuerpo}</p>
                        ) : null}
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(n.created_at).toLocaleString('es-CO')}
                        </p>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
