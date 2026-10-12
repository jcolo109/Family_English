import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Aviso, Boton, Campo, Logo, Pantalla } from '../components/ui'

/** Destino del enlace de recuperación: Supabase abre sesión desde el enlace y aquí se fija la nueva contraseña. */
export default function NuevaContrasena() {
  const { session, cargando } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [repetida, setRepetida] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    if (password !== repetida) {
      setError('Las dos contraseñas no coinciden.')
      return
    }
    setEnviando(true)
    const { error } = await supabase.auth.updateUser({ password })
    setEnviando(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/grupos', { replace: true })
  }

  return (
    <Pantalla>
      <div className="flex flex-1 flex-col gap-7 px-7 pb-8 pt-14">
        <div className="flex items-center gap-3.5">
          <Logo />
          <span className="font-display text-2xl font-extrabold">Family English</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[30px] font-extrabold">Nueva contraseña</h1>
          <p className="m-0 text-[15px] leading-normal text-tinta-2">Elige una contraseña de al menos 6 caracteres.</p>
        </div>

        {!cargando && !session ? (
          <Aviso tipo="error">
            El enlace no es válido o ha caducado. Vuelve a pedir uno desde «¿Olvidaste tu contraseña?».
          </Aviso>
        ) : (
          <form className="flex flex-1 flex-col gap-4" onSubmit={guardar}>
            <Campo etiqueta="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
            <Campo etiqueta="Repite la contraseña" type="password" value={repetida} onChange={(e) => setRepetida(e.target.value)} required minLength={6} autoComplete="new-password" />
            {error && <Aviso tipo="error">{error}</Aviso>}
            <div className="flex-1" />
            <Boton type="submit" disabled={enviando || cargando}>
              {enviando ? 'Guardando…' : 'Guardar y entrar'}
            </Boton>
          </form>
        )}
      </div>
    </Pantalla>
  )
}
