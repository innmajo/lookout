import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function IconBubble({
  icon: Icono,
  tono = 'tema',
  className,
}: {
  icon: LucideIcon
  tono?: 'tema' | 'critico' | 'ok'
  className?: string
}) {
  return (
    <div
      className={cn(
        'icon-bubble',
        tono === 'critico' && 'icon-bubble-critico',
        tono === 'ok' && 'icon-bubble-ok',
        className,
      )}
    >
      <Icono className="h-5 w-5" aria-hidden />
    </div>
  )
}

export function CardOrb({ tono = 'tema' }: { tono?: 'tema' | 'critico' | 'ok' }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl',
        tono === 'tema' && 'bg-primary/30',
        tono === 'critico' && 'bg-critico/30',
        tono === 'ok' && 'bg-monitorear/30',
      )}
      aria-hidden
    />
  )
}
