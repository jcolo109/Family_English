import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ConGrupo, fechaLarga, fechaLocal, ordinal, type ContextoGrupo, type Palabra } from '../lib/grupo'
import { BarraInferior } from '../components/navegacion'
import { Aviso, Pantalla } from '../components/ui'
import { IconoAviso, IconoChevronAbajo, IconoChevronDerecha, IconoEngranaje } from '../components/iconos'

type FilaRanking = { id: string; usuario_id: string; puntos_totales: number; alta_el: string; perfil: { nombre_visible: string } | null }
type ExamenHoy = { id: string; puntos: number; completado_el: string | null }

export default function InicioGrupo() {
  return <ConGrupo>{(ctx) => <Contenido {...ctx} />}</ConGrupo>
}

function Contenido({ grupo, miembro, esOrganizador, usuarioId }: ContextoGrupo) {
  const hoy = fechaLocal(grupo.zona_horaria)
  const [palabras, setPalabras] = useState<Palabra[]>([])
  const [ranking, setRanking] = useState<FilaRanking[]>([])
  const [examen, setExamen] = useState<ExamenHoy | null>(null)
  const [sinAsignar, setSinAsignar] = useState<number | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    // Reparto bajo demanda: si hoy aún no hay palabras asignadas, las asigna (idempotente).
    await supabase.rpc('reparto_hoy', { p_grupo: grupo.id })

    const [p, r, e, s] = await Promise.all([
      supabase
        .from('palabras')
        .select('id, ingles, espanol, ejemplo, categoria, orden, estado, fecha_asignacion')
        .eq('grupo_id', grupo.id)
        .eq('fecha_asignacion', hoy)
        .order('orden'),
      supabase.from('miembros').select('id, usuario_id, puntos_totales, alta_el, perfil:perfiles(nombre_visible)').eq('grupo_id', grupo.id),
      supabase.from('examenes').select('id, puntos, completado_el').eq('miembro_id', miembro.id).eq('fecha_juego', hoy).maybeSingle(),
      esOrganizador
        ? supabase.from('palabras').select('id', { count: 'exact', head: true }).eq('grupo_id', grupo.id).eq('estado', 'sin_asignar')
        : Promise.resolve({ count: null, error: null }),
    ])
    const fallo = p.error ?? r.error ?? e.error ?? s.error
    if (fallo) {
      setError(fallo.message)
      setCargando(false)
      return
    }
    setPalabras((p.data ?? []) as Palabra[])
    const filas = ((r.data ?? []) as unknown as FilaRanking[]).sort(
      (a, b) => b.puntos_totales - a.puntos_totales || a.alta_el.localeCompare(b.alta_el),
    )
    setRanking(filas)
    setExamen((e.data as ExamenHoy | null) ?? null)
    setSinAsignar(s.count ?? null)
    setCargando(false)
  }, [grupo.id, miembro.id, hoy, esOrganizador])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const miPuesto = ranking.findIndex((f) => f.usuario_id === usuarioId) + 1
  const top = ranking.slice(0, 3)
  const hecho = examen?.completado_el != null
  const hayPalabras = palabras.length > 0
  const medallas = ['bg-[#F5C542] text-[#4D3900]', 'bg-[#C9CFDB] text-[#2A3045]', 'bg-[#E0A47A] text-[#4A2408]']

  return (
    <Pantalla>
      <header className="flex items-center justify-between py-1.5 pl-5 pr-4 pt-7">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-tinta-2">{fechaLarga(grupo.zona_horaria)}</span>
          <Link to="/grupos" className="flex min-h-11 items-center gap-1 font-display text-[26px] font-extrabold text-tinta no-underline">
            {grupo.nombre}
            <IconoChevronAbajo tamano={20} />
          </Link>
        </div>
        {esOrganizador && (
          <Link to={`/g/${grupo.id}/vocabulario`} aria-label="Ajustes del grupo" className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-tinta">
            <IconoEngranaje />
          </Link>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-3.5 px-4 pb-3.5 pt-1.5">
        {error && <Aviso tipo="error">{error}</Aviso>}

        <section className={`flex flex-col gap-3.5 rounded-[22px] p-[18px] text-white ${hecho ? 'bg-tinta' : 'bg-acento'}`}>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="self-start rounded-full bg-white/20 px-2.5 py-[3px] text-xs font-extrabold tracking-[0.3px]">
                {hecho ? 'HECHO' : hayPalabras ? 'PENDIENTE' : 'SIN PALABRAS'}
              </span>
              <h2 className="m-0 mt-1 text-2xl font-extrabold">Examen de hoy</h2>
              <span className="text-[15px] opacity-90">
                {hecho ? 'Ya has sumado tus puntos de hoy' : hayPalabras ? '10 preguntas · unos 2 minutos' : 'Hoy no hay palabras nuevas'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-display text-[30px] font-extrabold leading-none">{hecho ? `+${examen!.puntos}` : '+10'}</span>
              <span className="text-xs opacity-90">{hecho ? 'pts de hoy' : 'pts posibles'}</span>
            </div>
          </div>
          {hecho ? (
            <Link to={`/g/${grupo.id}/resultado`} className="flex h-[50px] items-center justify-center rounded-[14px] bg-white text-base font-extrabold text-tinta no-underline">
              Ver resultado
            </Link>
          ) : hayPalabras ? (
            <Link to={`/g/${grupo.id}/examen`} className="flex h-[50px] items-center justify-center rounded-[14px] bg-white text-base font-extrabold text-tinta no-underline">
              Empezar examen
            </Link>
          ) : (
            <p className="m-0 text-sm leading-snug opacity-90">
              {esOrganizador ? 'Añade palabras al vocabulario y se repartirán al momento.' : 'El organizador tiene que añadir más palabras.'}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="m-0 font-sans text-base font-extrabold">Tus {palabras.length || 5} palabras de hoy</h2>
            {hayPalabras && (
              <Link to={`/g/${grupo.id}/palabras`} className="flex min-h-11 items-center text-sm font-extrabold text-acento no-underline">
                Estudiar
              </Link>
            )}
          </div>
          {cargando ? (
            <p className="m-0 text-sm text-tinta-2">Cargando…</p>
          ) : hayPalabras ? (
            <div className="flex flex-wrap gap-2">
              {palabras.map((p) => (
                <span key={p.id} className="rounded-[10px] bg-chip px-3 py-2 text-[15px] font-bold">
                  {p.ingles}
                </span>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm text-tinta-2">Todavía no se han repartido palabras hoy.</p>
          )}
        </section>

        <section className="flex flex-col gap-1 rounded-[20px] bg-white px-4 pb-2 pt-3.5">
          <div className="flex items-center justify-between">
            <h2 className="m-0 font-sans text-base font-extrabold">Clasificación</h2>
            <Link to={`/g/${grupo.id}/ranking`} className="flex min-h-11 items-center text-sm font-extrabold text-acento no-underline">
              Ver todo
            </Link>
          </div>
          {top.map((f, i) => {
            const soyYo = f.usuario_id === usuarioId
            return (
              <div key={f.id} className={`flex items-center gap-3 rounded-xl p-2 ${soyYo ? 'bg-acento-fondo' : ''}`}>
                <span aria-hidden="true" className={`flex h-[30px] w-[30px] items-center justify-center rounded-full text-sm font-extrabold ${medallas[i]}`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-[15px] font-bold">
                  {f.perfil?.nombre_visible ?? 'Jugador'}
                  {soyYo ? ' (tú)' : ''}
                </span>
                <span className="font-display text-[17px] font-extrabold">{f.puntos_totales}</span>
              </div>
            )
          })}
          {miPuesto > 3 && (
            <div className="flex items-center gap-3 rounded-xl bg-acento-fondo p-2">
              <span aria-hidden="true" className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-chip text-sm font-extrabold text-tinta-3">
                {miPuesto}
              </span>
              <span className="flex-1 text-[15px] font-bold">Tú · {ordinal(miPuesto)} de {ranking.length}</span>
              <span className="font-display text-[17px] font-extrabold">{miembro.puntos_totales}</span>
            </div>
          )}
        </section>

        {esOrganizador && sinAsignar !== null && sinAsignar < 10 && (
          <Link
            to={`/g/${grupo.id}/vocabulario`}
            className="flex items-center gap-3 rounded-2xl border-[1.5px] border-aviso-borde bg-aviso-fondo px-3.5 py-3 text-aviso-tinta no-underline"
          >
            <IconoAviso className="shrink-0 text-aviso-texto" />
            <span className="flex-1 text-sm leading-snug">
              <strong>{sinAsignar === 0 ? 'No quedan palabras sin asignar.' : `Quedan ${sinAsignar} palabras sin asignar.`}</strong>{' '}
              {sinAsignar === 0 ? 'Añade más o mañana no habrá examen.' : 'Añade más para los próximos días.'}
            </span>
            <IconoChevronDerecha tamano={18} />
          </Link>
        )}
      </div>

      <BarraInferior grupoId={grupo.id} />
    </Pantalla>
  )
}
