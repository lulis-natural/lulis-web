/* ═══════════════════════════════════════════════════════════
   LULIS Admin — auth.js
   Guard de autenticación sin pantallas en blanco ni bloqueos.
   ═══════════════════════════════════════════════════════════ */

import { auth } from './firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// Asegurar visibilidad inmediata del body
document.body.style.visibility = 'visible';

// Verificar si hay sesión local activa
const isLocalAdmin = localStorage.getItem('lulis_admin_authenticated') === 'true';

if (isLocalAdmin) {
  populateUserUI({
    displayName: localStorage.getItem('lulis_admin_user') || 'Administrador',
    email: localStorage.getItem('lulis_admin_email') || 'admin@lulis.bo'
  });
} else {
  // Comprobar Firebase Auth con timeout de 3 segundos
  let resolved = false;
  const timeoutId = setTimeout(() => {
    if (!resolved && localStorage.getItem('lulis_admin_authenticated') !== 'true') {
      window.location.replace('index.html');
    }
  }, 3000);

  onAuthStateChanged(auth, (user) => {
    resolved = true;
    clearTimeout(timeoutId);
    if (user) {
      localStorage.setItem('lulis_admin_authenticated', 'true');
      localStorage.setItem('lulis_admin_user', user.displayName || user.email.split('@')[0]);
      localStorage.setItem('lulis_admin_email', user.email);
      populateUserUI(user);
    } else if (localStorage.getItem('lulis_admin_authenticated') !== 'true') {
      window.location.replace('index.html');
    }
  });
}

function populateUserUI(user) {
  const nameEls   = document.querySelectorAll('[data-user-name]');
  const emailEls  = document.querySelectorAll('[data-user-email]');
  const avatarEls = document.querySelectorAll('[data-user-avatar]');

  const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Admin');
  const initial     = displayName.charAt(0).toUpperCase();

  nameEls.forEach(el   => el.textContent = displayName);
  emailEls.forEach(el  => el.textContent = user.email || 'admin@lulis.bo');
  avatarEls.forEach(el => el.textContent = initial);

  initMenuToggle();
}

function initMenuToggle() {
  const toggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  sidebar.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      if (window.innerWidth <= 768) sidebar.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (window.innerWidth > 768) return;
    if (!sidebar.classList.contains('open')) return;
    if (sidebar.contains(e.target) || toggle.contains(e.target)) return;
    sidebar.classList.remove('open');
  });
}

export async function getCurrentUser() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user || { email: localStorage.getItem('lulis_admin_email') || 'admin@lulis.bo' });
    });
  });
}
