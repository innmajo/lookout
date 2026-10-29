import { Check, Circle, Eye, EyeOff, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ThemeBubbles, ThemeContentFigures } from '@/components/layout/ThemeBubbles'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mensajeErrorSupabase } from '@/lib/factoresApi'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { aplicarApariencia, useThemeStore } from '@/store/useThemeStore'

type Modo = 'entrar' | 'registrar'

const REGLAS_PASSWORD = [
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

function evaluarPassword(password: string) {
  return REGLAS_PASSWORD.map((regla) => ({
    id: regla.id,
    label: regla.label,
    ok: regla.ok(password),
  }))
}

const EMPRESA_VACIA = {
  nombreEmpresa: '',
  nit: '',
  responsableNombre: '',
  responsableApellido: '',
  responsableCedula: '',
  direccion: '',
  ciudad: '',
}

export function Login() {
  const navigate = useNavigate()
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)
  const tema = useThemeStore((s) => s.tema)
  const sector = useThemeStore((s) => s.sector)
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [empresa, setEmpresa] = useState(EMPRESA_VACIA)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const checklist = useMemo(() => evaluarPassword(password), [password])
  const passwordValida = checklist.every((regla) => regla.ok)

  useEffect(() => {
    aplicarApariencia(tema, sector)
  }, [tema, sector])

  function setCampoEmpresa(campo: keyof typeof EMPRESA_VACIA, valor: string) {
    setEmpresa((prev) => ({ ...prev, [campo]: valor }))
  }

  function cambiarModo(siguiente: Modo) {
    setModo(siguiente)
    setPassword('')
    setMostrarPassword(false)
    if (siguiente === 'entrar') setEmpresa(EMPRESA_VACIA)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (modo === 'registrar' && !passwordValida) {
      toast.error('La contraseña no cumple los requisitos')
      return
    }

    setEnviando(true)
    try {
      if (modo === 'entrar') {
        await signIn(email.trim(), password)
        toast.success('Sesión iniciada')
        navigate('/dashboard', { replace: true })
      } else {
        const { needsEmailConfirmation } = await signUp(email.trim(), password, empresa)
        if (needsEmailConfirmation) {
          toast.message('Revisa tu correo para confirmar la cuenta')
          cambiarModo('entrar')
        } else {
          toast.success('Empresa registrada')
          navigate('/dashboard', { replace: true })
        }
      }
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

      <div className="relative z-10 w-full max-w-lg">
        <ThemeContentFigures />

        <Card className="relative">
          <span
            className="pointer-events-none absolute -left-10 -top-12 h-28 w-28 rounded-full bg-primary/30 blur-2xl"
            aria-hidden
          />
          <CardHeader className="relative space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/app-icon.jpg"
                alt=""
                className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/40 shadow-glow"
              />
              <div className="leading-tight">
                <p className="text-[15px] font-semibold text-foreground">Lookout</p>
                <p className="text-[11px] text-muted-foreground">Análisis PESTEL</p>
              </div>
            </div>
            <CardTitle className="text-xl">
              {modo === 'entrar' ? 'Iniciar sesión' : 'Registrar empresa'}
            </CardTitle>
          </CardHeader>

          <CardContent className="relative">
            <form className="space-y-4" onSubmit={onSubmit}>
              {modo === 'registrar' ? (
                <>
                  <div className="space-y-3">
                    <p className="section-title">Empresa</p>
                    <div className="space-y-1.5">
                      <Label htmlFor="nombreEmpresa">Nombre de la empresa</Label>
                      <Input
                        id="nombreEmpresa"
                        required
                        value={empresa.nombreEmpresa}
                        onChange={(e) => setCampoEmpresa('nombreEmpresa', e.target.value)}
                        placeholder="Razón social o nombre comercial"
                        autoComplete="organization"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nit">NIT</Label>
                      <Input
                        id="nit"
                        required
                        value={empresa.nit}
                        onChange={(e) => setCampoEmpresa('nit', e.target.value)}
                        placeholder="Número de identificación tributaria"
                        inputMode="numeric"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="section-title">Responsable</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="responsableNombre">Nombre</Label>
                        <Input
                          id="responsableNombre"
                          required
                          value={empresa.responsableNombre}
                          onChange={(e) => setCampoEmpresa('responsableNombre', e.target.value)}
                          placeholder="Nombre"
                          autoComplete="given-name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="responsableApellido">Apellido</Label>
                        <Input
                          id="responsableApellido"
                          required
                          value={empresa.responsableApellido}
                          onChange={(e) => setCampoEmpresa('responsableApellido', e.target.value)}
                          placeholder="Apellido"
                          autoComplete="family-name"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="responsableCedula">Cédula</Label>
                      <Input
                        id="responsableCedula"
                        required
                        value={empresa.responsableCedula}
                        onChange={(e) => setCampoEmpresa('responsableCedula', e.target.value)}
                        placeholder="Número de documento"
                        inputMode="numeric"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="direccion">Dirección</Label>
                      <Input
                        id="direccion"
                        required
                        value={empresa.direccion}
                        onChange={(e) => setCampoEmpresa('direccion', e.target.value)}
                        placeholder="Dirección de la empresa"
                        autoComplete="street-address"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ciudad">Ciudad</Label>
                      <Input
                        id="ciudad"
                        required
                        value={empresa.ciudad}
                        onChange={(e) => setCampoEmpresa('ciudad', e.target.value)}
                        placeholder="Ciudad"
                        autoComplete="address-level2"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="section-title">Acceso</p>
                  </div>
                </>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={mostrarPassword ? 'text' : 'password'}
                    autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                    required
                    minLength={modo === 'registrar' ? 6 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    placeholder={modo === 'registrar' ? 'Crea una contraseña segura' : 'Tu contraseña'}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
                    onClick={() => setMostrarPassword((v) => !v)}
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={mostrarPassword}
                  >
                    {mostrarPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>

                {modo === 'registrar' ? (
                  <ul className="mt-2 space-y-1.5" aria-live="polite">
                    {checklist.map((regla) => (
                      <li
                        key={regla.id}
                        className={cn(
                          'flex items-center gap-2 text-xs transition-colors',
                          regla.ok ? 'text-emerald-400' : 'text-muted-foreground',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-full',
                            regla.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-foreground/5',
                          )}
                          aria-hidden
                        >
                          {regla.ok ? (
                            <Check className="h-3 w-3" />
                          ) : password.length > 0 ? (
                            <X className="h-3 w-3 opacity-70" />
                          ) : (
                            <Circle className="h-2.5 w-2.5 opacity-50" />
                          )}
                        </span>
                        {regla.label}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={enviando || (modo === 'registrar' && !passwordValida)}
              >
                {enviando
                  ? 'Espera…'
                  : modo === 'entrar'
                    ? 'Entrar'
                    : 'Registrar empresa'}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {modo === 'entrar' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button
                type="button"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={() => cambiarModo(modo === 'entrar' ? 'registrar' : 'entrar')}
              >
                {modo === 'entrar' ? 'Registra tu empresa' : 'Inicia sesión'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
