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

/**
 * Paletas bien separadas en el círculo de color (un tono por sector).
 * Antes hidro/construcción/comercio y industria/financiero se confundían.
 */
export const SECTORES: Record<SectorId, SectorMeta> = {
  agro: {
    id: 'agro',
    nombre: 'Agropecuario y agroindustria',
    pesos: { Político: 20, Económico: 20, Social: 10, Tecnológico: 12, Ecológico: 25, Legal: 13 },
    paleta: {
      // Verde lima / campo
      dark: { primary: '#22C55E', primaryDark: '#16A34A' },
      light: { primary: '#15803D', primaryDark: '#166534' },
    },
  },
  hidrocarburos: {
    id: 'hidrocarburos',
    nombre: 'Hidrocarburos y minería',
    pesos: { Político: 25, Económico: 18, Social: 8, Tecnológico: 10, Ecológico: 22, Legal: 17 },
    paleta: {
      // Ámbar / oro petróleo (no terracota)
      dark: { primary: '#F59E0B', primaryDark: '#D97706' },
      light: { primary: '#B45309', primaryDark: '#92400E' },
    },
  },
  energia: {
    id: 'energia',
    nombre: 'Energía y servicios públicos',
    pesos: { Político: 24, Económico: 16, Social: 8, Tecnológico: 12, Ecológico: 22, Legal: 18 },
    paleta: {
      // Cian eléctrico
      dark: { primary: '#06B6D4', primaryDark: '#0891B2' },
      light: { primary: '#0E7490', primaryDark: '#155E75' },
    },
  },
  industria: {
    id: 'industria',
    nombre: 'Industria manufacturera',
    pesos: { Político: 12, Económico: 24, Social: 10, Tecnológico: 18, Ecológico: 16, Legal: 20 },
    paleta: {
      // Gris acero azulado
      dark: { primary: '#64748B', primaryDark: '#475569' },
      light: { primary: '#475569', primaryDark: '#334155' },
    },
  },
  construccion: {
    id: 'construccion',
    nombre: 'Construcción e infraestructura',
    pesos: { Político: 18, Económico: 28, Social: 10, Tecnológico: 10, Ecológico: 12, Legal: 22 },
    paleta: {
      // Rojo ladrillo
      dark: { primary: '#EF4444', primaryDark: '#DC2626' },
      light: { primary: '#B91C1C', primaryDark: '#991B1B' },
    },
  },
  comercio: {
    id: 'comercio',
    nombre: 'Comercio, turismo y consumo',
    pesos: { Político: 12, Económico: 24, Social: 22, Tecnológico: 14, Ecológico: 10, Legal: 18 },
    paleta: {
      // Fucsia / magenta (bien lejos del rojo)
      dark: { primary: '#EC4899', primaryDark: '#DB2777' },
      light: { primary: '#BE185D', primaryDark: '#9D174D' },
    },
  },
  financiero: {
    id: 'financiero',
    nombre: 'Servicios financieros',
    pesos: { Político: 15, Económico: 22, Social: 10, Tecnológico: 20, Ecológico: 5, Legal: 28 },
    paleta: {
      // Azul royal
      dark: { primary: '#3B82F6', primaryDark: '#2563EB' },
      light: { primary: '#1D4ED8', primaryDark: '#1E40AF' },
    },
  },
  tic: {
    id: 'tic',
    nombre: 'TIC y conocimiento',
    pesos: { Político: 12, Económico: 18, Social: 15, Tecnológico: 32, Ecológico: 5, Legal: 18 },
    paleta: {
      // Violeta
      dark: { primary: '#A855F7', primaryDark: '#9333EA' },
      light: { primary: '#7E22CE', primaryDark: '#6B21A8' },
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
    // En claro se refuerza el glow para que el cambio de sector se note de inmediato
    root.style.setProperty('--border', rgbPrimary)
    root.style.setProperty('--border-alpha', '0.35')
    root.style.setProperty('--glass-border', hexToRgba(primary, 0.28))
    root.style.setProperty('--shell-glow-1', hexToRgba(primary, 0.42))
    root.style.setProperty('--shell-glow-2', hexToRgba(primary, 0.28))
    root.style.setProperty('--shell-glow-3', hexToRgba(primary, 0.2))
    root.style.setProperty('--chart-grid', hexToRgba(primary, 0.22))
    root.style.setProperty('--tooltip-border', hexToRgba(primary, 0.35))
  }
}
