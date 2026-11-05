import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { APP_NAME } from '@/lib/constants'
import { esSectorId, SECTORES } from '@/lib/sectores'
import type { InformeMetadatos } from '@/lib/informesApi'
import { useThemeStore } from '@/store/useThemeStore'

function colorDelSector(sector: string): string {
  const tema = useThemeStore.getState().tema
  if (!esSectorId(sector)) return '#0D9488'
  return SECTORES[sector].paleta[tema].primary
}

interface Anillo {
  x: number
  y: number
  r: number
  grosor?: number
  relleno?: boolean
  opacidad: number
}

function dibujarAnillos(doc: jsPDF, color: string, zona: { x: number; y: number; w: number; h: number }, piezas: Anillo[]) {
  const api = doc as jsPDF & {
    GState?: new (opciones: { opacity: number }) => object
    setGState?: (estado: object) => void
  }
  doc.saveGraphicsState()
  doc.lines(
    [
      [zona.w, 0],
      [0, zona.h],
      [-zona.w, 0],
      [0, -zona.h],
    ],
    zona.x,
    zona.y,
    [1, 1],
    null,
    true,
  )
  doc.clip()
  doc.discardPath()
  doc.setLineCap('round')
  for (const pieza of piezas) {
    if (api.GState && api.setGState) api.setGState(new api.GState({ opacity: pieza.opacidad }))
    doc.setDrawColor(color)
    doc.setFillColor(color)
    if (pieza.relleno) {
      doc.circle(pieza.x, pieza.y, pieza.r, 'F')
    } else {
      doc.setLineWidth(pieza.grosor ?? 0.6)
      doc.circle(pieza.x, pieza.y, pieza.r, 'S')
    }
  }
  doc.restoreGraphicsState()
}
const SLATE = '#0F172A'
const CREMA = '#F8FAFC'
const TEXTO = '#334155'
const SUAVE = '#64748B'

type Rgb = [number, number, number]

interface FilaFactor {
  categoria: string
  factor: string
  tipo: string
  impacto: string
  plazo: string
  puntaje: string
  nivel: string
  valor: string
  descripcion: string
}

interface FilaRuta {
  plazo: string
  accion: string
  factor: string
  resultado: string
}

interface GrupoPrioridad {
  nivel: string
  items: string[]
}

interface InformeParseado {
  resumen: string
  factores: FilaFactor[]
  notas: string[]
  prioridades: GrupoPrioridad[]
  ruta: FilaRuta[]
}

function sinMarcas(texto: string): string {
  return texto
    .replace(/\*\*/g, '')
    .replace(/^\*+|\*+$/g, '')
    .replace(/`/g, '')
    .trim()
}

function factorVacio(categoria: string): FilaFactor {
  return {
    categoria,
    factor: '',
    tipo: '',
    impacto: '',
    plazo: '',
    puntaje: '',
    nivel: '',
    valor: '',
    descripcion: '',
  }
}

function asignarCampo(fila: FilaFactor, clave: string, valor: string) {
  if (clave.includes('factor')) fila.factor = valor
  else if (clave.includes('tipo')) fila.tipo = valor
  else if (clave.includes('impacto')) fila.impacto = valor
  else if (clave.includes('plazo')) fila.plazo = valor
  else if (clave.includes('puntaje') || clave.includes('puntu')) fila.puntaje = valor
  else if (clave.includes('nivel')) fila.nivel = valor
  else if (clave.includes('valor')) fila.valor = valor
  else if (clave.includes('descrip')) fila.descripcion = valor
}

function esSeparadorTabla(celdas: string[]): boolean {
  return celdas.length > 0 && celdas.every((celda) => /^:?-{3,}:?$/.test(celda))
}

function mapearRuta(encabezado: string[], celdas: string[]): FilaRuta {
  const indice = (pista: string) => encabezado.findIndex((columna) => columna.toLowerCase().includes(pista))
  const tomar = (pista: string, pos: number) => {
    const i = indice(pista)
    return sinMarcas((i >= 0 ? celdas[i] : celdas[pos]) ?? '')
  }
  return {
    plazo: tomar('plazo', 0),
    accion: tomar('acci', 1),
    factor: tomar('factor', 2),
    resultado: tomar('resultado', 3),
  }
}

export function parsearInformeMarkdown(texto: string): InformeParseado {
  type Zona = 'inicio' | 'resumen' | 'pestel' | 'prioridades' | 'ruta'
  let zona: Zona = 'inicio'
  let categoria = ''
  let actual: FilaFactor | null = null
  let encabezadoRuta: string[] | null = null
  const resumen: string[] = []
  const factores: FilaFactor[] = []
  const notas: string[] = []
  const prioridades: GrupoPrioridad[] = []
  const ruta: FilaRuta[] = []

  function cerrarFactor() {
    if (!actual) return
    if (actual.factor || actual.descripcion || actual.tipo) factores.push(actual)
    actual = null
  }

  for (const cruda of texto.replace(/\r/g, '').split('\n')) {
    const linea = cruda.trim()
    if (!linea || linea === '---') continue

    if (linea.startsWith('## ')) {
      cerrarFactor()
      encabezadoRuta = null
      const titulo = sinMarcas(linea).toLowerCase()
      if (titulo.includes('resumen')) zona = 'resumen'
      else if (titulo.includes('pestel') || titulo.includes('analisis') || titulo.includes('análisis')) zona = 'pestel'
      else if (titulo.includes('prioridad')) zona = 'prioridades'
      else if (titulo.includes('hoja') || titulo.includes('ruta')) zona = 'ruta'
      else zona = 'inicio'
      continue
    }

    if (linea.startsWith('# ')) continue

    if (linea.startsWith('### ')) {
      cerrarFactor()
      const titulo = sinMarcas(linea)
      if (zona === 'pestel') categoria = titulo
      if (zona === 'prioridades') prioridades.push({ nivel: titulo.toUpperCase(), items: [] })
      continue
    }

    if (zona === 'resumen') {
      resumen.push(sinMarcas(linea))
      continue
    }

    if (zona === 'pestel') {
      const campo = linea.match(/^[-*]\s+\*\*([^*]+):\*\*\s*(.*)$/)
      if (campo) {
        const clave = campo[1].trim().toLowerCase()
        const valor = sinMarcas(campo[2]).replace(/\.$/, '')
        if (clave.includes('factor') || !actual) {
          if (clave.includes('factor')) cerrarFactor()
          actual = actual ?? factorVacio(categoria)
        }
        asignarCampo(actual, clave, valor)
        continue
      }
      if (/^\*[^*]/.test(linea) || linea.startsWith('_')) {
        const nota = sinMarcas(linea).replace(/^\*+|\*+$/g, '').trim()
        if (nota) notas.push(nota)
      }
      continue
    }

    if (zona === 'prioridades') {
      const bala = linea.match(/^[-*]\s+(.*)$/)
      if (!bala) continue
      if (prioridades.length === 0) prioridades.push({ nivel: 'GENERAL', items: [] })
      prioridades[prioridades.length - 1].items.push(sinMarcas(bala[1]))
      continue
    }

    if (zona === 'ruta' && linea.startsWith('|')) {
      const celdas = linea
        .split('|')
        .map((celda) => sinMarcas(celda))
        .filter((celda) => celda.length > 0)
      if (esSeparadorTabla(celdas)) continue
      if (!encabezadoRuta) {
        encabezadoRuta = celdas
        continue
      }
      const fila = mapearRuta(encabezadoRuta, celdas)
      if (fila.plazo || fila.accion) ruta.push(fila)
    }
  }

  cerrarFactor()
  return { resumen: resumen.join(' '), factores, notas, prioridades, ruta }
}

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

function colorNivel(nivel: string): Rgb {
  const texto = nivel.toUpperCase()
  if (texto.includes('CRÍT') || texto.includes('CRIT')) return [220, 38, 38]
  if (texto.includes('ATEN')) return [217, 119, 6]
  return [22, 163, 74]
}

function colorPlazo(plazo: string): Rgb {
  const texto = plazo.toLowerCase()
  if (texto.includes('corto')) return [13, 148, 136]
  if (texto.includes('mediano')) return [217, 119, 6]
  return [30, 64, 175]
}

function finalTabla(doc: jsPDF): number {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0
}

export async function crearInformePdf(input: {
  version: number
  texto: string
  metadatos: InformeMetadatos
  fecha: string
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const conFuente = await incrustarFuente(doc)
  const font = conFuente ? 'PTSans' : 'helvetica'
  const margen = 14
  const paginaAncho = doc.internal.pageSize.getWidth()
  const paginaAlto = doc.internal.pageSize.getHeight()
  const ancho = paginaAncho - margen * 2
  const informe = parsearInformeMarkdown(input.texto)
  const acento = colorDelSector(input.metadatos.sector)
  const etiqueta = input.version > 0 ? `Versión ${input.version}` : 'Vista previa'
  let y = 48

  function nuevaPagina() {
    doc.addPage()
    y = 18
  }

  function asegurar(espacio: number) {
    if (y + espacio <= paginaAlto - 16) return
    nuevaPagina()
  }

  function titulo(texto: string) {
    asegurar(14)
    doc.setFillColor(acento)
    doc.rect(margen, y, 2.4, 7, 'F')
    doc.setFont(font, 'bold')
    doc.setFontSize(12)
    doc.setTextColor(SLATE)
    doc.text(texto, margen + 6, y + 5.5)
    y += 12
  }

  doc.setFillColor(SLATE)
  doc.rect(0, 0, paginaAncho, 36, 'F')
  dibujarAnillos(doc, acento, { x: 0, y: 0, w: paginaAncho, h: 36 }, [
    { x: paginaAncho + 2, y: -1, r: 16, grosor: 1.6, opacidad: 0.34 },
    { x: paginaAncho + 2, y: -1, r: 9, grosor: 0.45, opacidad: 0.55 },
    { x: paginaAncho + 2, y: -1, r: 2.2, relleno: true, opacidad: 0.4 },
    { x: paginaAncho - 34, y: 2, r: 6, grosor: 0.9, opacidad: 0.4 },
    { x: paginaAncho - 22, y: 14, r: 1.3, relleno: true, opacidad: 0.5 },
    { x: -4, y: 30, r: 11, grosor: 1.1, opacidad: 0.28 },
    { x: -4, y: 30, r: 5.5, grosor: 0.35, opacidad: 0.45 },
  ])
  doc.setFillColor(acento)
  doc.rect(0, 36, paginaAncho, 2.4, 'F')
  doc.setFont(font, 'bold')
  doc.setTextColor('#FFFFFF')
  doc.setFontSize(10)
  doc.text(APP_NAME, margen, 12)
  doc.setFontSize(18)
  doc.text('Análisis de entorno externo', margen, 22)
  doc.setFont(font, 'normal')
  doc.setFontSize(10)
  doc.text(etiqueta, margen, 30)
  doc.text(input.metadatos.empresa || 'Empresa', paginaAncho - margen, 22, { align: 'right' })
  doc.setFontSize(9)
  doc.text(input.fecha, paginaAncho - margen, 30, { align: 'right' })

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen, bottom: 16 },
    theme: 'grid',
    styles: { font, fontSize: 9, textColor: TEXTO, cellPadding: 2.2, valign: 'middle' },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: SLATE, fillColor: CREMA, cellWidth: 28 },
      1: { cellWidth: 63 },
      2: { fontStyle: 'bold', textColor: SLATE, fillColor: CREMA, cellWidth: 28 },
      3: { cellWidth: 63 },
    },
    body: [
      ['Empresa', input.metadatos.empresa || '—', 'NIT', input.metadatos.nit || '—'],
      ['Sector', input.metadatos.sectorNombre || '—', 'Ciudad', input.metadatos.ciudad || '—'],
      ['Autor', `${input.metadatos.autor || '—'} · ${input.metadatos.rol || '—'}`, 'Fecha', input.fecha],
    ],
  })
  y = finalTabla(doc) + 6

  const niveles = input.metadatos.porNivel
  const cajas = [
    { label: 'Factores', valor: String(input.metadatos.factores ?? informe.factores.length), color: acento },
    { label: 'Críticos', valor: String(niveles?.CRÍTICO ?? 0), color: '#DC2626' },
    { label: 'Atención', valor: String(niveles?.ATENCIÓN ?? 0), color: '#D97706' },
    { label: 'Monitorear', valor: String(niveles?.MONITOREAR ?? 0), color: '#16A34A' },
  ]
  const cajaAncho = (ancho - 9) / 4
  cajas.forEach((caja, index) => {
    const x = margen + index * (cajaAncho + 3)
    doc.setFillColor(CREMA)
    doc.roundedRect(x, y, cajaAncho, 18, 1.5, 1.5, 'F')
    doc.setFont(font, 'bold')
    doc.setFontSize(14)
    doc.setTextColor(caja.color)
    doc.text(caja.valor, x + cajaAncho / 2, y + 8, { align: 'center' })
    doc.setFont(font, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(SUAVE)
    doc.text(caja.label.toUpperCase(), x + cajaAncho / 2, y + 14, { align: 'center' })
  })
  y += 26

  if (informe.resumen) {
    titulo('Resumen ejecutivo')
    doc.setFont(font, 'normal')
    doc.setFontSize(10)
    const lineas = doc.splitTextToSize(informe.resumen, ancho - 8) as string[]
    const altoCaja = lineas.length * 5 + 8
    asegurar(altoCaja)
    doc.setFillColor(CREMA)
    doc.roundedRect(margen, y, ancho, altoCaja, 1.5, 1.5, 'F')
    doc.setTextColor(TEXTO)
    doc.text(lineas, margen + 4, y + 6)
    y += altoCaja + 8
  }

  if (informe.factores.length > 0) {
    titulo('Análisis PESTEL')
    const categorias = [...new Set(informe.factores.map((fila) => fila.categoria || 'General'))]
    for (const categoria of categorias) {
      const filas = informe.factores.filter((fila) => (fila.categoria || 'General') === categoria)
      asegurar(20)
      doc.setFont(font, 'bold')
      doc.setFontSize(11)
      doc.setTextColor(acento)
      doc.text(categoria, margen, y)
      y += 3
      const hayValor = filas.some((fila) => fila.valor)
      autoTable(doc, {
        startY: y,
        margin: { left: margen, right: margen, top: 16, bottom: 16 },
        theme: 'grid',
        styles: { font, fontSize: 8, textColor: TEXTO, valign: 'middle', cellPadding: 1.8 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
        head: [hayValor
          ? ['Factor', 'Tipo', 'Impacto', 'Plazo', 'Nivel', 'Puntaje', 'Valor']
          : ['Factor', 'Tipo', 'Impacto', 'Plazo', 'Nivel', 'Puntaje']],
        body: filas.map((fila) => {
          const base = [fila.factor || '—', fila.tipo || '—', fila.impacto || '—', fila.plazo || '—', fila.nivel || '—', fila.puntaje || '—']
          return hayValor ? [...base, fila.valor || '—'] : base
        }),
        columnStyles: { 0: { cellWidth: hayValor ? 52 : 62 } },
        didParseCell: (data) => {
          const columnaNivel = 4
          if (data.section !== 'body' || data.column.index !== columnaNivel) return
          const [r, g, b] = colorNivel(String(data.cell.raw ?? ''))
          data.cell.styles.fillColor = [r, g, b]
          data.cell.styles.textColor = 255
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.halign = 'center'
        },
      })
      y = finalTabla(doc) + 4
      for (const fila of filas) {
        if (!fila.descripcion) continue
        doc.setFont(font, 'normal')
        doc.setFontSize(9)
        const detalle = doc.splitTextToSize(fila.descripcion, ancho) as string[]
        asegurar(detalle.length * 4.6 + 2)
        doc.setTextColor(TEXTO)
        doc.text(detalle, margen, y)
        y += detalle.length * 4.6 + 3
      }
    }
    for (const nota of informe.notas) {
      doc.setFont(font, 'normal')
      doc.setFontSize(8)
      const lineas = doc.splitTextToSize(nota, ancho) as string[]
      asegurar(lineas.length * 4 + 2)
      doc.setTextColor(SUAVE)
      doc.text(lineas, margen, y)
      y += lineas.length * 4 + 3
    }
    y += 3
  }

  if (informe.prioridades.length > 0) {
    titulo('Prioridades')
    autoTable(doc, {
      startY: y,
      margin: { left: margen, right: margen, top: 16, bottom: 16 },
      theme: 'grid',
      styles: { font, fontSize: 9, textColor: TEXTO, valign: 'middle', cellPadding: 2.4 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      head: [['Nivel', 'Qué atender']],
      columnStyles: { 0: { cellWidth: 36, halign: 'center', fontStyle: 'bold' }, 1: { cellWidth: ancho - 36 } },
      body: informe.prioridades.map((grupo) => [grupo.nivel, grupo.items.join('\n') || '—']),
      didParseCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 0) return
        const [r, g, b] = colorNivel(String(data.cell.raw ?? ''))
        data.cell.styles.fillColor = [r, g, b]
        data.cell.styles.textColor = 255
      },
    })
    y = finalTabla(doc) + 8
  }

  if (informe.ruta.length > 0) {
    titulo('Hoja de ruta')
    const etapas = [
      { titulo: 'Corto plazo', pista: 'corto', color: colorPlazo('corto') },
      { titulo: 'Mediano plazo', pista: 'mediano', color: colorPlazo('mediano') },
      { titulo: 'Largo plazo', pista: 'largo', color: colorPlazo('largo') },
    ]
    const columnas = etapas.map((etapa) => ({
      ...etapa,
      filas: informe.ruta.filter((fila) => fila.plazo.toLowerCase().includes(etapa.pista)),
    }))
    const colW = (ancho - 6) / 3
    doc.setFont(font, 'normal')
    doc.setFontSize(8)
    const alto = Math.max(
      28,
      ...columnas.map((columna) => {
        const texto = columna.filas.map((fila) => fila.accion).join('\n') || 'Sin acciones'
        const lineas = doc.splitTextToSize(texto, colW - 6) as string[]
        return 14 + lineas.length * 3.8
      }),
    )
    asegurar(alto + 4)
    columnas.forEach((columna, index) => {
      const x = margen + index * (colW + 3)
      doc.setFillColor(CREMA)
      doc.roundedRect(x, y, colW, alto, 1.5, 1.5, 'F')
      doc.setFillColor(...columna.color)
      doc.rect(x, y, colW, 2.2, 'F')
      doc.setFont(font, 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...columna.color)
      doc.text(`${index + 1}  ${columna.titulo.toUpperCase()}`, x + 3, y + 8)
      doc.setFont(font, 'normal')
      doc.setFontSize(8)
      doc.setTextColor(TEXTO)
      const texto = columna.filas.map((fila) => fila.accion).join('\n') || 'Sin acciones'
      const lineas = doc.splitTextToSize(texto, colW - 6) as string[]
      doc.text(lineas, x + 3, y + 14)
    })
    y += alto + 6

    autoTable(doc, {
      startY: y,
      margin: { left: margen, right: margen, top: 16, bottom: 16 },
      theme: 'grid',
      styles: { font, fontSize: 8, textColor: TEXTO, valign: 'middle', cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      head: [['Plazo', 'Acción', 'Factor origen', 'Resultado esperado']],
      columnStyles: { 0: { cellWidth: 32, fontStyle: 'bold', halign: 'center' }, 1: { cellWidth: 52 }, 2: { cellWidth: 32 } },
      body: informe.ruta.map((fila) => [
        fila.plazo || '—',
        fila.accion || '—',
        fila.factor || '—',
        fila.resultado || '—',
      ]),
      didParseCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 0) return
        const [r, g, b] = colorPlazo(String(data.cell.raw ?? ''))
        data.cell.styles.textColor = [r, g, b]
      },
    })
    y = finalTabla(doc) + 4
  }

  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i += 1) {
    doc.setPage(i)
    doc.setFillColor(SLATE)
    doc.rect(0, paginaAlto - 10, paginaAncho, 10, 'F')
    dibujarAnillos(doc, acento, { x: 0, y: paginaAlto - 10, w: paginaAncho, h: 10 }, [
      { x: 6, y: paginaAlto + 2, r: 7, grosor: 0.7, opacidad: 0.4 },
      { x: 6, y: paginaAlto + 2, r: 3.2, grosor: 0.3, opacidad: 0.55 },
      { x: paginaAncho + 2, y: paginaAlto + 3, r: 6, grosor: 0.55, opacidad: 0.32 },
    ])
    doc.setFont(font, 'normal')
    doc.setFontSize(8)
    doc.setTextColor('#FFFFFF')
    doc.text(`${APP_NAME}  ·  ${etiqueta}  ·  ${input.metadatos.empresa}`, margen, paginaAlto - 4)
    doc.text(`${i} / ${paginas}`, paginaAncho - margen, paginaAlto - 4, { align: 'right' })
  }

  return doc
}

export async function descargarInformePdf(input: {
  version: number
  texto: string
  metadatos: InformeMetadatos
  fecha: string
}) {
  const doc = await crearInformePdf(input)
  const slug = input.metadatos.empresa.replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'empresa'
  const nombre = input.version > 0 ? `PESTEL_v${input.version}_${slug}.pdf` : `PESTEL_vista_${slug}.pdf`
  doc.save(nombre)
}
