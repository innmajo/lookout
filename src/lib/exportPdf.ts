import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { FactorPestel } from '@/types/pestel'
import {
  calcularKpis,
  factoresCriticos,
  generarInsights,
  resumenPorEntorno,
} from '@/lib/analytics'
import { calcularPrioridad } from '@/lib/prioridad'
import { CATEGORIAS } from '@/types/pestel'
import { APP_NAME } from '@/lib/constants'
import { fechaLarga, nombreArchivoExport } from '@/lib/utils'

const TEAL = '#0D9488'
const SLATE = '#0F172A'
const CREMA = '#F1F5F9'
const TEXTO = '#334155'

async function bufferABase64(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function cargarFuente(url: string): Promise<string | null> {
  try {
    const respuesta = await fetch(url)
    if (!respuesta.ok) return null
    return bufferABase64(await respuesta.arrayBuffer())
  } catch {
    return null
  }
}

async function incrustarFuentes(doc: jsPDF): Promise<boolean> {
  const regular =
    (await cargarFuente('/fonts/PTSans-Regular.ttf')) ??
    (await cargarFuente(
      'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ptsans/PT_Sans-Web-Regular.ttf',
    ))
  const bold =
    (await cargarFuente('/fonts/PTSans-Bold.ttf')) ??
    (await cargarFuente(
      'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ptsans/PT_Sans-Web-Bold.ttf',
    ))

  if (!regular || !bold) return false

  doc.addFileToVFS('PTSans-Regular.ttf', regular)
  doc.addFont('PTSans-Regular.ttf', 'PTSans', 'normal')
  doc.addFileToVFS('PTSans-Bold.ttf', bold)
  doc.addFont('PTSans-Bold.ttf', 'PTSans', 'bold')
  doc.setFont('PTSans', 'normal')
  return true
}

async function capturarGrafico(id: string): Promise<string | null> {
  const nodo = document.getElementById(id)
  if (!nodo) return null
  const canvas = await html2canvas(nodo, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
  })
  return canvas.toDataURL('image/png')
}

function pieDePagina(doc: jsPDF, pagina: number, total: number) {
  const ancho = doc.internal.pageSize.getWidth()
  const alto = doc.internal.pageSize.getHeight()
  doc.setFillColor(SLATE)
  doc.rect(0, alto - 12, ancho, 12, 'F')
  doc.setTextColor('#FFFFFF')
  doc.setFontSize(8)
  doc.text(`${APP_NAME}  ·  Análisis PESTEL`, 14, alto - 5)
  doc.text(`${pagina} / ${total}`, ancho - 14, alto - 5, { align: 'right' })
}

function colorPrioridad(nivel: string): [number, number, number] {
  if (nivel === 'CRÍTICO') return [220, 38, 38]
  if (nivel === 'ATENCIÓN') return [245, 158, 11]
  return [22, 163, 74]
}

export async function exportarPdf(factores: FactorPestel[]): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const fuenteOk = await incrustarFuentes(doc)
  const fuente = fuenteOk ? 'PTSans' : 'helvetica'
  const ancho = doc.internal.pageSize.getWidth()
  const margen = 16
  const kpis = calcularKpis(factores)
  const insights = generarInsights(factores)
  const criticos = factoresCriticos(factores)
  const resumen = resumenPorEntorno(factores)

  doc.setFont(fuente, 'bold')
  doc.setFillColor(SLATE)
  doc.rect(0, 0, ancho, 42, 'F')
  doc.setFillColor(TEAL)
  doc.rect(0, 42, ancho, 2.2, 'F')
  doc.setTextColor('#FFFFFF')
  doc.setFontSize(11)
  doc.text(APP_NAME, margen, 16)
  doc.setFontSize(22)
  doc.text('Informe de Análisis PESTEL', margen, 28)
  doc.setFont(fuente, 'normal')
  doc.setFontSize(10)
  doc.text(`Fecha de generación: ${fechaLarga()}`, margen, 37)

  doc.setTextColor(TEXTO)
  doc.setFont(fuente, 'bold')
  doc.setFontSize(13)
  doc.text('RESUMEN EJECUTIVO', margen, 56)

  const cajas = [
    { label: 'Factores', valor: String(kpis.total), color: TEAL },
    { label: 'Amenazas', valor: String(kpis.amenazas), color: '#DC2626' },
    { label: 'Oportunidades', valor: String(kpis.oportunidades), color: '#16A34A' },
    { label: 'Críticos', valor: String(kpis.criticos), color: '#DC2626' },
  ]
  cajas.forEach((caja, index) => {
    const x = margen + index * 45
    doc.setFillColor(CREMA)
    doc.roundedRect(x, 62, 42, 22, 2, 2, 'F')
    doc.setFont(fuente, 'bold')
    doc.setFontSize(16)
    doc.setTextColor(caja.color)
    doc.text(caja.valor, x + 21, 73, { align: 'center' })
    doc.setFont(fuente, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(TEXTO)
    doc.text(caja.label.toUpperCase(), x + 21, 80, { align: 'center' })
  })

  doc.setFont(fuente, 'bold')
  doc.setFontSize(11)
  doc.setTextColor(TEAL)
  doc.text('Insights automáticos', margen, 96)
  doc.setFont(fuente, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(TEXTO)
  let y = 104
  insights.forEach((texto) => {
    const lineas = doc.splitTextToSize(`•  ${texto}`, ancho - margen * 2)
    doc.text(lineas, margen, y)
    y += lineas.length * 5.2 + 2
  })

  const [barras, radar] = await Promise.all([
    capturarGrafico('chart-barras'),
    capturarGrafico('chart-radar'),
  ])

  if (y > 160) {
    doc.addPage()
    y = 22
  }

  doc.setFont(fuente, 'bold')
  doc.setFontSize(13)
  doc.setTextColor(TEXTO)
  doc.text('GRÁFICOS DEL ENTORNO', margen, y)
  y += 6

  if (barras) {
    doc.addImage(barras, 'PNG', margen, y, 178, 68)
    y += 74
  }
  if (radar) {
    if (y > 200) {
      doc.addPage()
      y = 22
    }
    doc.addImage(radar, 'PNG', margen + 30, y, 118, 86)
    y += 92
  }

  doc.addPage()
  doc.setFont(fuente, 'bold')
  doc.setFontSize(13)
  doc.setTextColor(TEXTO)
  doc.text('MATRIZ DE PRIORIZACIÓN', margen, 22)
  doc.setFont(fuente, 'normal')
  doc.setFontSize(9)
  doc.text('Impacto (filas) × Plazo (columnas). Semáforo: crítico, atención y monitoreo.', margen, 28)

  const impactos = ['Alto', 'Medio', 'Bajo'] as const
  const plazos = ['Corto plazo', 'Mediano plazo', 'Largo plazo'] as const
  const matrizBody = impactos.map((impacto) => {
    const fila: string[] = [impacto]
    plazos.forEach((plazo) => {
      const n = factores.filter((f) => f.impacto === impacto && f.plazo === plazo).length
      const nivel = calcularPrioridad({ impacto, plazo }).nivel
      fila.push(`${n} · ${nivel}`)
    })
    return fila
  })

  autoTable(doc, {
    startY: 34,
    head: [['Impacto / Plazo', ...plazos]],
    body: matrizBody,
    theme: 'grid',
    styles: { font: fuente, fontSize: 9, halign: 'center', textColor: TEXTO },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index === 0) return
      const impacto = impactos[data.row.index]
      const plazo = plazos[data.column.index - 1]
      if (!impacto || !plazo) return
      const [r, g, b] = colorPrioridad(calcularPrioridad({ impacto, plazo }).nivel)
      data.cell.styles.fillColor = [r, g, b]
      data.cell.styles.textColor = 255
      data.cell.styles.fontStyle = 'bold'
    },
  })

  let cursor = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12

  doc.setFont(fuente, 'bold')
  doc.setFontSize(13)
  doc.setTextColor('#DC2626')
  doc.text('FACTORES CRÍTICOS', margen, cursor)
  cursor += 4

  autoTable(doc, {
    startY: cursor,
    head: [['Categoría', 'Tipo', 'Descripción', 'Impacto', 'Plazo']],
    body:
      criticos.length === 0
        ? [['—', '—', 'No hay factores críticos registrados', '—', '—']]
        : criticos.map((f) => [f.categoria, f.tipo, f.descripcion, f.impacto, f.plazo]),
    theme: 'grid',
    styles: { font: fuente, fontSize: 8, textColor: TEXTO, valign: 'middle' },
    headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 2: { cellWidth: 88 } },
    didParseCell: (data) => {
      if (data.section === 'body') {
        data.cell.styles.fillColor = [254, 226, 226]
      }
    },
  })

  doc.addPage()
  doc.setFont(fuente, 'bold')
  doc.setFontSize(13)
  doc.setTextColor(TEXTO)
  doc.text('FACTORES POR CATEGORÍA', margen, 22)

  autoTable(doc, {
    startY: 28,
    head: [['Entorno', 'Amenazas', 'Oportunidades', 'Total']],
    body: resumen.map((fila) => [fila.categoria, fila.amenazas, fila.oportunidades, fila.total]),
    theme: 'grid',
    styles: { font: fuente, fontSize: 9, textColor: TEXTO },
    headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
  })

  cursor = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  CATEGORIAS.forEach((categoria) => {
    const delGrupo = factores.filter((f) => f.categoria === categoria)
    if (delGrupo.length === 0) return

    autoTable(doc, {
      startY: cursor,
      head: [[`${categoria.toUpperCase()}`, 'Tipo', 'Impacto', 'Plazo', 'Prioridad', 'Descripción']],
      body: delGrupo.map((f) => {
        const p = calcularPrioridad(f)
        return [f.categoria, f.tipo, f.impacto, f.plazo, p.nivel, f.descripcion]
      }),
      theme: 'grid',
      styles: { font: fuente, fontSize: 8, textColor: TEXTO, valign: 'top' },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 5: { cellWidth: 70 } },
      didParseCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 4) return
        const nivel = String(data.cell.raw)
        const [r, g, b] = colorPrioridad(nivel)
        data.cell.styles.fillColor = [r, g, b]
        data.cell.styles.textColor = 255
        data.cell.styles.fontStyle = 'bold'
      },
    })
    cursor = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  })

  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont(fuente, 'normal')
    pieDePagina(doc, i, total)
  }

  doc.save(nombreArchivoExport('pdf'))
}
