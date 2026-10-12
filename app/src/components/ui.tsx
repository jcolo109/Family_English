import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

/** Marco de pantalla: ancho de móvil centrado, alto completo. */
export function Pantalla({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto flex min-h-dvh w-full max-w-[430px] flex-col ${className}`}>{children}</div>
  )
}

type Variante = 'primario' | 'oscuro' | 'secundario' | 'texto'

export function Boton({
  variante = 'primario',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  const base =
    'flex items-center justify-center rounded-2xl font-extrabold cursor-pointer transition-colors disabled:cursor-default disabled:bg-deshabilitado disabled:text-tinta-2'
  const estilos: Record<Variante, string> = {
    primario: 'h-14 bg-acento text-white text-[17px] hover:bg-acento-oscuro',
    oscuro: 'h-14 bg-tinta text-white text-[17px]',
    secundario: 'h-14 border-2 border-borde bg-white text-tinta text-[17px]',
    texto: 'h-12 bg-transparent text-[15px] font-bold text-tinta-2',
  }
  return <button type="button" className={`${base} ${estilos[variante]} ${className}`} {...props} />
}

const campoBase =
  'box-border rounded-xl border-[1.5px] border-borde bg-white px-4 text-base font-normal text-tinta outline-none focus:border-acento focus:ring-1 focus:ring-acento'

export function Campo({ etiqueta, ...props }: InputHTMLAttributes<HTMLInputElement> & { etiqueta: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-bold">
      <span>{etiqueta}</span>
      <input className={`h-13 ${campoBase}`} {...props} />
    </label>
  )
}

export function AreaTexto({
  etiqueta,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { etiqueta: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-bold">
      <span>{etiqueta}</span>
      <textarea className={`resize-none py-3.5 ${campoBase}`} {...props} />
    </label>
  )
}

export function Selector({
  etiqueta,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { etiqueta: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-bold">
      <span>{etiqueta}</span>
      <select className={`h-13 ${campoBase}`} {...props}>
        {children}
      </select>
    </label>
  )
}

export function Aviso({ tipo = 'ok', children }: { tipo?: 'ok' | 'error' | 'info'; children: ReactNode }) {
  const estilos = {
    ok: 'bg-ok-fondo text-ok-texto',
    error: 'bg-error-fondo text-error-texto',
    info: 'bg-acento-suave text-[#1E2F66]',
  }[tipo]
  return (
    <p role={tipo === 'error' ? 'alert' : 'status'} className={`m-0 rounded-xl px-4 py-3.5 text-[15px] font-semibold leading-snug ${estilos}`}>
      {children}
    </p>
  )
}

export function Insignia({ tono, children }: { tono: 'acento' | 'neutro' | 'ok' | 'aviso'; children: ReactNode }) {
  const estilos = {
    acento: 'bg-acento-suave text-acento-oscuro',
    neutro: 'bg-separador text-tinta-3',
    ok: 'bg-ok-fondo text-ok-texto',
    aviso: 'bg-[#FFF1DC] text-[#8A4200]',
  }[tono]
  return <span className={`self-start rounded-md px-2 py-0.5 text-xs font-extrabold ${estilos}`}>{children}</span>
}

export function Logo({ tamano = 54 }: { tamano?: number }) {
  const escala = tamano / 54
  return (
    <div aria-hidden="true" className="relative" style={{ width: tamano, height: tamano }}>
      <div
        className="absolute rounded-lg bg-aviso"
        style={{ left: 0, top: 8 * escala, width: 34 * escala, height: 42 * escala, transform: 'rotate(-12deg)' }}
      />
      <div
        className="absolute flex items-center justify-center rounded-lg bg-acento font-display font-extrabold text-white"
        style={{ left: 16 * escala, top: 2 * escala, width: 34 * escala, height: 42 * escala, fontSize: 14 * escala }}
      >
        EN
      </div>
    </div>
  )
}

export function Volver({ onClick, etiqueta = 'Volver' }: { onClick: () => void; etiqueta?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-tinta"
    >
      <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}
