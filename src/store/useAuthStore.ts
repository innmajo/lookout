import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { esSectorId } from '@/lib/sectores'
import { isSupabaseConfigured, requireSupabase } from '@/lib/supabase'
import { fetchSesionContexto } from '@/lib/usuariosApi'
import { aplicarApariencia, useThemeStore } from '@/store/useThemeStore'
import type { DatosEmpresaRegistro, EmpresaRow, PerfilRow } from '@/types/database'

interface AuthState {
  session: Session | null
  user: User | null
  perfil: PerfilRow | null
  empresa: EmpresaRow | null
  initializing: boolean
  ready: boolean
  setSession: (session: Session | null) => void
  cargarContexto: (userId: string) => Promise<void>
  limpiarContexto: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    empresa: DatosEmpresaRegistro,
  ) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
}

function aplicarSectorEmpresa(empresa: EmpresaRow | null) {
  if (!empresa || !esSectorId(empresa.sector)) return
  const tema = useThemeStore.getState().tema
  useThemeStore.getState().setSectorFijo(empresa.sector)
  aplicarApariencia(tema, empresa.sector)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  perfil: null,
  empresa: null,
  initializing: true,
  ready: false,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      ready: true,
      initializing: false,
    }),
  limpiarContexto: () => set({ perfil: null, empresa: null }),
  cargarContexto: async (userId) => {
    const ctx = await fetchSesionContexto(userId)
    set({ perfil: ctx.perfil, empresa: ctx.empresa })
    aplicarSectorEmpresa(ctx.empresa)
  },
  signIn: async (email, password) => {
    const { error } = await requireSupabase().auth.signInWithPassword({ email, password })
    if (error) throw error
  },
  signUp: async (email, password, empresa) => {
    const metadata = {
      nombre_empresa: empresa.nombreEmpresa.trim(),
      nit: empresa.nit.trim(),
      sector: empresa.sector,
      direccion: empresa.direccion.trim(),
      ciudad: empresa.ciudad.trim(),
      nombre: empresa.responsableNombre.trim(),
      apellido: empresa.responsableApellido.trim(),
      cedula: empresa.responsableCedula.trim(),
      responsable_nombre: empresa.responsableNombre.trim(),
      responsable_apellido: empresa.responsableApellido.trim(),
      responsable_cedula: empresa.responsableCedula.trim(),
      rol: 'admin_empresa',
    }

    const { data, error } = await requireSupabase().auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    if (error) throw error

    if (data.user?.id && data.session) {
      await get().cargarContexto(data.user.id)
    }

    return { needsEmailConfirmation: !data.session }
  },
  signOut: async () => {
    const { error } = await requireSupabase().auth.signOut()
    if (error) throw error
    set({ session: null, user: null, perfil: null, empresa: null })
    useThemeStore.setState({ sectorFijo: false })
  },
}))

let authListenerBound = false

/** Inicializa sesión y suscripción a cambios de auth. Idempotente. */
export function bootstrapAuth() {
  if (!isSupabaseConfigured) {
    useAuthStore.setState({ initializing: false, ready: true, session: null, user: null })
    return () => undefined
  }

  if (authListenerBound) return () => undefined
  authListenerBound = true

  const client = requireSupabase()

  client.auth.getSession().then(({ data }) => {
    useAuthStore.getState().setSession(data.session)
  })

  const { data } = client.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session)
  })

  return () => {
    data.subscription.unsubscribe()
    authListenerBound = false
  }
}
