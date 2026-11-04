import { Database, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { TablaPesos } from '@/components/SectorPicker'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TRM_POR_DEFECTO } from '@/lib/dinero'
import { mensajeErrorSupabase } from '@/lib/factoresApi'
import { puedeOperarFactores, ROL_ETIQUETA } from '@/lib/roles'
import { FACTORES_EJEMPLO } from '@/lib/sampleData'
import { SECTORES } from '@/lib/sectores'
import { fetchTrmMercado, type TrmMercado } from '@/lib/trmApi'
import { useAuthStore } from '@/store/useAuthStore'
import { usePestelStore } from '@/store/usePestelStore'

export function Configuracion() {
  const userId = useAuthStore((s) => s.user?.id)
  const empresa = useAuthStore((s) => s.empresa)
  const perfil = useAuthStore((s) => s.perfil)
  const factores = usePestelStore((s) => s.factores)
  const cargarEjemplos = usePestelStore((s) => s.cargarEjemplos)
  const borrarTodo = usePestelStore((s) => s.borrarTodo)
  const trmUsd = usePestelStore((s) => s.trmUsd)
  const setTrmUsd = usePestelStore((s) => s.setTrmUsd)

  const sector = empresa?.sector
  const esSistema = perfil?.rol === 'sistema'
  const esAdminEmpresa = perfil?.rol === 'admin_empresa'
  const puedeEjemplos = puedeOperarFactores(perfil?.rol)
  const puedeEditarTrm = esAdminEmpresa || esSistema

  const [trmBorrador, setTrmBorrador] = useState(String(trmUsd))
  const [mercado, setMercado] = useState<TrmMercado | null>(null)
  const [cargandoTrm, setCargandoTrm] = useState(false)

  useEffect(() => {
    setTrmBorrador(String(trmUsd))
  }, [trmUsd])

  useEffect(() => {
    if (!puedeEditarTrm) return
    let cancelado = false
    setCargandoTrm(true)
    void fetchTrmMercado()
      .then(async (data) => {
        if (cancelado) return
        setMercado(data)
        // Si aún está el respaldo 4000, aplica la tasa real una vez.
        if (usePestelStore.getState().trmUsd === TRM_POR_DEFECTO) {
          await setTrmUsd(data.valor)
          if (!cancelado) setTrmBorrador(String(data.valor))
        }
      })
      .catch(() => {
        if (!cancelado) setMercado(null)
      })
      .finally(() => {
        if (!cancelado) setCargandoTrm(false)
      })
    return () => {
      cancelado = true
    }
  }, [puedeEditarTrm, setTrmUsd])

  async function refrescarTrmMercado() {
    setCargandoTrm(true)
    try {
      const data = await fetchTrmMercado()
      setMercado(data)
      toast.success(`Tasa de mercado: ${data.valor.toLocaleString('es-CO')} COP/USD`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo consultar la TRM')
    } finally {
      setCargandoTrm(false)
    }
  }

  async function aplicarTrmMercado() {
    if (!mercado) {
      await refrescarTrmMercado()
      return
    }
    try {
      await setTrmUsd(mercado.valor)
      setTrmBorrador(String(mercado.valor))
      toast.success('TRM actualizada con la tasa de mercado')
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    }
  }

  async function guardarTrmManual() {
    const n = Number(trmBorrador.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Ingrese una TRM válida mayor que 0')
      return
    }
    try {
      await setTrmUsd(n)
      toast.success('TRM guardada')
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl text-foreground">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {empresa
            ? `${empresa.nombre} · su rol: ${perfil ? ROL_ETIQUETA[perfil.rol] : '—'}`
            : 'Parámetros de la cuenta'}
          . El sector de la empresa no se puede cambiar.
        </p>
      </header>

      {empresa && sector ? (
        <Card>
          <CardHeader>
            <CardTitle>Sector de la organización</CardTitle>
            <CardDescription>
              Definido al registrar la empresa. Fija los pesos PESTEL y el color de Lookout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="glass-soft rounded-xl px-4 py-3 text-sm font-medium text-foreground">
              {SECTORES[sector].nombre}
            </p>
            <TablaPesos sectorActivo={sector} soloActivo={!esSistema} />
          </CardContent>
        </Card>
      ) : null}

      {empresa && puedeEditarTrm ? (
        <Card>
          <CardHeader>
            <CardTitle>Tasa de cambio (TRM)</CardTitle>
            <CardDescription>
              Pesos colombianos por 1 dólar. Se consulta una tasa de mercado y puede ajustarla a
              mano.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="glass-soft space-y-2 rounded-xl px-4 py-3 text-sm">
              <p className="text-foreground">
                {cargandoTrm && !mercado
                  ? 'Consultando tasa de mercado…'
                  : mercado
                    ? (
                        <>
                          Tasa de mercado:{' '}
                          <strong>{mercado.valor.toLocaleString('es-CO')} COP/USD</strong>
                        </>
                      )
                    : 'No se pudo cargar la tasa de mercado.'}
              </p>
              {mercado?.actualizadoEn ? (
                <p className="text-xs text-muted-foreground">
                  Actualización de la fuente: {mercado.actualizadoEn}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Fuente:{' '}
                <a
                  href="https://www.exchangerate-api.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  Rates By Exchange Rate API
                </a>
                . No es la TRM oficial del Banco de la República; es una referencia de mercado.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={cargandoTrm}
                  onClick={() => void refrescarTrmMercado()}
                >
                  <RefreshCw className={cargandoTrm ? 'animate-spin' : undefined} />
                  Actualizar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="accent"
                  disabled={cargandoTrm || !mercado}
                  onClick={() => void aplicarTrmMercado()}
                >
                  Usar tasa de mercado
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="trm">COP por USD (editable)</Label>
              <div className="mt-1.5 flex max-w-md flex-wrap items-center gap-2">
                <Input
                  id="trm"
                  className="max-w-xs"
                  inputMode="decimal"
                  value={trmBorrador}
                  onChange={(e) => setTrmBorrador(e.target.value)}
                  onBlur={() => void guardarTrmManual()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void guardarTrmManual()
                    }
                  }}
                />
                <Button type="button" size="sm" variant="outline" onClick={() => void guardarTrmManual()}>
                  Guardar
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Valor guardado en la empresa. Respaldo si falla la API:{' '}
                {TRM_POR_DEFECTO.toLocaleString('es-CO')}.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {puedeEjemplos && empresa && sector && userId ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Datos de ejemplo</CardTitle>
              <CardDescription>
                Carga factores de ejemplo solo del sector {SECTORES[sector].nombre}. Reemplaza los
                registros actuales de la empresa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="accent">
                    <Database />
                    Cargar datos de ejemplo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cargar el set de demostración?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se reemplazarán los {factores.length} factor
                      {factores.length === 1 ? '' : 'es'} actuales por ejemplos de{' '}
                      {SECTORES[sector].nombre} (
                      {FACTORES_EJEMPLO.filter((f) => f.sector === sector).length} registros).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        void (async () => {
                          try {
                            await cargarEjemplos(userId, empresa.id, sector)
                            toast.success('Datos de ejemplo cargados')
                          } catch (error) {
                            toast.error(mensajeErrorSupabase(error))
                          }
                        })()
                      }}
                    >
                      Cargar ejemplos
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card className="border-critico/30">
            <CardHeader>
              <CardTitle className="text-critico">Borrar todos los datos</CardTitle>
              <CardDescription>
                Elimina de forma permanente todos los factores de la empresa en Supabase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    <Trash2 />
                    Borrar todos los datos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Borrar todo el análisis?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán {factores.length} registros.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-critico hover:bg-red-700"
                      onClick={() => {
                        void (async () => {
                          try {
                            await borrarTodo(empresa.id)
                            toast.success('Todos los datos fueron eliminados')
                          } catch (error) {
                            toast.error(mensajeErrorSupabase(error))
                          }
                        })()
                      }}
                    >
                      Sí, borrar todo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
