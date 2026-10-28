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
import { useChartTheme } from '@/lib/chartTheme'
import type { SerieEntorno } from '@/lib/analytics'

interface BarrasAgrupadasProps {
  data: SerieEntorno[]
  id?: string
}

export function BarrasAgrupadas({ data, id = 'chart-barras' }: BarrasAgrupadasProps) {
  const chart = useChartTheme()

  return (
    <div id={id} className="h-[320px] w-full bg-transparent">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
          <XAxis dataKey="categoria" tick={{ fill: chart.tick, fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: chart.tick, fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              borderColor: chart.tooltipBorder,
              background: chart.tooltipBg,
              color: chart.tooltipText,
              fontFamily: 'Inter',
            }}
          />
          <Legend wrapperStyle={{ color: chart.tooltipText }} />
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
