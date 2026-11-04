import { Check, Circle, Eye, EyeOff, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ThemeBubbles, ThemeContentFigures } from '@/components/layout/ThemeBubbles'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mensajeErrorSupabase } from '@/lib/factoresApi'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

const REGLAS = [
  {
    id: 'largo',
    label: 'Al menos 6 caracteres',
    ok: (password: string) => password.length >= 6,
  },
  {
    id: 'numeros',
    label: 'Al menos 2 números',
    ok: (password: string) => (password.match(/\d/g) ?? []).length >= 2,
  },
  {
    id: 'signo',
    label: 'Al menos 1 signo (!@#$%…)',
    ok: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const

export function CambiarPassword() {
  const navigate = useNavigate()
  const cambiarPassword = useAuthStore((s) => s.cambiarPassword)
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const checklist = useMemo(
    () => REGLAS.map((r) => ({ ...r, ok: r.ok(password) })),
    [password],
  )
  const valida = checklist.every((r) => r.ok) && password === confirmacion && password.length > 0

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valida) {
      toast.error('La contraseña no cumple los requisitos o no coincide')
      return
    }
    setEnviando(true)
    try {
      await cambiarPassword(password)
      toast.success('Contraseña actualizada')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="app-shell relative flex min-h-svh items-center justify-center px-4 py-10">
      <ThemeBubbles />
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <ThemeContentFigures />
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Actualice su contraseña</CardTitle>
            <CardDescription>
              Su administrador le asignó una contraseña temporal. Defina una nueva para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="nueva">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="nueva"
                    type={mostrar ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground"
                    onClick={() => setMostrar((v) => !v)}
                    aria-label={mostrar ? 'Ocultar' : 'Mostrar'}
                  >
                    {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {checklist.map((regla) => (
                    <li
                      key={regla.id}
                      className={cn(
                        'flex items-center gap-2 text-xs',
                        regla.ok ? 'text-emerald-400' : 'text-muted-foreground',
                      )}
                    >
                      {regla.ok ? (
                        <Check className="h-3 w-3" />
                      ) : password.length > 0 ? (
                        <X className="h-3 w-3 opacity-70" />
                      ) : (
                        <Circle className="h-2.5 w-2.5 opacity-50" />
                      )}
                      {regla.label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirmar contraseña</Label>
                <Input
                  id="confirm"
                  type={mostrar ? 'text' : 'password'}
                  required
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                  autoComplete="new-password"
                />
                {confirmacion && confirmacion !== password ? (
                  <p className="text-xs text-critico">Las contraseñas no coinciden</p>
                ) : null}
              </div>
              <Button type="submit" className="w-full" disabled={enviando || !valida}>
                {enviando ? 'Guardando…' : 'Guardar y continuar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
