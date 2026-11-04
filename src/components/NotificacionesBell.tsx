import { Bell } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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

export function NotificacionesBell() {
  const userId = useAuthStore((s) => s.user?.id)
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [items, setItems] = useState<Notificacion[]>([])

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
    <div className="relative">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Notificaciones"
        onClick={() => {
          setAbierto((v) => !v)
          void recargar()
        }}
      >
        <Bell className="h-4 w-4" />
        {noLeidas > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critico px-1 text-[10px] text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        ) : null}
      </Button>

      {abierto ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-80 max-w-[90vw] rounded-xl border border-border bg-surface p-2 shadow-lg sm:left-auto sm:right-0">
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
        </div>
      ) : null}
    </div>
  )
}
