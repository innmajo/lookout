import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { isSupabaseConfigured, requireSupabase } from '@/lib/supabase'
import type { DatosEmpresaRegistro } from '@/types/database'

interface AuthState {
  session: Session | null
  user: User | null
  initializing: boolean
  ready: boolean
  setSession: (session: Session | null) => void
  setInitializing: (value: boolean) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    empresa: DatosEmpresaRegistro,
  ) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initializing: true,
  ready: false,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      ready: true,
      initializing: false,
    }),
  setInitializing: (initializing) => set({ initializing }),
  signIn: async (email, password) => {
    const { error } = await requireSupabase().auth.signInWithPassword({ email, password })
    if (error) throw error
  },
  signUp: async (email, password, empresa) => {
    const metadata = {
      nombre_empresa: empresa.nombreEmpresa.trim(),
      nit: empresa.nit.trim(),
      responsable_nombre: empresa.responsableNombre.trim(),
      responsable_apellido: empresa.responsableApellido.trim(),
      responsable_cedula: empresa.responsableCedula.trim(),
      direccion: empresa.direccion.trim(),
      ciudad: empresa.ciudad.trim(),
    }

    const { data, error } = await requireSupabase().auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    if (error) throw error

    const userId = data.user?.id
    if (userId && data.session) {
      const { error: perfilError } = await requireSupabase()
        .from('perfiles')
        .upsert(
          {
            id: userId,
            ...metadata,
          },
          { onConflict: 'id' },
        )
      if (perfilError) throw perfilError
    }

    return { needsEmailConfirmation: !data.session }
  },
  signOut: async () => {
    const { error } = await requireSupabase().auth.signOut()
    if (error) throw error
    set({ session: null, user: null })
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
