import { AlertTriangle, Leaf, ShieldAlert, Sprout, TrendingUp } from 'lucide-react'
import { BarrasAgrupadas } from '@/components/charts/BarrasAgrupadas'
import { DonaCategorias } from '@/components/charts/DonaCategorias'
import { RadarEntornos } from '@/components/charts/RadarEntornos'
import { EmptyState } from '@/components/EmptyState'
import { MatrizPriorizacion } from '@/components/matriz/MatrizPriorizacion'
import { SemaforoBadge } from '@/components/SemaforoBadge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  calcularKpis,
  factoresCriticos,
  generarInsights,
  resumenPorEntorno,
} from '@/lib/analytics'
import { CATEGORIA_META } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { usePestelStore } from '@/store/usePestelStore'

export function Dashboard() {
  const factores = usePestelStore((s) => s.factores)
  const kpis = calcularKpis(factores)
  const resumen = resumenPorEntorno(factores)
  const insights = generarInsights(factores)
  const criticos = factoresCriticos(factores)

  if (factores.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader />
        <EmptyState
          titulo="Aún no hay factores registrados"
          descripcion="Registre amenazas y oportunidades del entorno, o cargue datos de ejemplo desde Configuración."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader />

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard titulo="Factores" valor={kpis.total} icono={Leaf} />
        <KpiCard titulo="Amenazas" valor={kpis.amenazas} icono={ShieldAlert} acento="text-primary" />
        <KpiCard titulo="Oportunidades" valor={kpis.oportunidades} icono={Sprout} acento="text-monitorear" />
        <KpiCard
          titulo="Críticos"
          valor={kpis.criticos}
          icono={AlertTriangle}
          destacado
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Amenazas vs. oportunidades</CardTitle>
            <CardDescription>Comparación por cada entorno PESTEL</CardDescription>
          </CardHeader>
          <CardContent>
            <BarrasAgrupadas data={resumen} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Perfil de entornos</CardTitle>
            <CardDescription>Radar de amenazas y oportunidades</CardDescription>
          </CardHeader>
          <CardContent>
            <RadarEntornos data={resumen} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por categoría</CardTitle>
            <CardDescription>Participación de cada entorno en el total</CardDescription>
          </CardHeader>
          <CardContent>
            <DonaCategorias data={resumen} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Insight automático</CardTitle>
            <CardDescription>Lectura inmediata para la gerencia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((texto) => (
              <p
                key={texto}
                className="glass-soft rounded-xl px-4 py-3 text-sm leading-relaxed text-foreground"
              >
                {resaltarEntornos(texto)}
              </p>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Matriz de Riesgos</CardTitle>
          <CardDescription>
            Filas: impacto (alto arriba). Columnas: plazo (corto a la izquierda). Pulse una celda para ver los factores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatrizPriorizacion factores={factores} />
        </CardContent>
      </Card>

      <Card className={cn(criticos.length > 0 && 'border-critico/40')}>
        <CardHeader>
          <CardTitle className="text-critico">Alertas urgentes</CardTitle>
          <CardDescription>Factores en nivel CRÍTICO: alto impacto y corto plazo</CardDescription>
        </CardHeader>
        <CardContent>
          {criticos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay alertas urgentes en este momento.</p>
          ) : (
            <ul className="space-y-3">
              {criticos.map((factor) => {
                const meta = CATEGORIA_META[factor.categoria]
                const Icon = meta.icon
                return (
                  <li
                    key={factor.id}
                    className="flex flex-col gap-2 rounded-xl border border-critico/30 bg-critico/10 p-3 sm:flex-row sm:items-start"
                  >
                    <div className="flex items-center gap-2 sm:w-40">
                      <Icon className="h-4 w-4" style={{ color: meta.color }} aria-hidden />
                      <span className="text-sm font-bold" style={{ color: meta.color }}>
                        {factor.categoria}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap gap-2">
                        <Badge variant={factor.tipo === 'Amenaza' ? 'amenaza' : 'oportunidad'}>
                          {factor.tipo}
                        </Badge>
                        <SemaforoBadge factor={factor} />
                      </div>
                      <p className="text-sm text-foreground">{factor.descripcion}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PageHeader() {
  return (
    <header className="mb-6">
      <h1 className="text-2xl text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Lectura del entorno externo para priorizar decisiones.
      </p>
    </header>
  )
}

function KpiCard({
  titulo,
  valor,
  icono: Icono,
  acento,
  destacado = false,
}: {
  titulo: string
  valor: number
  icono: typeof TrendingUp
  acento?: string
  destacado?: boolean
}) {
  return (
    <Card className={cn(destacado && 'border-critico/40 bg-critico/10')}>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="section-title">{titulo}</p>
          <p className={cn('mt-2 text-3xl font-semibold tracking-tight', destacado ? 'text-critico' : acento)}>
            {valor}
          </p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            destacado ? 'bg-critico/20 text-critico' : 'bg-primary/15 text-accent',
          )}
        >
          <Icono className="h-5 w-5" aria-hidden />
        </div>
      </CardContent>
    </Card>
  )
}

function resaltarEntornos(texto: string) {
  const partes = texto.split(/\b(Político|Económico|Social|Tecnológico|Ecológico|Legal|CRÍTICO)\b/g)
  return partes.map((parte, index) => {
    if (parte === 'CRÍTICO') {
      return (
        <strong key={`${parte}-${index}`} className="text-critico">
          {parte}
        </strong>
      )
    }
    if (parte in CATEGORIA_META) {
      return (
        <strong key={`${parte}-${index}`} style={{ color: CATEGORIA_META[parte as keyof typeof CATEGORIA_META].color }}>
          {parte}
        </strong>
      )
    }
    return <span key={`${parte}-${index}`}>{parte}</span>
  })
}
