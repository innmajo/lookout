import type { FactorPestel } from '@/types/pestel'
import { calcularPrioridad } from '@/lib/prioridad'
import { nombreArchivoExport } from '@/lib/utils'

function celda(valor: string): string {
  const limpio = valor.replaceAll('"', '""')
  return `"${limpio}"`
}

export function exportarCsv(factores: FactorPestel[]): void {
  const encabezado = [
    'Categoría',
    'Descripción',
    'Tipo',
    'Impacto',
    'Plazo',
    'Prioridad',
    'Puntaje',
    'Fecha de registro',
    'Origen',
  ]

  const filas = factores.map((factor) => {
    const prioridad = calcularPrioridad(factor)
    return [
      factor.categoria,
      factor.descripcion,
      factor.tipo,
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
