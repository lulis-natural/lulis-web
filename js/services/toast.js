/* ═══════════════════════════════════════════════════════════
   LULIS — services/toast.js
   Notificaciones toast globales.
   Cargado antes que los módulos para que estén disponibles.
   ═══════════════════════════════════════════════════════════ */

(function initToast() {
  const duration = (window.LULIS_CONFIG && LULIS_CONFIG.toastDuration) || 3500;

  /**
   * Muestra un mensaje toast.
   * @param {string} msg  - Texto a mostrar.
   */
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = msg;
    toast.classList.add('show');

    setTimeout(() => toast.classList.remove('show'), duration);
  }

  /* Exponer globalmente para uso desde cualquier módulo */
  window.showToast = showToast;
})();
