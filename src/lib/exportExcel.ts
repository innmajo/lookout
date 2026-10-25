import * as XLSX from 'xlsx'
import type { FactorPestel } from '@/types/pestel'
import { calcularPrioridad } from '@/lib/prioridad'
import { resumenPorEntorno, factoresCriticos } from '@/lib/analytics'
import { nombreArchivoExport } from '@/lib/utils'

function hojaFactores(factores: FactorPestel[]) {
  return factores.map((factor) => {
    const prioridad = calcularPrioridad(factor)
    return {
      Categoría: factor.categoria,
      Descripción: factor.descripcion,
      Tipo: factor.tipo,
      Impacto: factor.impacto,
      Plazo: factor.plazo,
      Prioridad: prioridad.nivel,
      Puntaje: prioridad.puntaje,
      'Fecha de registro': new Date(factor.fechaRegistro).toLocaleString('es-CO'),
      Origen: factor.esEjemplo ? 'Ejemplo' : 'Registrado',
    }
  })
}

export function exportarExcel(factores: FactorPestel[]): void {
  const libro = XLSX.utils.book_new()

  const wsFactores = XLSX.utils.json_to_sheet(hojaFactores(factores))
  XLSX.utils.book_append_sheet(libro, wsFactores, 'Factores')

  const resumen = resumenPorEntorno(factores).map((fila) => ({
    Entorno: fila.categoria,
    Amenazas: fila.amenazas,
    Oportunidades: fila.oportunidades,
    Total: fila.total,
  }))
  const wsResumen = XLSX.utils.json_to_sheet(resumen)
  XLSX.utils.book_append_sheet(libro, wsResumen, 'Resumen por entorno')

  const wsCriticos = XLSX.utils.json_to_sheet(hojaFactores(factoresCriticos(factores)))
  XLSX.utils.book_append_sheet(libro, wsCriticos, 'Críticos')

  XLSX.writeFile(libro, nombreArchivoExport('xlsx'))
}
