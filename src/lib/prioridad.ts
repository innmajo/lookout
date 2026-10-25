import type { FactorPestel, Impacto, Plazo, Prioridad } from '@/types/pestel'

const IMPACTO_VALOR: Record<Impacto, number> = {
  Alto: 3,
  Medio: 2,
  Bajo: 1,
}

const PLAZO_VALOR: Record<Plazo, number> = {
  'Corto plazo': 3,
  'Mediano plazo': 2,
  'Largo plazo': 1,
}

export function valorImpacto(impacto: Impacto): number {
  return IMPACTO_VALOR[impacto]
}

export function valorPlazo(plazo: Plazo): number {
  return PLAZO_VALOR[plazo]
}

export function calcularPrioridad(
  factor: Pick<FactorPestel, 'impacto' | 'plazo'>,
): Prioridad {
  const puntaje = IMPACTO_VALOR[factor.impacto] * PLAZO_VALOR[factor.plazo]

  if (puntaje === 9) {
    return {
      puntaje,
      nivel: 'CRÍTICO',
      color: '#E11D48',
      significado: 'Urgente, actuar ya',
    }
  }

  if (puntaje >= 4) {
    return {
      puntaje,
      nivel: 'ATENCIÓN',
      color: '#F59E0B',
      significado: 'Planificar',
    }
  }

  return {
    puntaje,
    nivel: 'MONITOREAR',
    color: '#16A34A',
    significado: 'Seguimiento',
  }
}

export function esCritico(factor: Pick<FactorPestel, 'impacto' | 'plazo'>): boolean {
  return calcularPrioridad(factor).nivel === 'CRÍTICO'
}
