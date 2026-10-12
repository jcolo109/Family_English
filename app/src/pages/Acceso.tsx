import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Aviso, Boton, Campo, Logo, Pantalla } from '../components/ui'

type Modo = 'login' | 'register' | 'recover'

export default function Acceso() {
  const { session, cargando } = useAuth()
  const navigate = useNavigate()
  const [modo, setModo] = useState<Modo>('login')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!cargando && session) return <Navigate to="/grupos" replace />

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo)
    setError(null)
    setAviso(null)
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setAviso(null)
    setEnviando(true)
    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/grupos', { replace: true })
      } else if (modo === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre_visible: nombre.trim() } },
        })
        if (error) throw error
        if (data.session) navigate('/grupos', { replace: true })
        else setAviso('Cuenta creada. Revisa tu email para confirmarla y después inicia sesión.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/nueva-contrasena`,
        })
        if (error) throw error
        setAviso('Enlace enviado. Revisa tu bandeja de entrada.')
      }
    } catch (err) {
      setError(traducirError(err))
    } finally {
      setEnviando(false)
    }
  }

  const pestana = (activa: boolean) =>
    `flex-1 h-11 rounded-[10px] border-0 text-[15px] font-bold cursor-pointer ${
      activa ? 'bg-white text-tinta shadow-[0_1px_3px_rgba(22,27,51,0.14)]' : 'bg-transparent text-tinta-2'
    }`

  return (
    <Pantalla>
      <div className="flex flex-1 flex-col gap-7 px-7 pb-8 pt-14">
        <div className="flex items-center gap-3.5">
          <Logo />
          <span className="font-display text-2xl font-extrabold">Family English</span>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="m-0 text-[34px] font-extrabold leading-[1.08] tracking-[-0.5px]">
            Cinco palabras al día. Todo el grupo jugando.
          </h1>
          <p className="m-0 text-base leading-normal text-tinta-2">
            Estudia, haz tu examen de dos minutos y sube en la clasificación de tu grupo.
          </p>
        </div>

        {modo !== 'recover' ? (
          <div role="tablist" className="flex gap-1 rounded-[14px] bg-[#E6E9F2] p-1">
            <button type="button" role="tab" aria-selected={modo === 'login'} className={pestana(modo === 'login')} onClick={() => cambiarModo('login')}>
              Iniciar sesión
            </button>
            <button type="button" role="tab" aria-selected={modo === 'register'} className={pestana(modo === 'register')} onClick={() => cambiarModo('register')}>
              Crear cuenta
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <h2 className="m-0 text-[22px] font-extrabold">Recuperar contraseña</h2>
            <p className="m-0 text-[15px] leading-normal text-tinta-2">Te enviaremos un enlace a tu email para crear una nueva.</p>
          </div>
        )}

        <form className="flex flex-1 flex-col gap-4" onSubmit={enviar}>
          {modo === 'register' && (
            <Campo
              etiqueta="Nombre visible"
              type="text"
              placeholder="Cómo te verá tu grupo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              minLength={2}
              maxLength={40}
              autoComplete="nickname"
            />
          )}
          <Campo
            etiqueta="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
          />
          {modo !== 'recover' && (
            <Campo
              etiqueta="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            />
          )}

          {modo === 'login' && (
            <div className="-mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => cambiarModo('recover')}
                className="min-h-11 cursor-pointer border-0 bg-transparent px-1 text-[15px] font-bold text-acento"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {error && <Aviso tipo="error">{error}</Aviso>}
          {aviso && <Aviso tipo="ok">{aviso}</Aviso>}

          <div className="flex-1" />

          {modo !== 'recover' ? (
            <Boton type="submit" disabled={enviando}>
              {enviando ? 'Un momento…' : modo === 'register' ? 'Crear cuenta' : 'Entrar'}
            </Boton>
          ) : (
            <div className="flex flex-col gap-2">
              <Boton type="submit" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar enlace'}
              </Boton>
              <Boton variante="texto" onClick={() => cambiarModo('login')}>
                Volver a iniciar sesión
              </Boton>
            </div>
          )}

          <p className="m-0 text-center text-[13px] leading-normal text-tinta-2">
            Solo guardamos tu email, tu nombre visible y tus resultados.
          </p>
        </form>
      </div>
    </Pantalla>
  )
}

function traducirError(err: unknown): string {
  const mensaje = err instanceof Error ? err.message : String(err)
  if (/invalid login credentials/i.test(mensaje)) return 'Email o contraseña incorrectos.'
  if (/email not confirmed/i.test(mensaje)) return 'Confirma tu email antes de entrar. Revisa tu bandeja de entrada.'
  if (/already registered/i.test(mensaje)) return 'Ya existe una cuenta con ese email.'
  if (/password should be at least/i.test(mensaje)) return 'La contraseña debe tener al menos 6 caracteres.'
  if (/rate limit/i.test(mensaje)) return 'Demasiados intentos. Espera un momento y vuelve a probar.'
  if (/failed to fetch|network/i.test(mensaje)) return 'No hay conexión con el servidor. Comprueba tu red.'
  return mensaje
}
