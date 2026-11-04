import { UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { mensajeErrorSupabase } from '@/lib/factoresApi'
import { ROL_ETIQUETA, ROLES_OPERATIVOS, type RolOperativo } from '@/lib/roles'
import {
  crearUsuarioEmpresa,
  listarUsuariosEmpresa,
  setUsuarioActivo,
} from '@/lib/usuariosApi'
import { useAuthStore } from '@/store/useAuthStore'
import type { PerfilRow } from '@/types/database'

const VACIO = {
  email: '',
  password: '',
  rol: 'digitador' as RolOperativo,
  nombre: '',
  apellido: '',
  cedula: '',
}

export function Usuarios() {
  const empresa = useAuthStore((s) => s.empresa)
  const miId = useAuthStore((s) => s.user?.id)
  const [usuarios, setUsuarios] = useState<PerfilRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState(VACIO)
  const [enviando, setEnviando] = useState(false)

  const recargar = useCallback(async () => {
    if (!empresa?.id) return
    setCargando(true)
    try {
      const lista = await listarUsuariosEmpresa(empresa.id)
      setUsuarios(lista)
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    } finally {
      setCargando(false)
    }
  }, [empresa?.id])

  useEffect(() => {
    void recargar()
  }, [recargar])

  async function onCrear(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      await crearUsuarioEmpresa(form)
      toast.success('Usuario creado. Entregue la contraseña temporal de forma segura.')
      setForm(VACIO)
      await recargar()
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    } finally {
      setEnviando(false)
    }
  }

  async function toggleActivo(perfil: PerfilRow) {
    if (perfil.id === miId) {
      toast.error('No puede desactivarse a usted mismo')
      return
    }
    if (perfil.rol === 'admin_empresa') {
      toast.error('No se puede desactivar al administrador de la empresa desde aquí')
      return
    }
    try {
      await setUsuarioActivo(perfil.id, !perfil.activo)
      toast.success(perfil.activo ? 'Usuario desactivado' : 'Usuario activado')
      await recargar()
    } catch (error) {
      toast.error(mensajeErrorSupabase(error))
    }
  }

  if (!empresa) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-muted-foreground">No hay empresa asociada a esta cuenta.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl text-foreground">Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {empresa.nombre} · cree usuarios de su empresa y asígneles un solo rol. La contraseña es
          temporal: al entrar deberán definir una nueva antes de usar Lookout.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo usuario</CardTitle>
          <CardDescription>
            Roles operativos: digitador, supervisor, auditor o aprobador. Un usuario = un rol.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={onCrear}>
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                required
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                required
                value={form.apellido}
                onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cedula">Cédula</Label>
              <Input
                id="cedula"
                required
                value={form.cedula}
                onChange={(e) => setForm((f) => ({ ...f, cedula: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rol">Rol</Label>
              <Select
                value={form.rol}
                onValueChange={(v) => setForm((f) => ({ ...f, rol: v as RolOperativo }))}
              >
                <SelectTrigger id="rol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_OPERATIVOS.map((rol) => (
                    <SelectItem key={rol} value={rol}>
                      {ROL_ETIQUETA[rol]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-user">Correo</Label>
              <Input
                id="email-user"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password-temp">Contraseña temporal</Label>
              <Input
                id="password-temp"
                type="text"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={enviando}>
                <UserPlus />
                {enviando ? 'Creando…' : 'Crear usuario'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipo</CardTitle>
          <CardDescription>
            {cargando ? 'Cargando…' : `${usuarios.length} usuario${usuarios.length === 1 ? '' : 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    {[u.nombre, u.apellido].filter(Boolean).join(' ') || '—'}
                  </TableCell>
                  <TableCell className="text-xs">{u.cedula || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROL_ETIQUETA[u.rol]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.activo ? 'monitorear' : 'critico'}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {u.rol !== 'admin_empresa' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void toggleActivo(u)}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
