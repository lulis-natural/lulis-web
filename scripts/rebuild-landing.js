const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

// 1. Get original clean HTML directly from git commit 67decf5
let origHtml = execSync('git show 67decf5:index.html', { cwd: rootDir, encoding: 'utf8' });

// 2. Replace about visual with clean placeholder
const oldAboutVisual = /<div class="about-visual reveal-left">[\s\S]*?<div class="about-badge"/;
const newAboutVisual = `<div class="about-visual reveal-left">
        <div class="about-visual-placeholder-box">
          <div class="about-visual-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <h3 class="about-visual-title">Fotografía Oficial</h3>
          <p class="about-visual-desc">Espacio reservado para la fotografía de nuestro equipo y taller artesanal LULIS.</p>
        </div>
        <div class="about-badge"`;
origHtml = origHtml.replace(oldAboutVisual, newAboutVisual);

// 3. Products data for full pre-render
const productsJsonPath = path.join(rootDir, 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));

function renderProductCard(p) {
  const waMsg = encodeURIComponent(`Hola LULIS 👋 Me interesa el producto: ${p.nombre} (${p.size || p.gramos || '50g'}) por ${p.precio}. ¿Tienen disponibilidad?`);
  const tagsHtml = (p.tipoCabello || []).map(t => `<span class="hair-tag">Para cabello ${t}</span>`).join(' ');
  return `
      <article class="product-card reveal" data-category="${p.categoria}" data-name="${p.nombre.toLowerCase()}">
        <div class="product-img">
          <img src="${p.imagenUrl}"
               alt="${p.nombre} — cosmética consciente LULIS"
               width="400" height="300" loading="lazy" decoding="async">
          ${p.badge ? `<span class="product-badge ${p.badgeClass || 'badge-hot'}">${p.badge}</span>` : ''}
        </div>
        <div class="product-body">
          <div class="product-meta-top">
            <p class="product-category">${p.categoriaLabel || (p.categoria === 'shampoo' ? 'Shampoo Sólido' : p.categoria === 'acondicionador' ? 'Acondicionador Sólido' : 'Pack Dúo')}</p>
            <div class="product-price"><strong>${p.precio}</strong></div>
          </div>
          <h3 class="product-name">${p.nombre}</h3>
          <p class="product-variante-sub">${p.variante || ''}</p>
          <div class="product-tags">
            <span class="product-duracion">${p.duracion || p.size || '50g'}</span>
            ${tagsHtml}
          </div>
          <p class="product-desc">${p.descripcion}</p>
          <div class="product-footer">
            <div class="product-avail avail-yes" aria-label="Disponible">
              <span class="avail-dot" aria-hidden="true"></span> Disponible
            </div>
            <a href="https://wa.me/59173515698?text=${waMsg}"
               class="product-wa"
               data-product="${p.nombre} (${p.size || '50g'})"
               aria-label="Consultar por WhatsApp el ${p.nombre}"
               target="_blank" rel="noopener noreferrer">
              <svg class="wa-icon" aria-hidden="true"><use href="#icon-whatsapp"/></svg>
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </article>`;
}

const productsHtml = `
    <!-- Filtros de categoría -->
    <div class="catalog-filters reveal" id="catalogFilters" role="tablist" aria-label="Filtrar por categoría">
      <button type="button" class="filter-btn active" data-filter="all">Todos los productos (8)</button>
      <button type="button" class="filter-btn" data-filter="shampoo">🌿 Shampoos Sólidos (3)</button>
      <button type="button" class="filter-btn" data-filter="acondicionador">✨ Acondicionadores (2)</button>
      <button type="button" class="filter-btn" data-filter="pack">🎁 Packs y Dúos (3)</button>
    </div>

    <!-- Grilla completa de catálogo -->
    <div class="catalog-grid" id="catalogProductsGrid">
      ${products.map(renderProductCard).join('\n')}
    </div>
`;

// Replace products section inner wrap
const oldProductsSectionPattern = /<div class="products-categories-wrap" id="productos-wrap">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/;
const newProductsSection = `${productsHtml}\n  </div>\n</section>`;
origHtml = origHtml.replace(oldProductsSectionPattern, newProductsSection);

// Update navbar links
const oldNavLinks = `<ul class="nav-links" role="list">
      <li><a href="#about">Nosotros</a></li>
      <li><a href="#products">Catálogo</a></li>
      <li><a href="#impact-env">Impacto</a></li>
      <li><a href="#how">Proceso</a></li>
      <li><a href="#testimonials">Reseñas</a></li>
      <li><a href="#contact" class="nav-cta btn">Contacto</a></li>
    </ul>`;

const newNavLinks = `<ul class="nav-links" role="list">
      <li><a href="#about">Nosotros</a></li>
      <li><a href="#products">Catálogo</a></li>
      <li><a href="#impact-env">Impacto</a></li>
      <li><a href="#gallery">Galería</a></li>
      <li><a href="#ubicaciones">Puntos de Venta</a></li>
      <li><a href="#faq">FAQ</a></li>
      <li><a href="#contact" class="nav-cta btn">Contacto</a></li>
    </ul>`;
origHtml = origHtml.replace(oldNavLinks, newNavLinks);

// Update mobile menu
const oldMobileMenu = `<div class="mobile-menu" id="mobileMenu" role="dialog" aria-modal="true" aria-label="Menú de navegación">
  <button class="mobile-close" id="menuCloseBtn" aria-label="Cerrar menú">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>
  <a href="#about"       class="menu-link">Nosotros</a>
  <a href="#products"    class="menu-link">Catálogo</a>
  <a href="#impact-env"  class="menu-link">Impacto</a>
  <a href="#how"         class="menu-link">Proceso</a>
  <a href="#testimonials" class="menu-link">Reseñas</a>
  <a href="#contact"     class="menu-link">Contacto</a>
</div>`;

const newMobileMenu = `<div class="mobile-menu" id="mobileMenu" role="dialog" aria-modal="true" aria-label="Menú de navegación">
  <button class="mobile-close" id="menuCloseBtn" aria-label="Cerrar menú">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>
  <a href="#about"       class="menu-link">Nosotros</a>
  <a href="#products"    class="menu-link">Catálogo</a>
  <a href="#impact-env"  class="menu-link">Impacto</a>
  <a href="#gallery"     class="menu-link">Galería</a>
  <a href="#ubicaciones" class="menu-link">Puntos de Venta</a>
  <a href="#faq"         class="menu-link">Preguntas Frecuentes</a>
  <a href="#contact"     class="menu-link">Contacto</a>
  <a href="/admin/"      class="menu-link" style="color:var(--wine);font-size:1.1rem;margin-top:16px;">🔐 Panel Admin</a>
</div>`;
origHtml = origHtml.replace(oldMobileMenu, newMobileMenu);

// Add admin link to footer legal
const oldFooterLegal = `<nav class="footer-legal" aria-label="Enlaces legales">
        <a href="#">Privacidad</a>
        <a href="#">Términos</a>
      </nav>`;
const newFooterLegal = `<nav class="footer-legal" aria-label="Enlaces legales">
        <a href="#">Privacidad</a>
        <a href="#">Términos</a>
        <a href="/admin/" style="color:var(--wine);font-weight:600;">🔐 Acceso Admin</a>
      </nav>`;
origHtml = origHtml.replace(oldFooterLegal, newFooterLegal);

// Write to index.html with pure UTF-8
fs.writeFileSync(path.join(rootDir, 'index.html'), origHtml, 'utf8');
console.log('index.html rebuilt cleanly with UTF-8!');
