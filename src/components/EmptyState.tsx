import { Radar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  titulo: string
  descripcion: string
  accion?: boolean
}

export function EmptyState({ titulo, descripcion, accion = true }: EmptyStateProps) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-2xl border-dashed px-6 py-16 text-center text-white">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-accent shadow-glow">
        <Radar className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="text-lg text-white">{titulo}</h2>
      <p className="mt-2 max-w-md text-sm text-white/80">{descripcion}</p>
      {accion ? (
        <Button asChild className="mt-6">
          <Link to="/registro">Registrar primer factor</Link>
        </Button>
      ) : null}
    </div>
  )
}
