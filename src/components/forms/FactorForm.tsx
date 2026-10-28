import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CATEGORIA_META } from '@/lib/constants'
import { copAUsd, formatearUSD } from '@/lib/dinero'
import { etiquetaPeso } from '@/lib/prioridad'
import { factorSchema, type FactorSchema } from '@/lib/schema'
import { LISTA_SECTORES, SECTORES, esSectorId } from '@/lib/sectores'
import { cn } from '@/lib/utils'
import { usePestelStore } from '@/store/usePestelStore'
import { useThemeStore } from '@/store/useThemeStore'
import { CATEGORIAS, IMPACTOS, PLAZOS, type FactorFormValues } from '@/types/pestel'

interface FactorFormProps {
  defaultValues?: Partial<FactorFormValues>
  onSubmit: (values: FactorFormValues) => void
  onCancel?: () => void
  submitLabel?: string
}

function ErrorMsg({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null
  return (
    <p role="alert" className="mt-1 text-xs font-bold text-critico">
      {mensaje}
    </p>
  )
}

export function FactorForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar factor',
}: FactorFormProps) {
  const sectorOrg = useThemeStore((s) => s.sector)
  const trmUsd = usePestelStore((s) => s.trmUsd)
  const form = useForm<FactorSchema>({
    resolver: zodResolver(factorSchema),
    defaultValues: {
      sector: defaultValues?.sector ?? sectorOrg,
      descripcion: '',
      valorCOP: defaultValues?.valorCOP,
      ...defaultValues,
    },
  })

  const descripcion = form.watch('descripcion') ?? ''
  const tipo = form.watch('tipo')
  const sector = form.watch('sector')
  const categoria = form.watch('categoria')
  const valorCOP = form.watch('valorCOP')

  return (
    <form
      onSubmit={form.handleSubmit((values) => onSubmit(values as FactorFormValues))}
      className="grid gap-5"
      noValidate
    >
      <div>
        <Label htmlFor="sector">Sector del factor</Label>
        <Controller
          control={form.control}
          name="sector"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="sector" aria-invalid={!!form.formState.errors.sector} className="mt-1.5">
                <SelectValue placeholder="Seleccione el sector" />
              </SelectTrigger>
              <SelectContent>
                {LISTA_SECTORES.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.paleta.dark.primary }}
                        aria-hidden
                      />
                      {item.nombre}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <ErrorMsg mensaje={form.formState.errors.sector?.message} />
      </div>

      <div>
        <Label htmlFor="categoria">Categoría</Label>
        <Controller
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="categoria" aria-invalid={!!form.formState.errors.categoria} className="mt-1.5">
                <SelectValue placeholder="Seleccione un entorno PESTEL" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((cat) => {
                  const meta = CATEGORIA_META[cat]
                  const Icon = meta.icon
                  const peso = esSectorId(sector) ? SECTORES[sector].pesos[cat] : undefined
                  return (
                    <SelectItem key={cat} value={cat}>
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: meta.color }} aria-hidden />
                        <span style={{ color: meta.color }}>{cat}</span>
                        {peso != null ? (
                          <span className="text-muted-foreground">({peso}%)</span>
                        ) : null}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )}
        />
        {esSectorId(sector) && categoria ? (
          <p className="mt-1.5 text-xs text-muted-foreground">{etiquetaPeso(sector, categoria)}</p>
        ) : null}
        <ErrorMsg mensaje={form.formState.errors.categoria?.message} />
      </div>

      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          className="mt-1.5"
          maxLength={500}
          placeholder="Ej: Aumento del 20% en el precio de los fertilizantes nitrogenados"
          aria-invalid={!!form.formState.errors.descripcion}
          {...form.register('descripcion')}
        />
        <div className="mt-1 flex items-center justify-between">
          <ErrorMsg mensaje={form.formState.errors.descripcion?.message} />
          <p className={cn('ml-auto text-xs', descripcion.length > 480 ? 'text-critico' : 'text-muted-foreground')}>
            {descripcion.length}/500
          </p>
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Tipo</legend>
        <Controller
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-2 grid grid-cols-2 gap-2"
            >
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium text-foreground',
                  field.value === 'Amenaza'
                    ? 'border-critico/60 bg-critico/20 text-critico'
                    : 'glass-soft',
                )}
              >
                <RadioGroupItem value="Amenaza" id="tipo-amenaza" />
                Amenaza
              </label>
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium text-foreground',
                  field.value === 'Oportunidad'
                    ? 'border-monitorear/60 bg-monitorear/20 text-monitorear'
                    : 'glass-soft',
                )}
              >
                <RadioGroupItem value="Oportunidad" id="tipo-oportunidad" />
                Oportunidad
              </label>
            </RadioGroup>
          )}
        />
        <ErrorMsg mensaje={form.formState.errors.tipo?.message} />
      </fieldset>

      <div>
        <Label htmlFor="valorCOP">
          {tipo === 'Oportunidad' ? 'Valor que podría ganar (COP)' : 'Valor que podría perder (COP)'}
        </Label>
        <Input
          id="valorCOP"
          className="mt-1.5"
          inputMode="decimal"
          placeholder="Ej: 250000000"
          aria-invalid={!!form.formState.errors.valorCOP}
          {...form.register('valorCOP')}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Opcional. Se muestra también en dólares con la TRM de Configuración
          {typeof valorCOP === 'number' && Number.isFinite(valorCOP)
            ? ` · ${formatearUSD(copAUsd(valorCOP, trmUsd))} (TRM ${trmUsd.toLocaleString('es-CO')})`
            : ''}
          .
        </p>
        <ErrorMsg mensaje={form.formState.errors.valorCOP?.message} />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Impacto</legend>
        <Controller
          control={form.control}
          name="impacto"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-2 grid grid-cols-3 gap-2"
            >
              {IMPACTOS.map((opcion) => (
                <label
                  key={opcion}
                  className={cn(
                    'flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 py-2.5 text-sm font-medium text-foreground',
                    field.value === opcion ? 'border-primary bg-primary/25' : 'glass-soft',
                  )}
                >
                  <RadioGroupItem value={opcion} id={`impacto-${opcion}`} />
                  {opcion}
                </label>
              ))}
            </RadioGroup>
          )}
        />
        <ErrorMsg mensaje={form.formState.errors.impacto?.message} />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Plazo</legend>
        <Controller
          control={form.control}
          name="plazo"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3"
            >
              {PLAZOS.map((opcion) => (
                <label
                  key={opcion}
                  className={cn(
                    'flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 py-2.5 text-sm font-medium text-foreground',
                    field.value === opcion ? 'border-primary bg-primary/25' : 'glass-soft',
                  )}
                >
                  <RadioGroupItem value={opcion} id={`plazo-${opcion}`} />
                  {opcion.replace(' plazo', '')}
                </label>
              ))}
            </RadioGroup>
          )}
        />
        <ErrorMsg mensaje={form.formState.errors.plazo?.message} />
      </fieldset>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}
