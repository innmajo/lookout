export const ROLES = [
  'sistema',
  'admin_empresa',
  'digitador',
  'supervisor',
  'auditor',
  'aprobador',
] as const

export type Rol = (typeof ROLES)[number]

export const ROLES_OPERATIVOS = [
  'digitador',
  'supervisor',
  'auditor',
  'aprobador',
] as const satisfies ReadonlyArray<Rol>

export type RolOperativo = (typeof ROLES_OPERATIVOS)[number]

export const ROL_ETIQUETA: Record<Rol, string> = {
  sistema: 'Administrador del sistema',
  admin_empresa: 'Administrador de empresa',
  digitador: 'Digitador',
  supervisor: 'Supervisor',
  auditor: 'Auditor',
  aprobador: 'Aprobador',
}

export function esRol(valor: string | null | undefined): valor is Rol {
  return !!valor && (ROLES as readonly string[]).includes(valor)
}

export function esRolOperativo(valor: string | null | undefined): valor is RolOperativo {
  return !!valor && (ROLES_OPERATIVOS as readonly string[]).includes(valor)
}

/** Admin de empresa solo administra: no digitiza ni aprueba. */
export function puedeGestionarUsuarios(rol: Rol | null | undefined): boolean {
  return rol === 'admin_empresa' || rol === 'sistema'
}

/** Por ahora solo el digitador escribe factores (flujo de aprobación viene después). */
export function puedeOperarFactores(rol: Rol | null | undefined): boolean {
  return rol === 'digitador'
}

export function puedeVerFactores(rol: Rol | null | undefined): boolean {
  return esRolOperativo(rol) || rol === 'admin_empresa'
}

export function puedeVerConfiguracionEmpresa(rol: Rol | null | undefined): boolean {
  return rol === 'admin_empresa' || rol === 'sistema'
}
