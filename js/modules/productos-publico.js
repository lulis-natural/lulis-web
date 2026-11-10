/* ═══════════════════════════════════════════════════════════
   LULIS — modules/productos-publico.js
   Manejo de Bloques de Catálogo:
   - Filtro interactivo por bloque (Todos, Shampoos, Acondicionadores, Packs)
   - Creación dinámica de nuevos bloques si se agregan categorías en Firestore
   - Sincronización segura de precios y stock
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const WRAP_ID = 'productos-wrap';
  const FILTERS_ID = 'catalogFilters';

  function initFilters() {
    const filtersContainer = document.getElementById(FILTERS_ID);
    const wrap = document.getElementById(WRAP_ID);
    if (!filtersContainer || !wrap) return;

    const buttons = filtersContainer.querySelectorAll('.filter-btn');
    const blocks = wrap.querySelectorAll('.category-block');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter') || 'all';

        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        blocks.forEach(block => {
          const category = block.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            block.style.display = 'flex';
            block.style.opacity = '0';
            block.style.transform = 'translateY(8px)';
            setTimeout(() => {
              block.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
              block.style.opacity = '1';
              block.style.transform = 'none';
            }, 30);
          } else {
            block.style.display = 'none';
          }
        });
      });
    });
  }

  function slugify(text) {
    return (text || '')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  function createProductCard(p) {
    const waMsg = encodeURIComponent(`Hola LULIS 👋 Me interesa el producto: ${p.nombre} (${p.size || p.gramos || '50g'}) por ${p.precio}. ¿Tienen disponibilidad?`);
    const tagsHtml = (p.tipoCabello || []).map(t => `<span class="hair-tag">${t}</span>`).join(' ');
    const article = document.createElement('article');
    article.className = 'product-card reveal visible';
    article.setAttribute('data-category', p.categoria || 'otro');
    article.setAttribute('data-id', p.id || '');
    article.setAttribute('data-name', (p.nombre || '').toLowerCase());
    article.innerHTML = `
      <div class="product-img">
        <img src="${p.imagenUrl || 'Imagenes/productos/Jamaica.jpg'}"
             alt="${p.nombre} — cosmética consciente LULIS"
             width="400" height="195" loading="lazy" decoding="async">
        ${p.badge ? `<span class="product-badge ${p.badgeClass || 'badge-hot'}">${p.badge}</span>` : ''}
      </div>
      <div class="product-body">
        <div class="product-meta-top">
          <p class="product-category">${p.categoriaLabel || p.categoria || 'Producto'}</p>
          <div class="product-price"><strong>${p.precio || '35 Bs.'}</strong></div>
        </div>
        <h3 class="product-name">${p.nombre}</h3>
        <p class="product-variante-sub">${p.variante || ''}</p>
        <div class="product-tags">
          <span class="product-duracion">${p.duracion || p.size || '50g'}</span>
          ${tagsHtml}
        </div>
        <p class="product-desc">${p.descripcion || ''}</p>
        <div class="product-footer">
          <div class="product-avail ${p.disponible === false ? 'avail-no' : 'avail-yes'}" aria-label="${p.disponible === false ? 'Agotado' : 'Disponible'}">
            <span class="avail-dot" aria-hidden="true"></span> ${p.disponible === false ? 'Agotado' : 'Disponible'}
          </div>
        </div>
        <a href="https://wa.me/59173515698?text=${waMsg}"
           class="product-wa"
           data-product="${p.nombre} (${p.size || '50g'})"
           aria-label="Consultar por WhatsApp el ${p.nombre}"
           target="_blank" rel="noopener noreferrer">
          <svg class="wa-icon" aria-hidden="true" style="width:16px;height:16px;fill:#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Consultar por WhatsApp
        </a>
      </div>
    `;
    return article;
  }

  // Sincronización en segundo plano con Firestore
  function syncFirestore() {
    if (!window.LULIS_FB || !window.LULIS_FB.db) return;

    window.LULIS_FB.db.collection('productos')
      .get()
      .then(snap => {
        if (!snap || snap.empty) return;

        const wrap = document.getElementById(WRAP_ID);
        const filtersContainer = document.getElementById(FILTERS_ID);
        if (!wrap) return;

        const liveProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 1. Actualizar precios/stock en productos existentes
        liveProducts.forEach(p => {
          const card = wrap.querySelector(`.product-card[data-id="${p.id}"]`) ||
                       wrap.querySelector(`.product-card[data-name="${(p.nombre || '').toLowerCase()}"]`);
          if (card) {
            if (p.precio) {
              const priceEl = card.querySelector('.product-price strong');
              if (priceEl) priceEl.textContent = p.precio;
            }
            if (p.disponible === false) {
              const availEl = card.querySelector('.product-avail');
              if (availEl) {
                availEl.className = 'product-avail avail-no';
                availEl.innerHTML = '<span class="avail-dot" aria-hidden="true"></span> Agotado';
              }
            }
          }
        });

        // 2. Detectar si hay categorías nuevas (nuevos bloques creados desde el admin)
        const existingCategories = Array.from(wrap.querySelectorAll('.category-block'))
          .map(b => b.getAttribute('data-category'));

        liveProducts.forEach(p => {
          const cat = p.categoria || 'otro';
          if (!existingCategories.includes(cat)) {
            existingCategories.push(cat);

            // Crear nuevo bloque de columna dinámico
            const newBlock = document.createElement('div');
            newBlock.className = 'category-block reveal visible';
            newBlock.setAttribute('data-category', cat);

            const catTitle = p.categoriaLabel || cat.charAt(0).toUpperCase() + cat.slice(1);
            newBlock.innerHTML = `
              <div class="category-block-header">
                <span class="category-block-icon" aria-hidden="true">🌿</span>
                <div class="category-block-info">
                  <h3 class="category-block-title">${catTitle}</h3>
                  <span class="category-block-sub">Nueva línea de cosmética sólida</span>
                </div>
              </div>
              <div class="product-list" id="list-${cat}"></div>
            `;
            wrap.appendChild(newBlock);

            // Añadir botón al filtro si no existe
            if (filtersContainer && !filtersContainer.querySelector(`[data-filter="${cat}"]`)) {
              const btn = document.createElement('button');
              btn.type = 'button';
              btn.className = 'filter-btn';
              btn.setAttribute('data-filter', cat);
              btn.textContent = `🌱 ${catTitle}`;
              filtersContainer.appendChild(btn);
              initFilters(); // re-bind listeners
            }
          }

          // Si el producto no estaba en la tarjeta, agregarlo a su bloque
          const cardExists = wrap.querySelector(`.product-card[data-id="${p.id}"]`) ||
                             wrap.querySelector(`.product-card[data-name="${(p.nombre || '').toLowerCase()}"]`);
          if (!cardExists) {
            const blockList = wrap.querySelector(`#list-${cat}`) ||
                              wrap.querySelector(`.category-block[data-category="${cat}"] .product-list`);
            if (blockList) {
              blockList.appendChild(createProductCard(p));
            }
          }
        });
      })
      .catch(err => {
        console.warn('LULIS catálogo: manteniendo tarjetas locales', err && err.message);
      });
  }

  // Iniciar al cargar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initFilters();
      setTimeout(syncFirestore, 600);
    });
  } else {
    initFilters();
    setTimeout(syncFirestore, 600);
  }
})();
