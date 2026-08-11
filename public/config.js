// ============================================================
//  CONFIGURACIÓN — edita solo este archivo para personalizar
// ============================================================
//  UNA sola web sirve a VARIOS dominios. Todos comparten la MISMA
//  base de datos de Supabase, asi que lo que se publica en cualquiera
//  aparece al instante en los tres. Lo unico que cambia por dominio
//  es la marca: nombre, textos, colores y bloques opcionales.
//
//  Para probar un tema en local:  http://localhost:5173/?brand=colombia
// ============================================================

(function () {
  // --- Lo que comparten TODOS los dominios (incluida la base de datos) ---
  var BASE = {
    SUPABASE_URL:      "https://undnvfgmwljzuaqlbnhr.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable_ykB6FtAA1c5IAp9RP2DFDA_RwPMeLfV",

    DEFAULT_COUNTRY:  "Colombia",
    DEFAULT_CC:       "57",
    PERSONAS_COUNTRY: "Colombia",
    PERSONAS_CC:      "57",

    POLL_MS: 20000,          // cada cuántos ms refresca la web
    THEME:   "verde",        // tema visual por defecto
    CREDIT:  'Creado sin ánimo de lucro ni ningún fin comercial por <strong>Jef</strong> · <a href="https://instagram.com/soyeljef" target="_blank" rel="noopener">@soyeljef</a>',
    SUPPORT:  null,          // bloque "Apoya" (logo aliado). null = oculto
    DONATION: null           // bloque de donación en efectivo. null = oculto
  };

  // --- Datos de donación de la Fundación Falcao ---
  // Se muestran tal cual en la web. La cuenta y el QR son de la fundación:
  // el dinero va DIRECTO a ella, esta web no intermedia ningún pago.
  var DONACION_FALCAO = {
    ORG:       "Fundación Falcao",
    NIT:       "900.749.311",
    BANCO:     "BBVA Colombia",
    TIPO:      "Cuenta de Ahorros Empresarial",
    CUENTA_16: "0479000200010964",
    CUENTA_10: "0479010964",
    CUENTA_9:  "479010964",
    QR:        "./qr-falcao.png",
    MID:       "0092811176",
    TERMINAL:  "000",
    NOTA:      "Todos los recursos son gestionados directamente por la Fundación Falcao. Esta web no recibe, administra ni intermedia ningún dinero."
  };

  // --- Marca por dominio ---
  var BRANDS = {
    "juntosporcolombia.fundacionfalcao.org": {
      BRAND:         "Juntos por Colombia",
      EYEBROW:       "Red de ayuda mutua · Emergencias",
      HERO_TITLE:    "Ayudémonos entre todos 🤝",
      HERO_SUBTITLE: "Una web para reunir suministros, cubrir necesidades y reencontrar personas cuando ocurre una emergencia. Publica lo que ofreces, lo que necesitas o a quién buscas, y coordinas directo por WhatsApp. Sin cuentas, sin registro.",
      THEME:         "azul",
      CREDIT:        'Creado sin ánimo de lucro ni ningún fin comercial · Desarrollado por Jef Riveros en colaboración con @fundacionfalcao',
      SUPPORT:       { LABEL: "Apoya", LOGO: "./logofundacionfalcao2.png", ALT: "Fundación Falcao" },
      DONATION:      DONACION_FALCAO
    },

    "juntosayudando.com": {
      BRAND:         "Juntos Ayudando",
      EYEBROW:       "Red de ayuda mutua · Emergencias",
      HERO_TITLE:    "Ayudémonos entre todos 🤝",
      HERO_SUBTITLE: "Una web para reunir suministros, cubrir necesidades y reencontrar personas cuando ocurre una emergencia. Publica lo que ofreces, lo que necesitas o a quién buscas, y coordinas directo por WhatsApp. Sin cuentas, sin registro."
    },

    "voyporvenezuela.com": {
      BRAND:         "Juntos Ayudando",
      EYEBROW:       "Red de ayuda mutua · Emergencias",
      HERO_TITLE:    "Ayudémonos entre todos 🤝",
      HERO_SUBTITLE: "Una web para reunir suministros, cubrir necesidades y reencontrar personas cuando ocurre una emergencia. Publica lo que ofreces, lo que necesitas o a quién buscas, y coordinas directo por WhatsApp. Sin cuentas, sin registro."
    }
  };

  var FALLBACK = "juntosayudando.com";

  // --- Resolución de la marca ---
  var host = (location.hostname || "").replace(/^www\./, "").toLowerCase();
  var forced = null;
  try {
    var q = new URLSearchParams(location.search).get("brand");
    if (q === "colombia") forced = "juntosporcolombia.fundacionfalcao.org";
    else if (q === "juntos") forced = "juntosayudando.com";
  } catch (e) {}

  var key = forced || (BRANDS[host] ? host : FALLBACK);
  var cfg = {};
  for (var k in BASE) cfg[k] = BASE[k];
  for (var k2 in BRANDS[key]) cfg[k2] = BRANDS[key][k2];

  window.APP_CONFIG = cfg;

  // Se aplica antes de pintar para que no haya parpadeo de color.
  document.documentElement.setAttribute("data-brand", cfg.THEME || "verde");
})();
