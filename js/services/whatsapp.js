/* ═══════════════════════════════════════════════════════════
   LULIS — services/whatsapp.js
   Centraliza toda la lógica de apertura de WhatsApp.
   El número y mensajes se leen desde config.js.
   ═══════════════════════════════════════════════════════════ */

(function initWhatsApp() {
  const config = window.LULIS_CONFIG;
  if (!config) {
    console.warn('LULIS: config.js no cargado antes de whatsapp.js');
    return;
  }

  /**
   * Abre WhatsApp con un mensaje pre-cargado para un producto.
   * @param {string} productName - Nombre del producto consultado.
   */
  function openWA(productName) {
    const msg = encodeURIComponent(config.whatsapp.messages.product(productName));
    window.open(`${config.whatsapp.baseUrl}?text=${msg}`, '_blank', 'noopener,noreferrer');
  }

  /* Exponer globalmente para llamadas directas */
  window.openWA = openWA;

  /* Delegación de eventos para todos los .product-wa (botones o enlaces)
     Funciona aunque los cards se generen dinámicamente en el futuro. */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.product-wa');
    if (!btn) return;
    e.preventDefault();
    const productName = btn.dataset.product || 'un producto LULIS';
    openWA(productName);
  });
})();
