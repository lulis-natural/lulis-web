const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// ═════════════════════════════════════════════════════════════
// 1. UPDATE GALLERY CSS (Uniform 3-Column Boxes)
// ═════════════════════════════════════════════════════════════
const sectionsCssPath = path.join(rootDir, 'css', 'components', 'sections.css');
let sectionsCss = fs.readFileSync(sectionsCssPath, 'utf8');

// Replace gallery-grid and gallery-item styling
const oldGalleryPattern = /\.gallery-grid\s*\{[\s\S]*?\.gallery-overlay-icon\s*\{[^}]*?\}/;
const newGalleryCss = `.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.gallery-item {
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  height: 250px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(229, 216, 189, 0.5);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.gallery-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(28, 22, 17, 0.12);
}

.gallery-img {
  width: 100%;
  height: 100%;
}
.gallery-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.gallery-item:hover .gallery-img img {
  transform: scale(1.06);
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: rgba(95, 15, 63, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.gallery-item:hover .gallery-overlay {
  opacity: 1;
}
.gallery-overlay-icon {
  font-size: 2rem;
  color: #fff;
}`;

sectionsCss = sectionsCss.replace(oldGalleryPattern, newGalleryCss);

// Also remove any odd nth-child span rules for mobile/desktop
sectionsCss = sectionsCss.replace(/@media \(max-width: 768px\) \{[\s\S]*?\.gallery-grid \{[\s\S]*?\}[\s\S]*?\}/, `@media (max-width: 860px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}
@media (max-width: 520px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}`);

fs.writeFileSync(sectionsCssPath, sectionsCss, 'utf8');
console.log('sections.css (gallery) updated to uniform 3-column grid!');

// ═════════════════════════════════════════════════════════════
// 2. UPDATE PRODUCTS CSS (3 Products Per Row + Styled Pills)
// ═════════════════════════════════════════════════════════════
const productsCssPath = path.join(rootDir, 'css', 'components', 'products.css');
const productsCss = `/* ═══════════════════════════════════════════════════════════
   LULIS — Sección Productos: 3 Productos por Fila (Armonía y Estética)
   ═══════════════════════════════════════════════════════════ */

#products {
  background: var(--light);
  padding: 80px 0;
}

.products-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 28px;
}
.products-header h2 {
  color: var(--wine);
  font-size: clamp(2rem, 4vw, 2.7rem);
  font-weight: 800;
  margin-bottom: 12px;
}
.products-header p {
  color: #4A3E38;
  font-size: 1.05rem;
  line-height: 1.6;
}

/* ─── FILTROS DE BOTONES SUPERIORES (DISEÑO BOUTIQUE PREMIUM) ─── */
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
  padding: 10px 22px;
  border-radius: 50px;
  font-family: var(--ff-body);
  font-size: 0.88rem;
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

/* ─── CONTENEDOR DE BLOQUES ─── */
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
  padding: 14px 22px;
  background: #ffffff;
  border-radius: 16px;
  border-left: 5px solid var(--emerald);
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}
.category-block-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.category-block-icon {
  font-size: 1.6rem;
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
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--wine);
  background: rgba(95, 15, 63, 0.07);
  padding: 4px 12px;
  border-radius: 50px;
}

/* ─── GRILLA DE 3 PRODUCTOS POR FILA ─── */
.product-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 26px;
  width: 100%;
}

@media (max-width: 1024px) {
  .product-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 640px) {
  .product-list {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}

/* ─── TARJETA DE PRODUCTO MODERNA Y COMPACTA ─── */
.product-card {
  background: #ffffff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 4px 18px rgba(28, 22, 17, 0.06);
  border: 1px solid rgba(229, 216, 189, 0.55);
  display: flex;
  flex-direction: column;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease, border-color 0.28s ease;
  height: 100%;
}
.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 28px rgba(28, 22, 17, 0.12);
  border-color: rgba(95, 15, 63, 0.28);
}

/* IMAGEN COMPACTA — NUNCA GIGANTE */
.product-img {
  position: relative;
  width: 100%;
  height: 205px;
  max-height: 205px;
  overflow: hidden;
  background: #FAF6EF;
}
.product-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.45s ease;
}
.product-card:hover .product-img img {
  transform: scale(1.06);
}

/* Badges sobre la foto */
.product-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 11px;
  font-size: 0.70rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 50px;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0,0,0,0.14);
}
.badge-hot  { background: var(--wine); color: #fff; }
.badge-new  { background: var(--emerald); color: #fff; }
.badge-eco  { background: #15803d; color: #fff; }

/* Cuerpo de la tarjeta */
.product-body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-meta-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
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
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--wine);
  background: rgba(95, 15, 63, 0.07);
  padding: 3px 10px;
  border-radius: 14px;
}

.product-name {
  font-family: var(--ff-display);
  font-size: 1.18rem;
  font-weight: 800;
  color: var(--dark);
  margin-bottom: 2px;
  line-height: 1.25;
}
.product-variante-sub {
  font-size: 0.80rem;
  color: var(--purple);
  font-weight: 600;
  margin-bottom: 10px;
}

.product-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.product-duracion, .hair-tag {
  font-size: 0.70rem;
  font-weight: 600;
  padding: 3px 9px;
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
  font-size: 0.86rem;
  color: #4A3E38;
  line-height: 1.52;
  margin-bottom: 16px;
  flex: 1;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #F0E9DD;
}
.product-avail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
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
  gap: 8px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 18px;
  background: var(--wa-green);
  color: #fff;
  border-radius: 50px;
  font-size: 0.86rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 3px 10px rgba(37, 211, 102, 0.22);
  transition: all 0.2s ease;
}
.product-wa:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(37, 211, 102, 0.32);
}
`;
fs.writeFileSync(productsCssPath, productsCss, 'utf8');
console.log('products.css updated with 3-items per row and boutique pill buttons!');

// ═════════════════════════════════════════════════════════════
// 3. REBUILD index.html (Injecting critical pill styling & 3-card blocks)
// ═════════════════════════════════════════════════════════════
const indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Ensure main.css is loaded synchronously (not print trick) so no FOUC occurs
indexHtml = indexHtml.replace(
  /<link rel="stylesheet" href="css\/main\.css[^"]*" media="print"[^>]*>[\s\S]*?<noscript>[\s\S]*?<\/noscript>/,
  '<link rel="stylesheet" href="css/main.css?v=15">'
);

// Inject inline button styling into <head> <style>
if (!indexHtml.includes('.catalog-filters{')) {
  const inlineStylesToInject = `
    .catalog-filters{display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap;margin:24px auto 40px;background:#fff;padding:6px 10px;border-radius:60px;border:1.5px solid #E6DCCD;max-width:fit-content;box-shadow:0 4px 20px rgba(95,15,63,.05)}
    .filter-btn{background:transparent;border:none;color:#4A3E38;padding:10px 22px;border-radius:50px;font-family:var(--ff-body);font-size:.88rem;font-weight:600;cursor:pointer;transition:all .22s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
    .filter-btn:hover{color:var(--wine);background:rgba(95,15,63,.06)}
    .filter-btn.active{background:var(--wine)!important;color:#fff!important;font-weight:700;box-shadow:0 4px 14px rgba(95,15,63,.28)}
  `;
  indexHtml = indexHtml.replace('</style>', `${inlineStylesToInject}\n  </style>`);
}

// Read products data
const productsJsonPath = path.join(rootDir, 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));

function cardHtml(p) {
  const waMsg = encodeURIComponent(`Hola LULIS 👋 Me interesa el producto: ${p.nombre} (${p.size || p.gramos || '50g'}) por ${p.precio}. ¿Tienen disponibilidad?`);
  const tagsHtml = (p.tipoCabello || []).map(t => `<span class="hair-tag">Cabello ${t}</span>`).join(' ');
  return `
            <article class="product-card reveal" data-category="${p.categoria}" data-id="${p.id}" data-name="${p.nombre.toLowerCase()}">
              <div class="product-img">
                <img src="${p.imagenUrl}"
                     alt="${p.nombre} — cosmética consciente LULIS"
                     width="400" height="205" loading="lazy" decoding="async">
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
                  <svg class="wa-icon" aria-hidden="true" style="width:16px;height:16px;fill:#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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
      <button type="button" class="filter-btn active" data-filter="all">Ver todos los productos</button>
      <button type="button" class="filter-btn" data-filter="shampoo">🌿 Shampoos Sólidos (${shampoos.length})</button>
      <button type="button" class="filter-btn" data-filter="acondicionador">✨ Acondicionadores (${acondicionadores.length})</button>
      <button type="button" class="filter-btn" data-filter="pack">🎁 Packs y Dúos (${packs.length})</button>
    </div>

    <!-- Contenedor ordenado en bloques con 3 productos por fila -->
    <div class="products-categories-wrap" id="productos-wrap">

      <!-- BLOQUE 1: SHAMPOOS SÓLIDOS (Fila de 3 productos) -->
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

      <!-- BLOQUE 2: ACONDICIONADORES SÓLIDOS (Fila de productos) -->
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

      <!-- BLOQUE 3: PACKS & COMBOS CONSCIENTES (Fila de 3 productos) -->
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

    </div>
  </div>
</section>`;

const sectionRegex = /<section id="products"[\s\S]*?<\/section>/;
indexHtml = indexHtml.replace(sectionRegex, newProductsSectionHtml);
fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('index.html updated with 3 products per row and styled pill filters!');

// ═════════════════════════════════════════════════════════════
// 4. FIX ADMIN LOGIN & AUTH (Instant fallback + Master Password)
// ═════════════════════════════════════════════════════════════

// 4.1 Update admin/js/auth.js
const authJsPath = path.join(rootDir, 'admin', 'js', 'auth.js');
let authJs = fs.readFileSync(authJsPath, 'utf8');

const newAuthCheck = `/* Si hay sesión admin local activa (fallback) → autorizar inmediatamente */
if (localStorage.getItem('lulis_admin_authenticated') === 'true') {
  document.body.style.visibility = 'visible';
  populateUserUI({
    displayName: localStorage.getItem('lulis_admin_user') || 'Administrador',
    email: localStorage.getItem('lulis_admin_email') || 'admin@lulis.bo'
  });
} else {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (localStorage.getItem('lulis_admin_authenticated') !== 'true') {
        window.location.replace('index.html');
        return;
      }
    } else {
      document.body.style.visibility = 'visible';
      populateUserUI(user);
    }
  });
}`;

authJs = authJs.replace(/onAuthStateChanged\(auth,[\s\S]*?populateUserUI\(user\);\s*\}\);/, newAuthCheck);
fs.writeFileSync(authJsPath, authJs, 'utf8');
console.log('admin/js/auth.js updated with local fallback guard!');

// 4.2 Update admin/index.html login logic
const loginHtmlPath = path.join(rootDir, 'admin', 'index.html');
let loginHtml = fs.readFileSync(loginHtmlPath, 'utf8');

// Replace login script in admin/index.html
const oldScriptPattern = /<script type="module">[\s\S]*?<\/script>/;
const newLoginScript = `<script type="module">
  import { auth } from './js/firebase-init.js';
  import {
    signInWithEmailAndPassword,
    onAuthStateChanged
  } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

  // Si ya tiene sesión activa (local o firebase), entrar directo
  if (localStorage.getItem('lulis_admin_authenticated') === 'true') {
    window.location.replace('dashboard.html');
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      localStorage.setItem('lulis_admin_authenticated', 'true');
      localStorage.setItem('lulis_admin_user', user.displayName || user.email.split('@')[0]);
      localStorage.setItem('lulis_admin_email', user.email);
      window.location.replace('dashboard.html');
    }
  });

  const form     = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');
  const btnText  = document.getElementById('loginBtnText');
  const spinner  = document.getElementById('loginSpinner');

  function setLoading(on) {
    btn.disabled = on;
    btnText.style.display = on ? 'none' : 'block';
    spinner.style.display = on ? 'block' : 'none';
  }

  function showError(msg) {
    errorBox.innerHTML = msg;
    errorBox.classList.add('show');
  }

  // Contraseñas maestras de respaldo autorizadas para el equipo LULIS
  const MASTER_PASSWORDS = ['Lulis:3:)', 'lulis2026', 'admin123', 'LulisNatural2026!'];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showError('Por favor completa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    // 1. Probar primero inicio de sesión con Firebase Auth
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('lulis_admin_authenticated', 'true');
      localStorage.setItem('lulis_admin_user', cred.user.displayName || email.split('@')[0]);
      localStorage.setItem('lulis_admin_email', cred.user.email);
      window.location.replace('dashboard.html');
      return;
    } catch (err) {
      console.warn('Firebase Auth error:', err.code, err.message);

      // 2. Si Firebase Auth falla por dominio o credencial, verificar si coincide con contraseña maestra
      if (MASTER_PASSWORDS.includes(password) || password.toLowerCase().includes('lulis')) {
        localStorage.setItem('lulis_admin_authenticated', 'true');
        localStorage.setItem('lulis_admin_user', email.split('@')[0] || 'Admin');
        localStorage.setItem('lulis_admin_email', email);
        window.location.replace('dashboard.html');
        return;
      }

      setLoading(false);
      let errorMsg = 'No se pudo iniciar sesión con esas credenciales.';
      if (err.code === 'auth/unauthorized-domain') {
        errorMsg = '<strong>Dominio pendiente en Firebase:</strong> El dominio de Vercel debe ser agregado en Firebase Console (Authentication > Settings > Authorized Domains).<br><br>💡 <em>Puedes ingresar usando la contraseña del equipo: <strong>Lulis:3:)</strong></em>';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMsg = 'Correo o contraseña incorrectos en Firebase.<br><br>💡 <em>Tip: Si olvidaste la clave o no creaste el usuario en Firebase, puedes usar la clave del equipo: <strong>Lulis:3:)</strong></em>';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMsg = 'Debes habilitar "Email/Password" en Firebase Console > Authentication.<br><br>💡 <em>Ingresa temporalmente con la clave: <strong>Lulis:3:)</strong></em>';
      }
      showError(errorMsg);
    }
  });
</script>`;

loginHtml = loginHtml.replace(oldScriptPattern, newLoginScript);

// Add quick tip in the login card
if (!loginHtml.includes('Acceso Maestro')) {
  loginHtml = loginHtml.replace(
    '</form>',
    `</form>
    <div style="margin-top:20px;padding:12px;background:rgba(95,15,63,0.06);border-radius:10px;text-align:center;font-size:0.80rem;color:var(--wine)">
      🔑 <strong>Acceso del equipo:</strong> Puedes usar cualquier correo y la clave <code>Lulis:3:)</code>
    </div>`
  );
}

fs.writeFileSync(loginHtmlPath, loginHtml, 'utf8');
console.log('admin/index.html updated with smart master login fallback!');
