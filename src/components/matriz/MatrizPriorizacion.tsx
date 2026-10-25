import { useState } from 'react'
import { SemaforoBadge } from '@/components/SemaforoBadge'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { celdasMatriz, type CeldaMatriz } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { IMPACTOS, PLAZOS, type FactorPestel } from '@/types/pestel'

interface MatrizPriorizacionProps {
  factores: FactorPestel[]
}

export function MatrizPriorizacion({ factores }: MatrizPriorizacionProps) {
  const celdas = celdasMatriz(factores)
  const [activa, setActiva] = useState<CeldaMatriz | null>(null)

  return (
    <>
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[520px] grid-cols-[88px_repeat(3,1fr)] gap-2"
          role="grid"
          aria-label="Matriz de priorización impacto por plazo"
        >
          <div />
          {PLAZOS.map((plazo) => (
            <div key={plazo} className="section-title px-1 text-center">
              {plazo}
            </div>
          ))}
          {IMPACTOS.map((impacto) => (
            <div key={impacto} className="contents">
              <div className="flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {impacto}
              </div>
              {PLAZOS.map((plazo) => {
                const celda = celdas.find((c) => c.impacto === impacto && c.plazo === plazo)
                if (!celda) return null
                const esCritica = celda.nivel === 'CRÍTICO'
                const tiene = celda.factores.length > 0
                return (
                  <button
                    key={`${impacto}-${plazo}`}
                    type="button"
                    role="gridcell"
                    onClick={() => setActiva(celda)}
                    className={cn(
                      'min-h-[92px] rounded-xl border p-3 text-left transition hover:brightness-95',
                      esCritica && tiene && 'animate-pulse-ring border-2 border-critico',
                    )}
                    style={{
                      backgroundColor: `${celda.color}18`,
                      borderColor: esCritica && tiene ? undefined : `${celda.color}66`,
                    }}
                  >
                    <p className="text-2xl font-bold" style={{ color: celda.color }}>
                      {celda.factores.length}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: celda.color }}>
                      {celda.nivel}
                    </p>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!activa} onOpenChange={(open) => !open && setActiva(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activa ? `${activa.impacto} × ${activa.plazo}` : 'Factores'}
            </DialogTitle>
            <DialogDescription>
              {activa
                ? `Nivel ${activa.nivel}. ${activa.factores.length} factor${activa.factores.length === 1 ? '' : 'es'} en esta celda.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {activa && activa.factores.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay factores en esta combinación.</p>
          ) : (
            <ul className="space-y-3">
              {activa?.factores.map((factor) => (
                <li key={factor.id} className="glass-soft rounded-xl p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{factor.categoria}</Badge>
                    <Badge variant={factor.tipo === 'Amenaza' ? 'amenaza' : 'oportunidad'}>
                      {factor.tipo}
                    </Badge>
                    <SemaforoBadge factor={factor} />
                  </div>
                  <p className="text-sm text-foreground">{factor.descripcion}</p>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
