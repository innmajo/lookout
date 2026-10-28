import { Database, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { usePestelStore } from '@/store/usePestelStore'

export function Configuracion() {
  const factores = usePestelStore((s) => s.factores)
  const cargarEjemplos = usePestelStore((s) => s.cargarEjemplos)
  const borrarTodo = usePestelStore((s) => s.borrarTodo)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl text-foreground">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Los registros se guardan solo en este navegador (localStorage). No hay servidor.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Datos de ejemplo</CardTitle>
          <CardDescription>
            Carga 16 factores ficticios del entorno agroindustrial, con varios críticos, marcados
            como ejemplo. Reemplaza los registros actuales.
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
                  actuales por datos de ejemplo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    cargarEjemplos()
                    toast.success('Datos de ejemplo cargados')
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
            Elimina de forma permanente todos los factores guardados en este navegador.
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
                    borrarTodo()
                    toast.success('Todos los datos fueron eliminados')
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
