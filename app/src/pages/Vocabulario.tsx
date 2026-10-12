import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ConGrupo, fechaCorta, type ContextoGrupo, type Palabra } from '../lib/grupo'
import { CabeceraAjustes } from '../components/navegacion'
import { Aviso, Boton, Campo, Insignia, Pantalla } from '../components/ui'
import { IconoAviso, IconoLapiz, IconoMas, IconoSubir } from '../components/iconos'

type Filtro = 'todas' | 'sin_asignar' | 'asignada' | 'archivada'
type Nueva = { ingles: string; espanol: string; ejemplo: string; categoria: string }

const VACIA: Nueva = { ingles: '', espanol: '', ejemplo: '', categoria: '' }

export default function Vocabulario() {
  return <ConGrupo>{(ctx) => (ctx.esOrganizador ? <Contenido {...ctx} /> : <Navigate to={`/g/${ctx.grupo.id}`} replace />)}</ConGrupo>
}

function Contenido({ grupo }: ContextoGrupo) {
  const navigate = useNavigate()
  const [palabras, setPalabras] = useState<Palabra[]>([])
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nueva, setNueva] = useState<Nueva>(VACIA)
  const [editando, setEditando] = useState<Palabra | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const archivoRef = useRef<HTMLInputElement>(null)

  const cargar = useCallback(async () => {
    const { data, error } = await supabase
      .from('palabras')
      .select('id, ingles, espanol, ejemplo, categoria, orden, estado, fecha_asignacion')
      .eq('grupo_id', grupo.id)
      .order('estado')
      .order('orden')
    if (error) setError(error.message)
    else setPalabras((data ?? []) as Palabra[])
  }, [grupo.id])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const cuenta = {
    todas: palabras.length,
    sin_asignar: palabras.filter((p) => p.estado === 'sin_asignar').length,
    asignada: palabras.filter((p) => p.estado === 'asignada').length,
    archivada: palabras.filter((p) => p.estado === 'archivada').length,
  }
  const visibles = palabras
    .filter((p) => filtro === 'todas' || p.estado === filtro)
    .sort((a, b) => orden(a) - orden(b) || (a.estado === 'asignada' ? b.orden - a.orden : a.orden - b.orden))

  async function anadir(lista: Nueva[]) {
    setError(null)
    setAviso(null)
    setEnviando(true)
    const { data, error } = await supabase.rpc('anadir_palabras', { p_grupo: grupo.id, p_palabras: lista })
    setEnviando(false)
    if (error) {
      setError(error.message)
      return false
    }
    const n = Number(data ?? 0)
    setAviso(n === 1 ? 'Palabra añadida.' : `${n} palabras añadidas.`)
    await cargar()
    return true
  }

  async function guardarNueva(e: FormEvent) {
    e.preventDefault()
    if (await anadir([nueva])) {
      setNueva(VACIA)
      setMostrarForm(false)
    }
  }

  async function guardarEdicion(e: FormEvent) {
    e.preventDefault()
    if (!editando) return
    setEnviando(true)
    const { error } = await supabase
      .from('palabras')
      .update({
        ingles: editando.ingles.trim(),
        espanol: editando.espanol.trim(),
        ejemplo: editando.ejemplo?.trim() || null,
        categoria: editando.categoria?.trim() || null,
      })
      .eq('id', editando.id)
    setEnviando(false)
    if (error) setError(error.message)
    else {
      setEditando(null)
      await cargar()
    }
  }

  async function archivar(p: Palabra) {
    const { error } = await supabase.from('palabras').update({ estado: 'archivada' }).eq('id', p.id)
    if (error) setError(error.message)
    else {
      setEditando(null)
      await cargar()
    }
  }

  async function importarCsv(archivo: File) {
    const texto = await archivo.text()
    const filas = parsearCsv(texto)
    if (filas.length === 0) {
      setError('No se ha encontrado ninguna fila con inglés y español. Formato esperado: inglés, español, ejemplo (opcional), categoría (opcional).')
      return
    }
    await anadir(filas)
    if (archivoRef.current) archivoRef.current.value = ''
  }

  const chip = (activo: boolean) =>
    `min-h-9 cursor-pointer rounded-full px-3 text-[13px] font-extrabold ${activo ? 'border-0 bg-tinta text-white' : 'border-[1.5px] border-borde bg-white text-tinta-3'}`

  return (
    <Pantalla>
      <CabeceraAjustes grupoId={grupo.id} nombreGrupo={grupo.nombre} titulo="Vocabulario" onVolver={() => navigate(`/g/${grupo.id}`)} />

      <div className="flex flex-1 flex-col gap-3.5 px-4 pb-7">
        {cuenta.sin_asignar < 10 && (
          <div className="flex gap-3 rounded-2xl border-[1.5px] border-aviso-borde bg-aviso-fondo px-3.5 py-3 text-sm leading-snug text-aviso-tinta">
            <IconoAviso className="shrink-0 text-aviso-texto" />
            <span>
              <strong>{cuenta.sin_asignar === 0 ? 'No queda ninguna palabra sin asignar.' : `Quedan ${cuenta.sin_asignar} sin asignar.`}</strong>{' '}
              {cuenta.sin_asignar === 0
                ? 'Añade palabras para que haya examen.'
                : `Alcanzan para ${Math.ceil(cuenta.sin_asignar / 5)} ${Math.ceil(cuenta.sin_asignar / 5) === 1 ? 'día' : 'días'}. Añade más para no quedaros sin examen.`}
            </span>
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              setMostrarForm((v) => !v)
              setEditando(null)
            }}
            className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-acento text-[15px] font-extrabold text-white"
          >
            <IconoMas tamano={18} /> Añadir palabra
          </button>
          <button
            type="button"
            onClick={() => archivoRef.current?.click()}
            className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-borde bg-white text-[15px] font-extrabold text-tinta"
          >
            <IconoSubir tamano={18} /> Importar CSV
          </button>
          <input
            ref={archivoRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importarCsv(f)
            }}
          />
        </div>

        {error && <Aviso tipo="error">{error}</Aviso>}
        {aviso && <Aviso tipo="ok">{aviso}</Aviso>}

        {mostrarForm && (
          <form onSubmit={guardarNueva} className="flex flex-col gap-3 rounded-2xl border-2 border-acento bg-white p-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <Campo etiqueta="Inglés" value={nueva.ingles} onChange={(e) => setNueva({ ...nueva, ingles: e.target.value })} placeholder="to whisper" required autoFocus />
              <Campo etiqueta="Español" value={nueva.espanol} onChange={(e) => setNueva({ ...nueva, espanol: e.target.value })} placeholder="susurrar" required />
            </div>
            <Campo etiqueta="Ejemplo (opcional)" value={nueva.ejemplo} onChange={(e) => setNueva({ ...nueva, ejemplo: e.target.value })} placeholder="Don't whisper in class." />
            <Campo etiqueta="Categoría (opcional)" value={nueva.categoria} onChange={(e) => setNueva({ ...nueva, categoria: e.target.value })} placeholder="Verbos" />
            <div className="flex gap-2.5">
              <Boton variante="secundario" className="h-12 flex-1 text-[15px]" onClick={() => setMostrarForm(false)}>
                Cancelar
              </Boton>
              <Boton type="submit" className="h-12 flex-1 text-[15px]" disabled={enviando}>
                Guardar
              </Boton>
            </div>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          {(
            [
              ['todas', 'Todas'],
              ['sin_asignar', 'Sin asignar'],
              ['asignada', 'Asignadas'],
              ['archivada', 'Archivadas'],
            ] as [Filtro, string][]
          ).map(([f, texto]) => (
            <button key={f} type="button" aria-pressed={filtro === f} onClick={() => setFiltro(f)} className={chip(filtro === f)}>
              {texto} · {cuenta[f]}
            </button>
          ))}
        </div>

        <div className="flex flex-col overflow-hidden rounded-2xl bg-white">
          {visibles.length === 0 && <p className="m-0 p-4 text-[15px] text-tinta-2">No hay palabras en este filtro.</p>}
          {visibles.map((p) => (
            <div key={p.id} className="border-b border-separador last:border-b-0">
              <div className="flex items-center gap-2.5 px-3.5 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[15px] font-extrabold">
                    {p.ingles} <span className="font-semibold text-tinta-2">· {p.espanol}</span>
                  </span>
                  <span className="flex items-center gap-2 text-[13px] text-tinta-2">
                    <Insignia tono={p.estado === 'sin_asignar' ? 'acento' : p.estado === 'asignada' ? 'ok' : 'neutro'}>
                      {p.estado === 'sin_asignar' ? 'Sin asignar' : p.estado === 'asignada' ? 'Asignada' : 'Archivada'}
                    </Insignia>
                    {p.estado === 'sin_asignar' && `nº ${p.orden}`}
                    {p.estado === 'asignada' && p.fecha_asignacion && `${fechaCorta(p.fecha_asignacion)}${p.categoria ? ` · ${p.categoria}` : ''}`}
                  </span>
                </div>
                {p.estado !== 'archivada' && (
                  <button
                    type="button"
                    aria-label={`Editar ${p.ingles}`}
                    onClick={() => {
                      setEditando(editando?.id === p.id ? null : { ...p })
                      setMostrarForm(false)
                    }}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-chip text-tinta-3"
                  >
                    <IconoLapiz tamano={18} />
                  </button>
                )}
              </div>
              {editando?.id === p.id && (
                <form onSubmit={guardarEdicion} className="flex flex-col gap-3 border-t border-separador bg-fondo p-3.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <Campo etiqueta="Inglés" value={editando.ingles} onChange={(e) => setEditando({ ...editando, ingles: e.target.value })} required />
                    <Campo etiqueta="Español" value={editando.espanol} onChange={(e) => setEditando({ ...editando, espanol: e.target.value })} required />
                  </div>
                  <Campo etiqueta="Ejemplo (opcional)" value={editando.ejemplo ?? ''} onChange={(e) => setEditando({ ...editando, ejemplo: e.target.value })} />
                  <Campo etiqueta="Categoría (opcional)" value={editando.categoria ?? ''} onChange={(e) => setEditando({ ...editando, categoria: e.target.value })} />
                  <div className="flex gap-2.5">
                    <button type="button" onClick={() => archivar(p)} className="h-12 cursor-pointer rounded-xl border-0 bg-error-fondo px-4 text-[15px] font-extrabold text-error-texto">
                      Archivar
                    </button>
                    <Boton variante="secundario" className="h-12 flex-1 text-[15px]" onClick={() => setEditando(null)}>
                      Cancelar
                    </Boton>
                    <Boton type="submit" className="h-12 flex-1 text-[15px]" disabled={enviando}>
                      Guardar
                    </Boton>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </Pantalla>
  )
}

function orden(p: Palabra) {
  return p.estado === 'sin_asignar' ? 0 : p.estado === 'asignada' ? 1 : 2
}

/** Acepta separador coma, punto y coma o tabulador; columnas: inglés, español, ejemplo, categoría. */
function parsearCsv(texto: string): Nueva[] {
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lineas.length === 0) return []
  const primera = lineas[0]!
  const separador = [';', '\t', ','].sort((a, b) => primera.split(b).length - primera.split(a).length)[0]!
  const filas = lineas.map((l) => l.split(separador).map((c) => c.trim().replace(/^"(.*)"$/, '$1').trim()))
  const sinCabecera = /ingl|english/i.test(filas[0]?.[0] ?? '') ? filas.slice(1) : filas
  return sinCabecera
    .filter((c) => (c[0] ?? '') !== '' && (c[1] ?? '') !== '')
    .map((c) => ({ ingles: c[0]!, espanol: c[1]!, ejemplo: c[2] ?? '', categoria: c[3] ?? '' }))
}
