import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { RequireAuth } from './lib/auth'
import Acceso from './pages/Acceso'
import NuevaContrasena from './pages/NuevaContrasena'
import MisGrupos from './pages/MisGrupos'
import CrearGrupo from './pages/CrearGrupo'
import Invitar from './pages/Invitar'
import Invitacion from './pages/Invitacion'
import InicioGrupo from './pages/InicioGrupo'
import PalabrasDelDia from './pages/PalabrasDelDia'
import Vocabulario from './pages/Vocabulario'
import Proximamente from './pages/Proximamente'

const privada = (elemento: ReactNode) => <RequireAuth>{elemento}</RequireAuth>

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Acceso />} />
      <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
      <Route path="/invitacion/:token" element={<Invitacion />} />

      <Route path="/grupos" element={privada(<MisGrupos />)} />
      <Route path="/grupos/nuevo" element={privada(<CrearGrupo />)} />
      <Route path="/perfil" element={privada(<Proximamente titulo="Perfil" />)} />

      <Route path="/g/:id" element={privada(<InicioGrupo />)} />
      <Route path="/g/:id/palabras" element={privada(<PalabrasDelDia />)} />
      <Route path="/g/:id/invitar" element={privada(<Invitar />)} />
      <Route path="/g/:id/vocabulario" element={privada(<Vocabulario />)} />
      <Route path="/g/:id/miembros" element={privada(<Proximamente titulo="Miembros" />)} />
      <Route path="/g/:id/examen" element={privada(<Proximamente titulo="Examen" />)} />
      <Route path="/g/:id/resultado" element={privada(<Proximamente titulo="Resultado" />)} />
      <Route path="/g/:id/ranking" element={privada(<Proximamente titulo="Clasificación" />)} />
      <Route path="/g/:id/repaso" element={privada(<Proximamente titulo="Repaso" />)} />
      <Route path="/g/:id/historial" element={privada(<Proximamente titulo="Mi historial" />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
