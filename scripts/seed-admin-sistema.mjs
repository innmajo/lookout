/**
 * Crea el Administrador del sistema (no usa el formulario de registro).
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seed-admin-sistema.mjs
 *
 * La service role key está en Supabase → Project Settings → API (service_role). No la suba al repo.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

if (!url || !serviceKey || !email || !password) {
  console.error(
    'Faltan SUPABASE_URL (o VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL y ADMIN_PASSWORD',
  )
  process.exit(1)
}

const admin = createClient(url, serviceKey)

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    rol: 'sistema',
    nombre: 'Administrador',
    apellido: 'Sistema',
  },
})

if (error) {
  console.error(error.message)
  process.exit(1)
}

console.log('Admin del sistema creado:', data.user?.id, data.user?.email)
