/* ═══════════════════════════════════════════════════════════
   LULIS — modules/navbar.js
   Maneja el scroll del navbar y el menú móvil.
   ═══════════════════════════════════════════════════════════ */

(function initNavbar() {
  const navbar     = document.getElementById('navbar');
  const mobileMenu = document.getElementById('mobileMenu');
  const hamburger  = document.getElementById('hamburgerBtn') || document.querySelector('.hamburger');
  const closeBtn   = document.getElementById('menuCloseBtn') || document.querySelector('.mobile-close');

  if (!navbar || !mobileMenu || !hamburger) return;

  /* ── Scroll: añade clase .scrolled al navbar ── */
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  /* ── Toggle del menú móvil ── */
  function toggleMenu() {
    const isOpen = mobileMenu.classList.toggle('open');
    document.body.classList.toggle('menu-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  }

  /* Exponer función para los onclick del HTML */
  window.toggleMenu = toggleMenu;

  /* Event listener en el botón hamburger (FIX: no tenía onclick en el HTML) */
  hamburger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  /* Event listener en el botón cerrar */
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });
  }

  /* Cerrar al clickear un link del menu */
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      if (mobileMenu.classList.contains('open')) toggleMenu();
    });
  });

  /* Cerrar al hacer click fuera del menu */
  document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('open')
        && !mobileMenu.contains(e.target)
        && !hamburger.contains(e.target)) {
      toggleMenu();
    }
  });

  /* Cerrar con tecla Escape */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      toggleMenu();
    }
  });
})();
