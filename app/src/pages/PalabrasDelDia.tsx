import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ConGrupo, fechaCorta, fechaLocal, type ContextoGrupo, type Palabra } from '../lib/grupo'
import { CabeceraSimple } from '../components/navegacion'
import { Aviso, Pantalla } from '../components/ui'

export default function PalabrasDelDia() {
  return <ConGrupo>{(ctx) => <Contenido {...ctx} />}</ConGrupo>
}

function Contenido({ grupo }: ContextoGrupo) {
  const hoy = fechaLocal(grupo.zona_horaria)
  const [palabras, setPalabras] = useState<Palabra[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [indice, setIndice] = useState(0)
  const [volteada, setVolteada] = useState(false)
  const [sabidas, setSabidas] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase
      .from('palabras')
      .select('id, ingles, espanol, ejemplo, categoria, orden, estado, fecha_asignacion')
      .eq('grupo_id', grupo.id)
      .eq('fecha_asignacion', hoy)
      .order('orden')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setPalabras((data ?? []) as Palabra[])
      })
  }, [grupo.id, hoy])

  const total = palabras?.length ?? 0
  const palabra = palabras?.[indice]

  function siguiente() {
    setIndice((i) => (i + 1) % Math.max(total, 1))
    setVolteada(false)
  }
  function meLaSe() {
    if (palabra) setSabidas((s) => new Set(s).add(palabra.id))
    siguiente()
  }

  return (
    <Pantalla>
      <CabeceraSimple
        volverA={`/g/${grupo.id}`}
        etiquetaVolver="Volver al inicio"
        titulo="Palabras del día"
        subtitulo={`${fechaCorta(hoy)} · las mismas para todo el grupo`}
        accion={
          <Link to={`/g/${grupo.id}/repaso`} className="flex min-h-11 items-center px-2 text-sm font-extrabold text-acento no-underline">
            Repaso
          </Link>
        }
      />

      <div className="flex flex-1 flex-col gap-4 px-5 pb-7 pt-2">
        {error && <Aviso tipo="error">{error}</Aviso>}
        {palabras === null && !error && <p className="m-0 text-tinta-2">Cargando…</p>}

        {palabras !== null && total === 0 && (
          <Aviso tipo="info">Hoy no hay palabras repartidas en este grupo. Vuelve mañana o pide al organizador que añada vocabulario.</Aviso>
        )}

        {palabra && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {palabras!.map((p, j) => (
                  <span
                    key={p.id}
                    className={`h-2 rounded-full transition-all ${j === indice ? 'w-7 bg-acento' : sabidas.has(p.id) ? 'w-2 bg-ok' : 'w-2 bg-borde'}`}
                  />
                ))}
              </div>
              <span className="text-[13px] font-bold text-tinta-2">
                {indice + 1} de {total} · {sabidas.size} sabidas
              </span>
            </div>

            <button
              type="button"
              onClick={() => setVolteada((v) => !v)}
              aria-label="Voltear tarjeta"
              className={`flex flex-1 cursor-pointer flex-col gap-3 rounded-[28px] p-6 text-left font-sans transition-colors ${
                volteada
                  ? 'border-0 bg-acento text-white shadow-[0_12px_32px_rgba(22,27,51,0.18)]'
                  : 'border-[1.5px] border-borde-suave bg-white text-tinta shadow-[0_12px_32px_rgba(22,27,51,0.08)]'
              }`}
            >
              <span className={`self-start rounded-full px-2.5 py-1 text-xs font-extrabold tracking-[0.3px] ${volteada ? 'bg-white/20 text-white' : 'bg-acento-suave text-acento-oscuro'}`}>
                {volteada ? 'ESPAÑOL' : 'INGLÉS'}
                {palabra.categoria ? ` · ${palabra.categoria}` : ''}
              </span>
              <span className="flex flex-1 flex-col justify-center gap-2.5">
                {!volteada ? (
                  <>
                    <span className="font-display text-[40px] font-extrabold leading-[1.05]">{palabra.ingles}</span>
                    <span className="text-[15px] text-tinta-2">Piensa la traducción y toca para comprobar</span>
                  </>
                ) : (
                  <>
                    <span className="font-display text-[40px] font-extrabold leading-[1.05]">{palabra.espanol}</span>
                    <span className="text-lg font-bold opacity-90">{palabra.ingles}</span>
                    {palabra.ejemplo && <span className="text-[15px] italic leading-snug opacity-90">“{palabra.ejemplo}”</span>}
                  </>
                )}
              </span>
              <span className={`text-[13px] font-bold ${volteada ? 'text-white/80' : 'text-tinta-2'}`}>Toca para voltear</span>
            </button>

            <div className="flex gap-2.5">
              <button type="button" onClick={siguiente} className="h-[52px] flex-1 cursor-pointer rounded-2xl border-2 border-borde bg-white text-[15px] font-extrabold text-tinta">
                Repasar otra vez
              </button>
              <button type="button" onClick={meLaSe} className="h-[52px] flex-1 cursor-pointer rounded-2xl border-0 bg-ok-fondo text-[15px] font-extrabold text-ok-texto">
                Me la sé
              </button>
            </div>
            <Link to={`/g/${grupo.id}/examen`} className="flex h-14 items-center justify-center rounded-2xl bg-acento text-[17px] font-extrabold text-white no-underline">
              Ir al examen
            </Link>
          </>
        )}
      </div>
    </Pantalla>
  )
}
