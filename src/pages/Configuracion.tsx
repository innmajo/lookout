import { Database, Trash2 } from 'lucide-react'
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
  const esAdminEmpresa = perfil?.rol === 'admin_empresa'
  const puedeEjemplos = puedeOperarFactores(perfil?.rol)

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
            <TablaPesos sectorActivo={sector} />
          </CardContent>
        </Card>
      ) : null}

      {empresa && (esAdminEmpresa || perfil?.rol === 'sistema') ? (
        <Card>
          <CardHeader>
            <CardTitle>Tasa de cambio (TRM)</CardTitle>
            <CardDescription>
              Pesos colombianos por 1 dólar. Se usa para traducir el valor de cada amenaza u
              oportunidad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="trm">COP por USD</Label>
            <Input
              id="trm"
              className="mt-1.5 max-w-xs"
              inputMode="decimal"
              value={trmUsd}
              onChange={(e) => {
                const n = Number(e.target.value)
                if (Number.isFinite(n) && n > 0) {
                  void setTrmUsd(n).catch((error) => toast.error(mensajeErrorSupabase(error)))
                }
              }}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Valor de referencia (no es una TRM en vivo). Por defecto{' '}
              {TRM_POR_DEFECTO.toLocaleString('es-CO')}.
            </p>
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
