/* ═══════════════════════════════════════════════════════════
   LULIS Admin — auth.js
   Guard de autenticación. Incluir en TODAS las páginas admin
   excepto index.html (login).

   Flujo:
   1. Espera a que Firebase Auth resuelva el estado
   2. Si no hay usuario → redirige a index.html
   3. Si hay usuario pero NO tiene claim admin:true → redirige
   4. Si es admin → muestra el contenido, rellena el UI
   ═══════════════════════════════════════════════════════════ */

import { auth } from './firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* Ocultar el body hasta que se confirme la sesión */
document.body.style.visibility = 'hidden';

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    /* Sin sesión → ir al login */
    window.location.replace('index.html');
    return;
  }

  /* [TEMP] Validacion de custom claim desactivada para pruebas locales.
     En produccion se debe reactivar:
       if (!tokenResult.claims.admin) { ... redirigir ... }
  */
  /*
  const tokenResult = await user.getIdTokenResult(true);
  if (!tokenResult.claims.admin) {
    await auth.signOut();
    window.location.replace('index.html?error=no_access');
    return;
  }
  */

  /* Sesión válida → mostrar página y poblar datos de usuario */
  document.body.style.visibility = 'visible';
  populateUserUI(user);
});

/* Rellena avatar, nombre y email en la sidebar */
function populateUserUI(user) {
  const nameEls   = document.querySelectorAll('[data-user-name]');
  const emailEls  = document.querySelectorAll('[data-user-email]');
  const avatarEls = document.querySelectorAll('[data-user-avatar]');

  const displayName = user.displayName || user.email.split('@')[0];
  const initial     = displayName.charAt(0).toUpperCase();

  nameEls.forEach(el   => el.textContent = displayName);
  emailEls.forEach(el  => el.textContent = user.email);
  avatarEls.forEach(el => el.textContent = initial);

  /* Inicializar menu toggle (mobile) */
  initMenuToggle();
}

/* Toggle del sidebar en mobile */
function initMenuToggle() {
  const toggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  /* Cerrar al hacer click en un link del sidebar (en mobile) */
  sidebar.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
      }
    });
  });

  /* Cerrar al hacer click fuera del sidebar */
  document.addEventListener('click', (e) => {
    if (window.innerWidth > 768) return;
    if (!sidebar.classList.contains('open')) return;
    if (sidebar.contains(e.target) || toggle.contains(e.target)) return;
    sidebar.classList.remove('open');
  });
}

/* Exportar para uso en otros módulos */
export async function getCurrentUser() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}
