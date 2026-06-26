# Doy por Venezuela — Tablón de Ayuda en Emergencias

App web ligera para reunir suministros y necesidades durante un desastre natural.
La gente publica **lo que ofrece** o **lo que necesita** (categoría, ubicación, WhatsApp)
y otros lo contactan directo por WhatsApp. Sin login, sin registro.

- **Frontend:** HTML + CSS + JS puro (una sola carpeta `public/`). Se sirve como sitio estático.
- **Base de datos:** Supabase (Postgres). Gratis para empezar, aguanta bien picos de tráfico.
- **Hosting recomendado:** Cloudflare Pages (CDN global, gratis) o Vercel/Netlify.

---

## 1. Crear la base de datos (Supabase) — 5 min

1. Entra a https://supabase.com → **New project** (elige una región cercana, ej. South America).
2. Cuando esté listo, ve a **SQL Editor → New query**, pega TODO el contenido de
   `supabase/schema.sql` y pulsa **Run**. Esto crea la tabla, la vista pública y las funciones seguras.
3. Ve a **Project Settings → API** y copia dos valores:
   - **Project URL** → ej. `https://abcd1234.supabase.co`
   - **anon public key** (la `anon` / `public`, NO la `service_role`).

> La `anon key` es pública por diseño: solo puede leer la vista `items_public` (sin el código
> privado) y llamar a las 4 funciones. Nadie puede borrar/editar sin el código del autor.

## 2. Configurar la app — 1 min

Abre `public/config.js` y pega tus datos:

```js
SUPABASE_URL:      "https://abcd1234.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...tu_anon_key...",
```

También puedes cambiar el título (`HERO_TITLE`), el país por defecto, etc.
Para reusar en otro desastre, solo cambias estos textos.

## 3. Probar local — 1 min

No abras `index.html` con doble clic (los módulos JS necesitan un servidor). Usa:

```bash
cd public
python3 -m http.server 5173
# abre http://localhost:5173
```

(o `npx serve public`).

## 4. Publicar en Cloudflare Pages (recomendado)

**Opción A — desde la terminal (rápida):**
```bash
npm install -g wrangler
wrangler login
wrangler pages deploy public --project-name=doy-por-venezuela
```

**Opción B — desde GitHub (auto-deploy):**
1. Sube este repo a GitHub.
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build command: *(vacío)* · Output directory: `public`.
4. Deploy. Cada `git push` vuelve a publicar.

**Dominio propio:** en el proyecto de Pages → **Custom domains** → agrega `doyporvenezuela.com`
(si compraste el dominio en Cloudflare Registrar, se conecta solo).

### Alternativa: Vercel
```bash
npm i -g vercel
vercel --prod
# Output/Root directory: public
```

---

## ¿Aguanta un desastre con mucho tráfico?

- **Cloudflare Pages** sirve el sitio desde su CDN global: soporta picos enormes sin problema.
- **Supabase** free tier alcanza para arrancar. Si el evento crece mucho, sube a **Pro ($25/mes)**
  desde el dashboard sin cambiar código. El esquema ya trae índices por fecha y estado.
- La app **lee** de una vista cacheable y **escribe** poco (publicar / marcar). El refresco
  automático es cada 20s (ajustable en `config.js → POLL_MS`).

## Seguridad y datos

- Solo se guarda lo que el usuario publica. No hay cuentas ni tracking.
- El **código** de cada publicación nunca se expone: vive en la tabla pero la vista pública no lo incluye.
- "Ya no está disponible" lo puede tocar cualquiera (modelo comunitario, con confirmación 💛).
  Reabrir y borrar requieren el código del autor. Si prefieres que marcar tampoco sea abierto,
  cambia la función `mark_taken` para que también pida código.

## Estructura

```
doy-por-venezuela/
├── public/
│   ├── index.html      # estructura
│   ├── styles.css      # estilos
│   ├── config.js       # ← tus claves y textos
│   └── app.js          # lógica + Supabase
├── supabase/
│   └── schema.sql      # tabla + vista + funciones (ejecutar una vez)
├── CLAUDE.md           # contexto para Claude Code
└── README.md
```
