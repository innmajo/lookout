import { Building2, ClipboardList, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { TablaPesos } from '@/components/SectorPicker'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { mensajeErrorSupabase } from '@/lib/factoresApi'
import { ROL_ETIQUETA } from '@/lib/roles'
import { LISTA_SECTORES, SECTORES, type SectorId } from '@/lib/sectores'
import {
  fetchMetricasSistema,
  listarEmpresasSistema,
  listarUsuariosSistema,
  type MetricasSistema,
  type UsuarioSistema,
} from '@/lib/sistemaApi'
import { useThemeStore } from '@/store/useThemeStore'
import type { EmpresaRow } from '@/types/database'

export function DashboardSistema() {
  const sector = useThemeStore((s) => s.sector)
  const setSector = useThemeStore((s) => s.setSector)
  const [metricas, setMetricas] = useState<MetricasSistema | null>(null)
  const [empresas, setEmpresas] = useState<EmpresaRow[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    void Promise.all([fetchMetricasSistema(), listarEmpresasSistema(), listarUsuariosSistema()])
      .then(([m, e, u]) => {
        if (cancelado) return
        setMetricas(m)
        setEmpresas(e)
        setUsuarios(u)
      })
      .catch((error) => {
        if (!cancelado) toast.error(mensajeErrorSupabase(error))
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl text-foreground">Administración del sistema</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestione la plataforma: métricas globales, empresas, usuarios y pesos PESTEL. No participa
          en el flujo de registros de las empresas.
        </p>
      </header>

      <section aria-label="Métricas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi titulo="Empresas" valor={metricas?.empresas} icono={Building2} cargando={cargando} />
        <Kpi titulo="Usuarios" valor={metricas?.usuarios} icono={Users} cargando={cargando} />
        <Kpi
          titulo="Usuarios activos"
          valor={metricas?.usuariosActivos}
          icono={Users}
          cargando={cargando}
        />
        <Kpi
          titulo="Factores"
          valor={metricas?.factores}
          icono={ClipboardList}
          cargando={cargando}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Parámetros PESTEL (pesos por sector)</CardTitle>
          <CardDescription>
            Valores de referencia de la plataforma. Puede previsualizar el color de cada sector
            (claro/oscuro con el interruptor del menú).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-1.5">
            <p className="text-xs text-muted-foreground">Previsualizar paleta</p>
            <Select value={sector} onValueChange={(v) => setSector(v as SectorId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LISTA_SECTORES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TablaPesos sectorActivo={sector} soloActivo={false} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empresas</CardTitle>
          <CardDescription>
            {cargando ? 'Cargando…' : `${empresas.length} registrada${empresas.length === 1 ? '' : 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>NIT</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.length === 0 && !cargando ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No hay empresas registradas.
                  </TableCell>
                </TableRow>
              ) : (
                empresas.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.nombre}</TableCell>
                    <TableCell className="text-xs">{e.nit}</TableCell>
                    <TableCell className="text-xs">
                      {SECTORES[e.sector]?.nombre ?? e.sector}
                    </TableCell>
                    <TableCell className="text-xs">{e.ciudad ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={e.activa ? 'monitorear' : 'critico'}>
                        {e.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del sistema</CardTitle>
          <CardDescription>
            {cargando
              ? 'Cargando…'
              : `${usuarios.length} usuario${usuarios.length === 1 ? '' : 's'} en todas las empresas`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.length === 0 && !cargando ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No hay usuarios.
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      {[u.nombre, u.apellido].filter(Boolean).join(' ') || '—'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {u.rol === 'sistema' ? '—' : (u.empresa_nombre ?? '—')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROL_ETIQUETA[u.rol]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.activo ? 'monitorear' : 'critico'}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Kpi({
  titulo,
  valor,
  icono: Icon,
  cargando,
}: {
  titulo: string
  valor: number | undefined
  icono: typeof Users
  cargando: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="rounded-xl bg-primary/15 p-2 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{titulo}</p>
          <p className="text-xl font-semibold text-foreground">
            {cargando || valor == null ? '—' : valor}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
