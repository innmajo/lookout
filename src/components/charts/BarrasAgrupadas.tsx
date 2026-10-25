import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { COLOR_AMENAZA, COLOR_OPORTUNIDAD } from '@/lib/constants'
import type { SerieEntorno } from '@/lib/analytics'

interface BarrasAgrupadasProps {
  data: SerieEntorno[]
  id?: string
}

export function BarrasAgrupadas({ data, id = 'chart-barras' }: BarrasAgrupadasProps) {
  return (
    <div id={id} className="h-[320px] w-full bg-transparent">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,0.16)" />
          <XAxis dataKey="categoria" tick={{ fill: '#8B9CB3', fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: '#8B9CB3', fontSize: 12 }} />
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
          <Bar dataKey="amenazas" name="Amenazas" fill={COLOR_AMENAZA} radius={[6, 6, 0, 0]} />
          <Bar
            dataKey="oportunidades"
            name="Oportunidades"
            fill={COLOR_OPORTUNIDAD}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
