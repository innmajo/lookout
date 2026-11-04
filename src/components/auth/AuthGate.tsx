import { useEffect, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { puedeVerFactores } from '@/lib/roles'
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
            Aplica las migraciones (`supabase db push` o el Action de GitHub) y despliega la función{' '}
            <code className="text-foreground">crear-usuario</code>.
          </li>
          <li>
            Reinicia <code className="text-foreground">npm run dev</code>.
          </li>
        </ol>
      </div>
    </div>
  )
}

/** Escucha auth, carga perfil/empresa y factores de la empresa. */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const empresaId = useAuthStore((s) => s.empresa?.id ?? null)
  const rol = useAuthStore((s) => s.perfil?.rol)
  const cargarContexto = useAuthStore((s) => s.cargarContexto)
  const limpiarContexto = useAuthStore((s) => s.limpiarContexto)
  const cargarDesdeNube = usePestelStore((s) => s.cargarDesdeNube)
  const limpiarLocal = usePestelStore((s) => s.limpiarLocal)

  useEffect(() => bootstrapAuth(), [])

  useEffect(() => {
    if (!userId) {
      limpiarContexto()
      limpiarLocal()
      return
    }
    void cargarContexto(userId).catch(() => undefined)
  }, [userId, cargarContexto, limpiarContexto, limpiarLocal])

  useEffect(() => {
    if (!empresaId) {
      if (rol === 'sistema') {
        limpiarLocal()
      }
      return
    }
    void cargarDesdeNube(empresaId).catch(() => undefined)
  }, [empresaId, rol, cargarDesdeNube, limpiarLocal])

  return children
}

/** Exige sesión + perfil; si no hay, redirige a /login. */
export function RequireAuth() {
  const location = useLocation()
  const initializing = useAuthStore((s) => s.initializing)
  const session = useAuthStore((s) => s.session)
  const perfil = useAuthStore((s) => s.perfil)
  const empresa = useAuthStore((s) => s.empresa)
  const loadingDatos = usePestelStore((s) => s.loading)
  const hydratedEmpresaId = usePestelStore((s) => s.hydratedEmpresaId)

  if (!isSupabaseConfigured) return <SetupSupabase />
  if (initializing) return <PantallaCarga mensaje="Comprobando sesión…" />
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  if (!perfil) return <PantallaCarga mensaje="Cargando perfil…" />

  if (perfil.rol === 'sistema') {
    return <Outlet />
  }

  if (!empresa) return <PantallaCarga mensaje="Cargando empresa…" />

  if (puedeVerFactores(perfil.rol) && (loadingDatos || hydratedEmpresaId !== empresa.id)) {
    return <PantallaCarga mensaje="Sincronizando datos de la empresa…" />
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

/** Solo admin_empresa (o sistema). */
export function RequireAdminEmpresa() {
  const rol = useAuthStore((s) => s.perfil?.rol)
  if (rol !== 'admin_empresa' && rol !== 'sistema') {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
