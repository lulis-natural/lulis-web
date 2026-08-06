/* ═══════════════════════════════════════════════════════════
   LULIS — modules/faq.js
   Accordion de preguntas frecuentes (solo una abierta a la vez).
   ═══════════════════════════════════════════════════════════ */

(function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  function closeAll() {
    items.forEach((item) => {
      item.classList.remove('open');
      item.setAttribute('aria-expanded', 'false');
      const answer = item.querySelector('.faq-answer');
      if (answer) answer.style.maxHeight = '0';
    });
  }

  function openItem(item) {
    item.classList.add('open');
    item.setAttribute('aria-expanded', 'true');
    const answer = item.querySelector('.faq-answer');
    if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
  }

  function toggleFAQ(item) {
    const isOpen = item.classList.contains('open');
    closeAll();
    if (!isOpen) openItem(item);
  }

  /* Exponer para posibles llamadas externas */
  window.toggleFAQ = toggleFAQ;

  items.forEach((item) => {
    /* Click */
    item.addEventListener('click', () => toggleFAQ(item));

    /* Teclado: Enter / Espacio */
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFAQ(item);
      }
    });
  });
})();
