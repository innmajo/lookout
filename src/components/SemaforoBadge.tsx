import { Badge } from '@/components/ui/badge'
import { calcularPrioridad } from '@/lib/prioridad'
import { SECTORES } from '@/lib/sectores'
import type { FactorPestel } from '@/types/pestel'

const VARIANTE = {
  CRÍTICO: 'critico',
  ATENCIÓN: 'atencion',
  MONITOREAR: 'monitorear',
} as const

interface SemaforoBadgeProps {
  factor: Pick<FactorPestel, 'impacto' | 'plazo' | 'sector' | 'categoria'>
  mostrarPuntaje?: boolean
}

export function SemaforoBadge({ factor, mostrarPuntaje = false }: SemaforoBadgeProps) {
  const prioridad = calcularPrioridad(factor)
  const sector = SECTORES[factor.sector]?.nombre ?? factor.sector
  return (
    <Badge
      variant={VARIANTE[prioridad.nivel]}
      title={`${prioridad.significado}. ${factor.categoria} pesa ${prioridad.peso}% en ${sector}.`}
    >
      {prioridad.nivel}
      {mostrarPuntaje ? ` · ${prioridad.puntaje}` : ''}
    </Badge>
  )
}
