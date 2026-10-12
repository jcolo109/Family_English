import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & { tamano?: number }

function Icono({ tamano = 22, children, ...props }: Props) {
  return (
    <svg
      aria-hidden="true"
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconoCasa = (p: Props) => (
  <Icono strokeWidth="2.2" {...p}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </Icono>
)
export const IconoTarjetas = (p: Props) => (
  <Icono {...p}>
    <rect x="3" y="6" width="13" height="15" rx="2" />
    <path d="M8 3h11a2 2 0 0 1 2 2v12" />
  </Icono>
)
export const IconoRanking = (p: Props) => (
  <Icono {...p}>
    <path d="M4 21v-8h5v8M9.5 21V4h5v17M15 21v-5h5v5" />
  </Icono>
)
export const IconoHistorial = (p: Props) => (
  <Icono {...p}>
    <path d="M3 3v18h18" />
    <path d="m7 15 4-4 3 3 5-6" />
  </Icono>
)
export const IconoPersona = (p: Props) => (
  <Icono {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icono>
)
export const IconoEngranaje = (p: Props) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Icono>
)
export const IconoChevronAbajo = (p: Props) => (
  <Icono strokeWidth="2.4" {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icono>
)
export const IconoChevronDerecha = (p: Props) => (
  <Icono strokeWidth="2.4" {...p}>
    <path d="m9 18 6-6-6-6" />
  </Icono>
)
export const IconoAviso = (p: Props) => (
  <Icono {...p}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </Icono>
)
export const IconoMas = (p: Props) => (
  <Icono strokeWidth="2.5" {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icono>
)
export const IconoCerrar = (p: Props) => (
  <Icono strokeWidth="2.6" {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icono>
)
export const IconoReenviar = (p: Props) => (
  <Icono strokeWidth="2.2" {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v5h-5" />
  </Icono>
)
export const IconoCopiar = (p: Props) => (
  <Icono {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Icono>
)
export const IconoLapiz = (p: Props) => (
  <Icono {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Icono>
)
export const IconoCheck = (p: Props) => (
  <Icono strokeWidth="2.5" {...p}>
    <path d="m5 12 5 5L20 7" />
  </Icono>
)
export const IconoSobre = (p: Props) => (
  <Icono {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icono>
)
export const IconoSubir = (p: Props) => (
  <Icono {...p}>
    <path d="M12 16V4" />
    <path d="m6 10 6-6 6 6" />
    <path d="M4 20h16" />
  </Icono>
)
export const IconoCandado = (p: Props) => (
  <Icono strokeWidth="2.2" {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Icono>
)
