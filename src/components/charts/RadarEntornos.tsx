import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { COLOR_AMENAZA, COLOR_OPORTUNIDAD } from '@/lib/constants'
import { useChartTheme } from '@/lib/chartTheme'
import type { SerieEntorno } from '@/lib/analytics'

interface RadarEntornosProps {
  data: SerieEntorno[]
  id?: string
}

export function RadarEntornos({ data, id = 'chart-radar' }: RadarEntornosProps) {
  const chart = useChartTheme()

  return (
    <div id={id} className="h-[320px] w-full bg-transparent">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke={chart.grid} />
          <PolarAngleAxis dataKey="categoria" tick={{ fill: chart.tick, fontSize: 12 }} />
          <PolarRadiusAxis allowDecimals={false} tick={{ fill: chart.tick, fontSize: 10 }} />
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
          <Radar
            name="Amenazas"
            dataKey="amenazas"
            stroke={COLOR_AMENAZA}
            fill={COLOR_AMENAZA}
            fillOpacity={0.35}
          />
          <Radar
            name="Oportunidades"
            dataKey="oportunidades"
            stroke={COLOR_OPORTUNIDAD}
            fill={COLOR_OPORTUNIDAD}
            fillOpacity={0.28}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
