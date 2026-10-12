import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from './supabase'
import { Pantalla } from '../components/ui'

type EstadoAuth = {
  session: Session | null
  cargando: boolean
}

const AuthContext = createContext<EstadoAuth>({ session: null, cargando: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCargando(false)
    })
    const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion)
    })
    return () => suscripcion.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ session, cargando }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <Pantalla>
        <p className="m-auto text-tinta-2">Cargando…</p>
      </Pantalla>
    )
  }
  if (!session) return <Navigate to="/" replace state={{ desde: location.pathname }} />
  return <>{children}</>
}
