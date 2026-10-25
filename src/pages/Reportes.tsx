import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { BarrasAgrupadas } from '@/components/charts/BarrasAgrupadas'
import { RadarEntornos } from '@/components/charts/RadarEntornos'
import { EmptyState } from '@/components/EmptyState'
import { MatrizPriorizacion } from '@/components/matriz/MatrizPriorizacion'
import { SemaforoBadge } from '@/components/SemaforoBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  calcularKpis,
  factoresCriticos,
  generarInsights,
  resumenPorEntorno,
} from '@/lib/analytics'
import { APP_NAME } from '@/lib/constants'
import { exportarCsv } from '@/lib/exportCsv'
import { exportarExcel } from '@/lib/exportExcel'
import { exportarPdf } from '@/lib/exportPdf'
import { fechaLarga } from '@/lib/utils'
import { usePestelStore } from '@/store/usePestelStore'
import { CATEGORIAS } from '@/types/pestel'

export function Reportes() {
  const factores = usePestelStore((s) => s.factores)
  const [exportando, setExportando] = useState(false)
  const kpis = calcularKpis(factores)
  const insights = generarInsights(factores)
  const criticos = factoresCriticos(factores)
  const resumen = resumenPorEntorno(factores)

  async function handlePdf() {
    setExportando(true)
    try {
      await exportarPdf(factores)
      toast.success('PDF descargado')
    } catch {
      toast.error('No se pudo generar el PDF')
    } finally {
      setExportando(false)
    }
  }

  if (factores.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <Encabezado />
        <EmptyState
          titulo="No hay datos para reportar"
          descripcion="Registre factores PESTEL o cargue el set de ejemplo para generar el informe de gerencia."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Encabezado />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handlePdf} disabled={exportando}>
            {exportando ? <Loader2 className="animate-spin" /> : <FileText />}
            Descargar PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              exportarExcel(factores)
              toast.success('Excel descargado')
            }}
          >
            <FileSpreadsheet />
            Descargar Excel (.xlsx)
          </Button>
          <Button
            type="button"
            variant="accent"
            onClick={() => {
              exportarCsv(factores)
              toast.success('CSV descargado')
            }}
          >
            <Download />
            Descargar CSV
          </Button>
        </div>
      </div>

      <div id="reporte-preview" className="space-y-6">
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-primary/10 px-6 py-8">
            <p className="text-sm font-medium text-accent">{APP_NAME}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Informe de análisis PESTEL
            </h2>
            <p className="mt-2 text-sm text-white/80">Fecha de generación: {fechaLarga()}</p>
          </div>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-4">
            <MiniKpi label="Factores" valor={kpis.total} />
            <MiniKpi label="Amenazas" valor={kpis.amenazas} />
            <MiniKpi label="Oportunidades" valor={kpis.oportunidades} />
            <MiniKpi label="Críticos" valor={kpis.criticos} alerta />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen ejecutivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((texto) => (
              <p key={texto} className="text-sm leading-relaxed text-white">
                {texto}
              </p>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Barras agrupadas</CardTitle>
              <CardDescription>Amenazas y oportunidades por entorno</CardDescription>
            </CardHeader>
            <CardContent>
              <BarrasAgrupadas data={resumen} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Radar de entornos</CardTitle>
              <CardDescription>Perfil comparativo</CardDescription>
            </CardHeader>
            <CardContent>
              <RadarEntornos data={resumen} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Matriz de priorización</CardTitle>
          </CardHeader>
          <CardContent>
            <MatrizPriorizacion factores={factores} />
          </CardContent>
        </Card>

        <Card className="border-critico/40">
          <CardHeader>
            <CardTitle className="text-critico">Factores críticos</CardTitle>
            <CardDescription>Alto impacto y corto plazo</CardDescription>
          </CardHeader>
          <CardContent>
            {criticos.length === 0 ? (
              <p className="text-sm text-white/80">No hay factores críticos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Prioridad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticos.map((factor) => (
                    <TableRow key={factor.id} className="bg-critico/10">
                      <TableCell className="font-bold">{factor.categoria}</TableCell>
                      <TableCell>
                        <Badge variant={factor.tipo === 'Amenaza' ? 'amenaza' : 'oportunidad'}>
                          {factor.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{factor.descripcion}</TableCell>
                      <TableCell>
                        <SemaforoBadge factor={factor} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Factores por categoría</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {CATEGORIAS.map((categoria) => {
              const grupo = factores.filter((f) => f.categoria === categoria)
              if (grupo.length === 0) return null
              return (
                <section key={categoria}>
                  <h3 className="mb-2 section-title">{categoria}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Impacto</TableHead>
                        <TableHead>Plazo</TableHead>
                        <TableHead>Prioridad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grupo.map((factor) => (
                        <TableRow key={factor.id}>
                          <TableCell>{factor.tipo}</TableCell>
                          <TableCell>{factor.descripcion}</TableCell>
                          <TableCell>{factor.impacto}</TableCell>
                          <TableCell>{factor.plazo}</TableCell>
                          <TableCell>
                            <SemaforoBadge factor={factor} mostrarPuntaje />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </section>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Encabezado() {
  return (
    <header>
      <h1 className="text-2xl text-white">Reportes</h1>
      <p className="mt-1 text-sm text-white/75">
        Vista previa del informe y descarga en PDF, Excel o CSV.
      </p>
    </header>
  )
}

function MiniKpi({ label, valor, alerta = false }: { label: string; valor: number; alerta?: boolean }) {
  return (
    <div className="glass-soft rounded-xl px-4 py-3">
      <p className="section-title">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${alerta ? 'text-critico' : 'text-foreground'}`}>{valor}</p>
    </div>
  )
}
