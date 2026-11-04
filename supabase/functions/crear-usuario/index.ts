import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const ROLES_OPERATIVOS = new Set(['digitador', 'supervisor', 'auditor', 'aprobador'])

type Body = {
  email?: string
  password?: string
  rol?: string
  nombre?: string
  apellido?: string
  cedula?: string
  empresa_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: 'Faltan variables de entorno de Supabase' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No autorizado' }, 401)

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: userData, error: userError } = await caller.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Sesión inválida' }, 401)

    const { data: perfil, error: perfilError } = await admin
      .from('perfiles')
      .select('id, rol, empresa_id, activo')
      .eq('id', userData.user.id)
      .maybeSingle()

    if (perfilError || !perfil || !perfil.activo) {
      return json({ error: 'Perfil no encontrado o inactivo' }, 403)
    }
    if (perfil.rol !== 'admin_empresa' && perfil.rol !== 'sistema') {
      return json({ error: 'Solo el administrador de empresa puede crear usuarios' }, 403)
    }

    const body = (await req.json()) as Body
    const email = body.email?.trim().toLowerCase()
    const password = body.password ?? ''
    const rol = body.rol?.trim()
    const nombre = body.nombre?.trim() ?? ''
    const apellido = body.apellido?.trim() ?? ''
    const cedula = body.cedula?.trim() ?? ''

    if (!email || !password || !rol) {
      return json({ error: 'email, password y rol son obligatorios' }, 400)
    }
    if (!ROLES_OPERATIVOS.has(rol)) {
      return json({ error: 'Rol no permitido. Use digitador, supervisor, auditor o aprobador.' }, 400)
    }
    if (password.length < 6) {
      return json({ error: 'La contraseña temporal debe tener al menos 6 caracteres' }, 400)
    }

    let empresaId = perfil.empresa_id as string | null
    if (perfil.rol === 'sistema') {
      empresaId = body.empresa_id ?? null
      if (!empresaId) return json({ error: 'empresa_id es obligatorio para el admin del sistema' }, 400)
    }
    if (!empresaId) return json({ error: 'El administrador no tiene empresa asignada' }, 400)

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        empresa_id: empresaId,
        rol,
        nombre,
        apellido,
        cedula,
        debe_cambiar_password: true,
      },
    })

    if (createError) return json({ error: createError.message }, 400)

    if (created.user?.id) {
      await admin
        .from('perfiles')
        .update({ debe_cambiar_password: true })
        .eq('id', created.user.id)
    }

    return json({
      user: {
        id: created.user?.id,
        email: created.user?.email,
        rol,
        empresa_id: empresaId,
        debe_cambiar_password: true,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado'
    return json({ error: message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
