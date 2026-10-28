import { z } from 'zod'
import { SECTOR_IDS } from '@/lib/sectores'
import { CATEGORIAS, IMPACTOS, PLAZOS, TIPOS } from '@/types/pestel'

export const factorSchema = z.object({
  sector: z.enum(SECTOR_IDS, {
    errorMap: () => ({ message: 'Seleccione un sector' }),
  }),
  categoria: z.enum(CATEGORIAS, {
    errorMap: () => ({ message: 'Seleccione una categoría' }),
  }),
  descripcion: z
    .string({ required_error: 'La descripción es obligatoria' })
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede superar 500 caracteres'),
  tipo: z.enum(TIPOS, {
    errorMap: () => ({ message: 'Seleccione si es amenaza u oportunidad' }),
  }),
  impacto: z.enum(IMPACTOS, {
    errorMap: () => ({ message: 'Seleccione el nivel de impacto' }),
  }),
  plazo: z.enum(PLAZOS, {
    errorMap: () => ({ message: 'Seleccione el plazo' }),
  }),
  valorCOP: z.preprocess((valor) => {
    if (valor === '' || valor === null || valor === undefined) return undefined
    const n = typeof valor === 'number' ? valor : Number(String(valor).replaceAll(',', '.'))
    return Number.isFinite(n) ? n : valor
  }, z.number({ invalid_type_error: 'Ingrese un valor numérico' }).nonnegative('El valor no puede ser negativo').optional()),
})

export type FactorSchema = z.infer<typeof factorSchema>
