import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mensajeErrorSupabase } from '@/lib/factoresApi'
import { useAuthStore } from '@/store/useAuthStore'

type Modo = 'entrar' | 'registrar'

export function Login() {
  const navigate = useNavigate()
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      if (modo === 'entrar') {
        await signIn(email.trim(), password)
        toast.success('Sesión iniciada')
        navigate('/dashboard', { replace: true })
      } else {
        const { needsEmailConfirmation } = await signUp(email.trim(), password)
        if (needsEmailConfirmation) {
          toast.message('Revisa tu correo para confirmar la cuenta')
          setModo('entrar')
        } else {
          toast.success('Cuenta creada')
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
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/app-icon.jpg"
              alt=""
              className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/40"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">Lookout</p>
              <p className="text-xs text-muted-foreground">Análisis PESTEL</p>
            </div>
          </div>
          <CardTitle>{modo === 'entrar' ? 'Iniciar sesión' : 'Crear cuenta'}</CardTitle>
          <CardDescription>
            Tus factores se guardan en Supabase y quedan asociados a tu usuario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? 'Espera…' : modo === 'entrar' ? 'Entrar' : 'Registrarme'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {modo === 'entrar' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-2 hover:underline"
              onClick={() => setModo(modo === 'entrar' ? 'registrar' : 'entrar')}
            >
              {modo === 'entrar' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
