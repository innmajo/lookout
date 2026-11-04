import type { SectorId } from '@/lib/sectores'

export const CATEGORIAS = [
  'Político',
  'Económico',
  'Social',
  'Tecnológico',
  'Ecológico',
  'Legal',
] as const
export type Categoria = (typeof CATEGORIAS)[number]

export const TIPOS = ['Amenaza', 'Oportunidad'] as const
export type Tipo = (typeof TIPOS)[number]

export const IMPACTOS = ['Alto', 'Medio', 'Bajo'] as const
export type Impacto = (typeof IMPACTOS)[number]

export const PLAZOS = ['Corto plazo', 'Mediano plazo', 'Largo plazo'] as const
export type Plazo = (typeof PLAZOS)[number]

export const NIVELES_PRIORIDAD = ['CRÍTICO', 'ATENCIÓN', 'MONITOREAR'] as const
export type NivelPrioridad = (typeof NIVELES_PRIORIDAD)[number]

export const ESTADOS_FACTOR = [
  'borrador',
  'para_corregir',
  'en_revision_supervisor',
  'en_auditoria',
  'en_aprobacion',
  'aprobado',
] as const
export type EstadoFactor = (typeof ESTADOS_FACTOR)[number]

export const ESTADO_FACTOR_ETIQUETA: Record<EstadoFactor, string> = {
  borrador: 'Borrador',
  para_corregir: 'Para corregir',
  en_revision_supervisor: 'En revisión',
  en_auditoria: 'En auditoría',
  en_aprobacion: 'En aprobación',
  aprobado: 'Aprobado',
}

/** Digitador puede editar/eliminar/reenviar estos estados. */
export function esEditableDigitador(estado: EstadoFactor | null | undefined): boolean {
  return estado === 'borrador' || estado === 'para_corregir'
}

export interface FactorPestel {
  id: string
  categoria: Categoria
  descripcion: string
  tipo: Tipo
  impacto: Impacto
  plazo: Plazo
  sector: SectorId
  valorCOP?: number
  fechaRegistro: string
  esEjemplo?: boolean
  estado: EstadoFactor
  loteId?: string | null
  version: number
}

export interface Prioridad {
  puntaje: number
  nivel: NivelPrioridad
  color: string
  significado: string
  peso: number
}

export interface FactorFormValues {
  categoria: Categoria
  descripcion: string
  tipo: Tipo
  impacto: Impacto
  plazo: Plazo
  sector: SectorId
  valorCOP?: number
}
