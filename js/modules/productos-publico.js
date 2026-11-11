/* ═══════════════════════════════════════════════════════════
   LULIS — modules/productos-publico.js (v12)
   Sincronización en vivo con Firestore REST API + LocalStorage
   - Filtro interactivo con redirección suave al bloque de categoría
   - Grilla de 2 productos por categoría
   - Sincronización automática de precios, imágenes y stock
   - Apertura reactiva de modal con los datos en vivo
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const WRAP_ID = 'productos-wrap';
  const FILTERS_ID = 'catalogFilters';
  const CACHE_KEY = 'lulis_productos_cache_v2';
  const FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/lulis-web/databases/(default)/documents/productos';

  /* ── 1. Helper para decodificar Firestore REST API ── */
  function parseFirestoreDoc(doc) {
    const fields = doc.fields || {};
    const getVal = (f) => {
      if (!f) return null;
      if (f.stringValue !== undefined) return f.stringValue;
      if (f.integerValue !== undefined) return parseInt(f.integerValue, 10);
      if (f.doubleValue !== undefined) return parseFloat(f.doubleValue);
      if (f.booleanValue !== undefined) return f.booleanValue;
      if (f.arrayValue !== undefined) return (f.arrayValue.values || []).map(getVal);
      if (f.mapValue !== undefined) {
        const m = {};
        for (const k in f.mapValue.fields) m[k] = getVal(f.mapValue.fields[k]);
        return m;
      }
      return null;
    };

    const id = doc.name ? doc.name.split('/').pop() : 'prod_' + Math.random().toString(36).substring(7);
    const data = { id };
    for (const k in fields) {
      data[k] = getVal(fields[k]);
    }
    return data;
  }

  /* ── 2. Detección Inteligente de Categoría ── */
  function detectCategory(p) {
    const rawCat = (p.categoria || '').toLowerCase().trim();
    const name = (p.nombre || '').toLowerCase();
    
    if (rawCat === 'acondicionador' || name.includes('acondicionador')) return 'acondicionador';
    if (rawCat === 'pack' || rawCat === 'duo' || name.includes('pack') || name.includes('dúo') || name.includes('duo') || name.includes('combo')) return 'pack';
    if (rawCat === 'manteca' || name.includes('manteca')) return 'manteca';
    if (rawCat === 'shampoo' || name.includes('shampoo')) return 'shampoo';
    return rawCat || 'shampoo';
  }

  /* ── 3. Formateo de Precios ── */
  function formatPrice(price) {
    if (!price) return 'Bs 35,00';
    let s = String(price).trim();
    if (s.toLowerCase().startsWith('bs')) {
      s = s.replace(/^[bB][sS]\.?\s*/, '').trim();
    }
    if (s.endsWith('Bs.')) {
      s = s.replace(/\s*Bs\.?$/, '').trim();
    }
    if (/^\d+(\.\d+)?$/.test(s)) {
      const num = parseFloat(s);
      return 'Bs ' + num.toFixed(2).replace('.', ',');
    }
    if (/^\d+,\d{2}$/.test(s)) {
      return 'Bs ' + s;
    }
    return 'Bs ' + s;
  }

  /* ── 4. URL de Imagen Segura ── */
  function getImgSrc(url) {
    if (!url) return 'Imagenes/productos/Jamaica.jpg';
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/')) return url;
    return url;
  }

  function slugify(text) {
    return (text || '')
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  /* ── 5. Renderizado de Tarjeta Individual (Grilla de 2) ── */
  function renderCardHtml(p) {
    const cat = detectCategory(p);
    const priceStr = formatPrice(p.precio);
    const imgSrc = getImgSrc(p.imagenUrl);
    const tags = Array.isArray(p.tipoCabello) ? p.tipoCabello : (p.tipoCabello ? [p.tipoCabello] : []);
    const size = p.size || '50g';
    const waMsg = encodeURIComponent(`Hola LULIS 👋 Me interesa el producto: ${p.nombre} (${size}) por ${priceStr}. ¿Tienen disponibilidad?`);
    const tagsHtml = tags.map(t => `<span class="tag-pill">${t}</span>`).join(' ');
    const cardId = p.id || slugify(p.nombre);

    return `
      <article class="product-card reveal visible"
               data-id="${cardId}"
               data-category="${cat}"
               data-name="${(p.nombre || '').toLowerCase()}"
               onclick="openProductModal('${cardId}')">
        <div class="product-img-box">
          <img src="${imgSrc}"
               alt="${p.nombre} — cosmética consciente LULIS"
               loading="lazy" decoding="async"
               onerror="this.onerror=null;this.src='Imagenes/logos/LOGO.jpg'">
          ${p.badge ? `<span class="product-badge badge-hot">${p.badge}</span>` : ''}
        </div>
        <div class="product-info-box">
          <div>
            <h3 class="product-title">${p.nombre}</h3>
            ${p.variante ? `<div style="font-size:0.82rem;color:#7A6960;margin-top:2px;font-weight:500;">${p.variante}</div>` : ''}
            <div class="product-tags">
              <span class="tag-pill">${size}</span>
              ${tagsHtml}
            </div>
          </div>
          <div class="product-bottom-row" onclick="event.stopPropagation()">
            <div class="product-price-val">${priceStr}</div>
            <a href="https://wa.me/59173515698?text=${waMsg}"
               class="btn-wa-compact"
               data-product="${p.nombre} (${size})"
               aria-label="Pedir por WhatsApp ${p.nombre}"
               target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Pedir
            </a>
          </div>
        </div>
      </article>
    `;
  }

  /* ── 6. Actualizar Catálogo y Modal Dinámico ── */
  function renderLiveCatalog(products) {
    if (!Array.isArray(products) || products.length === 0) return;

    window.LULIS_MODAL_DATA = window.LULIS_MODAL_DATA || {};

    const groups = {
      shampoo: [],
      acondicionador: [],
      pack: [],
      manteca: []
    };

    // Ordenar productos
    const sorted = [...products].sort((a, b) => (parseInt(a.orden, 10) || 99) - (parseInt(b.orden, 10) || 99));

    sorted.forEach(p => {
      if (p.disponible === false) return; // omitir no disponibles

      const cat = detectCategory(p);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);

      // Registrar datos completos en el modal
      const priceStr = formatPrice(p.precio);
      const cardId = p.id || slugify(p.nombre);
      const modalPayload = {
        nombre: p.nombre,
        categoria: (p.categoriaLabel || cat.toUpperCase()),
        precio: priceStr,
        img: getImgSrc(p.imagenUrl),
        desc: p.descripcion || p.descripcionLarga || 'Cosmética capilar botánica y sólida.',
        ingredientes: p.ingredientes || 'Tensioactivos vegetales de coco (SCI), mantecas puras y extractos botánicos.',
        duracion: p.duracion || (p.size || '50g') + ' · Rinde de 35 a 45 lavadas.',
        waText: `Hola LULIS 👋 Quisiera pedir el producto: ${p.nombre} (${priceStr}).`
      };

      window.LULIS_MODAL_DATA[cardId] = modalPayload;
      if (p.id) window.LULIS_MODAL_DATA[p.id] = modalPayload;
      window.LULIS_MODAL_DATA[slugify(p.nombre)] = modalPayload;
    });

    const wrap = document.getElementById(WRAP_ID);
    const filtersContainer = document.getElementById(FILTERS_ID);
    if (!wrap) return;

    // Renderizar cada grupo existente
    Object.keys(groups).forEach(cat => {
      const listEl = document.getElementById(`list-${cat}`);
      const items = groups[cat];

      if (listEl && items.length > 0) {
        listEl.innerHTML = items.map(renderCardHtml).join('');

        // Actualizar contador del bloque
        const block = wrap.querySelector(`.category-block[data-category="${cat}"]`);
        if (block) {
          const countEl = block.querySelector('.category-block-count, .category-box-count');
          if (countEl) {
            countEl.textContent = `${items.length} ${cat === 'pack' ? 'packs' : 'variedades'}`;
          }
        }
      } else if (!listEl && items.length > 0) {
        // Nueva categoría creada desde el panel admin
        const catTitle = cat.charAt(0).toUpperCase() + cat.slice(1);
        const newBlock = document.createElement('div');
        newBlock.className = 'category-block reveal visible';
        newBlock.setAttribute('data-category', cat);
        newBlock.innerHTML = `
          <div class="category-block-header">
            <div class="category-block-header-left">
              <span class="category-block-icon" aria-hidden="true">🌿</span>
              <div>
                <h3 class="category-block-title">${catTitle} Sólidos</h3>
                <span class="category-block-sub">Nueva línea botánica consciente</span>
              </div>
            </div>
            <span class="category-block-count">${items.length} variedades</span>
          </div>
          <div class="product-list" id="list-${cat}">
            ${items.map(renderCardHtml).join('')}
          </div>
        `;
        wrap.appendChild(newBlock);

        // Añadir botón en los filtros
        if (filtersContainer && !filtersContainer.querySelector(`[data-filter="${cat}"]`)) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'filter-btn';
          btn.setAttribute('data-filter', cat);
          btn.textContent = `🌱 ${catTitle} (${items.length})`;
          filtersContainer.appendChild(btn);
          initFilters();
        }
      }
    });
  }

  /* ── 7. Filtros Interactivos y Redirección Suave al Bloque ── */
  function initFilters() {
    const filtersContainer = document.getElementById(FILTERS_ID);
    const wrap = document.getElementById(WRAP_ID);
    if (!filtersContainer || !wrap) return;

    const buttons = filtersContainer.querySelectorAll('.filter-btn');
    const blocks = wrap.querySelectorAll('.category-block');

    buttons.forEach(btn => {
      // Remover listener previo para evitar duplicados
      btn.onclick = (e) => {
        e.preventDefault();
        const filter = btn.getAttribute('data-filter') || 'all';

        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (filter === 'all') {
          blocks.forEach(block => {
            block.style.display = 'block';
            block.style.opacity = '1';
          });
          const target = document.getElementById('products');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          let targetBlock = null;
          blocks.forEach(block => {
            const category = block.getAttribute('data-category');
            if (category === filter) {
              block.style.display = 'block';
              block.style.opacity = '1';
              if (!targetBlock) targetBlock = block;
            } else {
              block.style.display = 'none';
            }
          });

          if (targetBlock) {
            targetBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      };
    });
  }

  /* ── 8. Carga Sincronizada (Firestore REST API + LocalStorage) ── */
  async function syncProducts() {
    // 1. Cargar inmediatamente desde cache si existe
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          renderLiveCatalog(parsed);
        }
      }
    } catch (_) {}

    // 2. Consulta en vivo a Firestore REST API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(FIRESTORE_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.documents && data.documents.length > 0) {
          const liveList = data.documents.map(parseFirestoreDoc);
          localStorage.setItem(CACHE_KEY, JSON.stringify(liveList));
          renderLiveCatalog(liveList);
        }
      }
    } catch (err) {
      console.warn('[LulisCatalog] Usando cache local o productos iniciales:', err && err.message);
    }
  }

  // Inicializar al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initFilters();
      syncProducts();
    });
  } else {
    initFilters();
    syncProducts();
  }
})();