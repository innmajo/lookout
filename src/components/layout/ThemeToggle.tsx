import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/useThemeStore'

export function ThemeToggle({ className }: { className?: string }) {
  const tema = useThemeStore((s) => s.tema)
  const setTema = useThemeStore((s) => s.setTema)

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-2xl bg-[#1b1d24] p-1 shadow-lg ring-1 ring-white/10',
        className,
      )}
      role="group"
      aria-label="Tema de la interfaz"
    >
      <button
        type="button"
        aria-label="Tema claro"
        aria-pressed={tema === 'light'}
        onClick={() => setTema('light')}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors',
          tema === 'light' && 'bg-white/15 text-white',
        )}
      >
        <Sun className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Tema oscuro"
        aria-pressed={tema === 'dark'}
        onClick={() => setTema('dark')}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors',
          tema === 'dark' && 'bg-white/15 text-white',
        )}
      >
        <Moon className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
