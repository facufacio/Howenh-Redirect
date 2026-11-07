# Howenh Lodge · Página de links

Página tipo "linktree" para las redes: una pantalla con los botones a donde queremos
mandar al cliente (reservas, Instagram, WhatsApp…) y **métricas propias** de visitas y clics.

- **Frontend**: React + Vite + TypeScript (sin librerías de UI), se publica en Netlify.
- **Métricas**: base de datos propia en Supabase (proyecto aparte de Howenh Operatives).
- **Panel**: `/admin` (login con email y contraseña) muestra visitas, visitantes únicos, clics por link,
  origen del tráfico, dispositivos y visitas por día.
- Se guardan solo datos anónimos (id aleatorio del navegador, origen, dispositivo, idioma). Sin IP ni cookies.

## 1. Editar los links

Todo está en [`src/links.ts`](src/links.ts). Un link con `url` vacía no se muestra.
No cambies el `id` de un link ya publicado: es el nombre con el que se cuentan sus clics.

## 2. Crear la base de datos (una sola vez)

1. En Supabase creá un proyecto **nuevo** (no el de Howenh Operatives).
2. SQL Editor → pegá y corré todo [`supabase/schema.sql`](supabase/schema.sql).
3. Authentication → Users → **Add user** (tu email y una contraseña).
4. Authentication → Sign In / Providers → desactivá **Allow new users to sign up**.
5. En el SQL Editor corré (con tu email): `insert into public.admins (email) values ('tu-email@ejemplo.com');`
6. Project Settings → API: copiá **Project URL** y la clave **anon public**.

## 3. Publicar en Netlify (cuenta aparte)

1. Subí este repo a GitHub y conectalo en Netlify (Add new site → Import from Git).
2. Site configuration → Environment variables:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon public key
3. Deploy. Después podés asignar un dominio propio desde Domain management.

## 4. Medir de qué red viene cada visita

Pegá en cada red el link con una etiqueta, por ejemplo:

- Instagram: `https://TU-SITIO.netlify.app/?utm_source=instagram`
- TikTok: `https://TU-SITIO.netlify.app/?utm_source=tiktok`
- WhatsApp: `https://TU-SITIO.netlify.app/?utm_source=whatsapp`

Las apps (Instagram, etc.) suelen no informar de dónde vino el visitante: la etiqueta `utm_source` es lo que lo resuelve.

## Desarrollo local

```bash
npm install
cp .env.example .env   # y completar los valores
npm run dev            # http://localhost:5180
npm run build
```

Sin las variables de entorno la página funciona igual, pero no registra métricas.
