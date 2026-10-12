import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Aviso, Insignia, Pantalla } from '../components/ui'

type Grupo = { id: string; nombre: string }
type Miembro = { id: string; grupo_id: string; rol: 'organizador' | 'jugador'; puntos_totales: number; grupo: Grupo | null }
type Invitacion = { id: string; token: string; caduca_el: string; grupo: Grupo | null }
type Posicion = { puesto: number; total: number }

export default function MisGrupos() {
  const { session } = useAuth()
  const usuario = session!.user
  const nombre = (usuario.user_metadata?.nombre_visible as string | undefined) || usuario.email || ''
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [posiciones, setPosiciones] = useState<Record<string, Posicion>>({})
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    const [m, inv] = await Promise.all([
      supabase
        .from('miembros')
        .select('id, grupo_id, rol, puntos_totales, grupo:grupos(id, nombre)')
        .eq('usuario_id', usuario.id)
        .order('alta_el'),
      supabase
        .from('invitaciones')
        .select('id, token, caduca_el, grupo:grupos(id, nombre)')
        .eq('estado', 'pendiente')
        .ilike('email', usuario.email ?? '')
        .gt('caduca_el', new Date().toISOString()),
    ])
    if (m.error || inv.error) {
      setError((m.error ?? inv.error)!.message)
      setCargando(false)
      return
    }
    setError(null)
    const lista = (m.data ?? []) as unknown as Miembro[]
    setMiembros(lista)
    setInvitaciones((inv.data ?? []) as unknown as Invitacion[])

    if (lista.length > 0) {
      const { data } = await supabase
        .from('miembros')
        .select('grupo_id, usuario_id, puntos_totales')
        .in(
          'grupo_id',
          lista.map((x) => x.grupo_id),
        )
      const porGrupo: Record<string, Posicion> = {}
      for (const g of lista) {
        const filas = (data ?? []).filter((f) => f.grupo_id === g.grupo_id).sort((a, b) => b.puntos_totales - a.puntos_totales)
        const puesto = filas.findIndex((f) => f.usuario_id === usuario.id) + 1
        porGrupo[g.grupo_id] = { puesto, total: filas.length }
      }
      setPosiciones(porGrupo)
    }
    setCargando(false)
  }, [usuario.id, usuario.email])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function responderInvitacion(token: string, aceptar: boolean) {
    const { error } = await supabase.rpc(aceptar ? 'aceptar_invitacion' : 'rechazar_invitacion', { p_token: token })
    if (error) setError(error.message)
    else void cargar()
  }

  return (
    <Pantalla>
      <header className="flex items-center justify-between px-5 pb-4 pt-10">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-tinta-2">Hola, {nombre}</span>
          <h1 className="m-0 text-[30px] font-extrabold">Mis grupos</h1>
        </div>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="min-h-11 cursor-pointer rounded-xl border-0 bg-white px-3 text-sm font-bold text-tinta-2"
        >
          Salir
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 pb-6 pt-1">
        {error && <Aviso tipo="error">{error}</Aviso>}

        {invitaciones.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h2 className="m-0 font-sans text-[13px] font-extrabold uppercase tracking-[0.6px] text-tinta-2">Invitación pendiente</h2>
            {invitaciones.map((inv) => (
              <div key={inv.id} className="flex flex-col gap-3.5 rounded-[18px] border-[1.5px] border-aviso-borde bg-aviso-fondo p-4">
                <div className="flex items-start gap-3">
                  <div aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-aviso">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5C3300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-extrabold">{inv.grupo?.nombre ?? 'Grupo'}</span>
                    <span className="text-sm leading-snug text-aviso-tinta">Te han invitado a unirte. Caduca en {diasHasta(inv.caduca_el)}.</span>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button type="button" onClick={() => responderInvitacion(inv.token, true)} className="h-[46px] flex-1 cursor-pointer rounded-xl border-0 bg-tinta text-[15px] font-extrabold text-white">
                    Aceptar
                  </button>
                  <button type="button" onClick={() => responderInvitacion(inv.token, false)} className="h-[46px] flex-1 cursor-pointer rounded-xl border-[1.5px] border-[#D9B98A] bg-transparent text-[15px] font-bold text-aviso-tinta">
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="flex flex-col gap-2.5">
          <h2 className="m-0 font-sans text-[13px] font-extrabold uppercase tracking-[0.6px] text-tinta-2">Tus grupos</h2>
          {cargando && <p className="m-0 text-tinta-2">Cargando…</p>}
          {!cargando && miembros.length === 0 && (
            <p className="m-0 rounded-[18px] bg-white p-4 text-[15px] leading-normal text-tinta-2">
              Todavía no estás en ningún grupo. Crea uno o acepta una invitación.
            </p>
          )}
          {miembros.map((m) => {
            const pos = posiciones[m.grupo_id]
            return (
              <div key={m.id} className="flex flex-col gap-3.5 rounded-[18px] bg-white p-4 shadow-[0_1px_2px_rgba(22,27,51,0.06),0_4px_16px_rgba(22,27,51,0.05)]">
                <div className="flex items-center gap-3">
                  <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-acento font-display text-lg font-extrabold text-white">
                    {iniciales(m.grupo?.nombre ?? '')}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-[17px] font-extrabold">{m.grupo?.nombre}</span>
                    <Insignia tono={m.rol === 'organizador' ? 'acento' : 'neutro'}>{m.rol === 'organizador' ? 'Organizador' : 'Jugador'}</Insignia>
                  </div>
                  {pos && (
                    <div className="flex flex-col items-end">
                      <span className="font-display text-2xl font-extrabold">{pos.puesto}º</span>
                      <span className="text-[13px] text-tinta-2">de {pos.total}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-separador pt-3 text-sm">
                  <span className="text-tinta-2">{m.puntos_totales} puntos</span>
                </div>
              </div>
            )
          })}
        </section>

        <div className="flex-1" />

        <Link
          to="/grupos/nuevo"
          className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#B9C1D6] text-base font-extrabold text-tinta no-underline"
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Crear un grupo
        </Link>
      </div>
    </Pantalla>
  )
}

function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

function diasHasta(fechaIso: string) {
  const dias = Math.max(0, Math.ceil((new Date(fechaIso).getTime() - Date.now()) / 86_400_000))
  return dias === 1 ? '1 día' : `${dias} días`
}
