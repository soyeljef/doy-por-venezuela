// ============================================================
//  CONFIGURACIÓN — edita solo este archivo para personalizar
// ============================================================
//  1) Pega aquí tus datos de Supabase (Project Settings > API)
//  2) Cambia los textos de marca si lo reutilizas en otro desastre
// ============================================================

window.APP_CONFIG = {
  // --- Supabase (OBLIGATORIO) ---
  SUPABASE_URL:      "https://undnvfgmwljzuaqlbnhr.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_ykB6FtAA1c5IAp9RP2DFDA_RwPMeLfV",

  // --- Marca / textos ---
  BRAND:          "Juntos Ayudando",
  EYEBROW:        "Red de ayuda mutua · Emergencias",
  HERO_TITLE:     "Ayudémonos entre todos 🤝",
  HERO_SUBTITLE:  "Una web para reunir suministros, cubrir necesidades y reencontrar personas cuando ocurre una emergencia. Publica lo que ofreces, lo que necesitas o a quién buscas, y coordinas directo por WhatsApp. Sin cuentas, sin registro.",

  // --- Ubicación por defecto ---
  // Solo son la preselección de los formularios: la web funciona en cualquier país.
  DEFAULT_COUNTRY: "Venezuela",
  DEFAULT_CC:      "58",        // código WhatsApp preseleccionado (+58)

  // --- Personas (buscar / encontrar) ---
  // Se busca y se ubica gente sobre todo desde Colombia, así que ese panel
  // arranca en Colombia. Si el usuario elige otro país, se respeta su elección.
  PERSONAS_COUNTRY: "Colombia",
  PERSONAS_CC:      "57",

  // --- Comportamiento ---
  POLL_MS: 20000                // cada cuántos ms refresca la web (20s)
};
