-- Agrega el país de cada visita y más detalle de origen al panel.
-- Correr UNA vez en Supabase > SQL Editor (proyecto de la página de links). No borra nada.

alter table public.events add column if not exists country text check (char_length(country) <= 2);

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
    'by_campaign', coalesce((
      select jsonb_agg(x order by x.views desc)
      from (
        select coalesce(nullif(utm_source, ''), '—') as source,
               coalesce(nullif(utm_medium, ''), '—') as medium,
               coalesce(nullif(utm_campaign, ''), '—') as campaign,
               count(*) filter (where type = 'view')  as views,
               count(*) filter (where type = 'click') as clicks
        from e
        where coalesce(utm_source, '') <> '' or coalesce(utm_medium, '') <> '' or coalesce(utm_campaign, '') <> ''
        group by 1, 2, 3
      ) x
    ), '[]'::jsonb),
    'by_country', coalesce((
      select jsonb_agg(x order by x.views desc)
      from (
        select coalesce(nullif(country, ''), '?') as country,
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
