/* ═══════════════════════════════════════════════════════════
   LULIS — services/firebase-init.js
   Inicialización centralizada de Firebase para el sitio público.
   Lee la config desde LULIS_CONFIG y expone db + helpers.
   ═══════════════════════════════════════════════════════════ */

(function (global) {
  'use strict';

  const cfg = (typeof LULIS_CONFIG !== 'undefined') ? LULIS_CONFIG : {};

  const firebaseConfig = {
    apiKey:            "AIzaSyA0yateWGV_ExUiWli56VcB_o1xmWNJGIY",
    authDomain:        "lulis-web.firebaseapp.com",
    projectId:         "lulis-web",
    storageBucket:     "lulis-web.firebasestorage.app",
    messagingSenderId: "170393764293",
    appId:             "1:170393764293:web:c09fc4040e4987691a8bac",
    measurementId:     "G-N8D4L73T1N"
  };

  // Cargar SDKs de Firebase desde CDN (modernos, no-modules para el sitio público)
  if (typeof firebase === 'undefined') {
    console.warn('LULIS: Firebase SDK no cargó. Verifica la conexión a internet.');
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    global.LULIS_FB = {
      app:   firebase.app(),
      db:    firebase.firestore(),
      auth:  firebase.auth(),
      ready: true
    };
    console.info('LULIS: Firebase inicializado (project=' + firebaseConfig.projectId + ')');
  } catch (err) {
    console.warn('LULIS: Error inicializando Firebase:', err && err.message);
  }

})(window);
