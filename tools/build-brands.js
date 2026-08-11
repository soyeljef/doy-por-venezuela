/**
 * Genera un HTML por marca a partir de public/index.html.
 *
 * ¿Por qué existe esto? WhatsApp, Facebook y Telegram leen las etiquetas
 * Open Graph SIN ejecutar JavaScript. Como los tres dominios comparten un
 * único index.html, sin este paso todos mostrarían la tarjeta de la marca
 * por defecto: alguien compartiendo el enlace de la Fundación Falcao vería
 * una previsualización que dice "Juntos Ayudando". Y esta web se comparte
 * justamente por WhatsApp.
 *
 * index.html sigue siendo el ÚNICO archivo que se edita a mano (y el que se
 * abre en local). Este script solo escribe copias derivadas, así que no hay
 * dos ficheros que mantener en sincronía ni riesgo de que se desincronicen.
 */
const fs = require("fs");
const path = require("path");

const PUB = path.join(__dirname, "..", "public");
const SRC = path.join(PUB, "index.html");

// Una entrada por marca que NO sea la de index.html (esa ya está servida tal cual).
const MARCAS = [
  {
    archivo: "colombia.html",
    nombre:  "Juntos por Colombia",
    url:     "https://juntosporcolombia.fundacionfalcao.org/",
    imagen:  "https://juntosporcolombia.fundacionfalcao.org/og-colombia.png",
    color:   "#123E86",
    desc:    "Publica lo que ofreces, lo que necesitas o a quién buscas durante una emergencia, y coordina directo por WhatsApp. Sin cuentas, sin registro. Con el apoyo de la Fundación Falcao."
  }
];

// Reemplaza el atributo `content` (o href/el texto del title) de una etiqueta concreta.
function meta(html, patron, valor) {
  const re = new RegExp(`(${patron}[^>]*?content=")[^"]*(")`, "i");
  if (!re.test(html)) throw new Error(`No se encontró la etiqueta: ${patron}`);
  return html.replace(re, `$1${valor}$2`);
}

function construir(m) {
  let h = fs.readFileSync(SRC, "utf8");
  const titulo = `${m.nombre} — Red de ayuda mutua en emergencias`;

  h = h.replace(/<title>[^<]*<\/title>/i, `<title>${titulo}</title>`);
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/i, `$1${m.url}$2`);
  h = meta(h, '<meta name="description"',      m.desc);
  h = meta(h, '<meta property="og:url"',       m.url);
  h = meta(h, '<meta property="og:site_name"', m.nombre);
  h = meta(h, '<meta property="og:title"',     titulo);
  h = meta(h, '<meta property="og:description"', m.desc);
  h = meta(h, '<meta property="og:image"',     m.imagen);
  h = meta(h, '<meta name="theme-color"',      m.color);

  fs.writeFileSync(path.join(PUB, m.archivo), h);
  console.log(`  ✓ ${m.archivo} — ${titulo}`);
}

console.log("Generando HTML por marca desde public/index.html:");
MARCAS.forEach(construir);
console.log("Listo.");
