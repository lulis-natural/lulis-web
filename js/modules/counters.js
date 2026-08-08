/* ═══════════════════════════════════════════════════════════
   LULIS — modules/counters.js
   Animación de contadores en las estadísticas del hero.
   ═══════════════════════════════════════════════════════════ */

(function initCounters() {
  const heroSection = document.getElementById('hero');
  if (!heroSection) return;

  const duration = (window.LULIS_CONFIG && LULIS_CONFIG.counterDuration) || 1800;

  function animateCounter(el) {
    const original = el.textContent;
    const num      = parseFloat(original.replace(/[^0-9.]/g, ''));
    if (!num || num > 10000) return;

    const suffix = original.replace(/[0-9.]/g, '');
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const value    = num < 10
        ? (eased * num).toFixed(1)
        : Math.floor(eased * num);

      el.textContent = value + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = original; /* restaurar texto original exacto */
      }
    }

    requestAnimationFrame(step);
  }

  function animateAll() {
    document
      .querySelectorAll('.hero-stat-num:not([data-impact])')
      .forEach(animateCounter);
  }

  /* Sólo animar cuando el hero es visible */
  const heroObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateAll();
      heroObserver.disconnect();
    }
  }, { threshold: 0.3 });

  heroObserver.observe(heroSection);
})();
