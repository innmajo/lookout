import { BarChart3, CircleHelp, ClipboardList, FileText, LogOut, Menu, Settings, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { ThemeBubbles, ThemeContentFigures } from '@/components/layout/ThemeBubbles'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { mensajeErrorSupabase } from '@/lib/factoresApi'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { usePestelStore } from '@/store/usePestelStore'
import { aplicarApariencia, useThemeStore } from '@/store/useThemeStore'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/registro', label: 'Registro', icon: ClipboardList },
  { to: '/reportes', label: 'Reportes', icon: FileText },
  { to: '/informacion', label: 'Información', icon: CircleHelp },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
        <img
        src="/app-icon.jpg"
        alt="Lookout"
        className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/40 shadow-glow"
      />
      <div className="leading-tight">
        <p className="text-[15px] font-semibold text-foreground">Lookout</p>
        <p className="text-[11px] text-sidebar-muted">Análisis PESTEL</p>
      </div>
    </div>
  )
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/20 text-foreground shadow-glow'
                  : 'text-sidebar-muted hover:bg-foreground/5 hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

function CuentaSidebar() {
  const email = useAuthStore((s) => s.user?.email)
  const signOut = useAuthStore((s) => s.signOut)

  async function cerrarSesion() {
    try {
      await signOut()
      toast.success('Sesión cerrada')
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    }
  }

  return (
    <div className="space-y-2">
      {email ? (
        <p className="truncate text-[11px] text-sidebar-muted" title={email}>
          {email}
        </p>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start gap-2 px-2 text-sidebar-muted"
        onClick={() => void cerrarSesion()}
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        Cerrar sesión
      </Button>
      <p className="text-[11px] leading-relaxed text-sidebar-muted">
        Los datos se sincronizan con Supabase.
      </p>
    </div>
  )
}

export function AppLayout() {
  const [abierto, setAbierto] = useState(false)
  const hayEjemplos = usePestelStore((s) => s.factores.some((f) => f.esEjemplo))
  const syncError = usePestelStore((s) => s.error)
  const tema = useThemeStore((s) => s.tema)
  const sector = useThemeStore((s) => s.sector)

  useEffect(() => {
    aplicarApariencia(tema, sector)
  }, [tema, sector])

  return (
    <div className="app-shell lg:flex">
      <ThemeBubbles />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
      >
        Saltar al contenido
      </a>

      <aside className="glass hidden h-svh w-64 shrink-0 flex-col rounded-none border-y-0 border-l-0 p-5 lg:sticky lg:top-0 lg:flex">
        <Logo />
        <div className="mt-8 flex-1">
          <NavItems />
        </div>
        <div className="space-y-3">
          <ThemeToggle />
          <CuentaSidebar />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="glass sticky top-0 z-40 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 lg:hidden">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              className="rounded-lg p-2 text-foreground hover:bg-foreground/10"
              aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={abierto}
              onClick={() => setAbierto((v) => !v)}
            >
              {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {abierto ? (
          <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setAbierto(false)}>
            <aside
              className="glass flex h-full w-72 flex-col rounded-none border-y-0 border-l-0 p-5 pt-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1">
                <NavItems onNavigate={() => setAbierto(false)} />
              </div>
              <CuentaSidebar />
            </aside>
          </div>
        ) : null}

        <main id="contenido" className="relative min-w-0 px-4 py-6 lg:px-8 lg:py-8">
          <ThemeContentFigures />
          {syncError ? (
            <div
              role="alert"
              className="glass relative mb-6 rounded-xl px-4 py-3 text-sm text-critico"
            >
              No se pudieron sincronizar los datos: {syncError}
            </div>
          ) : null}
          {hayEjemplos ? (
            <div
              role="status"
              className="glass relative mb-6 overflow-hidden rounded-xl px-4 py-3 text-sm text-accent"
            >
              <span className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full bg-primary/35 blur-2xl" aria-hidden />
              Está viendo <strong className="text-foreground">datos de ejemplo</strong>. Puede editarlos,
              eliminarlos o cargarlos de nuevo desde Configuración.
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
