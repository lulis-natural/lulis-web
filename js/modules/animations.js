/* ═══════════════════════════════════════════════════════════
   LULIS — modules/animations.js
   IntersectionObserver para el reveal de elementos al scroll.
   ═══════════════════════════════════════════════════════════ */

(function initScrollReveal() {
  const threshold = (window.LULIS_CONFIG && LULIS_CONFIG.revealThreshold) || 0.12;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold });

  document
    .querySelectorAll('.reveal, .reveal-left, .reveal-right')
    .forEach((el) => observer.observe(el));
})();
