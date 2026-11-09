/* ═══════════════════════════════════════════════════════════
   LULIS — catalogo-page.js
   Lógica interactiva de la página de catálogo (catalogo.html).
   Buscador, filtros de categoría y tipo de cabello, modal de detalle.
   ═══════════════════════════════════════════════════════════ */

(function initCatalogoPage() {
  const grid = document.getElementById('catalogGrid');
  const searchInput = document.getElementById('catalogSearchInput');
  const countEl = document.getElementById('catalogCount');
  const emptyState = document.getElementById('catalogEmpty');
  const pills = document.querySelectorAll('.cat-pill');
  const hairSelect = document.getElementById('catalogHairFilter');

  // Modal elementos
  const modalBackdrop = document.getElementById('quickViewModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalImg = document.getElementById('modalImg');
  const modalName = document.getElementById('modalName');
  const modalVariante = document.getElementById('modalVariante');
  const modalCat = document.getElementById('modalCat');
  const modalPrice = document.getElementById('modalPrice');
  const modalDuracion = document.getElementById('modalDuracion');
  const modalHair = document.getElementById('modalHair');
  const modalDesc = document.getElementById('modalDesc');
  const modalIngredientes = document.getElementById('modalIngredientes');
  const modalModoUso = document.getElementById('modalModoUso');
  const modalWaBtn = document.getElementById('modalWaBtn');

  if (!grid) return;

  let allProducts = [];
  let currentCategory = 'todos';
  let currentSearch = '';
  let currentHairType = 'todos';

  // 1. Cargar productos desde LulisCatalog
  async function load() {
    if (window.LulisCatalog) {
      allProducts = await window.LulisCatalog.getAllProducts();
    } else {
      console.warn('LulisCatalog no cargado');
    }
    render();
  }

  // 2. Renderizar productos filtrados
  function render() {
    const search = currentSearch.toLowerCase().trim();

    const filtered = allProducts.filter(p => {
      // Filtro categoría
      let matchCat = true;
      if (currentCategory !== 'todos') {
        const cat = (p.categoria || '').toLowerCase();
        if (currentCategory === 'shampoo') matchCat = cat.includes('shampoo');
        else if (currentCategory === 'acondicionador') matchCat = cat.includes('acond');
        else if (currentCategory === 'pack') matchCat = cat.includes('pack') || cat.includes('duo');
      }

      // Filtro tipo de cabello
      let matchHair = true;
      if (currentHairType !== 'todos') {
        const hairs = Array.isArray(p.tipoCabello) ? p.tipoCabello : [];
        matchHair = hairs.includes(currentHairType) || hairs.includes('todos');
      }

      // Filtro búsqueda
      let matchSearch = true;
      if (search) {
        const name = (p.nombre || '').toLowerCase();
        const desc = (p.descripcion || '').toLowerCase();
        const variante = (p.variante || '').toLowerCase();
        const ing = (p.ingredientes || '').toLowerCase();
        matchSearch = name.includes(search) || desc.includes(search) || variante.includes(search) || ing.includes(search);
      }

      return matchCat && matchHair && matchSearch;
    });

    if (countEl) {
      countEl.textContent = `${filtered.length} producto${filtered.length === 1 ? '' : 's'} disponible${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = filtered.map(p => {
      const waUrl = window.LulisCatalog ? window.LulisCatalog.getWhatsAppUrl(p) : `https://wa.me/59173515698?text=Hola%20LULIS`;
      const tipos = Array.isArray(p.tipoCabello) ? p.tipoCabello.join(' · ') : (p.tipoCabello || '');
      const badgeHtml = p.badge ? `<span class="product-badge ${p.badgeClass || 'badge-hot'}">${p.badge}</span>` : '';

      return `
        <article class="product-card" data-id="${p.id}">
          <div class="product-img">
            ${badgeHtml}
            <img src="${p.imagenUrl}" alt="${p.nombre}" loading="lazy" onerror="this.onerror=null;this.src='Imagenes/logos/LOGO.jpg'">
          </div>
          <div class="product-body">
            <div class="product-meta-top">
              <span class="product-category">${p.categoriaLabel || p.categoria}</span>
              <span class="product-price">${p.precio || '35 Bs.'}</span>
            </div>
            <h3 class="product-name">${p.nombre}</h3>
            ${p.variante ? `<div class="product-variante-sub">${p.variante}</div>` : ''}

            <div class="product-tags">
              <span class="product-duracion">${p.duracion || '35–45 lavadas'}</span>
              ${tipos ? `<span class="hair-tag">Cabello ${tipos}</span>` : ''}
            </div>

            <p class="product-desc">${p.descripcion}</p>

            <div class="product-footer">
              <div class="product-avail ${p.disponible ? 'avail-yes' : 'avail-no'}">
                <span class="avail-dot" aria-hidden="true"></span>
                ${p.disponible ? 'Disponible' : 'Agotado'}
              </div>
              <small style="color:var(--mid);font-weight:600">${p.size || '50g'}</small>
            </div>

            <div class="product-actions-grid">
              <button type="button" class="btn-detail" data-action="quickview" data-id="${p.id}">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Detalles
              </button>
              <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="product-wa" aria-label="Pedir ${p.nombre} por WhatsApp">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Pedir por WhatsApp
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // 3. Eventos de búsqueda y filtros
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      render();
    });
  }

  pills.forEach(p => {
    p.addEventListener('click', () => {
      pills.forEach(x => x.classList.remove('is-active'));
      p.classList.add('is-active');
      currentCategory = p.dataset.category || 'todos';
      render();
    });
  });

  if (hairSelect) {
    hairSelect.addEventListener('change', (e) => {
      currentHairType = e.target.value;
      render();
    });
  }

  // 4. Modal de vista rápida
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="quickview"]');
    if (!btn) return;
    const id = btn.dataset.id;
    const prod = allProducts.find(x => x.id === id);
    if (!prod) return;
    openModal(prod);
  });

  function openModal(prod) {
    if (!modalBackdrop) return;
    if (modalImg) modalImg.src = prod.imagenUrl;
    if (modalName) modalName.textContent = prod.nombre;
    if (modalVariante) modalVariante.textContent = prod.variante || '';
    if (modalCat) modalCat.textContent = prod.categoriaLabel || prod.categoria;
    if (modalPrice) modalPrice.textContent = prod.precio || '35 Bs.';
    if (modalDuracion) modalDuracion.textContent = prod.duracion || '35–45 lavadas';
    if (modalHair) {
      const tipos = Array.isArray(prod.tipoCabello) ? prod.tipoCabello.join(', ') : prod.tipoCabello;
      modalHair.textContent = tipos ? `Recomendado para: Cabello ${tipos}` : '';
    }
    if (modalDesc) modalDesc.textContent = prod.descripcionLarga || prod.descripcion;
    if (modalIngredientes) modalIngredientes.textContent = prod.ingredientes || 'Ingredientes 100% botánicos y naturales.';
    if (modalModoUso) modalModoUso.textContent = prod.modoUso || 'Frotar sobre el cabello mojado, masajear y aclarar.';
    
    if (modalWaBtn) {
      const waUrl = window.LulisCatalog ? window.LulisCatalog.getWhatsAppUrl(prod) : `https://wa.me/59173515698`;
      modalWaBtn.href = waUrl;
    }

    modalBackdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  modalCloseBtn?.addEventListener('click', closeModal);
  modalBackdrop?.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop?.classList.contains('is-open')) closeModal();
  });

  // Arrancar
  load();
})();
