import { Download, FileSpreadsheet, Loader2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { copAUsd, exposicionEconomica, formatearCOP, formatearUSD, tieneValor } from '@/lib/dinero'
import { exportarCsv } from '@/lib/exportCsv'
import { exportarExcel } from '@/lib/exportExcel'
import { descargarInformePdf } from '@/lib/informePdf'
import { informeN8nConfigurado, solicitarInformeN8n } from '@/lib/informeN8n'
import {
  armarMetadatos,
  guardarInforme,
  listarInformes,
  type InformeVersion,
} from '@/lib/informesApi'
import { mensajeErrorSupabase } from '@/lib/factoresApi'
import { SECTORES } from '@/lib/sectores'
import { fechaLarga, formatearFecha } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { usePestelStore } from '@/store/usePestelStore'
import { CATEGORIAS } from '@/types/pestel'

export function Reportes() {
  const empresa = useAuthStore((s) => s.empresa)
  const perfil = useAuthStore((s) => s.perfil)
  const userId = useAuthStore((s) => s.user?.id)
  const factores = usePestelStore((s) => s.factores)
  const trmUsd = usePestelStore((s) => s.trmUsd)
  const [generando, setGenerando] = useState(false)
  const [informeUrl, setInformeUrl] = useState<string | null>(null)
  const [informeTexto, setInformeTexto] = useState<string | null>(null)
  const [informes, setInformes] = useState<InformeVersion[]>([])
  const [errorBiblioteca, setErrorBiblioteca] = useState<string | null>(null)
  const [descargandoId, setDescargandoId] = useState<string | null>(null)
  const aprobados = factores.filter((factor) => factor.estado === 'aprobado')
  const kpis = calcularKpis(factores)
  const dinero = exposicionEconomica(factores)
  const insights = generarInsights(factores)
  const criticos = factoresCriticos(factores)
  const resumen = resumenPorEntorno(factores)

  useEffect(() => {
    if (!empresa) return
    void listarInformes(empresa.id)
      .then((lista) => {
        setInformes(lista)
        setErrorBiblioteca(null)
      })
      .catch((error) => {
        setInformes([])
        setErrorBiblioteca(mensajeErrorSupabase(error))
      })
  }, [empresa])

  async function handleDescargarVersion(informe: InformeVersion) {
    setDescargandoId(informe.id)
    try {
      await descargarInformePdf({
        version: informe.version,
        texto: informe.texto,
        metadatos: informe.metadatos,
        fecha: formatearFecha(informe.createdAt),
      })
    } catch {
      toast.error('No se pudo descargar el PDF')
    } finally {
      setDescargandoId(null)
    }
  }

  async function handleInforme() {
    if (!empresa) {
      toast.error('No hay empresa en la sesión')
      return
    }
    if (aprobados.length === 0) {
      toast.error('Hace falta al menos un factor aprobado')
      return
    }
    setGenerando(true)
    setInformeUrl(null)
    setInformeTexto(null)
    try {
      const resultado = await solicitarInformeN8n(empresa, aprobados)
      setInformeUrl(resultado.url ?? null)
      setInformeTexto(resultado.texto ?? null)
      if (resultado.texto && perfil && userId) {
        try {
          const guardado = await guardarInforme({
            empresaId: empresa.id,
            userId,
            texto: resultado.texto,
            factores: aprobados,
            metadatos: armarMetadatos(empresa, perfil, aprobados),
          })
          setInformes((lista) => [guardado, ...lista.filter((item) => item.id !== guardado.id)])
          setErrorBiblioteca(null)
          toast.success(`Versión ${guardado.version} quedó en la biblioteca. El PDF se descarga desde ahí.`)
          document.getElementById('biblioteca')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } catch (error) {
          toast.error(`El análisis se generó, pero no se guardó: ${mensajeErrorSupabase(error)}`)
        }
      } else if (!resultado.url && !resultado.texto) {
        toast.success('n8n recibió los factores. El informe aún no trae enlace ni texto.')
      } else {
        toast.success('Informe generado')
      }
    } catch (error) {
      const mensaje = mensajeErrorSupabase(error)
      toast.error(mensaje.includes('Timeout') || mensaje.includes('aborted') ? 'n8n no respondió a tiempo' : mensaje)
    } finally {
      setGenerando(false)
    }
  }

  const biblioteca = (
    <Biblioteca
      informes={informes}
      error={errorBiblioteca}
      descargandoId={descargandoId}
      onDescargar={(informe) => void handleDescargarVersion(informe)}
    />
  )

  if (factores.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Encabezado />
        {biblioteca}
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
          {informeN8nConfigurado() ? (
            <Button type="button" onClick={() => void handleInforme()} disabled={generando || aprobados.length === 0}>
              {generando ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Generar análisis
            </Button>
          ) : null}
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

      {biblioteca}

      {informeUrl || informeTexto ? (
        <Card>
          <CardHeader>
            <CardTitle>Informe generado</CardTitle>
            <CardDescription>
              Análisis de {aprobados.length} factor{aprobados.length === 1 ? '' : 'es'} aprobado
              {aprobados.length === 1 ? '' : 's'}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Esta versión queda en la biblioteca. El PDF, con la hoja de ruta, se descarga desde esa fila.
            </p>
            {informeTexto ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{informeTexto}</p> : null}
            {informeUrl ? (
              <a
                href={informeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                Abrir documento
              </a>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div id="reporte-preview" className="space-y-6">
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-primary/10 px-6 py-8">
            <p className="text-sm font-medium text-accent">{APP_NAME}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Informe de análisis PESTEL
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Fecha de generación: {fechaLarga()}</p>
          </div>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <MiniKpi label="Factores" valor={kpis.total} />
            <MiniKpi label="Amenazas" valor={kpis.amenazas} />
            <MiniKpi label="Oportunidades" valor={kpis.oportunidades} />
            <MiniKpi label="Críticos" valor={kpis.criticos} alerta />
            <MiniKpi
              label="En riesgo"
              valor={dinero.conValor === 0 ? 'Sin valores' : formatearCOP(dinero.enRiesgoCOP)}
              alerta
            />
            <MiniKpi
              label="Por ganar"
              valor={dinero.conValor === 0 ? 'Sin valores' : formatearCOP(dinero.porGanarCOP)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen ejecutivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((texto) => (
              <p key={texto} className="text-sm leading-relaxed text-foreground">
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
            <CardDescription>Semáforo CRÍTICO ponderado por el peso del sector</CardDescription>
          </CardHeader>
          <CardContent>
            {criticos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay factores críticos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sector</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Prioridad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticos.map((factor) => (
                    <TableRow key={factor.id} className="bg-critico/10">
                      <TableCell className="text-xs">{SECTORES[factor.sector]?.nombre ?? factor.sector}</TableCell>
                      <TableCell className="font-bold">{factor.categoria}</TableCell>
                      <TableCell>
                        <Badge variant={factor.tipo === 'Amenaza' ? 'amenaza' : 'oportunidad'}>
                          {factor.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{factor.descripcion}</TableCell>
                      <TableCell className="text-xs">
                        {tieneValor(factor)
                          ? `${formatearCOP(factor.valorCOP)} · ${formatearUSD(copAUsd(factor.valorCOP, trmUsd))}`
                          : '—'}
                      </TableCell>
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
                        <TableHead>Sector</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Impacto</TableHead>
                        <TableHead>Plazo</TableHead>
                        <TableHead>Prioridad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grupo.map((factor) => (
                        <TableRow key={factor.id}>
                          <TableCell className="text-xs">{SECTORES[factor.sector]?.nombre ?? factor.sector}</TableCell>
                          <TableCell>{factor.tipo}</TableCell>
                          <TableCell>{factor.descripcion}</TableCell>
                          <TableCell className="text-xs">
                            {tieneValor(factor)
                              ? `${formatearCOP(factor.valorCOP)} · ${formatearUSD(copAUsd(factor.valorCOP, trmUsd))}`
                              : '—'}
                          </TableCell>
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

function mensajeBiblioteca(error: string | null): string {
  if (!error) return 'Todavía no hay versiones guardadas.'
  if (error.includes('schema cache') || error.includes('informes')) {
    return 'La biblioteca todavía no está creada en la base. Publica estos cambios para que se guarden las versiones.'
  }
  return error
}

function Biblioteca({
  informes,
  error,
  descargandoId,
  onDescargar,
}: {
  informes: InformeVersion[]
  error: string | null
  descargandoId: string | null
  onDescargar: (informe: InformeVersion) => void
}) {
  return (
    <Card id="biblioteca">
      <CardHeader>
        <CardTitle>Biblioteca de versiones</CardTitle>
        <CardDescription>
          Generar análisis guarda aquí la versión, con hoja de ruta y los datos del auditor. El PDF no se descarga
          solo: se baja desde la fila.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {informes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{mensajeBiblioteca(error)}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Versión</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>NIT</TableHead>
                  <TableHead>Factores</TableHead>
                  <TableHead>Niveles</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {informes.map((informe) => (
                  <TableRow key={informe.id}>
                    <TableCell className="font-medium">v{informe.version}</TableCell>
                    <TableCell>{formatearFecha(informe.createdAt)}</TableCell>
                    <TableCell>{informe.metadatos.autor}</TableCell>
                    <TableCell>{informe.metadatos.rol}</TableCell>
                    <TableCell>{informe.metadatos.nit}</TableCell>
                    <TableCell>{informe.metadatos.factores}</TableCell>
                    <TableCell className="text-xs">
                      {informe.metadatos.porNivel?.CRÍTICO ?? 0} críticos · {informe.metadatos.porNivel?.ATENCIÓN ?? 0}{' '}
                      atención · {informe.metadatos.porNivel?.MONITOREAR ?? 0} monitorear
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={descargandoId === informe.id}
                        onClick={() => onDescargar(informe)}
                      >
                        {descargandoId === informe.id ? <Loader2 className="animate-spin" /> : <Download />}
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Encabezado() {
  return (
    <header>
      <h1 className="text-2xl text-foreground">Reportes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Genera el análisis y descárgalo desde la biblioteca. Excel y CSV exportan los factores.
      </p>
    </header>
  )
}

function MiniKpi({ label, valor, alerta = false }: { label: string; valor: number | string; alerta?: boolean }) {
  return (
    <div className="glass-soft rounded-xl px-4 py-3">
      <p className="section-title">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${alerta ? 'text-critico' : 'text-foreground'}`}>{valor}</p>
    </div>
  )
}
