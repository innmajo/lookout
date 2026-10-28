import { CATEGORIAS, IMPACTOS, PLAZOS, type Categoria, type FactorPestel, type Impacto, type Plazo } from '@/types/pestel'
import { SECTORES } from '@/lib/sectores'
import { calcularNivelCelda, esCritico } from '@/lib/prioridad'

export interface KpisPestel {
  total: number
  amenazas: number
  oportunidades: number
  criticos: number
}

export interface SerieEntorno {
  categoria: Categoria
  amenazas: number
  oportunidades: number
  total: number
}

export interface CeldaMatriz {
  impacto: Impacto
  plazo: Plazo
  factores: FactorPestel[]
  nivel: ReturnType<typeof calcularNivelCelda>['nivel']
  color: string
}

export function calcularKpis(factores: FactorPestel[]): KpisPestel {
  return {
    total: factores.length,
    amenazas: factores.filter((f) => f.tipo === 'Amenaza').length,
    oportunidades: factores.filter((f) => f.tipo === 'Oportunidad').length,
    criticos: factores.filter(esCritico).length,
  }
}

export function resumenPorEntorno(factores: FactorPestel[]): SerieEntorno[] {
  return CATEGORIAS.map((categoria) => {
    const delEntorno = factores.filter((f) => f.categoria === categoria)
    return {
      categoria,
      amenazas: delEntorno.filter((f) => f.tipo === 'Amenaza').length,
      oportunidades: delEntorno.filter((f) => f.tipo === 'Oportunidad').length,
      total: delEntorno.length,
    }
  })
}

export function factoresCriticos(factores: FactorPestel[]): FactorPestel[] {
  return factores
    .filter(esCritico)
    .sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro))
}

export function generarInsights(factores: FactorPestel[]): string[] {
  if (factores.length === 0) return []

  const resumen = resumenPorEntorno(factores)
  const kpis = calcularKpis(factores)
  const insights: string[] = []

  const maxAmenazas = [...resumen].sort((a, b) => b.amenazas - a.amenazas)[0]
  const maxOportunidades = [...resumen].sort((a, b) => b.oportunidades - a.oportunidades)[0]
  const maxTotal = [...resumen].sort((a, b) => b.total - a.total)[0]

  if (maxAmenazas && maxAmenazas.amenazas > 0) {
    insights.push(
      `El entorno ${maxAmenazas.categoria} concentra la mayor cantidad de amenazas (${maxAmenazas.amenazas}).`,
    )
  }

  if (maxOportunidades && maxOportunidades.oportunidades > 0) {
    insights.push(
      `El entorno ${maxOportunidades.categoria} concentra más oportunidades (${maxOportunidades.oportunidades}).`,
    )
  }

  if (kpis.criticos > 0) {
    insights.push(
      `Hay ${kpis.criticos} factor${kpis.criticos === 1 ? '' : 'es'} en nivel CRÍTICO (impacto, plazo y peso del sector) que requieren acción inmediata.`,
    )
  } else {
    insights.push('No hay factores en nivel CRÍTICO. El entorno se puede gestionar con planificación y seguimiento.')
  }

  if (maxTotal && maxTotal.total > 0) {
    insights.push(
      `El entorno con más señales registradas es ${maxTotal.categoria} (${maxTotal.total} factores).`,
    )
  }

  const sectoresUsados = [...new Set(factores.map((f) => f.sector))]
  const unico = sectoresUsados.length === 1 ? sectoresUsados[0] : undefined
  if (unico) {
    const meta = SECTORES[unico]
    const dominante = [...CATEGORIAS].sort((a, b) => meta.pesos[b] - meta.pesos[a])[0]
    insights.push(
      `En ${meta.nombre} el entorno ${dominante} tiene el mayor peso (${meta.pesos[dominante]}%) y eleva el semáforo de esos factores.`,
    )
  } else if (sectoresUsados.length > 1) {
    insights.push(
      `Hay factores de ${sectoresUsados.length} sectores. El semáforo de cada uno usa los pesos PESTEL de su propio sector.`,
    )
  }

  return insights
}

export function celdasMatriz(factores: FactorPestel[]): CeldaMatriz[] {
  const celdas: CeldaMatriz[] = []
  for (const impacto of IMPACTOS) {
    for (const plazo of PLAZOS) {
      const deCelda = factores.filter((f) => f.impacto === impacto && f.plazo === plazo)
      const prioridad = calcularNivelCelda(impacto, plazo)
      celdas.push({
        impacto,
        plazo,
        factores: deCelda,
        nivel: prioridad.nivel,
        color: prioridad.color,
      })
    }
  }
  return celdas
}
