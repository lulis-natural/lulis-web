/* ═══════════════════════════════════════════════════════════
   LULIS — services/whatsapp.js
   Centraliza toda la lógica de apertura de WhatsApp.
   El número y mensajes se leen desde config.js.

   IMPORTANTE: Los botones .product-wa deben tener un href REAL
   con un mensaje genérico, para que funcionen incluso si este
   script no carga (cache viejo, JS deshabilitado, etc).
   ═══════════════════════════════════════════════════════════ */

(function initWhatsApp() {
  function buildUrl(productName) {
    const config = window.LULIS_CONFIG;
    if (!config || !config.whatsapp) {
      return 'https://wa.me/59173515698';
    }
    const msg = config.whatsapp.messages.product(productName || 'un producto LULIS');
    return `${config.whatsapp.baseUrl}?text=${encodeURIComponent(msg)}`;
  }

  function openWA(productName) {
    window.open(buildUrl(productName), '_blank', 'noopener,noreferrer');
  }

  /* Exponer globalmente para llamadas directas */
  window.openWA = openWA;

  /* Auto-reparar href de .product-wa (en caso de que el HTML esté cacheado sin href) */
  function fixWaLinks() {
    document.querySelectorAll('.product-wa').forEach(a => {
      const nombre = a.dataset.product || 'un producto LULIS';
      const url = buildUrl(nombre);
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixWaLinks);
  } else {
    fixWaLinks();
  }

  /* Re-aplicar a elementos dinámicos (cuando productos-publico.js inyecta cards) */
  const observer = new MutationObserver(() => fixWaLinks());
  observer.observe(document.body, { childList: true, subtree: true });

  /* Delegación de eventos: si tiene data-product, personalizar el mensaje;
     si no, dejar que el href funcione nativamente. */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.product-wa');
    if (!btn) return;
    const productName = btn.dataset.product;
    if (productName) {
      e.preventDefault();
      openWA(productName);
    }
    /* Si no tiene data-product, dejamos que el href funcione tal cual */
  });
})();
