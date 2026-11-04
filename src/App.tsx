import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  AuthBootstrap,
  GuestOnly,
  RequireAdminEmpresa,
  RequireAuth,
  RequireCambioPassword,
} from '@/components/auth/AuthGate'
import { AppLayout } from '@/components/layout/AppLayout'
import { CambiarPassword } from '@/pages/CambiarPassword'
import { Configuracion } from '@/pages/Configuracion'
import { Dashboard } from '@/pages/Dashboard'
import { Informacion } from '@/pages/Informacion'
import { Login } from '@/pages/Login'
import { Registro } from '@/pages/Registro'
import { Reportes } from '@/pages/Reportes'
import { Usuarios } from '@/pages/Usuarios'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<RequireCambioPassword />}>
            <Route path="/cambiar-password" element={<CambiarPassword />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/informacion" element={<Informacion />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route element={<RequireAdminEmpresa />}>
                <Route path="/usuarios" element={<Usuarios />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </AuthBootstrap>
    </BrowserRouter>
  )
}
