/* ═══════════════════════════════════════════════════════════
   LULIS — modules/gallery-pager.js (v2)
   Galería dinámica sincronizada con Firestore REST API + LocalStorage
   - Lee fotos subidas en tiempo real desde /admin/galeria.html
   - Renderiza fotos con overlay interactivo
   - Paginación dinámica de 6 items por página
   ═══════════════════════════════════════════════════════════ */

(function initDynamicGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  const pager = document.getElementById('galleryPager');
  if (!pager) return;

  const CACHE_KEY = 'lulis_galeria_cache_v2';
  const FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/lulis-web/databases/(default)/documents/galeria';

  const defaultItems = [
    { foto: 'Imagenes/productos/Jamaica y romero.jpg', alt: 'Shampoos sólidos de Jamaica y Romero LULIS' },
    { foto: 'Imagenes/galeria/alianza_renova_paper.jpeg', alt: 'Alianza LULIS con Renova Paper — packaging sostenible' },
    { foto: 'Imagenes/productos/Pack_romero_y_melon.jpeg', alt: 'Pack Shampoo Romero y Acondicionador Melón LULIS' },
    { foto: 'Imagenes/galeria/packagin.jpeg', alt: 'Packaging de papel orgánico con semillas LULIS' },
    { foto: 'Imagenes/logos/LOGO.jpg', alt: 'Logotipo LULIS — Cosmética Consciente Bolivia' },
    { foto: 'Imagenes/productos/Jamaica.jpg', alt: 'Shampoo sólido Jamaica LULIS' }
  ];

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function parseFirestoreDoc(doc) {
    const fields = doc.fields || {};
    const getVal = (f) => {
      if (!f) return null;
      if (f.stringValue !== undefined) return f.stringValue;
      if (f.integerValue !== undefined) return parseInt(f.integerValue, 10);
      if (f.doubleValue !== undefined) return parseFloat(f.doubleValue);
      if (f.booleanValue !== undefined) return f.booleanValue;
      return null;
    };
    return {
      id: doc.name ? doc.name.split('/').pop() : '',
      foto: getVal(fields.foto) || '',
      alt: getVal(fields.alt) || 'Galería LULIS',
      categoria: getVal(fields.categoria) || 'general',
      activo: getVal(fields.activo) !== false,
      orden: getVal(fields.orden) !== null ? getVal(fields.orden) : 99
    };
  }

  function renderGallery(photos) {
    if (!photos || photos.length === 0) photos = defaultItems;
    grid.innerHTML = photos.map(item => `
      <div class="gallery-item">
        <div class="gallery-img">
          <img src="${escapeHtml(item.foto)}" alt="${escapeHtml(item.alt)}" width="400" height="320" loading="lazy">
        </div>
        <div class="gallery-overlay" aria-hidden="true">
          <span class="gallery-overlay-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
        </div>
      </div>
    `).join('');

    setupPagination();
  }

  function setupPagination() {
    const items = Array.from(grid.querySelectorAll('.gallery-item'));
    const perPage = parseInt(grid.dataset.perPage || '6', 10);
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    const currentPageSpan = document.getElementById('galleryCurrentPage');
    const totalPagesSpan = document.getElementById('galleryTotalPages');
    const btnPrev = pager.querySelector('[data-action="prev"]');
    const btnNext = pager.querySelector('[data-action="next"]');

    if (totalPagesSpan) totalPagesSpan.textContent = String(totalPages);

    function showPage(page) {
      page = Math.max(1, Math.min(totalPages, page));
      items.forEach((item, i) => {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        item.classList.toggle('hidden', i < start || i >= end);
      });
      if (currentPageSpan) currentPageSpan.textContent = String(page);
      grid.dataset.page = String(page);
      if (btnPrev) btnPrev.disabled = page === 1;
      if (btnNext) btnNext.disabled = page === totalPages;
    }

    if (btnPrev) {
      btnPrev.onclick = () => showPage(parseInt(grid.dataset.page, 10) - 1);
    }
    if (btnNext) {
      btnNext.onclick = () => showPage(parseInt(grid.dataset.page, 10) + 1);
    }

    showPage(1);
  }

  // Carga inicial desde cache
  let loadedFromCache = false;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const active = parsed.filter(x => x.activo !== false && x.foto);
        if (active.length > 0) {
          renderGallery(active);
          loadedFromCache = true;
        }
      }
    }
  } catch (e) {
    console.warn('[Galeria] Error leyendo cache:', e);
  }

  // Sincronización en vivo con Firestore REST API
  fetch(FIRESTORE_URL + '?pageSize=50')
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(data => {
      if (data && data.documents && data.documents.length > 0) {
        const items = data.documents
          .map(parseFirestoreDoc)
          .filter(x => x.activo && x.foto)
          .sort((a, b) => (a.orden || 99) - (b.orden || 99));

        if (items.length > 0) {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(items));
          } catch (e) {}
          renderGallery(items);
          return;
        }
      }
      if (!loadedFromCache) setupPagination();
    })
    .catch(err => {
      console.warn('[Galeria] Fallback a elementos locales:', err);
      if (!loadedFromCache) setupPagination();
    });
})();
