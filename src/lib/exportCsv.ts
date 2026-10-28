import { copAUsd } from '@/lib/dinero'
import { calcularPrioridad } from '@/lib/prioridad'
import { SECTORES } from '@/lib/sectores'
import { nombreArchivoExport } from '@/lib/utils'
import { usePestelStore } from '@/store/usePestelStore'
import type { FactorPestel } from '@/types/pestel'

function celda(valor: string): string {
  const limpio = valor.replaceAll('"', '""')
  return `"${limpio}"`
}

export function exportarCsv(factores: FactorPestel[]): void {
  const trm = usePestelStore.getState().trmUsd
  const encabezado = [
    'Sector',
    'Categoría',
    'Peso %',
    'Descripción',
    'Tipo',
    'Valor COP',
    'Valor USD',
    'Impacto',
    'Plazo',
    'Prioridad',
    'Puntaje',
    'Fecha de registro',
    'Origen',
  ]

  const filas = factores.map((factor) => {
    const prioridad = calcularPrioridad(factor)
    const usd = factor.valorCOP != null ? String(Math.round(copAUsd(factor.valorCOP, trm))) : ''
    return [
      SECTORES[factor.sector]?.nombre ?? factor.sector,
      factor.categoria,
      String(prioridad.peso),
      factor.descripcion,
      factor.tipo,
      factor.valorCOP != null ? String(factor.valorCOP) : '',
      usd,
      factor.impacto,
      factor.plazo,
      prioridad.nivel,
      String(prioridad.puntaje),
      new Date(factor.fechaRegistro).toLocaleString('es-CO'),
      factor.esEjemplo ? 'Ejemplo' : 'Registrado',
    ].map(celda)
  })

  const csv = `\uFEFF${[encabezado.map(celda).join(';'), ...filas.map((fila) => fila.join(';'))].join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivoExport('csv')
  enlace.click()
  URL.revokeObjectURL(url)
}
