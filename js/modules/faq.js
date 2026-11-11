/* ═══════════════════════════════════════════════════════════
   LULIS — modules/faq.js
   Accordion interactivo fluido para Preguntas Frecuentes.
   Permite abrir y cerrar individualmente con fluidez total.
   ═══════════════════════════════════════════════════════════ */

(function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  function closeItem(item) {
    if (!item) return;
    item.classList.remove('open');
    item.setAttribute('aria-expanded', 'false');
    const answer = item.querySelector('.faq-answer');
    if (answer) {
      answer.style.maxHeight = '0px';
    }
  }

  function openItem(item) {
    if (!item) return;
    item.classList.add('open');
    item.setAttribute('aria-expanded', 'true');
    const answer = item.querySelector('.faq-answer');
    if (answer) {
      answer.style.maxHeight = (answer.scrollHeight + 40) + 'px';
    }
  }

  function toggleFAQ(item) {
    if (!item) return;
    const isCurrentlyOpen = item.classList.contains('open');

    // Cerrar los demás items para mantener orden visual
    items.forEach((other) => {
      if (other !== item && other.classList.contains('open')) {
        closeItem(other);
      }
    });

    if (isCurrentlyOpen) {
      closeItem(item);
    } else {
      openItem(item);
    }
  }

  /* Exponer globalmente */
  window.toggleFAQ = toggleFAQ;

  items.forEach((item) => {
    /* Click */
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFAQ(item);
    });

    /* Teclado: Enter / Espacio */
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        toggleFAQ(item);
      }
    });
  });

  // Ajustar altura en resize si hay una abierta
  window.addEventListener('resize', () => {
    const openOne = document.querySelector('.faq-item.open');
    if (openOne) {
      const answer = openOne.querySelector('.faq-answer');
      if (answer) {
        answer.style.maxHeight = (answer.scrollHeight + 40) + 'px';
      }
    }
  });
})();
