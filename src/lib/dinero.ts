import { pesoCategoria } from '@/lib/sectores'
import type { FactorPestel } from '@/types/pestel'

export const TRM_POR_DEFECTO = 4000

export function formatearCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor)
}

export function formatearUSD(valor: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(valor)
}

export function copAUsd(valorCOP: number, trm: number): number {
  if (!trm) return 0
  return valorCOP / trm
}

export function tieneValor(factor: Pick<FactorPestel, 'valorCOP'>): factor is FactorPestel & {
  valorCOP: number
} {
  return typeof factor.valorCOP === 'number' && Number.isFinite(factor.valorCOP)
}

export function exposicionEconomica(factores: FactorPestel[]) {
  const amenazas = factores.filter((f) => f.tipo === 'Amenaza' && tieneValor(f))
  const oportunidades = factores.filter((f) => f.tipo === 'Oportunidad' && tieneValor(f))

  return {
    enRiesgoCOP: amenazas.reduce((acc, f) => acc + (f.valorCOP ?? 0), 0),
    porGanarCOP: oportunidades.reduce((acc, f) => acc + (f.valorCOP ?? 0), 0),
    conValor: amenazas.length + oportunidades.length,
  }
}

export function resumenValor(factor: FactorPestel, trm: number): string | null {
  if (!tieneValor(factor)) return null
  const peso = pesoCategoria(factor.sector, factor.categoria)
  const etiqueta = factor.tipo === 'Amenaza' ? 'En riesgo' : 'Por ganar'
  return `${etiqueta}: ${formatearCOP(factor.valorCOP)} · ${formatearUSD(copAUsd(factor.valorCOP, trm))} (peso ${peso}%)`
}
