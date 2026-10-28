import { PESO_MEDIO, pesoCategoria, type SectorId } from '@/lib/sectores'
import type { Categoria, FactorPestel, Impacto, Plazo, Prioridad } from '@/types/pestel'

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

function nivelDesdePuntaje(puntaje: number, peso: number): Prioridad {
  if (puntaje >= 9) {
    return {
      puntaje,
      nivel: 'CRÍTICO',
      color: '#E11D48',
      significado: 'Urgente, actuar ya',
      peso,
    }
  }

  if (puntaje >= 4) {
    return {
      puntaje,
      nivel: 'ATENCIÓN',
      color: '#F59E0B',
      significado: 'Planificar',
      peso,
    }
  }

  return {
    puntaje,
    nivel: 'MONITOREAR',
    color: '#16A34A',
    significado: 'Seguimiento',
    peso,
  }
}

/** Semáforo de la celda impacto × plazo, sin ponderar el sector. */
export function calcularNivelCelda(impacto: Impacto, plazo: Plazo): Prioridad {
  const puntaje = IMPACTO_VALOR[impacto] * PLAZO_VALOR[plazo]
  return nivelDesdePuntaje(puntaje, PESO_MEDIO)
}

export function calcularPrioridad(
  factor: Pick<FactorPestel, 'impacto' | 'plazo' | 'sector' | 'categoria'>,
): Prioridad {
  const peso = pesoCategoria(factor.sector, factor.categoria)
  const base = IMPACTO_VALOR[factor.impacto] * PLAZO_VALOR[factor.plazo]
  const puntaje = Math.round(base * (peso / PESO_MEDIO) * 10) / 10
  return nivelDesdePuntaje(puntaje, peso)
}

export function esCritico(
  factor: Pick<FactorPestel, 'impacto' | 'plazo' | 'sector' | 'categoria'>,
): boolean {
  return calcularPrioridad(factor).nivel === 'CRÍTICO'
}

export function etiquetaPeso(sector: SectorId, categoria: Categoria): string {
  const peso = pesoCategoria(sector, categoria)
  return `${categoria} pesa ${peso}% en este sector`
}
