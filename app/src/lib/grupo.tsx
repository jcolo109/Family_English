import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { supabase } from './supabase'
import { useAuth } from './auth'
import { Aviso, Pantalla } from '../components/ui'

export type Grupo = {
  id: string
  nombre: string
  descripcion: string | null
  zona_horaria: string
  organizador_id: string
}

export type Miembro = {
  id: string
  rol: 'organizador' | 'jugador'
  puntos_totales: number
  alta_el: string
}

export type Palabra = {
  id: string
  ingles: string
  espanol: string
  ejemplo: string | null
  categoria: string | null
  orden: number
  estado: 'sin_asignar' | 'asignada' | 'archivada'
  fecha_asignacion: string | null
}

export type ContextoGrupo = {
  grupo: Grupo
  miembro: Miembro
  esOrganizador: boolean
  usuarioId: string
}

type Estado = 'cargando' | 'ok' | 'sin_acceso' | 'error'

export function useGrupo(grupoId: string | undefined) {
  const { session } = useAuth()
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [miembro, setMiembro] = useState<Miembro | null>(null)
  const [estado, setEstado] = useState<Estado>('cargando')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!grupoId || !session) return
    let activo = true
    Promise.all([
      supabase.from('grupos').select('id, nombre, descripcion, zona_horaria, organizador_id').eq('id', grupoId).maybeSingle(),
      supabase
        .from('miembros')
        .select('id, rol, puntos_totales, alta_el')
        .eq('grupo_id', grupoId)
        .eq('usuario_id', session.user.id)
        .maybeSingle(),
    ]).then(([g, m]) => {
      if (!activo) return
      if (g.error || m.error) {
        setError((g.error ?? m.error)!.message)
        setEstado('error')
        return
      }
      if (!g.data || !m.data) {
        setEstado('sin_acceso')
        return
      }
      setGrupo(g.data as Grupo)
      setMiembro(m.data as Miembro)
      setEstado('ok')
      try {
        localStorage.setItem('ultimo_grupo', grupoId)
      } catch {
        /* sin almacenamiento local */
      }
    })
    return () => {
      activo = false
    }
  }, [grupoId, session])

  return { grupo, miembro, estado, error }
}

/** Carga el grupo de la URL y comprueba que el usuario es miembro antes de pintar la pantalla. */
export function ConGrupo({ children }: { children: (ctx: ContextoGrupo) => ReactNode }) {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const { grupo, miembro, estado, error } = useGrupo(id)

  if (estado === 'cargando') {
    return (
      <Pantalla>
        <p className="m-auto text-tinta-2">Cargando…</p>
      </Pantalla>
    )
  }
  if (estado === 'sin_acceso') return <Navigate to="/grupos" replace />
  if (estado === 'error' || !grupo || !miembro) {
    return (
      <Pantalla>
        <div className="p-5">
          <Aviso tipo="error">{error ?? 'No se ha podido cargar el grupo.'}</Aviso>
        </div>
      </Pantalla>
    )
  }
  return <>{children({ grupo, miembro, esOrganizador: miembro.rol === 'organizador', usuarioId: session!.user.id })}</>
}

export function ultimoGrupoId(): string | null {
  try {
    return localStorage.getItem('ultimo_grupo')
  } catch {
    return null
  }
}

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria del grupo. */
export function fechaLocal(zona: string, fecha = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha)
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "12 oct" a partir de "2026-10-12". */
export function fechaCorta(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${MESES_CORTOS[(m ?? 1) - 1]}`
}

/** "Lunes, 12 de octubre" para hoy en la zona del grupo. */
export function fechaLarga(zona: string, fecha = new Date()): string {
  const texto = new Intl.DateTimeFormat('es-ES', { timeZone: zona, weekday: 'long', day: 'numeric', month: 'long' }).format(fecha)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function ordinal(n: number): string {
  return `${n}º`
}
