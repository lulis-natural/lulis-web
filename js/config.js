/* ═══════════════════════════════════════════════════════════
   LULIS — config.js
   Fuente única de verdad para todas las constantes.
   Cambiar un valor aquí lo actualiza en todo el sitio.
   ═══════════════════════════════════════════════════════════ */

const LULIS_CONFIG = {
  /* ── Firebase ──────────────────────────────────────────────
     👇 PEGA AQUÍ EL ID DE TU PROYECTO FIREBASE 👇
     Lo encuentras en: Firebase Console → Project Settings → General
     Se usa para leer las métricas de impacto en tiempo real.
     Ejemplo: "lulis-app"                                      */
  firebaseProjectId: 'TU_PROYECTO_FIREBASE',   /* ← COMPLETAR antes de desplegar  */

  /* Contacto */
  whatsapp: {
    number: '59173515698',
    baseUrl: 'https://wa.me/59173515698',
    messages: {
      default:  'Hola LULIS 👋 Me interesa saber más sobre sus productos.',
      product:  (name) => `Hola LULIS 👋 Me interesa el producto: ${name}. ¿Podría darme más información?`,
      hero:     'Hola LULIS%2C%20me%20interesa%20saber%20más%20sobre%20sus%20productos',
      float:    'Hola%20LULIS%2C%20quisiera%20información%20sobre%20sus%20productos',
    },
  },
  email: 'lulis.natural@gmail.com',   /* ← Cambiar al email real de la marca */

  /* Redes sociales */
  social: {
    instagram: 'https://www.instagram.com/lulis.natural?igsh=c3l1dmRkenM3eDR6',
    facebook:  'https://www.facebook.com/share/14iBbMU7oS6/',
    tiktok:    'https://tiktok.com/@lulis.natural',
  },

  /* Scroll reveal - umbral de visibilidad */
  revealThreshold: 0.12,

  /* Duración de animación de contadores (ms) */
  counterDuration: 1800,

  /* Duración del toast (ms) */
  toastDuration: 3500,
};

/* Exportar para uso en módulos ES (preparado para bundler/Firebase) */
/* En el sitio estático actual se usa como variable global */
