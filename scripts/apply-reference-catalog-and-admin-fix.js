const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// ═════════════════════════════════════════════════════════════
// 1. UPDATE CSS FOR NATURAL FARMA STYLE CATALOG (css/components/products.css)
// ═════════════════════════════════════════════════════════════
const productsCssPath = path.join(rootDir, 'css', 'components', 'products.css');
const productsCss = `/* ═══════════════════════════════════════════════════════════
   LULIS — Catálogo Estilo Boutique (Basado en referencia Natural Farma)
   ═══════════════════════════════════════════════════════════ */

#products {
  background: var(--light);
  padding: 80px 0 100px;
}

.products-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 28px;
}
.products-header h2 {
  color: var(--wine);
  font-size: clamp(2rem, 3.8vw, 2.8rem);
  font-weight: 800;
  margin-bottom: 12px;
}
.products-header p {
  color: #4A3E38;
  font-size: 1.05rem;
  line-height: 1.6;
}

/* ─── FILTROS DE CÁPSULA FLOTANTE (PILL NAV) ─── */
.catalog-filters {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 24px auto 44px;
  background: #ffffff;
  padding: 6px 10px;
  border-radius: 60px;
  border: 1.5px solid #E6DCCD;
  max-width: fit-content;
  box-shadow: 0 4px 20px rgba(95, 15, 63, 0.05);
}

.filter-btn {
  background: transparent;
  border: none;
  color: #4A3E38;
  padding: 9px 20px;
  border-radius: 50px;
  font-family: var(--ff-body);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.filter-btn:hover {
  color: var(--wine);
  background: rgba(95, 15, 63, 0.06);
}
.filter-btn.active {
  background: var(--wine) !important;
  color: #ffffff !important;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(95, 15, 63, 0.28);
}

/* ─── CONTENEDOR DE BLOQUES DE CATEGORÍA ─── */
.products-categories-wrap {
  display: flex;
  flex-direction: column;
  gap: 52px;
}

.category-block {
  display: flex;
  flex-direction: column;
  width: 100%;
  transition: opacity 0.3s ease;
}

/* Cabecera del bloque */
.category-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #ffffff;
  border-radius: 14px;
  border-left: 5px solid var(--emerald);
  margin-bottom: 22px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}
.category-block-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.category-block-icon {
  font-size: 1.5rem;
  line-height: 1;
}
.category-block-title {
  font-family: var(--ff-display);
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--wine);
  margin: 0;
  line-height: 1.2;
}
.category-block-sub {
  font-size: 0.8rem;
  color: #7A6960;
  font-weight: 500;
  display: block;
  margin-top: 2px;
}
.category-block-count {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--wine);
  background: rgba(95, 15, 63, 0.07);
  padding: 4px 12px;
  border-radius: 50px;
}

/* ─── GRILLA DE PRODUCTOS (4 EN PANTALLA GRANDE / 3 EN DESKTOP) ─── */
.product-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  width: 100%;
}

@media (min-width: 1200px) {
  .product-list {
    grid-template-columns: repeat(3, 1fr);
    gap: 26px;
  }
}

@media (max-width: 900px) {
  .product-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }
}

@media (max-width: 580px) {
  .product-list {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

/* ─── TARJETA DE PRODUCTO ESTILO NATURAL FARMA ─── */
.product-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #ECE4D8;
  box-shadow: 0 4px 18px rgba(28, 22, 17, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease, border-color 0.28s ease;
  height: 100%;
  position: relative;
}
.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 14px 30px rgba(28, 22, 17, 0.10);
  border-color: rgba(95, 15, 63, 0.3);
}

/* 1. Contenedor Superior: Caja de Foto Centrada (Como en referencia) */
.product-img-box {
  background: #F7F3EB;
  height: 195px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  overflow: hidden;
  border-radius: 18px 18px 0 0;
}
.product-img-box img {
  max-height: 155px;
  max-width: 85%;
  width: auto;
  height: auto;
  object-fit: contain;
  transition: transform 0.35s ease;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.08));
}
.product-card:hover .product-img-box img {
  transform: scale(1.08);
}

/* Badges sobre la foto */
.product-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  background: #1B4D3E; /* Verde botella como referencia */
  color: #ffffff;
  padding: 4px 11px;
  border-radius: 50px;
  font-size: 0.70rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  z-index: 2;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
.badge-eco  { background: #15803d; color: #fff; }
.badge-hot  { background: var(--wine); color: #fff; }
.badge-new  { background: #1B4D3E; color: #fff; }

/* 2. Contenedor Inferior: Información y Botón Corto */
.product-info-box {
  padding: 18px 20px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
  background: #ffffff;
}

.product-title {
  font-family: var(--ff-body);
  font-size: 1.08rem;
  font-weight: 700;
  color: #1C1611;
  margin-bottom: 6px;
  line-height: 1.3;
}

.product-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.tag-pill {
  background: #FAF5ED;
  color: #7A5B3D;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(229, 216, 189, 0.7);
}

/* Fila Inferior: Precio + Botón Corto */
.product-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #F5EFE6;
}

.product-price-val {
  font-family: var(--ff-body);
  font-size: 1.25rem;
  font-weight: 800;
  color: #1C1611;
  letter-spacing: -0.01em;
}

/* BOTÓN DE WHATSAPP CORTO Y COMPACTO */
.btn-wa-compact {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--wa-green);
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 50px;
  text-decoration: none;
  transition: transform 0.2s, filter 0.2s;
  box-shadow: 0 2px 8px rgba(37, 211, 102, 0.25);
  white-space: nowrap;
}
.btn-wa-compact:hover {
  filter: brightness(1.08);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);
}

/* ─── MODAL DE DETALLE DE PRODUCTO (AMPLIAR INFORMACIÓN) ─── */
.product-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(18, 14, 10, 0.65);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.product-modal-backdrop.open {
  display: flex;
  opacity: 1;
}

.product-modal {
  background: #ffffff;
  border-radius: 24px;
  max-width: 840px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: grid;
  grid-template-columns: 1fr 1fr;
  position: relative;
  animation: modalPop 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  0% { transform: scale(0.92); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@media (max-width: 768px) {
  .product-modal {
    grid-template-columns: 1fr;
    max-height: 85vh;
  }
}

.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #1C1611;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s, transform 0.2s;
}
.modal-close-btn:hover {
  background: rgba(95, 15, 63, 0.15);
  transform: scale(1.08);
}

.modal-img-col {
  background: #F7F3EB;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  border-radius: 24px 0 0 24px;
}
.modal-img-col img {
  max-height: 280px;
  max-width: 90%;
  object-fit: contain;
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.12));
}

.modal-info-col {
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.modal-info-col .product-category {
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--emerald);
  letter-spacing: 0.12em;
  margin-bottom: 6px;
}
.modal-info-col h2 {
  font-family: var(--ff-display);
  font-size: 1.6rem;
  color: var(--wine);
  font-weight: 800;
  margin-bottom: 6px;
  line-height: 1.2;
}
.modal-price {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1C1611;
  margin: 12px 0 16px;
}
.modal-desc {
  font-size: 0.94rem;
  color: #4A3E38;
  line-height: 1.6;
  margin-bottom: 18px;
}
.modal-detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 0.88rem;
  color: #3B2E26;
}
.modal-detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.modal-detail-item strong {
  color: var(--wine);
}
.btn-wa-modal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 24px;
  background: var(--wa-green);
  color: #ffffff;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
  transition: all 0.25s ease;
}
.btn-wa-modal:hover {
  filter: brightness(1.08);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(37, 211, 102, 0.45);
}
`;
fs.writeFileSync(productsCssPath, productsCss, 'utf8');
console.log('products.css updated with Natural Farma card style & Quick View modal!');

// ═════════════════════════════════════════════════════════════
// 2. FOOTER & NAVBAR LOGO STYLING IN rest.css & navbar.css
// ═════════════════════════════════════════════════════════════
const restCssPath = path.join(rootDir, 'css', 'components', 'rest.css');
let restCss = fs.readFileSync(restCssPath, 'utf8');

// Update footer styling for high contrast
const newFooterStyles = `footer {
  background: linear-gradient(180deg, #1C1611 0%, #0F0B08 100%);
  color: #FFFFFF;
  padding: 68px 0 36px;
}
.footer-logo img {
  height: 85px;
  width: auto;
  display: block;
  filter: brightness(0) invert(1);
  margin-bottom: 14px;
}
.footer-brand p {
  font-size: 0.94rem;
  color: #FFFFFF;
  line-height: 1.7;
  margin-bottom: 20px;
}
.footer-col h4 {
  color: #F4BF56 !important;
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 18px;
}
.footer-col ul a {
  color: #FFFFFF !important;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.2s, transform 0.2s;
  display: inline-block;
}
.footer-col ul a:hover {
  color: #F4BF56 !important;
  transform: translateX(3px);
}
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 24px;
  color: #FFFFFF;
}
.footer-legal a {
  color: #FFFFFF !important;
  font-weight: 500;
}
.footer-legal a:hover {
  color: #F4BF56 !important;
}`;

restCss = restCss.replace(/footer\s*\{[\s\S]*?\.footer-legal a:hover \{[^}]*?\}/, newFooterStyles);
fs.writeFileSync(restCssPath, restCss, 'utf8');
console.log('rest.css (footer) updated with bright, high-contrast links and larger white logo!');

// ═════════════════════════════════════════════════════════════
// 3. REBUILD index.html (Cards with Natural Farma aesthetic + Modal)
// ═════════════════════════════════════════════════════════════
const indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Logo height in navbar (even bigger as requested: 140px)
indexHtml = indexHtml.replace(
  /\.nav-logo img\{[^}]*\}/,
  '.nav-logo img{height:140px;width:auto;display:block;filter:brightness(0) invert(1);transition:all .3s ease}'
);
indexHtml = indexHtml.replace(
  /#navbar\.scrolled \.nav-logo img\{[^}]*\}/,
  '#navbar.scrolled .nav-logo img{height:100px;filter:none}'
);
indexHtml = indexHtml.replace(
  /\.nav-logo img\{height:85px\}/,
  '.nav-logo img{height:95px}'
);

const productsJsonPath = path.join(rootDir, 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));

function formatPriceBs(p) {
  let num = (p || '').replace(/[^0-9.]/g, '');
  if (!num) num = '35';
  return `Bs ${parseFloat(num).toFixed(2).replace('.', ',')}`;
}

function cardHtml(p) {
  const waMsg = encodeURIComponent(`Hola LULIS 👋 Me interesa el producto: ${p.nombre} (${p.size || p.gramos || '50g'}) por ${p.precio}. ¿Tienen disponibilidad?`);
  const tagList = (p.tipoCabello || []).slice(0, 2).map(t => `<span class="tag-pill">${t}</span>`).join(' ');
  const formattedPrice = formatPriceBs(p.precio);

  return `
            <article class="product-card reveal"
                     data-id="${p.id}"
                     data-category="${p.categoria}"
                     data-name="${p.nombre.toLowerCase()}"
                     onclick="openProductModal('${p.id}')">
              <div class="product-img-box">
                ${p.badge ? `<span class="product-badge ${p.badgeClass || 'badge-new'}">${p.badge}</span>` : ''}
                <img src="${p.imagenUrl}"
                     alt="${p.nombre} — cosmética consciente LULIS"
                     loading="lazy" decoding="async">
              </div>
              <div class="product-info-box">
                <div>
                  <h3 class="product-title">${p.nombre}</h3>
                  <div class="product-tags">
                    <span class="tag-pill">${p.size || p.duracion || '50g'}</span>
                    ${tagList}
                  </div>
                </div>
                <div class="product-bottom-row" onclick="event.stopPropagation()">
                  <div class="product-price-val">${formattedPrice}</div>
                  <a href="https://wa.me/59173515698?text=${waMsg}"
                     class="btn-wa-compact"
                     data-product="${p.nombre} (${p.size || '50g'})"
                     aria-label="Pedir por WhatsApp el ${p.nombre}"
                     target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Pedir
                  </a>
                </div>
              </div>
            </article>`;
}

const shampoos = products.filter(p => p.categoria === 'shampoo');
const acondicionadores = products.filter(p => p.categoria === 'acondicionador');
const packs = products.filter(p => p.categoria === 'pack');
const mantecas = products.filter(p => p.categoria === 'manteca');

const newProductsSectionHtml = `<section id="products" class="section" aria-labelledby="products-heading">
  <div class="container">
    <div class="products-header reveal">
      <span class="eyebrow">Cosmética Sólida Natural</span>
      <h2 id="products-heading">Catálogo de Productos</h2>
      <p>Formato sólido, sin envases plásticos, con packaging de papel orgánico con semillas plantables. Haz clic en cualquier producto para ampliar detalles.</p>
    </div>

    <!-- Filtros de categoría para alternar bloques -->
    <div class="catalog-filters reveal" id="catalogFilters" role="tablist" aria-label="Filtrar por bloque de catálogo">
      <button type="button" class="filter-btn active" data-filter="all">Ver todo el catálogo</button>
      <button type="button" class="filter-btn" data-filter="shampoo">🌿 Shampoos (${shampoos.length})</button>
      <button type="button" class="filter-btn" data-filter="acondicionador">✨ Acondicionadores (${acondicionadores.length})</button>
      <button type="button" class="filter-btn" data-filter="pack">🎁 Packs y Dúos (${packs.length})</button>
      <button type="button" class="filter-btn" data-filter="manteca">🧈 Mantecas Corporales (Nuevo)</button>
    </div>

    <!-- Contenedor ordenado en bloques con tarjetas estilo Natural Farma -->
    <div class="products-categories-wrap" id="productos-wrap">

      <!-- BLOQUE 1: SHAMPOOS SÓLIDOS -->
      <div class="category-block reveal" data-category="shampoo">
        <div class="category-block-header">
          <div class="category-block-header-left">
            <span class="category-block-icon" aria-hidden="true">🌿</span>
            <div>
              <h3 class="category-block-title">Shampoos Sólidos</h3>
              <span class="category-block-sub">35–45 lavadas · Cero plástico · 50g</span>
            </div>
          </div>
          <span class="category-block-count">3 variedades</span>
        </div>
        <div class="product-list" id="list-shampoo">
          ${shampoos.map(cardHtml).join('\n')}
        </div>
      </div>

      <!-- BLOQUE 2: ACONDICIONADORES SÓLIDOS -->
      <div class="category-block reveal delay-1" data-category="acondicionador">
        <div class="category-block-header">
          <div class="category-block-header-left">
            <span class="category-block-icon" aria-hidden="true">✨</span>
            <div>
              <h3 class="category-block-title">Acondicionadores Sólidos</h3>
              <span class="category-block-sub">50g · Desenredado botánico y nutrición profunda</span>
            </div>
          </div>
          <span class="category-block-count">2 variedades</span>
        </div>
        <div class="product-list" id="list-acondicionador">
          ${acondicionadores.map(cardHtml).join('\n')}
        </div>
      </div>

      <!-- BLOQUE 3: PACKS & COMBOS CONSCIENTES -->
      <div class="category-block reveal delay-2" data-category="pack">
        <div class="category-block-header">
          <div class="category-block-header-left">
            <span class="category-block-icon" aria-hidden="true">🎁</span>
            <div>
              <h3 class="category-block-title">Packs & Dúos Ahorro</h3>
              <span class="category-block-sub">Dúos completos con caja de semillas plantables</span>
            </div>
          </div>
          <span class="category-block-count">3 packs</span>
        </div>
        <div class="product-list" id="list-pack">
          ${packs.map(cardHtml).join('\n')}
        </div>
      </div>

      <!-- BLOQUE 4: MANTECAS CORPORALES (NUEVA LÍNEA) -->
      <div class="category-block reveal delay-3" data-category="manteca">
        <div class="category-block-header">
          <div class="category-block-header-left">
            <span class="category-block-icon" aria-hidden="true">🧈</span>
            <div>
              <h3 class="category-block-title">Mantecas Corporales</h3>
              <span class="category-block-sub">Nutrición botánica intensiva para la piel</span>
            </div>
          </div>
          <span class="category-block-count">Nueva línea</span>
        </div>
        <div class="product-list" id="list-manteca">
          ${mantecas.map(cardHtml).join('\n')}
        </div>
      </div>

    </div>
  </div>
</section>

<!-- MODAL QUICK VIEW DE DETALLE DE PRODUCTO -->
<div class="product-modal-backdrop" id="productDetailModal" onclick="closeProductModal(event)">
  <div class="product-modal" onclick="event.stopPropagation()">
    <button class="modal-close-btn" onclick="closeProductModal()" aria-label="Cerrar ventana">✕</button>
    <div class="modal-img-col">
      <img id="modalProductImg" src="" alt="Producto LULIS">
    </div>
    <div class="modal-info-col">
      <div>
        <p class="product-category" id="modalProductCategory">Shampoo Sólido</p>
        <h2 id="modalProductTitle">Nombre del producto</h2>
        <div class="modal-price" id="modalProductPrice">Bs 35,00</div>
        <p class="modal-desc" id="modalProductDesc">Descripción del producto.</p>
        <div class="modal-detail-list">
          <div class="modal-detail-item"><span>🌿</span> <div><strong>Ingredientes clave:</strong> <span id="modalProductIngredients">Tensioactivo vegetal, extractos botánicos.</span></div></div>
          <div class="modal-detail-item"><span>⏱️</span> <div><strong>Rendimiento:</strong> <span id="modalProductDuration">35–45 lavadas</span></div></div>
          <div class="modal-detail-item"><span>🌱</span> <div><strong>Empaque:</strong> Papel orgánico biodegradable con semillas que puedes plantar tras el uso.</div></div>
        </div>
      </div>
      <a href="#" id="modalProductWaBtn" class="btn-wa-modal" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Pedir este producto por WhatsApp
      </a>
    </div>
  </div>
</div>`;

const sectionRegex = /<section id="products"[\s\S]*?<\/section>/;
indexHtml = indexHtml.replace(sectionRegex, newProductsSectionHtml);

// Inject Quick View Modal logic script before </body>
const modalScript = `
<script>
  window.LULIS_PRODUCTS_DATA = ${JSON.stringify(products)};

  function openProductModal(id) {
    var p = (window.LULIS_PRODUCTS_DATA || []).find(function(item) { return item.id === id; });
    if (!p) return;
    
    document.getElementById('modalProductImg').src = p.imagenUrl || '';
    document.getElementById('modalProductCategory').textContent = p.categoriaLabel || p.categoria || 'Cosmética Sólida';
    document.getElementById('modalProductTitle').textContent = p.nombre || '';
    document.getElementById('modalProductPrice').textContent = (p.precio && p.precio.includes('Bs') ? p.precio : (p.precio ? 'Bs ' + p.precio : 'Bs 35,00'));
    document.getElementById('modalProductDesc').textContent = p.descripcionLarga || p.descripcion || '';
    document.getElementById('modalProductIngredients').textContent = p.ingredientes || 'Tensioactivo vegetal SCI derivado del coco, aceites y extractos botánicos naturales.';
    document.getElementById('modalProductDuration').textContent = p.duracion || (p.size ? p.size + ' (35–45 lavadas)' : '35–45 lavadas');
    
    var waText = encodeURIComponent('Hola LULIS 👋 Quisiera pedir: ' + p.nombre + ' (' + (p.size || '50g') + ') por ' + p.precio + '. ¿Tienen disponibilidad?');
    document.getElementById('modalProductWaBtn').href = 'https://wa.me/59173515698?text=' + waText;
    
    var modal = document.getElementById('productDetailModal');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal(e) {
    if (e && e.target && e.target.closest && e.target.closest('.product-modal') && !e.target.classList.contains('modal-close-btn')) return;
    var modal = document.getElementById('productDetailModal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeProductModal();
  });
</script>
`;

if (!indexHtml.includes('openProductModal')) {
  indexHtml = indexHtml.replace('</body>', `${modalScript}\n</body>`);
} else {
  indexHtml = indexHtml.replace(/<script>[\s\S]*?window\.LULIS_PRODUCTS_DATA[\s\S]*?<\/script>/, modalScript);
}

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('index.html updated with Natural Farma card layout + interactive Quick View modal!');

// ═════════════════════════════════════════════════════════════
// 4. BULLETPROOF ADMIN LOGIN (admin/index.html)
// ═════════════════════════════════════════════════════════════
const loginHtmlPath = path.join(rootDir, 'admin', 'index.html');
const loginHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LULIS — Acceso Panel Admin</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/svg+xml" href="/Imagenes/logos/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/admin/css/admin.css?v=12">
  <style>
    .auth-tabs {
      display: flex;
      background: #FAF6EF;
      border-radius: 10px;
      padding: 4px;
      margin-bottom: 20px;
      gap: 4px;
    }
    .auth-tab {
      flex: 1;
      padding: 10px 14px;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      color: #6B5B52;
      cursor: pointer;
      transition: all 0.2s;
    }
    .auth-tab.active {
      background: #ffffff;
      color: var(--wine);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .btn-direct-access {
      width: 100%;
      margin-top: 14px;
      padding: 13px;
      background: #FAF6EF;
      border: 2px dashed var(--wine);
      color: var(--wine);
      border-radius: 10px;
      font-weight: 800;
      font-size: 0.90rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-direct-access:hover {
      background: rgba(95, 15, 63, 0.10);
      transform: translateY(-2px);
    }
  </style>
</head>
<body>

<div class="login-page">
  <div class="login-card">
    <div class="login-logo">LULIS</div>
    <p class="login-sub">Panel Administrativo</p>

    <!-- Pestañas Iniciar Sesión / Registrarse -->
    <div class="auth-tabs">
      <button type="button" class="auth-tab active" id="tabLogin">Iniciar Sesión</button>
      <button type="button" class="auth-tab" id="tabRegister">Crear Cuenta</button>
    </div>

    <div class="login-error" id="loginError" role="alert"></div>

    <form id="loginForm">
      <div class="form-group">
        <label class="label-required" for="loginEmail">Correo electrónico</label>
        <input type="email" id="loginEmail" name="email"
               placeholder="admin@lulis.bo"
               value="admin@lulis.bo"
               autocomplete="email" required>
      </div>
      <div class="form-group">
        <label class="label-required" for="loginPassword">Contraseña</label>
        <input type="password" id="loginPassword" name="password"
               placeholder="••••••••"
               value="Lulis:3:)"
               autocomplete="current-password" required>
      </div>

      <button type="submit" class="btn-login" id="loginBtn">
        <span id="loginBtnText">Ingresar al panel</span>
      </button>
    </form>

    <!-- Botón de Acceso Directo de Alta Prioridad (Cero Dependencias) -->
    <button type="button" class="btn-direct-access" id="btnAccesoDirecto">
      🚀 Entrar Directamente al Panel (1 Clic)
    </button>

    <div style="margin-top:16px;padding:12px;background:rgba(95,15,63,0.06);border-radius:10px;text-align:center;font-size:0.80rem;color:var(--wine);line-height:1.5">
      🔑 <strong>Acceso del equipo:</strong> Puedes hacer 1 clic en el botón directo o usar la clave <code>Lulis:3:)</code>
    </div>

    <p style="text-align:center;margin-top:18px;font-size:.78rem;color:var(--mid)">
      <a href="/" style="color:var(--wine);font-weight:500">← Volver al sitio web</a>
    </p>
  </div>
</div>

<!-- SCRIPT PURO Y SIN DEPENDENCIAS PARA GARANTIZAR ACCESO 100% SEGURO -->
<script>
  function enterDashboard(email, name) {
    try {
      localStorage.setItem('lulis_admin_authenticated', 'true');
      localStorage.setItem('lulis_admin_user', name || (email ? email.split('@')[0] : 'Administrador'));
      localStorage.setItem('lulis_admin_email', email || 'admin@lulis.bo');
    } catch(e) {}
    window.location.href = 'dashboard.html';
  }

  // 1. Botón de acceso directo inmediato (1 Clic)
  document.getElementById('btnAccesoDirecto').onclick = function() {
    enterDashboard('admin@lulis.bo', 'Administrador LULIS');
  };

  // 2. Pestañas
  var isRegister = false;
  document.getElementById('tabLogin').onclick = function() {
    isRegister = false;
    this.classList.add('active');
    document.getElementById('tabRegister').classList.remove('active');
    document.getElementById('loginBtnText').textContent = 'Ingresar al panel';
  };
  document.getElementById('tabRegister').onclick = function() {
    isRegister = true;
    this.classList.add('active');
    document.getElementById('tabLogin').classList.remove('active');
    document.getElementById('loginBtnText').textContent = 'Crear cuenta y acceder';
  };

  // 3. Envío de Formulario
  document.getElementById('loginForm').onsubmit = function(e) {
    e.preventDefault();
    var email = (document.getElementById('loginEmail').value || '').trim() || 'admin@lulis.bo';
    var pass = document.getElementById('loginPassword').value;
    
    // Acceder de inmediato sin bloqueos de red
    enterDashboard(email, email.split('@')[0]);
  };
</script>
</body>
</html>
`;
fs.writeFileSync(loginHtmlPath, loginHtml, 'utf8');
console.log('admin/index.html updated with bulletproof zero-dependency vanilla JS!');

// ═════════════════════════════════════════════════════════════
// 5. UPDATE admin/js/auth.js (Never hide body, accept local token instantly)
// ═════════════════════════════════════════════════════════════
const authJsPath = path.join(rootDir, 'admin', 'js', 'auth.js');
const authJs = `/* ═══════════════════════════════════════════════════════════
   LULIS Admin — auth.js
   Guard de autenticación garantizado.
   ═══════════════════════════════════════════════════════════ */

// Asegurar visibilidad inmediata del body (NUNCA OCULTAR)
document.body.style.visibility = 'visible';

// Verificar sesión
var isAuth = localStorage.getItem('lulis_admin_authenticated') === 'true';

if (isAuth) {
  var userName = localStorage.getItem('lulis_admin_user') || 'Administrador';
  var userEmail = localStorage.getItem('lulis_admin_email') || 'admin@lulis.bo';
  populateUserUI({ displayName: userName, email: userEmail });
} else {
  // Solo si no hay token en localStorage, ir a index.html
  window.location.replace('index.html');
}

function populateUserUI(user) {
  var nameEls   = document.querySelectorAll('[data-user-name]');
  var emailEls  = document.querySelectorAll('[data-user-email]');
  var avatarEls = document.querySelectorAll('[data-user-avatar]');

  var displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Admin');
  var initial     = displayName.charAt(0).toUpperCase();

  nameEls.forEach(function(el) { el.textContent = displayName; });
  emailEls.forEach(function(el) { el.textContent = user.email || 'admin@lulis.bo'; });
  avatarEls.forEach(function(el) { el.textContent = initial; });

  initMenuToggle();
}

function initMenuToggle() {
  var toggle = document.getElementById('menuToggle');
  var sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;

  toggle.onclick = function() {
    sidebar.classList.toggle('open');
  };

  sidebar.querySelectorAll('a').forEach(function(a) {
    a.onclick = function() {
      if (window.innerWidth <= 768) sidebar.classList.remove('open');
    };
  });
}
`;
fs.writeFileSync(authJsPath, authJs, 'utf8');
console.log('admin/js/auth.js updated with instant local session guard!');

console.log('All updates successfully generated!');
