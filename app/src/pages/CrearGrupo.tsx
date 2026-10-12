import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AreaTexto, Aviso, Boton, Campo, Pantalla, Selector, Volver } from '../components/ui'

const ZONAS = [
  ['Europe/Madrid', 'España (península y Baleares)'],
  ['Atlantic/Canary', 'Canarias'],
  ['Europe/London', 'Reino Unido e Irlanda'],
  ['Europe/Lisbon', 'Portugal'],
  ['America/Mexico_City', 'México (centro)'],
  ['America/Bogota', 'Colombia, Perú, Ecuador'],
  ['America/Argentina/Buenos_Aires', 'Argentina'],
  ['America/Santiago', 'Chile'],
  ['America/New_York', 'EE. UU. (este)'],
] as const

export default function CrearGrupo() {
  const navigate = useNavigate()
  const zonaDetectada = Intl.DateTimeFormat().resolvedOptions().timeZone
  const zonaInicial = ZONAS.some(([z]) => z === zonaDetectada) ? zonaDetectada : 'Europe/Madrid'
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [zona, setZona] = useState<string>(zonaInicial)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function crear(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setEnviando(true)
    const { error } = await supabase.rpc('crear_grupo', {
      p_nombre: nombre.trim(),
      p_descripcion: descripcion.trim() || null,
      p_zona_horaria: zona,
    })
    setEnviando(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/grupos', { replace: true })
  }

  return (
    <Pantalla>
      <header className="flex items-center gap-2 px-3 pb-2 pt-8">
        <Volver onClick={() => navigate('/grupos')} />
        <span className="text-sm font-bold text-tinta-2">Paso 1 de 2</span>
      </header>
      <form className="flex flex-1 flex-col gap-5 px-5 pb-7" onSubmit={crear}>
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[30px] font-extrabold">Nuevo grupo</h1>
          <p className="m-0 text-[15px] leading-normal text-tinta-2">
            Serás el organizador: mantienes la lista de palabras y también juegas.
          </p>
        </div>

        <Campo
          etiqueta="Nombre del grupo"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Familia Colomar"
          required
          minLength={1}
          maxLength={60}
          autoFocus
        />
        <AreaTexto
          etiqueta={
            <>
              Descripción <span className="font-semibold text-tinta-2">(opcional)</span>
            </>
          }
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Por ejemplo: vocabulario para el viaje a Londres"
          maxLength={200}
        />
        <Selector etiqueta="Zona horaria" value={zona} onChange={(e) => setZona(e.target.value)}>
          {ZONAS.map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </Selector>

        <Aviso tipo="info">
          Cada día a las 00:00 de esta zona horaria se repartirán 5 palabras nuevas, las mismas para todo el grupo.
        </Aviso>
        {error && <Aviso tipo="error">{error}</Aviso>}

        <div className="flex-1" />
        <Boton type="submit" disabled={enviando || nombre.trim().length === 0}>
          {enviando ? 'Creando…' : 'Crear grupo'}
        </Boton>
      </form>
    </Pantalla>
  )
}
