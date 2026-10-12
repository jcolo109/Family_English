import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ultimoGrupoId } from '../lib/grupo'
import { BarraInferior } from '../components/navegacion'
import { Boton, Pantalla } from '../components/ui'

/** Marcador para pantallas aún no implementadas; mantiene la navegación operativa. */
export default function Proximamente({ titulo }: { titulo: string }) {
  const { id } = useParams<{ id: string }>()
  const grupoId = id ?? ultimoGrupoId()
  return (
    <Pantalla>
      <div className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-10">
        <h1 className="m-0 text-[30px] font-extrabold">{titulo}</h1>
        <p className="m-0 text-[15px] leading-normal text-tinta-2">Esta pantalla está en construcción.</p>
        {grupoId && (
          <Link to={`/g/${grupoId}`} className="text-[15px] font-bold text-acento">
            Volver al inicio del grupo
          </Link>
        )}
        <div className="flex-1" />
        {titulo === 'Perfil' && (
          <Boton variante="secundario" onClick={() => supabase.auth.signOut()}>
            Cerrar sesión
          </Boton>
        )}
      </div>
      <BarraInferior grupoId={grupoId} />
    </Pantalla>
  )
}
