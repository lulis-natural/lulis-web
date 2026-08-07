/* ═══════════════════════════════════════════════════════════
   LULIS — services/firebase.js
   Punto de entrada Firebase para el sitio público.
   Carga los SDKs (modo compat) e inicializa la app.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // Cargar Firebase compat SDK (no requiere bundler)
  const scripts = [
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js'
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload  = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar ' + src));
      document.head.appendChild(s);
    });
  }

  async function init() {
    for (const s of scripts) {
      try { await loadScript(s); }
      catch (e) { console.warn('LULIS: ' + e.message); return; }
    }
    // Una vez cargados los SDKs, ejecutar firebase-init.js
    const initScript = document.createElement('script');
    initScript.src = 'js/services/firebase-init.js';
    document.head.appendChild(initScript);
  }

  init();
})();
