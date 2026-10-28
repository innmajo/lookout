import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Configuracion } from '@/pages/Configuracion'
import { Dashboard } from '@/pages/Dashboard'
import { Informacion } from '@/pages/Informacion'
import { Registro } from '@/pages/Registro'
import { Reportes } from '@/pages/Reportes'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/informacion" element={<Informacion />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
