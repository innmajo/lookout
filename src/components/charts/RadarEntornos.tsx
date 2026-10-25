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
import type { SerieEntorno } from '@/lib/analytics'

interface RadarEntornosProps {
  data: SerieEntorno[]
  id?: string
}

export function RadarEntornos({ data, id = 'chart-radar' }: RadarEntornosProps) {
  return (
    <div id={id} className="h-[320px] w-full bg-transparent">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(96,165,250,0.2)" />
          <PolarAngleAxis dataKey="categoria" tick={{ fill: '#8B9CB3', fontSize: 12 }} />
          <PolarRadiusAxis allowDecimals={false} tick={{ fill: '#8B9CB3', fontSize: 10 }} />
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
