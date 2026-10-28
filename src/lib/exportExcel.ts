import * as XLSX from 'xlsx'
import { copAUsd } from '@/lib/dinero'
import { factoresCriticos, resumenPorEntorno } from '@/lib/analytics'
import { calcularPrioridad } from '@/lib/prioridad'
import { SECTORES } from '@/lib/sectores'
import { nombreArchivoExport } from '@/lib/utils'
import { usePestelStore } from '@/store/usePestelStore'
import type { FactorPestel } from '@/types/pestel'

function hojaFactores(factores: FactorPestel[], trm: number) {
  return factores.map((factor) => {
    const prioridad = calcularPrioridad(factor)
    return {
      Sector: SECTORES[factor.sector]?.nombre ?? factor.sector,
      Categoría: factor.categoria,
      'Peso %': prioridad.peso,
      Descripción: factor.descripcion,
      Tipo: factor.tipo,
      'Valor COP': factor.valorCOP ?? '',
      'Valor USD': factor.valorCOP != null ? Math.round(copAUsd(factor.valorCOP, trm)) : '',
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
  const trm = usePestelStore.getState().trmUsd
  const libro = XLSX.utils.book_new()

  const wsFactores = XLSX.utils.json_to_sheet(hojaFactores(factores, trm))
  XLSX.utils.book_append_sheet(libro, wsFactores, 'Factores')

  const resumen = resumenPorEntorno(factores).map((fila) => ({
    Entorno: fila.categoria,
    Amenazas: fila.amenazas,
    Oportunidades: fila.oportunidades,
    Total: fila.total,
  }))
  const wsResumen = XLSX.utils.json_to_sheet(resumen)
  XLSX.utils.book_append_sheet(libro, wsResumen, 'Resumen por entorno')

  const wsCriticos = XLSX.utils.json_to_sheet(hojaFactores(factoresCriticos(factores), trm))
  XLSX.utils.book_append_sheet(libro, wsCriticos, 'Críticos')

  XLSX.writeFile(libro, nombreArchivoExport('xlsx'))
}
