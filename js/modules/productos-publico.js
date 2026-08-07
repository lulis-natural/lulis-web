/* ═══════════════════════════════════════════════════════════
   LULIS — modules/productos-publico.js
   Renderiza los productos desde Firebase en la landing.
   Reemplaza el contenido de #firebase-productos.
   Si Firebase falla o no hay productos, deja el HTML hardcoded.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const TARGET = '#firebase-productos';
  const TIMEOUT_MS = 6000;

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(s) {
    if (s == null) return '';
    return String(s)
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function badgeClass(badge) {
    if (!badge) return '';
    const b = badge.toLowerCase();
    if (b.includes('nuevo') || b.includes('new')) return 'badge-new';
    if (b.includes('favorito') || b.includes('popular') || b.includes('hot')) return 'badge-hot';
    if (b.includes('eco')) return 'badge-eco';
    if (b.includes('ahorro') || b.includes('pack')) return 'badge-pack';
    return 'badge-hot';
  }

  function tipoLabel(t) {
    return ({
      shampoo: 'Shampoo Sólido',
      acondicionador: 'Acondicionador Sólido',
      pack: 'Pack / Combo'
    })[t] || 'Producto';
  }

  function productCard(p) {
    const foto = p.foto || '';
    const nombreCorto = p.nombre.replace(/^Shampoo Sólido\s+/i, '').replace(/^Acondicionador Sólido\s+/i, '');
    const productWA = encodeURIComponent(`Hola LULIS 👋 Me interesa el producto: ${p.nombre} (${p.gramos}). ¿Podría darme más información?`);
    return `
      <article class="product-card" style="opacity:1;visibility:visible;transform:none">
        <div class="product-img">
          ${foto
            ? `<img src="${escapeAttr(foto)}" alt="${escapeAttr(p.nombre)}" width="400" height="300" loading="lazy" decoding="async">`
            : `<div class="product-img-placeholder" style="background:var(--light);width:100%;height:100%;display:flex;align-items:center;justify-content:center;border-radius:8px"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.3"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>`}
          ${p.badge ? `<span class="product-badge ${badgeClass(p.badge)}">${escapeHtml(p.badge)}</span>` : ''}
        </div>
        <div class="product-body">
          <p class="product-category">${escapeHtml(tipoLabel(p.tipo))}</p>
          <h3 class="product-name">${escapeHtml(nombreCorto || p.nombre)}</h3>
          <span class="product-duracion">${escapeHtml(p.gramos || '')}</span>
          <p class="product-desc">${escapeHtml(p.descripcion || '')}</p>
          <div class="product-footer">
            <div class="product-avail ${p.disponible === false ? 'avail-no' : 'avail-yes'}" aria-label="${p.disponible === false ? 'No disponible' : 'Disponible'}">
              <span class="avail-dot" aria-hidden="true"></span>
              ${p.disponible === false ? 'No disponible' : 'Disponible'}
            </div>
            ${p.precio ? `<div class="product-price"><strong>${escapeHtml(p.precio)}</strong></div>` : ''}
          </div>
          <a href="https://wa.me/59173515698?text=${productWA}"
             class="product-wa"
             data-product="${escapeAttr(p.nombre)} (${escapeAttr(p.gramos)})"
             aria-label="Consultar por WhatsApp el ${escapeAttr(p.nombre)}"
             target="_blank" rel="noopener noreferrer">
            <svg class="wa-icon" aria-hidden="true"><use href="#icon-whatsapp"/></svg>
            Consultar por WhatsApp
          </a>
        </div>
      </article>
    `;
  }

  function render(productos) {
    const target = document.querySelector(TARGET);
    if (!target) return;
    if (!productos || !productos.length) {
      // No hay productos: dejar el HTML hardcoded
      target.innerHTML = '';
      return;
    }
    // Renderizar todos los productos
    target.innerHTML = productos
      .sort((a, b) => (a.orden || 99) - (b.orden || 99))
      .map(productCard)
      .join('');
    target.classList.add('has-data');
    // Ocultar el grupo de acondicionadores hardcoded (porque ya mostramos
    // todos los productos en el primer grupo desde Firebase)
    const hardcodedGroups = document.querySelectorAll('#productos-wrap > div');
    hardcodedGroups.forEach((g, idx) => {
      if (idx > 0) g.style.display = 'none';
    });
    // Re-bind WhatsApp buttons
    if (typeof window.LULIS_REBIND_WA === 'function') window.LULIS_REBIND_WA();
  }

  function load() {
    if (!window.LULIS_FB || !window.LULIS_FB.db) {
      setTimeout(load, 300);
      return;
    }
    const db = window.LULIS_FB.db;
    let done = false;
    const finish = (productos) => {
      if (done) return;
      done = true;
      render(productos);
    };
    // Timeout fallback: si Firebase no responde, dejar hardcoded
    setTimeout(() => finish(null), TIMEOUT_MS);

    db.collection('productos')
      .get()
      .then(snap => {
        // Filtrar y ordenar en JS para evitar requerir índice compuesto
        const productos = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.disponible !== false)
          .sort((a, b) => (a.orden || 99) - (b.orden || 99));
        finish(productos);
      })
      .catch(err => {
        console.warn('LULIS productos: error al cargar, usando HTML estático', err && err.message);
        finish(null);
      });
  }

  // Esperar a que Firebase esté listo
  function waitFirebase() {
    const start = Date.now();
    (function poll() {
      if (window.LULIS_FB && window.LULIS_FB.ready) {
        load();
      } else if (Date.now() - start < TIMEOUT_MS) {
        setTimeout(poll, 200);
      } else {
        // Timeout: dejar hardcoded
        console.info('LULIS productos: Firebase no respondió, usando HTML estático');
      }
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitFirebase);
  } else {
    waitFirebase();
  }
})();
