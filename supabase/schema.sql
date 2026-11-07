-- Base de datos de métricas de la página de links.
-- Correr UNA vez en Supabase > SQL Editor, en el proyecto PROPIO de esta página
-- (no en el de Howenh Operatives).

-- 1) Eventos: una fila por visita ('view') o clic ('click').
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  type        text not null check (type in ('view', 'click')),
  link_id     text check (char_length(link_id) <= 60),
  visitor_id  text check (char_length(visitor_id) <= 60),
  referrer    text check (char_length(referrer) <= 120),
  utm_source  text check (char_length(utm_source) <= 60),
  utm_medium  text check (char_length(utm_medium) <= 60),
  utm_campaign text check (char_length(utm_campaign) <= 60),
  device      text check (device in ('mobile', 'tablet', 'desktop')),
  lang        text check (char_length(lang) <= 5)
);
create index if not exists events_created_at_idx on public.events (created_at);

-- 2) Quién puede ver las métricas: solo los emails de esta lista.
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security; -- sin políticas: solo editable desde el SQL Editor

create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;
revoke all on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;

-- 3) Permisos: cualquiera puede ANOTAR un evento; solo un admin puede LEERLOS.
alter table public.events enable row level security;

drop policy if exists "cualquiera puede registrar eventos" on public.events;
create policy "cualquiera puede registrar eventos" on public.events
  for insert to anon, authenticated with check (true);

drop policy if exists "solo admins leen eventos" on public.events;
create policy "solo admins leen eventos" on public.events
  for select to authenticated using (public.es_admin());

-- 4) Resumen para el panel /admin (agrupado en la base: no hay límite de filas).
create or replace function public.link_stats(_days int default 30)
returns jsonb
language sql stable security invoker set search_path = public
as $$
  with e as (
    select * from public.events where created_at >= now() - make_interval(days => _days)
  )
  select jsonb_build_object(
    'views',    (select count(*) from e where type = 'view'),
    'clicks',   (select count(*) from e where type = 'click'),
    'visitors', (select count(distinct visitor_id) from e where type = 'view'),
    'by_link',  coalesce((
      select jsonb_agg(x order by x.clicks desc)
      from (select link_id, count(*) as clicks from e where type = 'click' group by link_id) x
    ), '[]'::jsonb),
    'by_day',   coalesce((
      select jsonb_agg(x order by x.day)
      from (
        select (created_at at time zone 'America/Argentina/Ushuaia')::date as day,
               count(*) filter (where type = 'view')  as views,
               count(*) filter (where type = 'click') as clicks
        from e group by 1
      ) x
    ), '[]'::jsonb),
    'by_source', coalesce((
      select jsonb_agg(x order by x.views desc)
      from (
        select coalesce(nullif(utm_source, ''), nullif(referrer, ''), 'directo') as source,
               count(*) filter (where type = 'view')  as views,
               count(*) filter (where type = 'click') as clicks
        from e group by 1
      ) x
    ), '[]'::jsonb),
    'by_device', coalesce((
      select jsonb_agg(x order by x.views desc)
      from (
        select coalesce(device, '?') as device,
               count(*) filter (where type = 'view')  as views,
               count(*) filter (where type = 'click') as clicks
        from e group by 1
      ) x
    ), '[]'::jsonb)
  )
$$;
revoke all on function public.link_stats(int) from public, anon;
grant execute on function public.link_stats(int) to authenticated;

-- 5) ÚLTIMO PASO: autorizar tu email para ver el panel (cambiá el email).
-- insert into public.admins (email) values ('tu-email@ejemplo.com');
