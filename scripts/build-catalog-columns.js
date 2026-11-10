const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. REWRITE css/components/products.css
const prodCssPath = path.join(rootDir, 'css', 'components', 'products.css');
const prodCss = `/* ═══════════════════════════════════════════════════════════
   LULIS — Sección Productos: Columnas por Bloques (Catálogo Limpio)
   ═══════════════════════════════════════════════════════════ */

#products {
  background: var(--light);
  padding: 80px 0;
}

.products-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 32px;
}
.products-header h2 {
  color: var(--wine);
  font-size: clamp(2rem, 4vw, 2.8rem);
  margin-bottom: 12px;
}
.products-header p {
  color: #4A3E38;
  font-size: 1.05rem;
  line-height: 1.6;
}

/* Filtros de Bloques en Landing */
.catalog-filters {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 20px 0 36px;
}
.filter-btn {
  background: #ffffff;
  border: 1.5px solid #E2D9CD;
  color: var(--dark);
  padding: 9px 20px;
  border-radius: 50px;
  font-family: var(--ff-body);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
}
.filter-btn:hover {
  border-color: var(--wine);
  color: var(--wine);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(95,15,63,0.12);
}
.filter-btn.active {
  background: var(--wine);
  border-color: var(--wine);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(95,15,63,0.22);
}

/* Grilla de Bloques / Columnas (2 o 3 columnas organizadas) */
.products-categories-wrap {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  align-items: start;
}

@media (min-width: 1100px) {
  .products-categories-wrap {
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
  }
}

/* Bloque individual de categoría */
.category-block {
  display: flex;
  flex-direction: column;
  transition: opacity 0.25s ease, transform 0.25s ease;
}

/* Cabecera del bloque */
.category-block-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: #ffffff;
  border-radius: 14px;
  border-left: 4px solid var(--emerald);
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.category-block-icon {
  font-size: 1.5rem;
  line-height: 1;
}
.category-block-title {
  font-family: var(--ff-display);
  font-size: 1.12rem;
  font-weight: 700;
  color: var(--wine);
  margin: 0;
  line-height: 1.2;
}
.category-block-sub {
  font-size: 0.76rem;
  color: #7A6960;
  font-weight: 500;
  display: block;
}

/* Lista vertical de tarjetas dentro del bloque */
.product-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* Tarjeta individual de producto */
.product-card {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(28, 22, 17, 0.05);
  border: 1px solid rgba(229, 216, 189, 0.55);
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 26px rgba(28, 22, 17, 0.12);
  border-color: rgba(95, 15, 63, 0.3);
}

/* ═══ IMAGEN CONTROLADA Y COMPACTA (NUNCA GIGANTE) ═══ */
.product-img {
  position: relative;
  width: 100%;
  height: 195px;
  max-height: 195px;
  overflow: hidden;
  background: #FAF6EF;
}
.product-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.4s ease;
}
.product-card:hover .product-img img {
  transform: scale(1.05);
}

/* Badges sobre la foto */
.product-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 10px;
  font-size: 0.70rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 50px;
  z-index: 2;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.badge-hot  { background: var(--wine); color: #fff; }
.badge-new  { background: var(--emerald); color: #fff; }
.badge-eco  { background: #15803d; color: #fff; }

/* Cuerpo de la tarjeta */
.product-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.product-meta-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.product-category {
  font-size: 0.70rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--emerald);
}
.product-price {
  font-family: var(--ff-display);
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--wine);
  background: rgba(95, 15, 63, 0.06);
  padding: 2px 8px;
  border-radius: 12px;
}
.product-name {
  font-family: var(--ff-display);
  font-size: 1.12rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 2px;
  line-height: 1.25;
}
.product-variante-sub {
  font-size: 0.78rem;
  color: var(--purple);
  font-weight: 600;
  margin-bottom: 8px;
}
.product-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
}
.product-duracion, .hair-tag {
  font-size: 0.70rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
}
.product-duracion {
  background: #F4EFE6;
  color: #4A3728;
}
.hair-tag {
  background: #FEF3C7;
  color: #92400E;
}
.product-desc {
  font-size: 0.84rem;
  color: #4A3E38;
  line-height: 1.48;
  margin-bottom: 12px;
}
.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #F0E9DD;
}
.product-avail {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
}
.avail-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.avail-yes .avail-dot { background: var(--emerald); }
.avail-no .avail-dot { background: var(--coral); }
.avail-yes { color: var(--emerald); font-weight: 600; }
.avail-no { color: var(--coral); font-weight: 600; }

.product-wa {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 10px;
  padding: 9px 16px;
  background: var(--wa-green);
  color: #fff;
  border-radius: 50px;
  font-size: 0.84rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}
.product-wa:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .products-categories-wrap {
    grid-template-columns: 1fr;
  }
}
`;
fs.writeFileSync(prodCssPath, prodCss, 'utf8');

// 2. REBUILD PRODUCTS SECTION IN index.html
const indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

const productsJsonPath = path.join(rootDir, 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));

function cardHtml(p) {
  const waMsg = encodeURIComponent(`Hola LULIS 👋 Me interesa el producto: ${p.nombre} (${p.size || p.gramos || '50g'}) por ${p.precio}. ¿Tienen disponibilidad?`);
  const tagsHtml = (p.tipoCabello || []).map(t => `<span class="hair-tag">${t}</span>`).join(' ');
  return `
            <article class="product-card reveal" data-category="${p.categoria}" data-id="${p.id}" data-name="${p.nombre.toLowerCase()}">
              <div class="product-img">
                <img src="${p.imagenUrl}"
                     alt="${p.nombre} — cosmética consciente LULIS"
                     width="400" height="195" loading="lazy" decoding="async">
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
            </article>`;
}

const shampoos = products.filter(p => p.categoria === 'shampoo');
const acondicionadores = products.filter(p => p.categoria === 'acondicionador');
const packs = products.filter(p => p.categoria === 'pack');

const newProductsSectionHtml = `<section id="products" class="section" aria-labelledby="products-heading">
  <div class="container">
    <div class="products-header reveal">
      <span class="eyebrow">Línea capilar consciente</span>
      <h2 id="products-heading">Nuestros productos</h2>
      <p>Formato sólido, sin plástico, con packaging de papel orgánico con semillas. Más concentrados, más eficientes, más responsables.</p>
    </div>

    <!-- Filtros de categoría para alternar bloques -->
    <div class="catalog-filters reveal" id="catalogFilters" role="tablist" aria-label="Filtrar por bloque de catálogo">
      <button type="button" class="filter-btn active" data-filter="all">Ver todos los bloques</button>
      <button type="button" class="filter-btn" data-filter="shampoo">🌿 Shampoos Sólidos (${shampoos.length})</button>
      <button type="button" class="filter-btn" data-filter="acondicionador">✨ Acondicionadores (${acondicionadores.length})</button>
      <button type="button" class="filter-btn" data-filter="pack">🎁 Packs y Dúos (${packs.length})</button>
    </div>

    <!-- Columnas ordenadas por bloques -->
    <div class="products-categories-wrap" id="productos-wrap">

      <!-- BLOQUE 1: SHAMPOOS SÓLIDOS -->
      <div class="category-block reveal" data-category="shampoo">
        <div class="category-block-header">
          <span class="category-block-icon" aria-hidden="true">🌿</span>
          <div class="category-block-info">
            <h3 class="category-block-title">Shampoos Sólidos</h3>
            <span class="category-block-sub">35–45 lavadas · 50g</span>
          </div>
        </div>
        <div class="product-list" id="list-shampoo">
          ${shampoos.map(cardHtml).join('\n')}
        </div>
      </div>

      <!-- BLOQUE 2: ACONDICIONADORES SÓLIDOS -->
      <div class="category-block reveal delay-1" data-category="acondicionador">
        <div class="category-block-header">
          <span class="category-block-icon" aria-hidden="true">✨</span>
          <div class="category-block-info">
            <h3 class="category-block-title">Acondicionadores Sólidos</h3>
            <span class="category-block-sub">50g · Desenredado e hidratación</span>
          </div>
        </div>
        <div class="product-list" id="list-acondicionador">
          ${acondicionadores.map(cardHtml).join('\n')}
        </div>
      </div>

      <!-- BLOQUE 3: PACKS & COMBOS CONSCIENTES -->
      <div class="category-block reveal delay-2" data-category="pack">
        <div class="category-block-header">
          <span class="category-block-icon" aria-hidden="true">🎁</span>
          <div class="category-block-info">
            <h3 class="category-block-title">Packs & Dúos Ahorro</h3>
            <span class="category-block-sub">Dúos con empaque de semillas plantable</span>
          </div>
        </div>
        <div class="product-list" id="list-pack">
          ${packs.map(cardHtml).join('\n')}
        </div>
      </div>

    </div>
  </div>
</section>`;

// Replace existing section
const sectionRegex = /<section id="products"[\s\S]*?<\/section>/;
indexHtml = indexHtml.replace(sectionRegex, newProductsSectionHtml);
fs.writeFileSync(indexPath, indexHtml, 'utf8');

console.log('products.css and index.html rebuilt with clean 2/3 columns and compact 195px images!');
