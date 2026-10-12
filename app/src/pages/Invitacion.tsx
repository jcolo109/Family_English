import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Aviso, Logo, Pantalla } from '../components/ui'

const CLAVE = 'invitacion_pendiente'

export function guardarInvitacionPendiente(token: string) {
  try {
    sessionStorage.setItem(CLAVE, token)
  } catch {
    /* sin almacenamiento */
  }
}

/** Ruta a la que ir tras entrar: la invitación guardada, si la hay; si no, Mis grupos. */
export function destinoTrasAcceso(): string {
  try {
    const token = sessionStorage.getItem(CLAVE)
    if (token) {
      sessionStorage.removeItem(CLAVE)
      return `/invitacion/${token}`
    }
  } catch {
    /* sin almacenamiento */
  }
  return '/grupos'
}

/** Enlace de invitación: acepta con el token y entra en el grupo. */
export default function Invitacion() {
  const { token } = useParams<{ token: string }>()
  const { session, cargando } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cargando || !session || !token) return
    supabase.rpc('aceptar_invitacion', { p_token: token }).then(({ data, error }) => {
      if (error) setError(traducir(error.message))
      else navigate(`/g/${data as string}`, { replace: true })
    })
  }, [cargando, session, token, navigate])

  if (!cargando && !session && token) {
    guardarInvitacionPendiente(token)
    return <Navigate to="/" replace />
  }

  return (
    <Pantalla>
      <div className="flex flex-1 flex-col gap-7 px-7 pb-8 pt-14">
        <div className="flex items-center gap-3.5">
          <Logo />
          <span className="font-display text-2xl font-extrabold">Family English</span>
        </div>
        {error ? (
          <>
            <Aviso tipo="error">{error}</Aviso>
            <Link to="/grupos" className="flex h-14 items-center justify-center rounded-2xl bg-acento text-[17px] font-extrabold text-white no-underline">
              Ir a mis grupos
            </Link>
          </>
        ) : (
          <p className="m-0 text-tinta-2">Uniéndote al grupo…</p>
        )}
      </div>
    </Pantalla>
  )
}

function traducir(mensaje: string) {
  if (/otro email/i.test(mensaje)) return 'Esta invitación es para otro email. Entra con la cuenta a la que se envió.'
  if (/caducado/i.test(mensaje)) return 'La invitación ha caducado. Pide al organizador que la reenvíe.'
  if (/no encontrada/i.test(mensaje)) return 'La invitación no existe o el enlace está incompleto.'
  if (/ya no está activa/i.test(mensaje)) return 'Esta invitación ya se usó o fue cancelada.'
  return mensaje
}
