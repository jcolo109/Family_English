-- Family English · reparto diario programado
-- Antes de ejecutar: en Supabase, Database > Extensions, activa `pg_cron`.
-- La función corre cada hora en el minuto 5 y asigna palabras a los grupos
-- cuya fecha local acaba de cambiar; en el resto no hace nada.

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'family-english-reparto-diario',
  '5 * * * *',
  $$ select public.asignar_palabras_diarias(); $$
);
