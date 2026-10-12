import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './lib/auth'
import Acceso from './pages/Acceso'
import NuevaContrasena from './pages/NuevaContrasena'
import MisGrupos from './pages/MisGrupos'
import CrearGrupo from './pages/CrearGrupo'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Acceso />} />
      <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
      <Route
        path="/grupos"
        element={
          <RequireAuth>
            <MisGrupos />
          </RequireAuth>
        }
      />
      <Route
        path="/grupos/nuevo"
        element={
          <RequireAuth>
            <CrearGrupo />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
