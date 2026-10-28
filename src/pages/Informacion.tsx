import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TablaPesos } from '@/components/SectorPicker'
import { calcularNivelCelda, calcularPrioridad, valorImpacto, valorPlazo } from '@/lib/prioridad'
import { PESO_MEDIO, pesoCategoria, SECTORES } from '@/lib/sectores'
import { useThemeStore } from '@/store/useThemeStore'
import { IMPACTOS, PLAZOS, type FactorPestel } from '@/types/pestel'

const PESO_MEDIO_TXT = PESO_MEDIO.toLocaleString('es-CO', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function formatearPuntaje(puntaje: number) {
  return puntaje.toLocaleString('es-CO', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

const VARIANTE = {
  CRÍTICO: 'critico',
  ATENCIÓN: 'atencion',
  MONITOREAR: 'monitorear',
} as const

const EJEMPLOS = [
  {
    titulo: 'Social en agro (peso bajo)',
    factor: {
      impacto: 'Alto',
      plazo: 'Corto plazo',
      sector: 'agro',
      categoria: 'Social',
    },
  },
  {
    titulo: 'Ecológico en agro (peso alto)',
    factor: {
      impacto: 'Alto',
      plazo: 'Corto plazo',
      sector: 'agro',
      categoria: 'Ecológico',
    },
  },
] as const satisfies ReadonlyArray<{
  titulo: string
  factor: Pick<FactorPestel, 'impacto' | 'plazo' | 'sector' | 'categoria'>
}>

export function Informacion() {
  const sector = useThemeStore((s) => s.sector)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl text-foreground">Información</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          De dónde salen el puntaje, el semáforo y los colores de la matriz.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Cómo se calcula el puntaje</CardTitle>
          <CardDescription>
            Cada registro recibe un número a partir del impacto, el plazo y cuánto pesa ese entorno
            PESTEL en el sector del factor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="glass-soft rounded-xl px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Fórmula
            </p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-foreground">
              puntaje = (impacto × plazo)
              <br />
              × (peso del entorno ÷ {PESO_MEDIO_TXT}%)
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              El {PESO_MEDIO_TXT}% es el peso medio (100% repartidos en los 6 entornos). Un entorno
              que pesa más que el promedio sube el semáforo; uno que pesa menos lo baja. El
              resultado se redondea a un decimal.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Escala
              titulo="Impacto"
              filas={[
                ['Alto', 3],
                ['Medio', 2],
                ['Bajo', 1],
              ]}
            />
            <Escala
              titulo="Plazo"
              filas={[
                ['Corto plazo', 3],
                ['Mediano plazo', 2],
                ['Largo plazo', 1],
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semáforo del factor</CardTitle>
          <CardDescription>
            El badge de Registro, las alertas urgentes y los reportes usan este puntaje ponderado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex flex-wrap items-center gap-3">
              <Badge variant="critico">CRÍTICO</Badge>
              <span className="text-sm text-foreground">
                9 o más · Urgente, actuar ya
              </span>
            </li>
            <li className="flex flex-wrap items-center gap-3">
              <Badge variant="atencion">ATENCIÓN</Badge>
              <span className="text-sm text-foreground">4 a 8,9 · Planificar</span>
            </li>
            <li className="flex flex-wrap items-center gap-3">
              <Badge variant="monitorear">MONITOREAR</Badge>
              <span className="text-sm text-foreground">menos de 4 · Seguimiento</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mismo impacto y plazo, distinto sector</CardTitle>
          <CardDescription>
            Alto × Corto plazo vale 9 antes de ponderar. El peso del entorno decide si llega a
            CRÍTICO.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {EJEMPLOS.map((item) => (
            <EjemploCalculo key={item.titulo} titulo={item.titulo} factor={item.factor} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>La matriz no usa el peso</CardTitle>
          <CardDescription>
            Las celdas solo combinan impacto y plazo. El semáforo de cada factor, al abrir la
            celda, sí está ponderado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MiniMatriz />
          <p className="text-sm text-muted-foreground">
            Un factor Social agro de impacto alto y corto plazo cae en la casilla CRÍTICO de la
            matriz, pero su badge puede decir ATENCIÓN. Las alertas urgentes del Dashboard siguen
            el badge, no el color de la casilla.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pesos PESTEL por sector</CardTitle>
          <CardDescription>
            Cada fila suma 100%. El sector de la organización pinta el color de Lookout; el sector
            de cada registro es el que entra en su puntaje.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TablaPesos sectorActivo={sector} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valor en dinero</CardTitle>
          <CardDescription>
            El monto en COP es opcional y no cambia el semáforo. En amenazas es lo que se podría
            perder; en oportunidades, lo que se podría ganar. El Dashboard lo muestra también en
            dólares con la TRM de Configuración.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

function Escala({ titulo, filas }: { titulo: string; filas: Array<[string, number]> }) {
  return (
    <div className="glass-soft rounded-xl p-3">
      <p className="section-title mb-2">{titulo}</p>
      <ul className="space-y-1.5 text-sm">
        {filas.map(([etiqueta, valor]) => (
          <li key={etiqueta} className="flex items-center justify-between gap-3">
            <span className="text-foreground">{etiqueta}</span>
            <span className="tabular-nums font-medium text-foreground">{valor}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EjemploCalculo({
  titulo,
  factor,
}: {
  titulo: string
  factor: Pick<FactorPestel, 'impacto' | 'plazo' | 'sector' | 'categoria'>
}) {
  const prioridad = calcularPrioridad(factor)
  const base = valorImpacto(factor.impacto) * valorPlazo(factor.plazo)
  const peso = pesoCategoria(factor.sector, factor.categoria)
  const sectorNombre = SECTORES[factor.sector].nombre

  return (
    <div className="glass-soft rounded-xl p-4">
      <p className="text-sm font-medium text-foreground">{titulo}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {sectorNombre} · {factor.categoria} {peso}% · {factor.impacto} × {factor.plazo}
      </p>
      <p className="mt-3 text-xs tabular-nums text-muted-foreground">
        {base} × ({peso} ÷ {PESO_MEDIO_TXT}) = {formatearPuntaje(prioridad.puntaje)}
      </p>
      <div className="mt-2">
        <Badge variant={VARIANTE[prioridad.nivel]}>
          {prioridad.nivel} · {formatearPuntaje(prioridad.puntaje)}
        </Badge>
      </div>
    </div>
  )
}

function MiniMatriz() {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[420px] grid-cols-[88px_repeat(3,1fr)] gap-2"
        role="table"
        aria-label="Niveles de la matriz impacto por plazo, sin peso de sector"
      >
        <div />
        {PLAZOS.map((plazo) => (
          <div key={plazo} className="section-title px-1 text-center">
            {plazo}
          </div>
        ))}
        {IMPACTOS.map((impacto) => (
          <div key={impacto} className="contents">
            <div className="flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {impacto}
            </div>
            {PLAZOS.map((plazo) => {
              const celda = calcularNivelCelda(impacto, plazo)
              return (
                <div
                  key={`${impacto}-${plazo}`}
                  className="rounded-xl border p-2 text-center"
                  style={{
                    backgroundColor: `${celda.color}18`,
                    borderColor: `${celda.color}66`,
                  }}
                >
                  <p className="text-lg font-bold tabular-nums" style={{ color: celda.color }}>
                    {celda.puntaje}
                  </p>
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: celda.color }}
                  >
                    {celda.nivel}
                  </p>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
