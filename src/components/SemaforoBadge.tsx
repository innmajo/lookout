import { Badge } from '@/components/ui/badge'
import { calcularPrioridad } from '@/lib/prioridad'
import type { FactorPestel } from '@/types/pestel'

const VARIANTE = {
  CRÍTICO: 'critico',
  ATENCIÓN: 'atencion',
  MONITOREAR: 'monitorear',
} as const

interface SemaforoBadgeProps {
  factor: Pick<FactorPestel, 'impacto' | 'plazo'>
  mostrarPuntaje?: boolean
}

export function SemaforoBadge({ factor, mostrarPuntaje = false }: SemaforoBadgeProps) {
  const prioridad = calcularPrioridad(factor)
  return (
    <Badge variant={VARIANTE[prioridad.nivel]} title={prioridad.significado}>
      {prioridad.nivel}
      {mostrarPuntaje ? ` · ${prioridad.puntaje}` : ''}
    </Badge>
  )
}
