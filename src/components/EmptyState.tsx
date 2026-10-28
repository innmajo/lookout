import { Radar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CardOrb, IconBubble } from '@/components/IconBubble'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  titulo: string
  descripcion: string
  accion?: boolean
}

export function EmptyState({ titulo, descripcion, accion = true }: EmptyStateProps) {
  return (
    <div className="glass relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-dashed px-6 py-16 text-center text-foreground">
      <CardOrb />
      <div className="relative mb-4">
        <IconBubble icon={Radar} className="h-14 w-14" />
      </div>
      <h2 className="text-lg text-foreground">{titulo}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{descripcion}</p>
      {accion ? (
        <Button asChild className="mt-6">
          <Link to="/registro">Registrar primer factor</Link>
        </Button>
      ) : null}
    </div>
  )
}
