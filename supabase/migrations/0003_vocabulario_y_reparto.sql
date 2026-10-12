-- Family English · alta de palabras y reparto bajo demanda
-- Ejecutar después de 0001 y 0002.

-- Reparto para UN grupo: asigna hasta 5 palabras si la fecha local del grupo
-- aún no tiene ninguna. Idempotente: llamarla varias veces el mismo día no hace nada.
create or replace function public.repartir_palabras_grupo(p_grupo uuid)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  zona text;
  hoy date;
  k integer := 0;
begin
  select zona_horaria into zona from public.grupos where id = p_grupo;
  if zona is null then
    return 0;
  end if;
  hoy := (now() at time zone zona)::date;
  if exists (select 1 from public.palabras where grupo_id = p_grupo and fecha_asignacion = hoy) then
    return 0;
  end if;
  with elegidas as (
    select id from public.palabras
    where grupo_id = p_grupo and estado = 'sin_asignar'
    order by orden
    limit 5
  )
  update public.palabras p
  set estado = 'asignada', fecha_asignacion = hoy
  from elegidas e
  where p.id = e.id;
  get diagnostics k = row_count;
  return k;
end;
$$;
revoke execute on function public.repartir_palabras_grupo(uuid) from public, anon, authenticated;

-- El reparto programado reutiliza la función por grupo.
create or replace function public.asignar_palabras_diarias()
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  g record;
  n integer := 0;
begin
  for g in select id from public.grupos loop
    n := n + public.repartir_palabras_grupo(g.id);
  end loop;
  return n;
end;
$$;

-- Cualquier miembro puede pedir el reparto de hoy al abrir el grupo; así un grupo
-- recién creado recibe sus primeras palabras sin esperar a la tarea programada.
create or replace function public.reparto_hoy(p_grupo uuid)
returns integer
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.es_miembro(p_grupo) then
    raise exception 'No perteneces a este grupo';
  end if;
  return public.repartir_palabras_grupo(p_grupo);
end;
$$;
grant execute on function public.reparto_hoy(uuid) to authenticated;

-- Alta de palabras (una o muchas): asigna el número de orden en el servidor.
-- p_palabras = [{"ingles": "...", "espanol": "...", "ejemplo": "...", "categoria": "..."}, ...]
create or replace function public.anadir_palabras(p_grupo uuid, p_palabras jsonb)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  siguiente integer;
  k integer;
begin
  if not public.es_organizador(p_grupo) then
    raise exception 'Solo el organizador puede añadir palabras';
  end if;
  select coalesce(max(orden), 0) into siguiente from public.palabras where grupo_id = p_grupo;
  insert into public.palabras (grupo_id, ingles, espanol, ejemplo, categoria, orden)
  select
    p_grupo,
    trim(x.ingles),
    trim(x.espanol),
    nullif(trim(x.ejemplo), ''),
    nullif(trim(x.categoria), ''),
    siguiente + row_number() over ()
  from jsonb_to_recordset(p_palabras) as x(ingles text, espanol text, ejemplo text, categoria text)
  where nullif(trim(x.ingles), '') is not null
    and nullif(trim(x.espanol), '') is not null;
  get diagnostics k = row_count;
  return k;
end;
$$;
grant execute on function public.anadir_palabras(uuid, jsonb) to authenticated;
