import { jsPDF } from 'jspdf'
import type { InformeMetadatos } from '@/lib/informesApi'

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

async function incrustarFuente(doc: jsPDF): Promise<boolean> {
  const regular =
    (await cargarFuente('/fonts/PTSans-Regular.ttf')) ??
    (await cargarFuente('https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ptsans/PT_Sans-Web-Regular.ttf'))
  const bold =
    (await cargarFuente('/fonts/PTSans-Bold.ttf')) ??
    (await cargarFuente('https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ptsans/PT_Sans-Web-Bold.ttf'))
  if (!regular || !bold) return false
  doc.addFileToVFS('PTSans-Regular.ttf', regular)
  doc.addFont('PTSans-Regular.ttf', 'PTSans', 'normal')
  doc.addFileToVFS('PTSans-Bold.ttf', bold)
  doc.addFont('PTSans-Bold.ttf', 'PTSans', 'bold')
  doc.setFont('PTSans', 'normal')
  return true
}

function limpiarMarkdown(linea: string): string {
  return linea.replace(/\*\*/g, '').replace(/^\s*[-*]\s+/, '• ').trim()
}

export async function descargarInformePdf(input: {
  version: number
  texto: string
  metadatos: InformeMetadatos
  fecha: string
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const conFuente = await incrustarFuente(doc)
  const font = conFuente ? 'PTSans' : 'helvetica'
  const margen = 18
  const ancho = doc.internal.pageSize.getWidth() - margen * 2
  const alto = doc.internal.pageSize.getHeight()
  let y = 20

  function asegurar(espacio: number) {
    if (y + espacio <= alto - 16) return
    doc.addPage()
    y = 20
  }

  function linea(texto: string, tamano: number, estilo: 'normal' | 'bold', salto = 6) {
    doc.setFont(font, estilo)
    doc.setFontSize(tamano)
    const partes = doc.splitTextToSize(texto, ancho) as string[]
    for (const parte of partes) {
      asegurar(salto)
      doc.text(parte, margen, y)
      y += salto
    }
  }

  const etiqueta = input.version > 0 ? `Versión ${input.version}` : 'Vista previa'
  linea('Lookout · Análisis PESTEL', 11, 'bold', 6)
  linea(etiqueta, 18, 'bold', 9)
  y += 2
  linea(`Empresa: ${input.metadatos.empresa}`, 11, 'normal')
  linea(`NIT: ${input.metadatos.nit}`, 11, 'normal')
  linea(`Sector: ${input.metadatos.sectorNombre}`, 11, 'normal')
  linea(`Ciudad: ${input.metadatos.ciudad ?? 'Sin ciudad'}`, 11, 'normal')
  linea(`Generado por: ${input.metadatos.autor} (${input.metadatos.rol})`, 11, 'normal')
  linea(`Fecha: ${input.fecha}`, 11, 'normal')
  linea(`Factores aprobados: ${input.metadatos.factores}`, 11, 'normal')
  const niveles = input.metadatos.porNivel
  linea(
    `Críticos: ${niveles.CRÍTICO ?? 0} · Atención: ${niveles.ATENCIÓN ?? 0} · Monitorear: ${niveles.MONITOREAR ?? 0}`,
    11,
    'normal',
  )
  y += 4

  for (const cruda of input.texto.split('\n')) {
    const lineaTexto = limpiarMarkdown(cruda)
    if (!lineaTexto || lineaTexto === '---') {
      y += 3
      continue
    }
    if (cruda.startsWith('### ')) {
      y += 1
      linea(lineaTexto.replace(/^#+\s*/, ''), 12, 'bold', 6)
      continue
    }
    if (cruda.startsWith('## ')) {
      y += 2
      linea(lineaTexto.replace(/^#+\s*/, ''), 14, 'bold', 7)
      continue
    }
    if (cruda.startsWith('# ')) {
      y += 3
      linea(lineaTexto.replace(/^#+\s*/, ''), 16, 'bold', 8)
      continue
    }
    linea(lineaTexto, 11, 'normal', 5.5)
  }

  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i += 1) {
    doc.setPage(i)
    doc.setFont(font, 'normal')
    doc.setFontSize(9)
    doc.text(`${etiqueta} · ${input.metadatos.empresa} · ${i}/${paginas}`, margen, alto - 10)
  }

  const slug = input.metadatos.empresa.replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'empresa'
  const nombre = input.version > 0 ? `PESTEL_v${input.version}_${slug}.pdf` : `PESTEL_vista_${slug}.pdf`
  doc.save(nombre)
}
