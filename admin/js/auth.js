/* ═══════════════════════════════════════════════════════════
   LULIS Admin — auth.js
   Guard de autenticación garantizado con rutas absolutas.
   ═══════════════════════════════════════════════════════════ */

// Asegurar visibilidad inmediata del body (NUNCA OCULTAR)
document.body.style.visibility = 'visible';

// Verificar sesión
var isAuth = localStorage.getItem('lulis_admin_authenticated') === 'true';

if (isAuth) {
  var userName = localStorage.getItem('lulis_admin_user') || 'Administrador';
  var userEmail = localStorage.getItem('lulis_admin_email') || 'admin@lulis.bo';
  populateUserUI({ displayName: userName, email: userEmail });
} else {
  // RUTA ABSOLUTA para evitar errores de subcarpeta
  window.location.replace('/admin/index.html');
}

function populateUserUI(user) {
  var nameEls   = document.querySelectorAll('[data-user-name]');
  var emailEls  = document.querySelectorAll('[data-user-email]');
  var avatarEls = document.querySelectorAll('[data-user-avatar]');

  var displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Admin');
  var initial     = displayName.charAt(0).toUpperCase();

  nameEls.forEach(function(el) { el.textContent = displayName; });
  emailEls.forEach(function(el) { el.textContent = user.email || 'admin@lulis.bo'; });
  avatarEls.forEach(function(el) { el.textContent = initial; });

  initMenuToggle();

  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = function() {
      localStorage.removeItem('lulis_admin_authenticated');
      localStorage.removeItem('lulis_admin_user');
      localStorage.removeItem('lulis_admin_email');
      window.location.replace('/admin/index.html');
    };
  }
}

function initMenuToggle() {
  var toggle = document.getElementById('menuToggle');
  var sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;

  toggle.onclick = function() {
    sidebar.classList.toggle('open');
  };

  sidebar.querySelectorAll('a').forEach(function(a) {
    a.onclick = function() {
      if (window.innerWidth <= 768) sidebar.classList.remove('open');
    };
  });
}
