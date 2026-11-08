-- Botones de la página editables desde /admin.
-- Correr UNA vez en Supabase > SQL Editor (proyecto de la página de links). No borra nada existente.

create table if not exists public.links (
  id          text primary key check (id ~ '^[a-z0-9_-]{1,40}$'),  -- nombre interno: lo usan las métricas, no cambiarlo
  orden       int  not null default 0,
  activo      boolean not null default true,
  destacado   boolean not null default false,
  icon        text not null default '🔗' check (char_length(icon) <= 80),
  label_en    text not null check (char_length(label_en) between 1 and 80),
  label_es    text not null check (char_length(label_es) between 1 and 80),
  hint_en     text not null default '' check (char_length(hint_en) <= 160),
  hint_es     text not null default '' check (char_length(hint_es) <= 160),
  url         text not null default '' check (url = '' or url ~* '^(https?://|mailto:|tel:)'),
  url_por_red jsonb   not null default '{}'::jsonb,   -- {"instagram": "https://..."}: otro link según la red
  solo_en     text[]  not null default '{}',          -- si no está vacío, el botón aparece solo en estas redes
  oculto_en   text[]  not null default '{}',          -- redes donde el botón NO aparece
  updated_at  timestamptz not null default now()
);

alter table public.links enable row level security;

-- Cualquiera puede LEER los botones (la página pública los necesita); solo un admin puede cambiarlos.
drop policy if exists "todos leen los botones" on public.links;
create policy "todos leen los botones" on public.links
  for select to anon, authenticated using (true);

drop policy if exists "solo admins crean botones" on public.links;
create policy "solo admins crean botones" on public.links
  for insert to authenticated with check (public.es_admin());

drop policy if exists "solo admins editan botones" on public.links;
create policy "solo admins editan botones" on public.links
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "solo admins borran botones" on public.links;
create policy "solo admins borran botones" on public.links
  for delete to authenticated using (public.es_admin());

-- Botones actuales de la página (para que todo siga igual al activarlo).
insert into public.links (id, orden, activo, destacado, icon, label_en, label_es, url, solo_en, oculto_en) values
  ('contact',   1, true,  false, '/icons/whatsapp.svg',  '¡Contact us!',          '¡Contactanos!',          'https://wa.link/aoyy7g',                       '{}',           '{}'),
  ('website',   2, true,  false, '/icons/howenh.png',    '¡Check our Web!',       '¡Visitá nuestra web!',   'https://howenhlodge.com.ar',                   '{}',           '{}'),
  ('facebook',  3, true,  false, '/icons/facebook.svg',  'Follow us on Facebook', 'Seguinos en Facebook',   'https://www.facebook.com/HowenhLodge',         '{}',           '{facebook}'),
  ('instagram', 4, true,  false, '/icons/instagram.svg', 'Follow us on Instagram','Seguinos en Instagram', 'https://www.instagram.com/howenhlodge',       '{facebook}',   '{}'),
  ('booking',   5, false, false, '🎣',                   'Book your week',        'Reservá tu semana',      'https://howenhoperatives.netlify.app/booking', '{}',           '{}'),
  ('youtube',   6, false, false, '▶️',                   'Watch our Youtube videos','Mirá nuestros videos de YouTube','https://www.youtube.com/@HowenhLodge', '{}', '{}')
on conflict (id) do nothing;
