-- Family English · esquema inicial
-- Modelo de datos de docs/analisis-v1.md. Ejecutar en el SQL Editor de Supabase
-- o con `supabase db push`.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.rol_miembro as enum ('organizador', 'jugador');
create type public.estado_invitacion as enum ('pendiente', 'aceptada', 'caducada', 'cancelada');
create type public.estado_palabra as enum ('sin_asignar', 'asignada', 'archivada');
create type public.direccion_pregunta as enum ('en_es', 'es_en');

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
create table public.perfiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text not null,
  nombre_visible text not null,
  avatar_url     text,
  creado_el      timestamptz not null default now()
);

create table public.grupos (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null check (char_length(nombre) between 1 and 60),
  descripcion     text,
  zona_horaria    text not null default 'Europe/Madrid',
  organizador_id  uuid not null references public.perfiles (id),
  creado_el       timestamptz not null default now()
);

create table public.miembros (
  id             uuid primary key default gen_random_uuid(),
  grupo_id       uuid not null references public.grupos (id) on delete cascade,
  usuario_id     uuid not null references public.perfiles (id) on delete cascade,
  rol            public.rol_miembro not null default 'jugador',
  alta_el        timestamptz not null default now(),
  puntos_totales integer not null default 0,
  unique (grupo_id, usuario_id)
);
create index miembros_usuario_idx on public.miembros (usuario_id);

create table public.invitaciones (
  id           uuid primary key default gen_random_uuid(),
  grupo_id     uuid not null references public.grupos (id) on delete cascade,
  email        text not null,
  token        uuid not null unique default gen_random_uuid(),
  estado       public.estado_invitacion not null default 'pendiente',
  invitado_por uuid not null references public.perfiles (id),
  caduca_el    timestamptz not null default now() + interval '7 days',
  creado_el    timestamptz not null default now()
);
create index invitaciones_email_idx on public.invitaciones (lower(email));

create table public.palabras (
  id               uuid primary key default gen_random_uuid(),
  grupo_id         uuid not null references public.grupos (id) on delete cascade,
  ingles           text not null,
  espanol          text not null,
  ejemplo          text,
  categoria        text,
  orden            integer not null,
  estado           public.estado_palabra not null default 'sin_asignar',
  fecha_asignacion date,
  creado_el        timestamptz not null default now(),
  unique (grupo_id, orden)
);
create index palabras_reparto_idx on public.palabras (grupo_id, estado, orden);
create index palabras_fecha_idx on public.palabras (grupo_id, fecha_asignacion);

create table public.examenes (
  id            uuid primary key default gen_random_uuid(),
  miembro_id    uuid not null references public.miembros (id) on delete cascade,
  fecha_juego   date not null,
  puntos        integer not null default 0 check (puntos between 0 and 10),
  iniciado_el   timestamptz not null default now(),
  completado_el timestamptz,
  unique (miembro_id, fecha_juego)
);

create table public.respuestas (
  id         uuid primary key default gen_random_uuid(),
  examen_id  uuid not null references public.examenes (id) on delete cascade,
  palabra_id uuid not null references public.palabras (id),
  orden      smallint not null,
  direccion  public.direccion_pregunta not null,
  opciones   text[] not null,
  es_repaso  boolean not null default false,
  respuesta  text,
  correcta   boolean,
  unique (examen_id, orden)
);

-- ---------------------------------------------------------------------------
-- Perfil automático al registrarse
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, email, nombre_visible)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre_visible'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Funciones de ayuda para las políticas (security definer evita recursión RLS)
-- ---------------------------------------------------------------------------
create or replace function public.es_miembro(g uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.miembros where grupo_id = g and usuario_id = auth.uid()
  );
$$;

create or replace function public.es_organizador(g uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.miembros
    where grupo_id = g and usuario_id = auth.uid() and rol = 'organizador'
  );
$$;

create or replace function public.comparte_grupo(otro uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select otro = auth.uid() or exists (
    select 1
    from public.miembros m1
    join public.miembros m2 on m1.grupo_id = m2.grupo_id
    where m1.usuario_id = auth.uid() and m2.usuario_id = otro
  );
$$;

create or replace function public.tiene_invitacion(g uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.invitaciones
    where grupo_id = g
      and estado = 'pendiente'
      and caduca_el > now()
      and lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- ---------------------------------------------------------------------------
-- Operaciones de negocio (RPC)
-- ---------------------------------------------------------------------------

-- Crea el grupo y da de alta al creador como organizador en una sola transacción.
create or replace function public.crear_grupo(
  p_nombre text,
  p_descripcion text default null,
  p_zona_horaria text default 'Europe/Madrid'
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  g uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  insert into public.grupos (nombre, descripcion, zona_horaria, organizador_id)
  values (trim(p_nombre), nullif(trim(p_descripcion), ''), p_zona_horaria, auth.uid())
  returning id into g;
  insert into public.miembros (grupo_id, usuario_id, rol)
  values (g, auth.uid(), 'organizador');
  return g;
end;
$$;

-- El invitado acepta con el token; debe estar autenticado con el email invitado.
create or replace function public.aceptar_invitacion(p_token uuid)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  inv public.invitaciones%rowtype;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  select * into inv from public.invitaciones where token = p_token for update;
  if not found then
    raise exception 'Invitación no encontrada';
  end if;
  if lower(inv.email) <> lower(auth.jwt() ->> 'email') then
    raise exception 'La invitación es para otro email';
  end if;
  if inv.estado = 'pendiente' and inv.caduca_el < now() then
    update public.invitaciones set estado = 'caducada' where id = inv.id;
    raise exception 'La invitación ha caducado';
  end if;
  if inv.estado <> 'pendiente' then
    raise exception 'La invitación ya no está activa';
  end if;
  insert into public.miembros (grupo_id, usuario_id, rol)
  values (inv.grupo_id, auth.uid(), 'jugador')
  on conflict (grupo_id, usuario_id) do nothing;
  update public.invitaciones set estado = 'aceptada' where id = inv.id;
  return inv.grupo_id;
end;
$$;

create or replace function public.rechazar_invitacion(p_token uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  update public.invitaciones
  set estado = 'cancelada'
  where token = p_token
    and estado = 'pendiente'
    and lower(email) = lower(auth.jwt() ->> 'email');
end;
$$;

-- Reparto diario: para cada grupo cuya fecha local aún no tiene palabras asignadas,
-- asigna hasta 5 palabras sin asignar en orden de alta. Pensada para ejecutarse
-- cada hora (cubre todas las zonas horarias); repetirla es inocuo.
create or replace function public.asignar_palabras_diarias()
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  g record;
  hoy date;
  n integer := 0;
  k integer;
begin
  for g in select id, zona_horaria from public.grupos loop
    hoy := (now() at time zone g.zona_horaria)::date;
    if exists (select 1 from public.palabras where grupo_id = g.id and fecha_asignacion = hoy) then
      continue;
    end if;
    with elegidas as (
      select id from public.palabras
      where grupo_id = g.id and estado = 'sin_asignar'
      order by orden
      limit 5
    )
    update public.palabras p
    set estado = 'asignada', fecha_asignacion = hoy
    from elegidas e
    where p.id = e.id;
    get diagnostics k = row_count;
    n := n + k;
  end loop;
  return n;
end;
$$;

revoke execute on function public.asignar_palabras_diarias() from public, anon, authenticated;
grant execute on function public.crear_grupo(text, text, text) to authenticated;
grant execute on function public.aceptar_invitacion(uuid) to authenticated;
grant execute on function public.rechazar_invitacion(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Seguridad por filas (RLS)
-- ---------------------------------------------------------------------------
alter table public.perfiles     enable row level security;
alter table public.grupos       enable row level security;
alter table public.miembros     enable row level security;
alter table public.invitaciones enable row level security;
alter table public.palabras     enable row level security;
alter table public.examenes     enable row level security;
alter table public.respuestas   enable row level security;

-- perfiles: el propio y los de quienes comparten grupo (y quien te invitó)
create policy "perfiles: ver propio y companeros" on public.perfiles
  for select to authenticated
  using (
    public.comparte_grupo(id)
    or id in (
      select invitado_por from public.invitaciones
      where estado = 'pendiente' and lower(email) = lower(auth.jwt() ->> 'email')
    )
  );
create policy "perfiles: editar propio" on public.perfiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- grupos: los míos y aquellos a los que tengo invitación pendiente (para ver el nombre)
create policy "grupos: ver propios o invitados" on public.grupos
  for select to authenticated
  using (public.es_miembro(id) or public.tiene_invitacion(id));
create policy "grupos: editar organizador" on public.grupos
  for update to authenticated
  using (organizador_id = auth.uid()) with check (organizador_id = auth.uid());
create policy "grupos: borrar organizador" on public.grupos
  for delete to authenticated
  using (organizador_id = auth.uid());
-- El alta se hace solo con crear_grupo().

-- miembros
create policy "miembros: ver los del grupo" on public.miembros
  for select to authenticated
  using (public.es_miembro(grupo_id));
create policy "miembros: salir o expulsar" on public.miembros
  for delete to authenticated
  using (rol <> 'organizador' and (usuario_id = auth.uid() or public.es_organizador(grupo_id)));
-- El alta se hace solo con crear_grupo() y aceptar_invitacion().

-- invitaciones
create policy "invitaciones: organizador gestiona" on public.invitaciones
  for all to authenticated
  using (public.es_organizador(grupo_id))
  with check (public.es_organizador(grupo_id) and invitado_por = auth.uid());
create policy "invitaciones: invitado ve las suyas" on public.invitaciones
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- palabras: el organizador ve todas; los jugadores solo las ya asignadas
create policy "palabras: ver" on public.palabras
  for select to authenticated
  using (public.es_organizador(grupo_id) or (public.es_miembro(grupo_id) and estado = 'asignada'));
create policy "palabras: organizador crea" on public.palabras
  for insert to authenticated
  with check (public.es_organizador(grupo_id));
create policy "palabras: organizador edita" on public.palabras
  for update to authenticated
  using (public.es_organizador(grupo_id)) with check (public.es_organizador(grupo_id));
create policy "palabras: organizador borra" on public.palabras
  for delete to authenticated
  using (public.es_organizador(grupo_id) and estado = 'sin_asignar');

-- exámenes: visibles para todo el grupo (alimentan la clasificación)
create policy "examenes: ver los del grupo" on public.examenes
  for select to authenticated
  using (exists (
    select 1 from public.miembros m where m.id = examenes.miembro_id and public.es_miembro(m.grupo_id)
  ));

-- respuestas: solo las propias
create policy "respuestas: ver propias" on public.respuestas
  for select to authenticated
  using (exists (
    select 1 from public.examenes e
    join public.miembros m on m.id = e.miembro_id
    where e.id = respuestas.examen_id and m.usuario_id = auth.uid()
  ));
-- Exámenes y respuestas se crean y corrigen solo desde funciones de servidor
-- (siguiente migración), nunca desde el cliente.
