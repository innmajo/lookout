import { requireSupabase } from '@/lib/supabase'
import type { RolOperativo } from '@/lib/roles'
import type { PerfilRow } from '@/types/database'

export const MSG_USUARIO_DESACTIVADO =
  'Usuario desactivado. Pídale a su organizador que lo active nuevamente.'

export async function listarUsuariosEmpresa(empresaId: string): Promise<PerfilRow[]> {
  const { data, error } = await requireSupabase()
    .from('perfiles')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function crearUsuarioEmpresa(input: {
  email: string
  password: string
  rol: RolOperativo
  nombre: string
  apellido: string
  cedula: string
}): Promise<void> {
  const { data, error } = await requireSupabase().functions.invoke('crear-usuario', {
    body: input,
  })

  if (error) throw error
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error))
  }
}

export async function setUsuarioActivo(userId: string, activo: boolean): Promise<void> {
  const { error } = await requireSupabase()
    .from('perfiles')
    .update({ activo })
    .eq('id', userId)

  if (error) throw error
}

export async function marcarPasswordActualizada(userId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('perfiles')
    .update({ debe_cambiar_password: false })
    .eq('id', userId)

  if (error) throw error
}

export async function fetchSesionContexto(userId: string) {
  const client = requireSupabase()
  const [{ data: perfil, error: perfilError }, { data: authData }] = await Promise.all([
    client
      .from('perfiles')
      .select(
        'id, empresa_id, rol, activo, debe_cambiar_password, nombre, apellido, cedula, created_at, updated_at',
      )
      .eq('id', userId)
      .maybeSingle(),
    client.auth.getUser(),
  ])

  if (perfilError) throw perfilError
  if (!perfil) throw new Error('No hay perfil asociado a esta cuenta. Vuelve a registrarte.')
  if (!perfil.activo) throw new Error(MSG_USUARIO_DESACTIVADO)

  // Metadata del alta (contraseña temporal) por si el flag en perfiles quedó en false.
  const metaDebe =
    authData.user?.user_metadata?.debe_cambiar_password === true ||
    authData.user?.user_metadata?.debe_cambiar_password === 'true'

  let perfilFinal = perfil
  if (metaDebe && perfil.debe_cambiar_password !== true) {
    const { data: updated } = await client
      .from('perfiles')
      .update({ debe_cambiar_password: true })
      .eq('id', userId)
      .select(
        'id, empresa_id, rol, activo, debe_cambiar_password, nombre, apellido, cedula, created_at, updated_at',
      )
      .maybeSingle()
    perfilFinal = updated ?? { ...perfil, debe_cambiar_password: true }
  }

  let empresa = null
  if (perfilFinal.empresa_id) {
    const { data, error } = await client
      .from('empresas')
      .select('*')
      .eq('id', perfilFinal.empresa_id)
      .maybeSingle()
    if (error) throw error
    empresa = data
    if (!empresa && perfilFinal.rol !== 'sistema') {
      throw new Error('No se encontró la empresa de esta cuenta.')
    }
    if (empresa && !empresa.activa) {
      throw new Error('La empresa está desactivada. Contacte al administrador del sistema.')
    }
  }

  return { perfil: perfilFinal, empresa }
}
