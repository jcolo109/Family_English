import { Link, NavLink } from 'react-router-dom'
import { IconoCasa, IconoHistorial, IconoPersona, IconoRanking, IconoTarjetas } from './iconos'
import { Volver } from './ui'
import type { ReactNode } from 'react'

export function BarraInferior({ grupoId }: { grupoId: string | null }) {
  const base = grupoId ? `/g/${grupoId}` : null
  const items = [
    { to: base ?? '/grupos', fin: true, texto: 'Inicio', Icono: IconoCasa },
    { to: base ? `${base}/palabras` : '/grupos', texto: 'Palabras', Icono: IconoTarjetas },
    { to: base ? `${base}/ranking` : '/grupos', texto: 'Ranking', Icono: IconoRanking },
    { to: base ? `${base}/historial` : '/grupos', texto: 'Historial', Icono: IconoHistorial },
    { to: '/perfil', texto: 'Perfil', Icono: IconoPersona },
  ]
  return (
    <nav
      aria-label="Navegación principal"
      className="flex border-t border-borde-suave bg-white px-1.5 pt-1.5"
      style={{ paddingBottom: 'max(18px, env(safe-area-inset-bottom))' }}
    >
      {items.map(({ to, fin, texto, Icono }) => (
        <NavLink
          key={texto}
          to={to}
          end={fin}
          className={({ isActive }) =>
            `flex min-h-[52px] flex-1 flex-col items-center justify-center gap-[3px] text-xs no-underline ${
              isActive ? 'font-extrabold text-acento' : 'font-bold text-tinta-2'
            }`
          }
        >
          <Icono />
          {texto}
        </NavLink>
      ))}
    </nav>
  )
}

export function CabeceraAjustes({
  grupoId,
  nombreGrupo,
  titulo,
  onVolver,
}: {
  grupoId: string
  nombreGrupo: string
  titulo: string
  onVolver: () => void
}) {
  const pestanas = [
    { to: `/g/${grupoId}/vocabulario`, texto: 'Vocabulario' },
    { to: `/g/${grupoId}/miembros`, texto: 'Miembros' },
    { to: `/g/${grupoId}/invitar`, texto: 'Invitaciones' },
  ]
  return (
    <header className="flex flex-col gap-2.5 px-3 pb-3 pt-8">
      <div className="flex items-center gap-1">
        <Volver onClick={onVolver} etiqueta="Volver al grupo" />
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-tinta-2">Ajustes · {nombreGrupo}</span>
          <h1 className="m-0 text-[26px] font-extrabold leading-tight">{titulo}</h1>
        </div>
      </div>
      <nav aria-label="Ajustes del grupo" className="flex gap-1.5 px-2">
        {pestanas.map((p) => (
          <NavLink
            key={p.to}
            to={p.to}
            className={({ isActive }) =>
              `flex min-h-10 flex-1 items-center justify-center rounded-full text-[14px] font-extrabold no-underline ${
                isActive ? 'bg-tinta text-white' : 'border-[1.5px] border-borde bg-white text-tinta-3'
              }`
            }
          >
            {p.texto}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

/** Cabecera sencilla con flecha de volver, título y subtítulo opcional. */
export function CabeceraSimple({
  volverA,
  etiquetaVolver = 'Volver',
  titulo,
  subtitulo,
  accion,
}: {
  volverA: string
  etiquetaVolver?: string
  titulo: string
  subtitulo?: ReactNode
  accion?: ReactNode
}) {
  return (
    <header className="flex items-center gap-1 px-3 pb-2 pt-8">
      <Link to={volverA} aria-label={etiquetaVolver} className="flex h-12 w-12 items-center justify-center rounded-full text-tinta">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <div className="flex flex-1 flex-col">
        <h1 className="m-0 text-[24px] font-extrabold leading-tight">{titulo}</h1>
        {subtitulo && <span className="text-[13px] font-semibold text-tinta-2">{subtitulo}</span>}
      </div>
      {accion}
    </header>
  )
}
