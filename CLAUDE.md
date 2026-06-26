# Contexto para Claude Code

## Qué es
"Doy por Venezuela" — tablón web de ayuda mutua para emergencias. Sin login.
La gente publica lo que **ofrece** o lo que **necesita**; se coordina por WhatsApp.

## Stack
- Frontend estático: `public/` (HTML + CSS + JS vanilla, módulos ES). Sin build.
- Backend: **Supabase** (Postgres). El cliente usa `@supabase/supabase-js` desde esm.sh.
- Hosting objetivo: **Cloudflare Pages** (output dir = `public`). Vercel/Netlify también valen.

## Reglas de datos (importante)
- La app LEE de la vista `items_public` (no incluye el campo privado `code`).
- La app ESCRIBE solo vía 4 funciones RPC `security definer`:
  `publish_item(payload jsonb)`, `mark_taken(p_id)`, `reopen_item(p_id, p_code)`, `delete_item(p_id, p_code)`.
- RLS activo en `items`; `anon` no puede tocar la tabla directo. No rompas esto.
- El `code` de cada publicación se guarda en `localStorage` (`dpv_mine`) para reconocer al autor en su dispositivo.

## Archivos clave
- `public/config.js` — credenciales de Supabase y textos de marca. Es lo único que el usuario edita.
- `public/app.js` — toda la lógica. Funciones: `loadItems`, `publish` (submitPost), `markGone`, `reopen`, `doDelete`, geolocalización (`geoBtn`).
- `supabase/schema.sql` — fuente de verdad del esquema. Si cambias columnas aquí, actualiza también `items_public` y `publish_item`.

## Tareas típicas que pueden pedirte
- Conectar Supabase: pedir URL + anon key y ponerlas en `config.js`.
- Desplegar: `wrangler pages deploy public --project-name=doy-por-venezuela`.
- Añadir un campo nuevo: tocar `schema.sql` (tabla + vista + función publish), `index.html` (input),
  `app.js` (leerlo en submitPost y mostrarlo en `cardHTML`).
- Cambiar idioma/marca para otro desastre: solo `config.js`.

## Correr local
```bash
cd public && python3 -m http.server 5173   # http://localhost:5173
```
No abrir index.html con file:// (los módulos ES requieren servidor).

## No hagas
- No metas claves `service_role` en el frontend (solo `anon`).
- No expongas la columna `code` en selects ni en la vista.
- No conviertas esto en una SPA con framework salvo que se pida; la gracia es que sea liviano.
