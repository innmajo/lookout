import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CATEGORIA_META } from '@/lib/constants'
import type { SerieEntorno } from '@/lib/analytics'

interface DonaCategoriasProps {
  data: SerieEntorno[]
}

export function DonaCategorias({ data }: DonaCategoriasProps) {
  const dona = data.filter((d) => d.total > 0).map((d) => ({ name: d.categoria, value: d.total }))

  return (
    <div id="chart-dona" className="h-[320px] w-full bg-transparent">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dona}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={96}
            paddingAngle={2}
          >
            {dona.map((entrada) => (
              <Cell
                key={entrada.name}
                fill={CATEGORIA_META[entrada.name as keyof typeof CATEGORIA_META].color}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              borderColor: 'rgba(96,165,250,0.28)',
              background: '#0C101C',
              color: '#E8EEF7',
              fontFamily: 'Inter',
            }}
          />
          <Legend wrapperStyle={{ color: '#E8EEF7' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
