import { useEffect, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { puedeVerFactores } from '@/lib/roles'
import { isSupabaseConfigured, requireSupabase } from '@/lib/supabase'
import { bootstrapAuth, useAuthStore } from '@/store/useAuthStore'
import { usePestelStore } from '@/store/usePestelStore'
import { useThemeStore } from '@/store/useThemeStore'

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
            Aplica las migraciones (`supabase db push --remote`) y despliega la función{' '}
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
  const debeCambiarPassword = useAuthStore((s) => s.perfil?.debe_cambiar_password === true)
  const cargarContexto = useAuthStore((s) => s.cargarContexto)
  const limpiarContexto = useAuthStore((s) => s.limpiarContexto)
  const setAuthError = useAuthStore((s) => s.setAuthError)
  const cargarDesdeNube = usePestelStore((s) => s.cargarDesdeNube)
  const limpiarLocal = usePestelStore((s) => s.limpiarLocal)

  useEffect(() => bootstrapAuth(), [])

  useEffect(() => {
    if (!userId) {
      limpiarContexto()
      limpiarLocal()
      return
    }

    let cancelado = false
    void cargarContexto(userId).catch(async (err) => {
      if (cancelado) return
      const mensaje =
        err instanceof Error ? err.message : 'No se pudo validar su cuenta.'
      setAuthError(mensaje)
      limpiarContexto()
      limpiarLocal()
      useThemeStore.setState({ sectorFijo: false })
      try {
        await requireSupabase().auth.signOut()
      } catch {
        // ignore
      }
      useAuthStore.setState({ session: null, user: null })
    })

    return () => {
      cancelado = true
    }
  }, [userId, cargarContexto, limpiarContexto, limpiarLocal, setAuthError])

  useEffect(() => {
    // No sincronizar datos de negocio hasta cambiar la contraseña temporal.
    if (debeCambiarPassword) return
    if (!empresaId) {
      if (rol === 'sistema') {
        limpiarLocal()
      }
      return
    }
    void cargarDesdeNube(empresaId).catch(() => undefined)
  }, [empresaId, rol, debeCambiarPassword, cargarDesdeNube, limpiarLocal])

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

  if (perfil.debe_cambiar_password === true && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />
  }

  if (perfil.rol === 'sistema') {
    return <Outlet />
  }

  if (!empresa) return <PantallaCarga mensaje="Cargando empresa…" />

  if (puedeVerFactores(perfil.rol) && (loadingDatos || hydratedEmpresaId !== empresa.id)) {
    return <PantallaCarga mensaje="Sincronizando datos de la empresa…" />
  }

  return <Outlet />
}

/** Si ya hay sesión, manda al dashboard (o a cambiar contraseña). */
export function GuestOnly() {
  const initializing = useAuthStore((s) => s.initializing)
  const session = useAuthStore((s) => s.session)
  const perfil = useAuthStore((s) => s.perfil)

  if (!isSupabaseConfigured) return <SetupSupabase />
  if (initializing) return <PantallaCarga mensaje="Comprobando sesión…" />
  if (session && perfil?.debe_cambiar_password === true) {
    return <Navigate to="/cambiar-password" replace />
  }
  if (session && perfil) return <Navigate to="/dashboard" replace />
  if (session && !perfil) return <PantallaCarga mensaje="Cargando perfil…" />
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

/** Solo si debe cambiar la contraseña temporal. */
export function RequireCambioPassword() {
  const perfil = useAuthStore((s) => s.perfil)
  const session = useAuthStore((s) => s.session)
  if (!session) return <Navigate to="/login" replace />
  if (!perfil) return <PantallaCarga mensaje="Cargando perfil…" />
  if (perfil.debe_cambiar_password !== true) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
