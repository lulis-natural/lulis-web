/* ═══════════════════════════════════════════════════════════
   LULIS — modules/productos-publico.js
   Catálogo público en la landing:
   - Filtros instantáneos por categoría (Todos, Shampoos, Acondicionadores, Packs)
   - Sincronización segura con Firebase Firestore (sin pantallas en blanco)
   - Enlace directo a WhatsApp con mensaje personalizado
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const GRID_ID = 'catalogProductsGrid';
  const FILTERS_ID = 'catalogFilters';

  function initFilters() {
    const filtersContainer = document.getElementById(FILTERS_ID);
    const grid = document.getElementById(GRID_ID);
    if (!filtersContainer || !grid) return;

    const buttons = filtersContainer.querySelectorAll('.filter-btn');
    const cards = grid.querySelectorAll('.product-card');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter') || 'all';

        // Actualizar clase activa en botones
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filtrar productos con animación suave
        cards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.style.display = 'flex';
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            setTimeout(() => {
              card.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
              card.style.opacity = '1';
              card.style.transform = 'none';
            }, 30);
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // Sincronización con Firestore (enriquecimiento opcional sin borrar nada)
  function syncFirestore() {
    if (!window.LULIS_FB || !window.LULIS_FB.db) return;

    window.LULIS_FB.db.collection('productos')
      .get()
      .then(snap => {
        if (!snap || snap.empty) return;

        const liveProducts = {};
        snap.forEach(doc => {
          const data = doc.data();
          const cleanName = (data.nombre || '').toLowerCase().trim();
          liveProducts[cleanName] = data;
        });

        // Actualizar precios y disponibilidad en las tarjetas existentes
        const grid = document.getElementById(GRID_ID);
        if (!grid) return;

        const cards = grid.querySelectorAll('.product-card');
        cards.forEach(card => {
          const cardName = (card.getAttribute('data-name') || '').toLowerCase().trim();
          // Buscar coincidencia en productos live
          const matched = Object.keys(liveProducts).find(k => cardName.includes(k) || k.includes(cardName));
          if (matched && liveProducts[matched]) {
            const p = liveProducts[matched];
            if (p.precio) {
              const priceEl = card.querySelector('.product-price strong');
              if (priceEl) priceEl.textContent = p.precio;
            }
            if (p.disponible === false) {
              const availEl = card.querySelector('.product-avail');
              if (availEl) {
                availEl.className = 'product-avail avail-no';
                availEl.innerHTML = '<span class="avail-dot" aria-hidden="true"></span> Agotado temporalmente';
              }
            }
          }
        });
      })
      .catch(err => {
        // En caso de cualquier error de red o permisos, el catálogo pre-renderizado se mantiene 100% visible
        console.warn('LULIS catálogo: usando catálogo pre-renderizado', err && err.message);
      });
  }

  // Inicialización cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initFilters();
      setTimeout(syncFirestore, 800);
    });
  } else {
    initFilters();
    setTimeout(syncFirestore, 800);
  }
})();
