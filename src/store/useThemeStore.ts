import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Tema = 'light' | 'dark'

interface ThemeState {
  tema: Tema
  setTema: (tema: Tema) => void
}

export function aplicarTema(tema: Tema) {
  document.documentElement.dataset.theme = tema
  document.documentElement.style.colorScheme = tema
}

function temaInicial(): Tema {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      tema: temaInicial(),
      setTema: (tema) => {
        aplicarTema(tema)
        set({ tema })
      },
    }),
    {
      name: 'lookout-theme',
      onRehydrateStorage: () => (state) => {
        aplicarTema(state?.tema ?? 'dark')
      },
    },
  ),
)
