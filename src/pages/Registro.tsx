import { Pencil, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FactorForm } from '@/components/forms/FactorForm'
import { SemaforoBadge } from '@/components/SemaforoBadge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CATEGORIA_META } from '@/lib/constants'
import { copAUsd, formatearCOP, formatearUSD, tieneValor } from '@/lib/dinero'
import { calcularPrioridad } from '@/lib/prioridad'
import { LISTA_SECTORES, SECTORES, type SectorId } from '@/lib/sectores'
import { formatearFecha } from '@/lib/utils'
import { usePestelStore } from '@/store/usePestelStore'
import {
  CATEGORIAS,
  IMPACTOS,
  PLAZOS,
  TIPOS,
  type Categoria,
  type FactorFormValues,
  type FactorPestel,
  type Impacto,
  type Plazo,
  type Tipo,
} from '@/types/pestel'

type Orden = 'fecha-desc' | 'fecha-asc' | 'prioridad-desc' | 'prioridad-asc'

export function Registro() {
  const factores = usePestelStore((s) => s.factores)
  const agregarFactor = usePestelStore((s) => s.agregarFactor)
  const actualizarFactor = usePestelStore((s) => s.actualizarFactor)
  const eliminarFactor = usePestelStore((s) => s.eliminarFactor)

  const trmUsd = usePestelStore((s) => s.trmUsd)
  const [busqueda, setBusqueda] = useState('')
  const [sector, setSector] = useState<SectorId | 'todos'>('todos')
  const [categoria, setCategoria] = useState<Categoria | 'todas'>('todas')
  const [tipo, setTipo] = useState<Tipo | 'todos'>('todos')
  const [impacto, setImpacto] = useState<Impacto | 'todos'>('todos')
  const [plazo, setPlazo] = useState<Plazo | 'todos'>('todos')
  const [orden, setOrden] = useState<Orden>('fecha-desc')
  const [editando, setEditando] = useState<FactorPestel | null>(null)
  const [eliminando, setEliminando] = useState<FactorPestel | null>(null)

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    const lista = factores.filter((factor) => {
      const coincideTexto =
        !texto ||
        factor.descripcion.toLowerCase().includes(texto) ||
        factor.categoria.toLowerCase().includes(texto) ||
        SECTORES[factor.sector]?.nombre.toLowerCase().includes(texto)
      return (
        coincideTexto &&
        (sector === 'todos' || factor.sector === sector) &&
        (categoria === 'todas' || factor.categoria === categoria) &&
        (tipo === 'todos' || factor.tipo === tipo) &&
        (impacto === 'todos' || factor.impacto === impacto) &&
        (plazo === 'todos' || factor.plazo === plazo)
      )
    })

    return lista.sort((a, b) => {
      if (orden === 'fecha-desc') return b.fechaRegistro.localeCompare(a.fechaRegistro)
      if (orden === 'fecha-asc') return a.fechaRegistro.localeCompare(b.fechaRegistro)
      const pa = calcularPrioridad(a).puntaje
      const pb = calcularPrioridad(b).puntaje
      return orden === 'prioridad-desc' ? pb - pa : pa - pb
    })
  }, [factores, busqueda, sector, categoria, tipo, impacto, plazo, orden])

  function handleCrear(values: FactorFormValues) {
    agregarFactor(values)
    toast.success('Factor registrado correctamente')
  }

  function handleEditar(values: FactorFormValues) {
    if (!editando) return
    actualizarFactor(editando.id, values)
    setEditando(null)
    toast.success('Factor actualizado')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl text-foreground">Registro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Documente amenazas y oportunidades del entorno. El valor en pesos es opcional.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo factor</CardTitle>
          <CardDescription>
            Incluya el sector (define el peso PESTEL) y, si puede, lo que se perdería o se ganaría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FactorForm key={factores.length} onSubmit={handleCrear} submitLabel="Guardar factor" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros</CardTitle>
          <CardDescription>
            {filtrados.length} de {factores.length} factores visibles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <FiltroSelect
              id="filtro-sector"
              label="Sector"
              value={sector}
              onChange={(v) => setSector(v as SectorId | 'todos')}
              opciones={[['todos', 'Todos'], ...LISTA_SECTORES.map((s) => [s.id, s.nombre] as const)]}
            />
            <div className="xl:col-span-2">
              <Label htmlFor="busqueda">Búsqueda</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
                <Input
                  id="busqueda"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por texto..."
                  className="pl-9"
                />
              </div>
            </div>
            <FiltroSelect
              id="filtro-categoria"
              label="Categoría"
              value={categoria}
              onChange={(v) => setCategoria(v as Categoria | 'todas')}
              opciones={[['todas', 'Todas'], ...CATEGORIAS.map((c) => [c, c] as const)]}
            />
            <FiltroSelect
              id="filtro-tipo"
              label="Tipo"
              value={tipo}
              onChange={(v) => setTipo(v as Tipo | 'todos')}
              opciones={[['todos', 'Todos'], ...TIPOS.map((c) => [c, c] as const)]}
            />
            <FiltroSelect
              id="filtro-impacto"
              label="Impacto"
              value={impacto}
              onChange={(v) => setImpacto(v as Impacto | 'todos')}
              opciones={[['todos', 'Todos'], ...IMPACTOS.map((c) => [c, c] as const)]}
            />
            <FiltroSelect
              id="filtro-plazo"
              label="Plazo"
              value={plazo}
              onChange={(v) => setPlazo(v as Plazo | 'todos')}
              opciones={[['todos', 'Todos'], ...PLAZOS.map((c) => [c, c] as const)]}
            />
          </div>

          <div className="max-w-xs">
            <Label htmlFor="orden">Ordenar por</Label>
            <Select value={orden} onValueChange={(v) => setOrden(v as Orden)}>
              <SelectTrigger id="orden" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fecha-desc">Fecha (más recientes)</SelectItem>
                <SelectItem value="fecha-asc">Fecha (más antiguos)</SelectItem>
                <SelectItem value="prioridad-desc">Prioridad (mayor)</SelectItem>
                <SelectItem value="prioridad-asc">Prioridad (menor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtrados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              {factores.length === 0
                ? 'No hay registros todavía. Complete el formulario de arriba o cargue datos de ejemplo.'
                : 'Ningún factor coincide con la búsqueda o los filtros.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sector</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="min-w-[220px]">Descripción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Impacto</TableHead>
                  <TableHead>Plazo</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((factor) => {
                  const meta = CATEGORIA_META[factor.categoria]
                  const Icon = meta.icon
                  return (
                    <TableRow key={factor.id}>
                      <TableCell className="text-xs">{SECTORES[factor.sector]?.nombre ?? factor.sector}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 font-bold" style={{ color: meta.color }}>
                          <Icon className="h-4 w-4" aria-hidden />
                          {factor.categoria}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-md">{factor.descripcion}</p>
                        {factor.esEjemplo ? (
                          <Badge variant="outline" className="mt-1 border-accent/40 text-accent">
                            Ejemplo
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={factor.tipo === 'Amenaza' ? 'amenaza' : 'oportunidad'}>
                          {factor.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {tieneValor(factor) ? (
                          <span>
                            {formatearCOP(factor.valorCOP)}
                            <span className="mt-0.5 block text-muted-foreground">
                              {formatearUSD(copAUsd(factor.valorCOP, trmUsd))}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{factor.impacto}</TableCell>
                      <TableCell>{factor.plazo}</TableCell>
                      <TableCell>
                        <SemaforoBadge factor={factor} mostrarPuntaje />
                      </TableCell>
                      <TableCell>{formatearFecha(factor.fechaRegistro)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Editar factor ${factor.categoria}`}
                            onClick={() => setEditando(factor)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Eliminar factor ${factor.categoria}`}
                            onClick={() => setEliminando(factor)}
                          >
                            <Trash2 className="h-4 w-4 text-critico" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editando} onOpenChange={(open) => !open && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar factor</DialogTitle>
            <DialogDescription>Actualice los campos y guarde los cambios.</DialogDescription>
          </DialogHeader>
          {editando ? (
            <FactorForm
              defaultValues={editando}
              onSubmit={handleEditar}
              onCancel={() => setEditando(null)}
              submitLabel="Actualizar factor"
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!eliminando} onOpenChange={(open) => !open && setEliminando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este factor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se quitará el registro del análisis PESTEL.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-critico hover:bg-red-700"
              onClick={() => {
                if (!eliminando) return
                eliminarFactor(eliminando.id)
                setEliminando(null)
                toast.success('Factor eliminado')
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FiltroSelect({
  id,
  label,
  value,
  onChange,
  opciones,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  opciones: ReadonlyArray<readonly [string, string]>
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="mt-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opciones.map(([val, texto]) => (
            <SelectItem key={val} value={val}>
              {texto}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
