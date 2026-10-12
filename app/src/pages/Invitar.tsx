import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ConGrupo, type ContextoGrupo } from '../lib/grupo'
import { CabeceraAjustes } from '../components/navegacion'
import { Aviso, Insignia, Pantalla, Volver } from '../components/ui'
import { IconoCerrar, IconoCopiar, IconoReenviar } from '../components/iconos'

type Invitacion = {
  id: string
  email: string
  token: string
  estado: 'pendiente' | 'aceptada' | 'caducada' | 'cancelada'
  caduca_el: string
  creado_el: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Invitar() {
  return <ConGrupo>{(ctx) => (ctx.esOrganizador ? <Contenido {...ctx} /> : <Navigate to={`/g/${ctx.grupo.id}`} replace />)}</ConGrupo>
}

function Contenido({ grupo, usuarioId }: ContextoGrupo) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const esNuevo = params.get('nuevo') === '1'
  const [emails, setEmails] = useState<string[]>([])
  const [texto, setTexto] = useState('')
  const [lista, setLista] = useState<Invitacion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    const { data, error } = await supabase
      .from('invitaciones')
      .select('id, email, token, estado, caduca_el, creado_el')
      .eq('grupo_id', grupo.id)
      .order('creado_el', { ascending: false })
    if (error) setError(error.message)
    else setLista((data ?? []) as Invitacion[])
  }, [grupo.id])

  useEffect(() => {
    void cargar()
  }, [cargar])

  function anadirChips(entrada: string) {
    const nuevos = entrada
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0)
    const validos = nuevos.filter((e) => EMAIL.test(e))
    const invalidos = nuevos.filter((e) => !EMAIL.test(e))
    if (validos.length > 0) setEmails((prev) => Array.from(new Set([...prev, ...validos])))
    setTexto(invalidos.join(' '))
    if (invalidos.length > 0) setError(`Email no válido: ${invalidos.join(', ')}`)
    else setError(null)
  }

  function teclaEnEmail(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      anadirChips(texto)
    } else if (e.key === 'Backspace' && texto === '' && emails.length > 0) {
      setEmails(emails.slice(0, -1))
    }
  }

  async function enviar() {
    const pendientes = texto.trim() ? [...emails, ...texto.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter((e) => EMAIL.test(e))] : emails
    if (pendientes.length === 0) {
      setError('Escribe al menos un email.')
      return
    }
    setEnviando(true)
    setError(null)
    setAviso(null)
    const { error } = await supabase.from('invitaciones').insert(pendientes.map((email) => ({ grupo_id: grupo.id, email, invitado_por: usuarioId })))
    setEnviando(false)
    if (error) {
      setError(error.message)
      return
    }
    setEmails([])
    setTexto('')
    setAviso(
      pendientes.length === 1
        ? 'Invitación creada. La persona la verá al entrar con ese email; también puedes copiarle el enlace.'
        : `${pendientes.length} invitaciones creadas. Cada persona la verá al entrar con su email; también puedes copiarles el enlace.`,
    )
    await cargar()
  }

  async function reenviar(inv: Invitacion) {
    const { error } = await supabase
      .from('invitaciones')
      .update({ estado: 'pendiente', caduca_el: new Date(Date.now() + 7 * 86_400_000).toISOString() })
      .eq('id', inv.id)
    if (error) setError(error.message)
    else await cargar()
  }

  async function cancelar(inv: Invitacion) {
    const { error } = await supabase.from('invitaciones').update({ estado: 'cancelada' }).eq('id', inv.id)
    if (error) setError(error.message)
    else await cargar()
  }

  async function copiarEnlace(inv: Invitacion) {
    const enlace = `${window.location.origin}/invitacion/${inv.token}`
    try {
      await navigator.clipboard.writeText(enlace)
      setAviso(`Enlace copiado para ${inv.email}.`)
    } catch {
      setAviso(`Enlace: ${enlace}`)
    }
  }

  const aceptadas = lista.filter((i) => i.estado === 'aceptada').length
  const estadoReal = (i: Invitacion) => (i.estado === 'pendiente' && new Date(i.caduca_el) < new Date() ? 'caducada' : i.estado)

  return (
    <Pantalla>
      {esNuevo ? (
        <header className="flex items-center gap-2 px-3 pb-2 pt-8">
          <Volver onClick={() => navigate('/grupos')} />
          <span className="text-sm font-bold text-tinta-2">{grupo.nombre} · Paso 2 de 2</span>
        </header>
      ) : (
        <CabeceraAjustes grupoId={grupo.id} nombreGrupo={grupo.nombre} titulo="Invitaciones" onVolver={() => navigate(`/g/${grupo.id}`)} />
      )}

      <div className="flex flex-1 flex-col gap-[18px] px-5 pb-7">
        {esNuevo && (
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-[30px] font-extrabold">Invita a tu grupo</h1>
            <p className="m-0 text-[15px] leading-normal text-tinta-2">Cada persona recibe un enlace de un solo uso que caduca en 7 días.</p>
          </div>
        )}

        <div className="flex flex-col gap-2.5 rounded-2xl border-2 border-acento bg-white p-3.5">
          <label htmlFor="emails" className="text-sm font-bold">
            Emails
          </label>
          <div className="flex flex-wrap gap-2">
            {emails.map((e) => (
              <span key={e} className="flex items-center gap-1.5 rounded-full bg-acento-suave py-1.5 pl-3 pr-1.5 text-sm font-bold text-[#1E2F66]">
                {e}
                <button type="button" aria-label={`Quitar ${e}`} onClick={() => setEmails(emails.filter((x) => x !== e))} className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-0 bg-[#CBD8F7] text-[#1E2F66]">
                  <IconoCerrar tamano={12} strokeWidth="3" />
                </button>
              </span>
            ))}
            <input
              id="emails"
              type="email"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={teclaEnEmail}
              onBlur={() => texto.trim() && anadirChips(texto)}
              placeholder={emails.length === 0 ? 'nombre@ejemplo.com' : 'Escribe otro email…'}
              className="h-9 min-w-[160px] flex-1 border-0 bg-transparent text-base text-tinta outline-none"
              autoComplete="off"
            />
          </div>
          <button type="button" onClick={enviar} disabled={enviando} className="h-12 cursor-pointer rounded-xl border-0 bg-acento text-base font-extrabold text-white disabled:bg-deshabilitado disabled:text-tinta-2">
            {enviando ? 'Creando…' : 'Enviar invitaciones'}
          </button>
        </div>

        {error && <Aviso tipo="error">{error}</Aviso>}
        {aviso && <Aviso tipo="ok">{aviso}</Aviso>}

        <div className="flex items-baseline justify-between">
          <h2 className="m-0 font-sans text-[13px] font-extrabold uppercase tracking-[0.6px] text-tinta-2">Invitaciones enviadas</h2>
          {lista.length > 0 && (
            <span className="text-[13px] text-tinta-2">
              {aceptadas} aceptadas de {lista.length}
            </span>
          )}
        </div>

        <div className="flex flex-col overflow-hidden rounded-2xl bg-white">
          {lista.length === 0 && <p className="m-0 p-4 text-[15px] text-tinta-2">Todavía no has invitado a nadie.</p>}
          {lista.map((inv) => {
            const estado = estadoReal(inv)
            return (
              <div key={inv.id} className="flex items-center gap-2.5 border-b border-separador px-3.5 py-3 last:border-b-0">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[15px] font-bold">{inv.email}</span>
                  <span className="flex items-center gap-2 text-[13px] text-tinta-2">
                    <Insignia tono={estado === 'aceptada' ? 'ok' : estado === 'pendiente' ? 'aviso' : 'neutro'}>
                      {estado === 'pendiente' ? 'Pendiente' : estado === 'aceptada' ? 'Aceptada' : estado === 'caducada' ? 'Caducada' : 'Cancelada'}
                    </Insignia>
                    {estado === 'pendiente' && `caduca en ${diasHasta(inv.caduca_el)}`}
                  </span>
                </div>
                {estado === 'pendiente' && (
                  <button type="button" aria-label={`Copiar enlace para ${inv.email}`} onClick={() => copiarEnlace(inv)} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-chip text-acento-oscuro">
                    <IconoCopiar tamano={18} />
                  </button>
                )}
                {(estado === 'pendiente' || estado === 'caducada' || estado === 'cancelada') && (
                  <button type="button" aria-label={`Reenviar invitación a ${inv.email}`} onClick={() => reenviar(inv)} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-chip text-acento-oscuro">
                    <IconoReenviar tamano={18} />
                  </button>
                )}
                {estado === 'pendiente' && (
                  <button type="button" aria-label={`Cancelar invitación a ${inv.email}`} onClick={() => cancelar(inv)} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-error-fondo text-error-texto">
                    <IconoCerrar tamano={16} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex-1" />
        {esNuevo && (
          <Link to={`/g/${grupo.id}`} className="flex h-14 items-center justify-center rounded-2xl bg-tinta text-[17px] font-extrabold text-white no-underline">
            Ir al grupo
          </Link>
        )}
      </div>
    </Pantalla>
  )
}

function diasHasta(fechaIso: string) {
  const dias = Math.max(0, Math.ceil((new Date(fechaIso).getTime() - Date.now()) / 86_400_000))
  return dias === 1 ? '1 día' : `${dias} días`
}
