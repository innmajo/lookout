import { z } from 'zod'
import { CATEGORIAS, IMPACTOS, PLAZOS, TIPOS } from '@/types/pestel'

export const factorSchema = z.object({
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
})

export type FactorSchema = z.infer<typeof factorSchema>
