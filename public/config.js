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
  BRAND:          "Voy por Venezuela",
  EYEBROW:        "Red de ayuda · Emergencia",
  HERO_TITLE:     "Ayudemos a Venezuela",
  HERO_SUBTITLE:  "Un tablón para reunir suministros y cubrir necesidades en la emergencia. Publica lo que ofreces o lo que necesitas, y se coordina directo por WhatsApp. Sin cuentas, sin registro.",

  // --- Ubicación por defecto ---
  DEFAULT_COUNTRY: "Venezuela",
  DEFAULT_CC:      "58",        // código WhatsApp por defecto (+58 Venezuela)

  // --- Comportamiento ---
  POLL_MS: 20000                // cada cuántos ms refresca el tablón (20s)
};
