import fs from 'node:fs'
import path from 'node:path'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const root = path.resolve(import.meta.dirname, '..')
const downloads = path.join(process.env.USERPROFILE, 'Downloads')
const out = path.join(downloads, 'Lookout_Presentacion_5min.pdf')

function fontB64(file) {
  return fs.readFileSync(path.join(root, 'public', 'fonts', file)).toString('base64')
}

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
doc.addFileToVFS('PTSans-Regular.ttf', fontB64('PTSans-Regular.ttf'))
doc.addFileToVFS('PTSans-Bold.ttf', fontB64('PTSans-Bold.ttf'))
doc.addFont('PTSans-Regular.ttf', 'PTSans', 'normal')
doc.addFont('PTSans-Bold.ttf', 'PTSans', 'bold')
doc.setFont('PTSans', 'normal')

const W = doc.internal.pageSize.getWidth()
const H = doc.internal.pageSize.getHeight()
const M = 16
const NAVY = [5, 7, 11]
const CARD = [12, 16, 28]
const BLUE = [59, 130, 246]
const TEXT = [244, 247, 251]
const MUTED = [200, 212, 230]
const TEAL = [45, 212, 191]

function fill(color) {
  doc.setFillColor(...color)
}

function pageBg() {
  fill(NAVY)
  doc.rect(0, 0, W, H, 'F')
  fill(BLUE)
  doc.rect(0, 0, W, 3.2, 'F')
}

function footer(page, total) {
  fill(BLUE)
  doc.rect(0, H - 10, W, 10, 'F')
  doc.setFont('PTSans', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text('Lookout  ·  Análisis PESTEL  ·  Presentación 5 minutos', M, H - 4)
  doc.text(`${page} / ${total}`, W - M, H - 4, { align: 'right' })
}

function heading(title, y) {
  doc.setFont('PTSans', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...TEXT)
  doc.text(title, M, y)
  fill(BLUE)
  doc.rect(M, y + 2.2, 22, 1.1, 'F')
  return y + 10
}

function body(text, y, size = 11, color = MUTED) {
  doc.setFont('PTSans', 'normal')
  doc.setFontSize(size)
  doc.setTextColor(...color)
  const lines = doc.splitTextToSize(text, W - M * 2)
  doc.text(lines, M, y)
  return y + lines.length * (size * 0.42) + 3
}

function bullet(items, y) {
  doc.setFont('PTSans', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...MUTED)
  for (const item of items) {
    const lines = doc.splitTextToSize(`•  ${item}`, W - M * 2)
    doc.text(lines, M, y)
    y += lines.length * 5.1 + 1.4
  }
  return y
}

function chip(label, x, y, w = 42) {
  fill(CARD)
  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, w, 9, 2, 2, 'FD')
  doc.setFont('PTSans', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...TEAL)
  doc.text(label, x + w / 2, y + 5.8, { align: 'center' })
}

function timeBox(label, x, y) {
  fill([15, 23, 42])
  doc.setDrawColor(45, 212, 191)
  doc.setLineWidth(0.25)
  doc.roundedRect(x, y, 28, 7, 1.5, 1.5, 'FD')
  doc.setFont('PTSans', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...TEAL)
  doc.text(label, x + 14, y + 4.8, { align: 'center' })
}

// Portada
pageBg()
doc.setFont('PTSans', 'bold')
doc.setFontSize(11)
doc.setTextColor(...TEAL)
doc.text('GUÍA PARA EXPONER', M, 38)
doc.setFontSize(32)
doc.setTextColor(...TEXT)
doc.text('Lookout', M, 56)
doc.setFontSize(16)
doc.setTextColor(...BLUE)
doc.text('Análisis PESTEL en 5 minutos', M, 66)

doc.setFont('PTSans', 'normal')
doc.setFontSize(12)
doc.setTextColor(...MUTED)
const intro = doc.splitTextToSize(
  'Herramienta web para registrar amenazas y oportunidades del entorno, priorizarlas con un semáforo y entregar un informe listo para gerencia.',
  W - M * 2,
)
doc.text(intro, M, 80)

chip('Sin servidor', M, 100)
chip('Datos en el navegador', M + 46, 100)
chip('PDF · Excel · CSV', M + 92, 100)
chip('Interfaz en español', M + 138, 100)

fill(CARD)
doc.setDrawColor(...BLUE)
doc.roundedRect(M, 122, W - M * 2, 52, 3, 3, 'FD')
doc.setFont('PTSans', 'bold')
doc.setFontSize(11)
doc.setTextColor(...TEXT)
doc.text('Cómo usar estos 5 minutos', M + 6, 132)
doc.setFont('PTSans', 'normal')
doc.setFontSize(10)
doc.setTextColor(...MUTED)
const plan = [
  '0:00–0:40   Qué es Lookout y qué problema resuelve',
  '0:40–1:30   El modelo PESTEL y la regla del semáforo',
  '1:30–4:20   Recorrido en vivo: Registro → Dashboard → Reportes',
  '4:20–5:00   Cierre: valor, límites y siguiente paso',
]
doc.text(plan, M + 6, 142)

doc.setFontSize(9)
doc.setTextColor(148, 163, 184)
doc.text('Tenga la app abierta en http://localhost:5173 con datos de ejemplo cargados.', M, 188)

// Página 2: qué es + PESTEL
doc.addPage()
pageBg()
let y = heading('1. Qué es y para qué sirve', 22)
timeBox('0:00–0:40', W - M - 28, 16)

y = body(
  'Lookout convierte un análisis PESTEL en un flujo operativo: se capturan factores del entorno externo, se clasifican y se priorizan de forma automática para decidir qué atender primero.',
  y,
)

y = body('Diga esto:', y + 1, 10, TEAL)
y = bullet(
  [
    'No es un documento estático: es un tablero vivo de vigilancia del entorno.',
    'Sirve para que analistas y gerencia vean amenazas, oportunidades y alertas en un mismo lugar.',
    'Los datos se quedan en el navegador. No hay base de datos ni backend.',
  ],
  y,
)

y = heading('2. El modelo y el semáforo', y + 4)
timeBox('0:40–1:30', W - M - 28, y - 10)

y = body(
  'PESTEL agrupa el entorno en seis frentes: Político, Económico, Social, Tecnológico, Ecológico y Legal. Cada factor se marca como amenaza u oportunidad, con impacto y plazo.',
  y,
)

y = body('La prioridad se calcula así:  puntaje = impacto × plazo', y, 11, TEXT)
y = body('Impacto: Alto 3 · Medio 2 · Bajo 1     Plazo: Corto 3 · Mediano 2 · Largo 1', y, 10)

autoTable(doc, {
  startY: y,
  margin: { left: M, right: M },
  head: [['Puntaje', 'Nivel', 'Qué implica', 'Ejemplo']],
  body: [
    ['9', 'CRÍTICO', 'Actuar ya', 'Alto impacto y corto plazo'],
    ['4 a 6', 'ATENCIÓN', 'Planificar', 'Impacto medio o plazo mediano'],
    ['1 a 3', 'MONITOREAR', 'Seguimiento', 'Bajo impacto o largo plazo'],
  ],
  theme: 'grid',
  styles: {
    font: 'PTSans',
    fontSize: 10,
    textColor: TEXT,
    fillColor: CARD,
    lineColor: [37, 99, 235],
    lineWidth: 0.15,
    cellPadding: 2.4,
  },
  headStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold' },
  alternateRowStyles: { fillColor: [8, 12, 22] },
})

y = doc.lastAutoTable.finalY + 8
y = body(
  'En la demo, un factor económico de alto impacto y corto plazo (por ejemplo, el alza de insumos) debe aparecer en rojo como CRÍTICO.',
  y,
)

// Página 3: recorrido
doc.addPage()
pageBg()
y = heading('3. Recorrido en vivo', 22)
timeBox('1:30–4:20', W - M - 28, 16)

y = body('Abra Configuración y pulse “Cargar datos de ejemplo” si el tablero está vacío. Luego recorra las cuatro pantallas en este orden:', y)

const pantallas = [
  [
    'Registro',
    'Muestre el formulario: categoría, descripción, tipo, impacto y plazo. Todos los campos son obligatorios. Luego señale la tabla: filtros, edición, eliminación y la etiqueta “Ejemplo”.',
  ],
  [
    'Dashboard',
    'KPIs (factores, amenazas, oportunidades, críticos), gráficos, insights automáticos, matriz 3×3 de impacto × plazo y la lista de alertas urgentes.',
  ],
  [
    'Reportes',
    'Vista previa del informe. Indique que se puede descargar PDF, Excel o CSV para gerencia, con el mismo semáforo y los factores críticos.',
  ],
  [
    'Configuración',
    'Deje claro el límite: todo vive en este navegador. Se puede recargar el set de demostración o borrar los datos.',
  ],
]

for (const [titulo, texto] of pantallas) {
  fill(CARD)
  doc.setDrawColor(59, 130, 246)
  doc.setLineWidth(0.25)
  doc.roundedRect(M, y - 4, W - M * 2, 28, 2.5, 2.5, 'FD')
  doc.setFont('PTSans', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...TEAL)
  doc.text(titulo, M + 5, y + 3)
  doc.setFont('PTSans', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  const lines = doc.splitTextToSize(texto, W - M * 2 - 10)
  doc.text(lines, M + 5, y + 10)
  y += 32
}

y += 2
y = body('Frase puente para el cierre:', y, 10, TEAL)
y = body(
  '“En menos de un minuto pasamos de capturar un factor a verlo priorizado y listo para un informe.”',
  y,
  11,
  TEXT,
)

// Página 4: cierre + guion
doc.addPage()
pageBg()
y = heading('4. Cierre', 22)
timeBox('4:20–5:00', W - M - 28, 16)

y = body('Resuma en tres puntos y pare:', y, 11, TEXT)
y = bullet(
  [
    'Lookout ordena el entorno PESTEL y dice qué es urgente.',
    'El semáforo evita discutir todo con la misma prioridad.',
    'El informe sale del mismo dato que se acaba de registrar.',
  ],
  y,
)

y = body('Si preguntan por límites, sea directo:', y + 1, 10, TEAL)
y = bullet(
  [
    'No hay usuarios ni nube: cada navegador tiene su propia copia.',
    'Los ejemplos son ficticios, para demostrar el flujo.',
    'El valor está en la captura, la priorización y la exportación.',
  ],
  y,
)

y = heading('Guion corto para leer', y + 2)
const guion = [
  'Lookout es una herramienta de análisis PESTEL. Permite registrar amenazas y oportunidades del entorno, priorizarlas y generar un informe.',
  'Cada factor se clasifica en uno de seis entornos y recibe un semáforo: crítico, atención o monitorear, según impacto y plazo.',
  'En Registro se documenta el factor. En Dashboard se ve el panorama y las alertas. En Reportes se descarga el informe.',
  'El resultado es una lectura clara para decidir qué atender primero, sin depender de una hoja de cálculo dispersa.',
]
y = bullet(guion, y)

doc.setFont('PTSans', 'bold')
doc.setFontSize(10)
doc.setTextColor(...TEAL)
doc.text('Tiempo objetivo: 5 minutos. Si se atrasa, salte Configuración y cierre con el guion.', M, 268)

const total = doc.getNumberOfPages()
for (let i = 1; i <= total; i++) {
  doc.setPage(i)
  footer(i, total)
}

fs.mkdirSync(downloads, { recursive: true })
doc.save(out)
console.log(out)
