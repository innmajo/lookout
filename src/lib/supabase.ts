import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (null as unknown as SupabaseClient<Database>)

export function requireSupabase(): SupabaseClient<Database> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase no está configurado. Crea .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
    )
  }
  return supabase
}
