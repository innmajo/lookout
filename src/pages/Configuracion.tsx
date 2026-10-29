import { Database, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SectorPicker, TablaPesos } from '@/components/SectorPicker'
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
import { FACTORES_EJEMPLO } from '@/lib/sampleData'
import { useAuthStore } from '@/store/useAuthStore'
import { usePestelStore } from '@/store/usePestelStore'
import { useThemeStore } from '@/store/useThemeStore'

export function Configuracion() {
  const userId = useAuthStore((s) => s.user?.id)
  const factores = usePestelStore((s) => s.factores)
  const cargarEjemplos = usePestelStore((s) => s.cargarEjemplos)
  const borrarTodo = usePestelStore((s) => s.borrarTodo)
  const trmUsd = usePestelStore((s) => s.trmUsd)
  const setTrmUsd = usePestelStore((s) => s.setTrmUsd)
  const sector = useThemeStore((s) => s.sector)
  const setSector = useThemeStore((s) => s.setSector)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl text-foreground">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Los factores y la TRM se guardan en Supabase asociados a tu cuenta. El tema y el sector de
          la organización siguen en este navegador.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Sector de la organización</CardTitle>
          <CardDescription>
            Define el color de Lookout y el sector por defecto al registrar un factor. Cada factor
            puede pertenecer a otro sector; su semáforo usa los pesos de esa fila.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <SectorPicker value={sector} onChange={setSector} />
          <TablaPesos sectorActivo={sector} />
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Datos de ejemplo</CardTitle>
          <CardDescription>
            Carga {FACTORES_EJEMPLO.length} factores ficticios de los 8 sectores, con varios
            críticos, marcados como ejemplo. Reemplaza los registros actuales en la nube.
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
                  Se reemplazarán los {factores.length} factor{factores.length === 1 ? '' : 'es'}{' '}
                  actuales por datos de ejemplo de los 8 sectores.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (!userId) {
                      toast.error('Debes iniciar sesión')
                      return
                    }
                    void (async () => {
                      try {
                        await cargarEjemplos(userId)
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
            Elimina de forma permanente todos los factores de tu cuenta en Supabase.
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
                    if (!userId) {
                      toast.error('Debes iniciar sesión')
                      return
                    }
                    void (async () => {
                      try {
                        await borrarTodo(userId)
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
    </div>
  )
}
