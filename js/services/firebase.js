/* ═══════════════════════════════════════════════════════════
   LULIS — services/firebase.js
   Configuración centralizada de Firebase para el sitio web.
   ═══════════════════════════════════════════════════════════ */

const LULIS_FIREBASE_CONFIG = {
  apiKey:            "AIzaSyA0yateWGV_ExUiWli56VcB_o1xmWNJGIY",
  authDomain:        "lulis-web.firebaseapp.com",
  projectId:         "lulis-web",
  storageBucket:     "lulis-web.firebasestorage.app",
  messagingSenderId: "170393764293",
  appId:             "1:170393764293:web:c09fc4040e4987691a8bac",
  measurementId:     "G-N8D4L73T1N"
};

window.LULIS_FIREBASE_CONFIG = LULIS_FIREBASE_CONFIG;
console.info('LULIS: Firebase configurado correctamente.');
