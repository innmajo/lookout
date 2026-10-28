import { AlertTriangle, CircleDollarSign, Leaf, ShieldAlert, Sprout, TrendingUp } from 'lucide-react'
import { CardOrb, IconBubble } from '@/components/IconBubble'
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
import { copAUsd, exposicionEconomica, formatearCOP, formatearUSD, tieneValor } from '@/lib/dinero'
import { SECTORES } from '@/lib/sectores'
import { cn } from '@/lib/utils'
import { usePestelStore } from '@/store/usePestelStore'

export function Dashboard() {
  const factores = usePestelStore((s) => s.factores)
  const trmUsd = usePestelStore((s) => s.trmUsd)
  const kpis = calcularKpis(factores)
  const dinero = exposicionEconomica(factores)
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

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard titulo="Factores" valor={kpis.total} icono={Leaf} />
        <KpiCard titulo="Amenazas" valor={kpis.amenazas} icono={ShieldAlert} acento="text-primary" />
        <KpiCard titulo="Oportunidades" valor={kpis.oportunidades} icono={Sprout} acento="text-monitorear" />
        <KpiCard
          titulo="Críticos"
          valor={kpis.criticos}
          icono={AlertTriangle}
          destacado
        />
        <KpiMoney
          titulo="En riesgo"
          cop={dinero.enRiesgoCOP}
          trm={trmUsd}
          vacio={dinero.conValor === 0}
        />
        <KpiMoney
          titulo="Por ganar"
          cop={dinero.porGanarCOP}
          trm={trmUsd}
          vacio={dinero.conValor === 0}
          positivo
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
          <CardDescription>
            Semáforo CRÍTICO según impacto, plazo y peso del sector en ese entorno PESTEL
          </CardDescription>
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
                    <div className="flex items-center gap-2 sm:w-44">
                      <Icon className="h-4 w-4" style={{ color: meta.color }} aria-hidden />
                      <span className="text-sm font-bold" style={{ color: meta.color }}>
                        {factor.categoria}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap gap-2">
                        <Badge variant="outline">{SECTORES[factor.sector]?.nombre ?? factor.sector}</Badge>
                        <Badge variant={factor.tipo === 'Amenaza' ? 'amenaza' : 'oportunidad'}>
                          {factor.tipo}
                        </Badge>
                        <SemaforoBadge factor={factor} mostrarPuntaje />
                      </div>
                      <p className="text-sm text-foreground">{factor.descripcion}</p>
                      {tieneValor(factor) ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {factor.tipo === 'Amenaza' ? 'Podría perder' : 'Podría ganar'}{' '}
                          {formatearCOP(factor.valorCOP)} · {formatearUSD(copAUsd(factor.valorCOP, trmUsd))}
                        </p>
                      ) : null}
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
        Lectura del entorno externo. El semáforo pondera el peso PESTEL del sector de cada factor.
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
    <Card className={cn('relative overflow-hidden', destacado && 'border-critico/40 bg-critico/10')}>
      <CardOrb tono={destacado ? 'critico' : 'tema'} />
      <CardContent className="relative flex items-center justify-between p-5">
        <div>
          <p className="section-title">{titulo}</p>
          <p className={cn('mt-2 text-3xl font-semibold tracking-tight', destacado ? 'text-critico' : acento)}>
            {valor}
          </p>
        </div>
        <IconBubble icon={Icono} tono={destacado ? 'critico' : 'tema'} />
      </CardContent>
    </Card>
  )
}

function KpiMoney({
  titulo,
  cop,
  trm,
  vacio,
  positivo = false,
}: {
  titulo: string
  cop: number
  trm: number
  vacio: boolean
  positivo?: boolean
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardOrb tono={positivo ? 'ok' : 'critico'} />
      <CardContent className="relative flex items-center justify-between p-5">
        <div>
          <p className="section-title">{titulo}</p>
          <p className={cn('mt-2 text-lg font-semibold tracking-tight', positivo ? 'text-monitorear' : 'text-critico')}>
            {vacio ? 'Sin valores' : formatearCOP(cop)}
          </p>
          {!vacio ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{formatearUSD(copAUsd(cop, trm))}</p>
          ) : null}
        </div>
        <IconBubble icon={CircleDollarSign} tono={positivo ? 'ok' : 'critico'} />
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
