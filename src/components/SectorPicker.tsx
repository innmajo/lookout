import { CATEGORIAS } from '@/types/pestel'
import { LISTA_SECTORES, SECTORES, type SectorId } from '@/lib/sectores'
import { cn } from '@/lib/utils'

export function SectorPicker({
  value,
  onChange,
}: {
  value: SectorId
  onChange: (sector: SectorId) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Sector de la organización">
      {LISTA_SECTORES.map((sector) => {
        const activo = value === sector.id
        const dominante = [...CATEGORIAS].sort((a, b) => sector.pesos[b] - sector.pesos[a])[0]
        return (
          <button
            key={sector.id}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onChange(sector.id)}
            className={cn(
              'flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition',
              activo ? 'border-primary bg-primary/15 shadow-glow' : 'glass-soft hover:bg-foreground/5',
            )}
          >
            <span
              className="mt-1 h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: sector.paleta.dark.primary }}
              aria-hidden
            />
            <span>
              <span className="block text-sm font-medium text-foreground">{sector.nombre}</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                Mayor peso: {dominante} {sector.pesos[dominante]}%
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function TablaPesos({ sectorActivo }: { sectorActivo: SectorId }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Sector</th>
            {CATEGORIAS.map((cat) => (
              <th key={cat} className="px-2 py-2 text-center font-medium" title={cat}>
                {cat.slice(0, 1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LISTA_SECTORES.map((sector) => {
            const activo = sector.id === sectorActivo
            return (
              <tr
                key={sector.id}
                className={cn('border-b border-border', activo && 'bg-primary/10')}
              >
                <td className="px-3 py-2 font-medium text-foreground">{sector.nombre}</td>
                {CATEGORIAS.map((cat) => (
                  <td key={cat} className="px-2 py-2 text-center tabular-nums">
                    {sector.pesos[cat]}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        Pesos de {SECTORES[sectorActivo].nombre}. La fila activa pinta el color de la app; cada
        factor usa los pesos de su propio sector para el semáforo.
      </p>
    </div>
  )
}
