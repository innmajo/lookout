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

export interface FactorPestel {
  id: string
  categoria: Categoria
  descripcion: string
  tipo: Tipo
  impacto: Impacto
  plazo: Plazo
  fechaRegistro: string
  esEjemplo?: boolean
}

export interface Prioridad {
  puntaje: number
  nivel: NivelPrioridad
  color: string
  significado: string
}

export interface FactorFormValues {
  categoria: Categoria
  descripcion: string
  tipo: Tipo
  impacto: Impacto
  plazo: Plazo
}
