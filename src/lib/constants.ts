import {
  CircleDollarSign,
  Cpu,
  Landmark,
  Leaf,
  Scale,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Categoria } from '@/types/pestel'

export const APP_NAME = 'Lookout'

export interface CategoriaMeta {
  icon: LucideIcon
  color: string
  bg: string
  border: string
}

export const CATEGORIA_META: Record<Categoria, CategoriaMeta> = {
  Político: {
    icon: Landmark,
    color: '#7C3AED',
    bg: '#F3E8FF',
    border: '#C4B5FD',
  },
  Económico: {
    icon: CircleDollarSign,
    color: '#E11D48',
    bg: '#FFE4E6',
    border: '#FECDD3',
  },
  Social: {
    icon: Users,
    color: '#2563EB',
    bg: '#DBEAFE',
    border: '#93C5FD',
  },
  Tecnológico: {
    icon: Cpu,
    color: '#0891B2',
    bg: '#CFFAFE',
    border: '#67E8F9',
  },
  Ecológico: {
    icon: Leaf,
    color: '#059669',
    bg: '#D1FAE5',
    border: '#6EE7B7',
  },
  Legal: {
    icon: Scale,
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FCD34D',
  },
}

export const COLOR_AMENAZA = '#E11D48'
export const COLOR_OPORTUNIDAD = '#059669'
export const COLOR_CRITICO = '#E11D48'
export const COLOR_ATENCION = '#D97706'
export const COLOR_MONITOREAR = '#059669'
