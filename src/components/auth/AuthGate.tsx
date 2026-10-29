import { useEffect, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isSupabaseConfigured } from '@/lib/supabase'
import { bootstrapAuth, useAuthStore } from '@/store/useAuthStore'
import { usePestelStore } from '@/store/usePestelStore'

function PantallaCarga({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">{mensaje}</p>
    </div>
  )
}

function SetupSupabase() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="glass max-w-lg space-y-3 rounded-2xl p-6">
        <h1 className="text-xl font-semibold text-foreground">Configura Supabase</h1>
        <p className="text-sm text-muted-foreground">
          Falta <code className="text-foreground">VITE_SUPABASE_URL</code> y{' '}
          <code className="text-foreground">VITE_SUPABASE_ANON_KEY</code>.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Copia <code className="text-foreground">.env.example</code> a{' '}
            <code className="text-foreground">.env.local</code> y pega las claves del proyecto.
          </li>
          <li>
            Ejecuta el SQL de <code className="text-foreground">supabase/schema.sql</code> en el SQL
            Editor.
          </li>
          <li>
            Reinicia <code className="text-foreground">npm run dev</code>.
          </li>
        </ol>
      </div>
    </div>
  )
}

/** Escucha auth y carga factores del usuario autenticado. */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const cargarDesdeNube = usePestelStore((s) => s.cargarDesdeNube)
  const limpiarLocal = usePestelStore((s) => s.limpiarLocal)

  useEffect(() => bootstrapAuth(), [])

  useEffect(() => {
    if (!userId) {
      limpiarLocal()
      return
    }
    void cargarDesdeNube(userId).catch(() => undefined)
  }, [userId, cargarDesdeNube, limpiarLocal])

  return children
}

/** Exige sesión; si no hay, redirige a /login. */
export function RequireAuth() {
  const location = useLocation()
  const initializing = useAuthStore((s) => s.initializing)
  const session = useAuthStore((s) => s.session)
  const loadingDatos = usePestelStore((s) => s.loading)
  const hydratedUserId = usePestelStore((s) => s.hydratedUserId)

  if (!isSupabaseConfigured) return <SetupSupabase />
  if (initializing) return <PantallaCarga mensaje="Comprobando sesión…" />
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  if (loadingDatos || hydratedUserId !== session.user.id) {
    return <PantallaCarga mensaje="Sincronizando factores…" />
  }

  return <Outlet />
}

/** Si ya hay sesión, manda al dashboard. */
export function GuestOnly() {
  const initializing = useAuthStore((s) => s.initializing)
  const session = useAuthStore((s) => s.session)

  if (!isSupabaseConfigured) return <SetupSupabase />
  if (initializing) return <PantallaCarga mensaje="Comprobando sesión…" />
  if (session) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
