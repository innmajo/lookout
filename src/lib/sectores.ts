import type { Categoria } from '@/types/pestel'

export const SECTOR_IDS = [
  'agro',
  'hidrocarburos',
  'energia',
  'industria',
  'construccion',
  'comercio',
  'financiero',
  'tic',
] as const

export type SectorId = (typeof SECTOR_IDS)[number]

export const PESO_MEDIO = 100 / 6

export type PesosPestel = Record<Categoria, number>

export interface PaletaSector {
  primary: string
  primaryDark: string
}

export interface SectorMeta {
  id: SectorId
  nombre: string
  pesos: PesosPestel
  paleta: { dark: PaletaSector; light: PaletaSector }
}

export const SECTORES: Record<SectorId, SectorMeta> = {
  agro: {
    id: 'agro',
    nombre: 'Agropecuario y agroindustria',
    pesos: { Político: 20, Económico: 20, Social: 10, Tecnológico: 12, Ecológico: 25, Legal: 13 },
    paleta: {
      dark: { primary: '#4A7C59', primaryDark: '#3D6B4C' },
      light: { primary: '#3F6F4E', primaryDark: '#345C41' },
    },
  },
  hidrocarburos: {
    id: 'hidrocarburos',
    nombre: 'Hidrocarburos y minería',
    pesos: { Político: 25, Económico: 18, Social: 8, Tecnológico: 10, Ecológico: 22, Legal: 17 },
    paleta: {
      dark: { primary: '#C17A3A', primaryDark: '#A8662E' },
      light: { primary: '#A8662E', primaryDark: '#8F5526' },
    },
  },
  energia: {
    id: 'energia',
    nombre: 'Energía y servicios públicos',
    pesos: { Político: 24, Económico: 16, Social: 8, Tecnológico: 12, Ecológico: 22, Legal: 18 },
    paleta: {
      dark: { primary: '#0E9AA7', primaryDark: '#0C838E' },
      light: { primary: '#0C7F8A', primaryDark: '#0A6B74' },
    },
  },
  industria: {
    id: 'industria',
    nombre: 'Industria manufacturera',
    pesos: { Político: 12, Económico: 24, Social: 10, Tecnológico: 18, Ecológico: 16, Legal: 20 },
    paleta: {
      dark: { primary: '#3D5A80', primaryDark: '#334C6C' },
      light: { primary: '#334C6C', primaryDark: '#2A3F59' },
    },
  },
  construccion: {
    id: 'construccion',
    nombre: 'Construcción e infraestructura',
    pesos: { Político: 18, Económico: 28, Social: 10, Tecnológico: 10, Ecológico: 12, Legal: 22 },
    paleta: {
      dark: { primary: '#C25B3A', primaryDark: '#A64D31' },
      light: { primary: '#A64D31', primaryDark: '#8C4129' },
    },
  },
  comercio: {
    id: 'comercio',
    nombre: 'Comercio, turismo y consumo',
    pesos: { Político: 12, Económico: 24, Social: 22, Tecnológico: 14, Ecológico: 10, Legal: 18 },
    paleta: {
      dark: { primary: '#D4674A', primaryDark: '#B8573E' },
      light: { primary: '#B8573E', primaryDark: '#9C4A34' },
    },
  },
  financiero: {
    id: 'financiero',
    nombre: 'Servicios financieros',
    pesos: { Político: 15, Económico: 22, Social: 10, Tecnológico: 20, Ecológico: 5, Legal: 28 },
    paleta: {
      dark: { primary: '#1E4B7A', primaryDark: '#173C62' },
      light: { primary: '#1A4270', primaryDark: '#143456' },
    },
  },
  tic: {
    id: 'tic',
    nombre: 'TIC y conocimiento',
    pesos: { Político: 12, Económico: 18, Social: 15, Tecnológico: 32, Ecológico: 5, Legal: 18 },
    paleta: {
      dark: { primary: '#6D5CE8', primaryDark: '#5B4BD1' },
      light: { primary: '#5B4BD1', primaryDark: '#4C3EB8' },
    },
  },
}

export const LISTA_SECTORES = SECTOR_IDS.map((id) => SECTORES[id])

export function esSectorId(valor: string | undefined): valor is SectorId {
  return !!valor && (SECTOR_IDS as readonly string[]).includes(valor)
}

export function pesoCategoria(sector: SectorId, categoria: Categoria): number {
  return SECTORES[sector].pesos[categoria]
}

function hexToRgb(hex: string): string {
  const n = hex.replace('#', '')
  return `${parseInt(n.slice(0, 2), 16)} ${parseInt(n.slice(2, 4), 16)} ${parseInt(n.slice(4, 6), 16)}`
}

function hexToRgba(hex: string, alpha: number): string {
  return `rgba(${hexToRgb(hex).replaceAll(' ', ', ')}, ${alpha})`
}

export function aplicarPaletaSector(tema: 'light' | 'dark', sector: SectorId) {
  const root = document.documentElement
  const { primary, primaryDark } = SECTORES[sector].paleta[tema]
  const rgbPrimary = hexToRgb(primary)
  const rgbDark = hexToRgb(primaryDark)

  root.style.setProperty('--primary', rgbPrimary)
  root.style.setProperty('--primary-dark', rgbDark)
  root.style.setProperty('--accent', rgbPrimary)
  root.style.setProperty('--ring', rgbPrimary)

  if (tema === 'dark') {
    root.style.setProperty('--border', rgbPrimary)
    root.style.setProperty('--border-alpha', '0.22')
    root.style.setProperty('--glass-border', hexToRgba(primary, 0.22))
    root.style.setProperty('--shell-glow-1', hexToRgba(primary, 0.24))
    root.style.setProperty('--shell-glow-2', hexToRgba(primaryDark, 0.16))
    root.style.setProperty('--shell-glow-3', hexToRgba(primary, 0.12))
    root.style.setProperty('--chart-grid', hexToRgba(primary, 0.16))
    root.style.setProperty('--tooltip-border', hexToRgba(primary, 0.28))
  } else {
    root.style.setProperty('--border', '203 213 225')
    root.style.setProperty('--border-alpha', '0.9')
    root.style.setProperty('--glass-border', 'rgba(226, 232, 240, 0.95)')
    root.style.setProperty('--shell-glow-1', hexToRgba(primary, 0.34))
    root.style.setProperty('--shell-glow-2', hexToRgba(primary, 0.22))
    root.style.setProperty('--shell-glow-3', hexToRgba(primary, 0.16))
    root.style.setProperty('--chart-grid', 'rgba(148, 163, 184, 0.28)')
    root.style.setProperty('--tooltip-border', 'rgba(203, 213, 225, 0.9)')
  }
}
