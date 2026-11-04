import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { aplicarPaletaSector, esSectorId, type SectorId } from '@/lib/sectores'

export type Tema = 'light' | 'dark'

interface ThemeState {
  tema: Tema
  sector: SectorId
  sectorFijo: boolean
  setTema: (tema: Tema) => void
  /** Solo para hidratar desde la empresa. No usar en UI de configuración. */
  setSectorFijo: (sector: SectorId) => void
}

export function aplicarApariencia(tema: Tema, sector: SectorId) {
  document.documentElement.dataset.theme = tema
  document.documentElement.dataset.sector = sector
  document.documentElement.style.colorScheme = tema
  aplicarPaletaSector(tema, sector)
}

function aparienciaInicial(): { tema: Tema; sector: SectorId } {
  if (typeof document === 'undefined') return { tema: 'dark', sector: 'agro' }
  const tema = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  const sectorRaw = document.documentElement.dataset.sector
  const sector = esSectorId(sectorRaw) ? sectorRaw : 'agro'
  return { tema, sector }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => {
      const inicial = aparienciaInicial()
      return {
        tema: inicial.tema,
        sector: inicial.sector,
        sectorFijo: false,
        setTema: (tema) => {
          aplicarApariencia(tema, get().sector)
          set({ tema })
        },
        setSectorFijo: (sector) => {
          aplicarApariencia(get().tema, sector)
          set({ sector, sectorFijo: true })
        },
      }
    },
    {
      name: 'lookout-theme',
      partialize: (state) => ({ tema: state.tema, sector: state.sector, sectorFijo: state.sectorFijo }),
      onRehydrateStorage: () => (state) => {
        aplicarApariencia(state?.tema ?? 'dark', state?.sector ?? 'agro')
      },
    },
  ),
)
