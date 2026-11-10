const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. UPDATE vercel.json
const vercelPath = path.join(rootDir, 'vercel.json');
let vercelJson = fs.readFileSync(vercelPath, 'utf8');
vercelJson = vercelJson.replace(
  /"source": "\/css\/\(\.\*\)",\s*"headers": \[\s*\{\s*"key": "Cache-Control",\s*"value": "[^"]*"\s*\}\s*\]/,
  `"source": "/css/(.*)",\n      "headers": [\n        {\n          "key": "Cache-Control",\n          "value": "no-store, no-cache, must-revalidate, max-age=0"\n        },\n        {\n          "key": "Pragma",\n          "value": "no-cache"\n        }\n      ]`
);
vercelJson = vercelJson.replace(
  /"source": "\/js\/\(\.\*\)",\s*"headers": \[\s*\{\s*"key": "Cache-Control",\s*"value": "[^"]*"\s*\}\s*\]/,
  `"source": "/js/(.*)",\n      "headers": [\n        {\n          "key": "Cache-Control",\n          "value": "no-store, no-cache, must-revalidate, max-age=0"\n        },\n        {\n          "key": "Pragma",\n          "value": "no-cache"\n        }\n      ]`
);
fs.writeFileSync(vercelPath, vercelJson);
console.log('vercel.json updated with zero-cache headers for instant updates!');

// 2. UPDATE rest.css (Gallery Pager & Footer)
const restCssPath = path.join(rootDir, 'css', 'components', 'rest.css');
let restCss = fs.readFileSync(restCssPath, 'utf8');

// Update gallery pager in rest.css to bright high contrast
const galleryPagerRegex = /\.gallery-pager-btn\s*\{[\s\S]*?\.gallery-pager-info\s*strong\s*\{[^}]*\}/;
const newGalleryPagerCss = `.gallery-pager-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 36px;
  padding: 16px 0;
}
.gallery-pager-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #FFFFFF !important;
  color: var(--wine) !important;
  border: 2px solid #FFFFFF !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28) !important;
  font-size: 1.1rem;
  font-weight: 800;
  transition: all 0.25s ease;
}
.gallery-pager-btn svg {
  width: 22px;
  height: 22px;
  stroke: var(--wine) !important;
  stroke-width: 2.5;
}
.gallery-pager-btn:hover:not(:disabled) {
  background: #F4BF56 !important;
  color: #1C1611 !important;
  border-color: #F4BF56 !important;
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(244, 191, 86, 0.45) !important;
}
.gallery-pager-btn:hover:not(:disabled) svg {
  stroke: #1C1611 !important;
}
.gallery-pager-btn:disabled {
  opacity: 0.35 !important;
  cursor: not-allowed;
  transform: none;
}
.gallery-pager-info {
  font-size: 1.02rem !important;
  color: #FFFFFF !important;
  font-weight: 600;
  min-width: 140px;
  text-align: center;
  letter-spacing: 0.04em;
  background: rgba(255, 255, 255, 0.12);
  padding: 8px 18px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.gallery-pager-info strong {
  color: #F4BF56 !important;
  font-weight: 800;
  font-size: 1.15rem;
}`;

restCss = restCss.replace(galleryPagerRegex, newGalleryPagerCss);

// Update footer logo in rest.css
restCss = restCss.replace(
  /\.footer-logo\s+img\s*\{[\s\S]*?\}/,
  `.footer-logo img, .footer-logo-img {
  height: 115px !important;
  max-height: 115px !important;
  width: auto !important;
  display: block;
  filter: brightness(0) invert(1) !important;
  opacity: 1 !important;
  margin-bottom: 16px;
}`
);
fs.writeFileSync(restCssPath, restCss);
console.log('rest.css updated with bright gallery pager & enlarged white footer logo!');

// 3. READ index.html
const indexHtmlPath = path.join(rootDir, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// 3.1. REMOVE ANY FLOATING "Popular" or other badges
html = html.replace(/<span class="product-badge[^"]*">[^<]*<\/span>/g, '');

// 3.2. ENLARGE UPPER NAVBAR LOGO
// Inline style on the img tag
html = html.replace(
  /<a href="#hero" class="nav-logo"[^>]*>\s*<img[^>]*src="Imagenes\/logos\/LOGO\.png"[^>]*>\s*<\/a>/,
  `<a href="#hero" class="nav-logo" aria-label="LULIS - Inicio">
      <img src="Imagenes/logos/LOGO.png" alt="LULIS" class="nav-logo-brand" style="height:115px;width:auto;max-height:115px;display:block;transition:all 0.3s ease;" />
    </a>`
);

// 3.3. ENLARGE FOOTER LOGO AND ENSURE PURE WHITE
html = html.replace(
  /<div class="footer-logo"><img[^>]*src="Imagenes\/logos\/LOGO\.png"[^>]*><\/div>/,
  `<div class="footer-logo"><img src="Imagenes/logos/LOGO.png" alt="LULIS" class="footer-logo-img" style="height:115px;width:auto;display:block;filter:brightness(0) invert(1) !important;opacity:1 !important;margin-bottom:16px;" /></div>`
);

// 3.4. REMOVE MODAL FROM BEFORE GALLERY AND MOVE TO END OF BODY
const modalRegex = /<div class="product-modal-backdrop" id="productDetailModal"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const modalMatch = html.match(modalRegex);
let modalContent = '';
if (modalMatch) {
  modalContent = modalMatch[0];
  html = html.replace(modalRegex, ''); // Remove from original position
}

// Make sure modal has inline display:none and fixed overlay
modalContent = `<div class="product-modal-backdrop" id="productDetailModal" onclick="closeProductModal(event)" style="display:none;position:fixed;inset:0;z-index:99999;background:rgba(28,22,17,0.78);align-items:center;justify-content:center;backdrop-filter:blur(6px);padding:20px;">
  <div class="product-modal" onclick="event.stopPropagation()" style="background:#FFFFFF;border-radius:24px;max-width:820px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.35);position:relative;border:1px solid #E6D8C3;display:grid;grid-template-columns:1fr 1fr;gap:28px;padding:32px;">
    <button type="button" class="modal-close-btn" onclick="closeProductModal(event)" aria-label="Cerrar detalle" style="position:absolute;top:16px;right:16px;width:38px;height:38px;border-radius:50%;background:#FAF6EF;border:1px solid #E6DCCD;display:flex;align-items:center;justify-content:center;font-size:1.4rem;cursor:pointer;color:#5F0F3F;font-weight:bold;z-index:10;">✕</button>
    <div class="modal-img-wrap" style="background:#FAF8F3;border-radius:18px;display:flex;align-items:center;justify-content:center;padding:24px;min-height:300px;">
      <img id="modalProductImg" src="Imagenes/productos/Jamaica.jpg" alt="Producto LULIS" style="max-width:100%;max-height:320px;object-fit:contain;border-radius:14px;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
    </div>
    <div class="modal-body-content" style="display:flex;flex-direction:column;justify-content:center;">
      <span class="modal-category-tag" id="modalProductCategory" style="font-size:0.75rem;font-weight:700;color:#5F0F3F;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:6px;">SHAMPOO SÓLIDO</span>
      <h2 class="modal-title" id="modalProductName" style="font-family:'League Spartan',sans-serif;font-size:1.85rem;color:#1C1611;font-weight:800;line-height:1.15;margin-bottom:10px;">Nombre del producto</h2>
      <div class="modal-price" id="modalProductPrice" style="font-size:1.6rem;font-weight:800;color:#5F0F3F;margin-bottom:14px;">Bs 35,00</div>
      <p class="modal-desc" id="modalProductDesc" style="font-size:0.95rem;color:#4A3728;line-height:1.6;margin-bottom:18px;">Descripción botánica del producto.</p>
      
      <div class="modal-details-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px;font-size:0.88rem;color:#1C1611;">
        <div style="display:flex;align-items:flex-start;gap:10px;"><span class="emoji-badge">🌿</span> <div><strong>Ingredientes clave:</strong> <span id="modalProductIngredients">Tensioactivo vegetal, extractos botánicos.</span></div></div>
        <div style="display:flex;align-items:flex-start;gap:10px;"><span class="emoji-badge">✨</span> <div><strong>Rendimiento:</strong> <span id="modalProductDuration">35–45 lavadas</span></div></div>
        <div style="display:flex;align-items:flex-start;gap:10px;"><span class="emoji-badge">🌱</span> <div><strong>Empaque:</strong> Papel orgánico biodegradable con semillas que puedes plantar tras el uso.</div></div>
      </div>
      
      <a id="modalProductWaBtn" href="https://wa.me/59173515698" target="_blank" rel="noopener noreferrer" style="background:#25D366;color:#FFFFFF;padding:12px 24px;border-radius:40px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;box-shadow:0 4px 16px rgba(37,211,102,0.35);font-size:0.95rem;">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Pedir este producto por WhatsApp
      </a>
    </div>
  </div>
</div>`;

// Insert modal right before </body>
html = html.replace('</body>', modalContent + '\n</body>');

// 3.5. BUILD THE PRODUCTS SECTION WITH STYLED BOX CATEGORIES & ORIGINAL RICH CARDS
const productsSectionRegex = /<!-- ═══ BLOQUE 1: SHAMPOOS SÓLIDOS ═══ -->[\s\S]*?<!-- ═══ BLOQUE 4: MANTECAS CORPORALES ═══ -->[\s\S]*?<\/div>\s*<\/section>/;

const newProductsBlocks = `<!-- ═══ BLOQUE 1: SHAMPOOS SÓLIDOS ═══ -->
      <div class="category-block" data-category-block="shampoo">
        <div class="category-block-header">
          <div class="category-block-left">
            <span class="category-box-badge-icon"><span class="emoji-badge">🌿</span></span>
            <div>
              <h3 class="category-box-title">Shampoos Sólidos</h3>
              <p class="category-box-sub">35–45 lavadas · Cero plástico · 50g</p>
            </div>
          </div>
          <span class="category-box-count">3 variedades</span>
        </div>
        <div class="product-list" id="list-shampoo">
          
          <!-- Jamaica -->
          <article class="product-card" data-id="shampoo-jamaica" data-category="shampoo" data-name="shampoo sólido jamaica" onclick="openProductModal('shampoo-jamaica')">
            <div class="product-img">
              <img src="Imagenes/productos/Jamaica.jpg" alt="Shampoo Sólido Jamaica" loading="lazy" decoding="async">
            </div>
            <div class="product-body">
              <div class="product-meta-top">
                <span class="product-category">Shampoo Sólido</span>
                <span class="product-price">Bs 35,00</span>
              </div>
              <h3 class="product-name">Shampoo Sólido Jamaica</h3>
              <p class="product-variante-sub">Jamaica & Flor de Hibisco</p>
              <div class="product-tags">
                <span class="tag-pill tag-duracion">35–45 lavadas</span>
                <span class="tag-pill">Para cabello mixto</span>
                <span class="tag-pill">Normal</span>
              </div>
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-quick-view" onclick="openProductModal('shampoo-jamaica')">Ver detalle</button>
                <a href="https://wa.me/59173515698?text=Hola%20LULIS%20%F0%9F%91%8B%20Me%20interesa%20el%20producto%3A%20Shampoo%20S%C3%B3lido%20Jamaica%20(50g)%20por%2035%20Bs..%20%C2%BFTienen%20disponibilidad%3F"
                   class="btn-wa-compact"
                   aria-label="Pedir por WhatsApp Shampoo Jamaica"
                   target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Pedir
                </a>
              </div>
            </div>
          </article>

          <!-- Romero -->
          <article class="product-card" data-id="shampoo-romero" data-category="shampoo" data-name="shampoo sólido romero" onclick="openProductModal('shampoo-romero')">
            <div class="product-img">
              <img src="Imagenes/productos/Romeros.jpg" alt="Shampoo Sólido Romero" loading="lazy" decoding="async">
            </div>
            <div class="product-body">
              <div class="product-meta-top">
                <span class="product-category">Shampoo Sólido</span>
                <span class="product-price">Bs 35,00</span>
              </div>
              <h3 class="product-name">Shampoo Sólido Romero</h3>
              <p class="product-variante-sub">Romero & Menta Silvestre</p>
              <div class="product-tags">
                <span class="tag-pill tag-duracion">35–45 lavadas</span>
                <span class="tag-pill">Para cabello graso</span>
                <span class="tag-pill">Mixto</span>
              </div>
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-quick-view" onclick="openProductModal('shampoo-romero')">Ver detalle</button>
                <a href="https://wa.me/59173515698?text=Hola%20LULIS%20%F0%9F%91%8B%20Me%20interesa%20el%20producto%3A%20Shampoo%20S%C3%B3lido%20Romero%20(50g)%20por%2035%20Bs..%20%C2%BFTienen%20disponibilidad%3F"
                   class="btn-wa-compact"
                   aria-label="Pedir por WhatsApp Shampoo Romero"
                   target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Pedir
                </a>
              </div>
            </div>
          </article>

          <!-- Coco -->
          <article class="product-card" data-id="shampoo-coco" data-category="shampoo" data-name="shampoo sólido coco" onclick="openProductModal('shampoo-coco')">
            <div class="product-img">
              <img src="Imagenes/productos/Coco.jpg" alt="Shampoo Sólido Coco" loading="lazy" decoding="async">
            </div>
            <div class="product-body">
              <div class="product-meta-top">
                <span class="product-category">Shampoo Sólido</span>
                <span class="product-price">Bs 35,00</span>
              </div>
              <h3 class="product-name">Shampoo Sólido Coco</h3>
              <p class="product-variante-sub">Coco & Almendras Dulces</p>
              <div class="product-tags">
                <span class="tag-pill tag-duracion">35–45 lavadas</span>
                <span class="tag-pill">Para cabello seco</span>
                <span class="tag-pill">Rizado</span>
              </div>
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-quick-view" onclick="openProductModal('shampoo-coco')">Ver detalle</button>
                <a href="https://wa.me/59173515698?text=Hola%20LULIS%20%F0%9F%91%8B%20Me%20interesa%20el%20producto%3A%20Shampoo%20S%C3%B3lido%20Coco%20(50g)%20por%2035%20Bs..%20%C2%BFTienen%20disponibilidad%3F"
                   class="btn-wa-compact"
                   aria-label="Pedir por WhatsApp Shampoo Coco"
                   target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Pedir
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- ═══ BLOQUE 2: ACONDICIONADORES SÓLIDOS ═══ -->
      <div class="category-block" data-category-block="acondicionador">
        <div class="category-block-header">
          <div class="category-block-left">
            <span class="category-box-badge-icon"><span class="emoji-badge">✨</span></span>
            <div>
              <h3 class="category-box-title">Acondicionadores Sólidos</h3>
              <p class="category-box-sub">50g · Desenredado botánico y nutrición profunda</p>
            </div>
          </div>
          <span class="category-box-count">2 variedades</span>
        </div>
        <div class="product-list" id="list-acondicionador">
          
          <!-- Melón -->
          <article class="product-card" data-id="acondicionador-melon" data-category="acondicionador" data-name="acondicionador sólido melón" onclick="openProductModal('acondicionador-melon')">
            <div class="product-img">
              <img src="Imagenes/productos/Pack_coco_y_melon.jpeg" alt="Acondicionador Sólido Melón" loading="lazy" decoding="async">
            </div>
            <div class="product-body">
              <div class="product-meta-top">
                <span class="product-category">Acondicionador</span>
                <span class="product-price">Bs 38,00</span>
              </div>
              <h3 class="product-name">Acondicionador Sólido Melón</h3>
              <p class="product-variante-sub">Melón & Semillas de Chía</p>
              <div class="product-tags">
                <span class="tag-pill tag-duracion">40–50 lavadas</span>
                <span class="tag-pill">Para cabello fino</span>
                <span class="tag-pill">Mixto</span>
              </div>
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-quick-view" onclick="openProductModal('acondicionador-melon')">Ver detalle</button>
                <a href="https://wa.me/59173515698?text=Hola%20LULIS%20%F0%9F%91%8B%20Me%20interesa%20el%20producto%3A%20Acondicionador%20S%C3%B3lido%20Mel%C3%B3n%20(50g)%20por%2038%20Bs..%20%C2%BFTienen%20disponibilidad%3F"
                   class="btn-wa-compact"
                   aria-label="Pedir por WhatsApp Acondicionador Melón"
                   target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Pedir
                </a>
              </div>
            </div>
          </article>

          <!-- Uva & Jamaica -->
          <article class="product-card" data-id="acondicionador-uva" data-category="acondicionador" data-name="acondicionador sólido uva y jamaica" onclick="openProductModal('acondicionador-uva')">
            <div class="product-img">
              <img src="Imagenes/productos/Pack_jamaica_y_jamaica.jpeg" alt="Acondicionador Uva & Jamaica" loading="lazy" decoding="async">
            </div>
            <div class="product-body">
              <div class="product-meta-top">
                <span class="product-category">Acondicionador</span>
                <span class="product-price">Bs 38,00</span>
              </div>
              <h3 class="product-name">Acondicionador Uva & Jamaica</h3>
              <p class="product-variante-sub">Uva Negra & Flor de Jamaica</p>
              <div class="product-tags">
                <span class="tag-pill tag-duracion">40–50 lavadas</span>
                <span class="tag-pill">Para cabello seco</span>
                <span class="tag-pill">Dañado</span>
              </div>
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-quick-view" onclick="openProductModal('acondicionador-uva')">Ver detalle</button>
                <a href="https://wa.me/59173515698?text=Hola%20LULIS%20%F0%9F%91%8B%20Me%20interesa%20el%20producto%3A%20Acondicionador%20Uva%20%26%20Jamaica%20(50g)%20por%2038%20Bs..%20%C2%BFTienen%20disponibilidad%3F"
                   class="btn-wa-compact"
                   aria-label="Pedir por WhatsApp Acondicionador Uva"
                   target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Pedir
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- ═══ BLOQUE 3: PACKS Y DÚOS ═══ -->
      <div class="category-block" data-category-block="pack">
        <div class="category-block-header">
          <div class="category-block-left">
            <span class="category-box-badge-icon"><span class="emoji-badge">🎁</span></span>
            <div>
              <h3 class="category-box-title">Packs y Dúos</h3>
              <p class="category-box-sub">Rutina capilar completa con ahorro especial</p>
            </div>
          </div>
          <span class="category-box-count">3 combinaciones</span>
        </div>
        <div class="product-list" id="list-pack">
          
          <!-- Pack Pureza -->
          <article class="product-card" data-id="pack-pureza" data-category="pack" data-name="pack dúo pureza (romero + melón)" onclick="openProductModal('pack-pureza')">
            <div class="product-img">
              <img src="Imagenes/productos/Pack_romero_y_melon.jpeg" alt="Pack Dúo Pureza" loading="lazy" decoding="async">
            </div>
            <div class="product-body">
              <div class="product-meta-top">
                <span class="product-category">Pack Dúo</span>
                <span class="product-price">Bs 68,00</span>
              </div>
              <h3 class="product-name">Pack Dúo Pureza</h3>
              <p class="product-variante-sub">Shampoo Romero + Acond. Melón</p>
              <div class="product-tags">
                <span class="tag-pill tag-duracion">Hasta 90 lavadas</span>
                <span class="tag-pill">Cabello graso</span>
                <span class="tag-pill">Mixto</span>
              </div>
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-quick-view" onclick="openProductModal('pack-pureza')">Ver detalle</button>
                <a href="https://wa.me/59173515698?text=Hola%20LULIS%20%F0%9F%91%8B%20Me%20interesa%20el%20producto%3A%20Pack%20D%C3%BAo%20Pureza%20por%2068%20Bs..%20%C2%BFTienen%20disponibilidad%3F"
                   class="btn-wa-compact"
                   aria-label="Pedir por WhatsApp Pack Pureza"
                   target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Pedir
                </a>
              </div>
            </div>
          </article>

          <!-- Pack Hidratación -->
          <article class="product-card" data-id="pack-hidratacion" data-category="pack" data-name="pack dúo hidratación (coco + melón)" onclick="openProductModal('pack-hidratacion')">
            <div class="product-img">
              <img src="Imagenes/productos/Pack_coco_y_melon.jpeg" alt="Pack Dúo Hidratación" loading="lazy" decoding="async">
            </div>
            <div class="product-body">
              <div class="product-meta-top">
                <span class="product-category">Pack Dúo</span>
                <span class="product-price">Bs 68,00</span>
              </div>
              <h3 class="product-name">Pack Dúo Hidratación</h3>
              <p class="product-variante-sub">Shampoo Coco + Acond. Melón</p>
              <div class="product-tags">
                <span class="tag-pill tag-duracion">Hasta 90 lavadas</span>
                <span class="tag-pill">Cabello seco</span>
                <span class="tag-pill">Rizado</span>
              </div>
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-quick-view" onclick="openProductModal('pack-hidratacion')">Ver detalle</button>
                <a href="https://wa.me/59173515698?text=Hola%20LULIS%20%F0%9F%91%8B%20Me%20interesa%20el%20producto%3A%20Pack%20D%C3%BAo%20Hidrataci%C3%B3n%20por%2068%20Bs..%20%C2%BFTienen%20disponibilidad%3F"
                   class="btn-wa-compact"
                   aria-label="Pedir por WhatsApp Pack Hidratación"
                   target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Pedir
                </a>
              </div>
            </div>
          </article>

          <!-- Pack Botánico -->
          <article class="product-card" data-id="pack-botanico" data-category="pack" data-name="pack dúo botánico (jamaica + romero)" onclick="openProductModal('pack-botanico')">
            <div class="product-img">
              <img src="Imagenes/productos/Jamaica y romero.jpg" alt="Pack Dúo Botánico" loading="lazy" decoding="async">
            </div>
            <div class="product-body">
              <div class="product-meta-top">
                <span class="product-category">Pack Dúo</span>
                <span class="product-price">Bs 65,00</span>
              </div>
              <h3 class="product-name">Pack Dúo Botánico</h3>
              <p class="product-variante-sub">2 Shampoos Sólidos (Jamaica + Romero)</p>
              <div class="product-tags">
                <span class="tag-pill tag-duracion">Hasta 90 lavadas</span>
                <span class="tag-pill">Todo cabello</span>
                <span class="tag-pill">Mixto</span>
              </div>
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-quick-view" onclick="openProductModal('pack-botanico')">Ver detalle</button>
                <a href="https://wa.me/59173515698?text=Hola%20LULIS%20%F0%9F%91%8B%20Me%20interesa%20el%20producto%3A%20Pack%20D%C3%BAo%20Bot%C3%A1nico%20por%2065%20Bs..%20%C2%BFTienen%20disponibilidad%3F"
                   class="btn-wa-compact"
                   aria-label="Pedir por WhatsApp Pack Botánico"
                   target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Pedir
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- ═══ BLOQUE 4: MANTECAS CORPORALES (NUEVA LÍNEA) ═══ -->
      <div class="category-block" data-category-block="manteca">
        <div class="category-block-header">
          <div class="category-block-left">
            <span class="category-box-badge-icon"><span class="emoji-badge">🥑</span></span>
            <div>
              <h3 class="category-box-title">Mantecas Corporales</h3>
              <p class="category-box-sub">Nutrición botánica profunda en barra para cuerpo y manos · Cero envase plástico</p>
            </div>
          </div>
          <span class="category-box-count">Próximo lanzamiento</span>
        </div>
        <div class="product-list" id="list-manteca">
          <article class="product-card" data-category="manteca" style="grid-column: 1 / -1; max-width: 580px; margin: 0 auto; width: 100%;">
            <div class="product-body" style="padding: 32px 28px; text-align: center;">
              <span class="product-category" style="justify-content:center;">LÍNEA CORPORAL BOTÁNICA</span>
              <h3 class="product-name" style="font-size: 1.45rem; margin: 8px 0 12px;">Mantecas Corporales Sólidas</h3>
              <p style="font-size: 0.95rem; color: #4A3728; line-height: 1.6; margin-bottom: 20px;">
                Fórmula sólida ultra hidratante a base de manteca de cacao pura, karité y aceites botánicos bolivianos. Hidratación sin envases plásticos.
              </p>
              <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin-bottom:24px;">
                <span class="tag-pill">Manteca de Cacao</span>
                <span class="tag-pill">Karité</span>
                <span class="tag-pill">Zero Waste</span>
                <span class="tag-pill">100% Biodegradable</span>
              </div>
              <a href="https://wa.me/59173515698?text=Hola%20LULIS%20%F0%9F%91%8B%20Quisiera%20reservar%20o%20conocer%20m%C3%A1s%20sobre%20las%20nuevas%20Mantecas%20Corporales."
                 class="btn btn-primary"
                 target="_blank" rel="noopener noreferrer"
                 style="display:inline-flex; align-items:center; gap:8px; margin:0 auto; background:var(--wine); color:#fff; padding:12px 28px; border-radius:50px; font-weight:700;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Consultar disponibilidad por WhatsApp
              </a>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>`;

html = html.replace(productsSectionRegex, newProductsBlocks);

// 3.6. INJECT COMPREHENSIVE INLINE CSS IN <style> TO GUARANTEE 100% ZERO-CACHE STYLING
const inlineCssToAdd = `
    /* ═══ EMOJIS CON ALTO CONTRASTE (NUNCA SE DIFUMINAN) ═══ */
    .emoji-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #FFFFFF !important;
      border: 1.5px solid #F4BF56 !important;
      border-radius: 50% !important;
      width: 34px !important;
      height: 34px !important;
      min-width: 34px !important;
      min-height: 34px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
      font-size: 1.15rem !important;
      line-height: 1 !important;
      vertical-align: middle;
      flex-shrink: 0;
    }
    .value-card h4 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--wine);
    }
    .circular-step-icon {
      background: #FFFFFF !important;
      border: 2px solid #F4BF56 !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.10) !important;
    }

    /* ═══ NAVBAR & LOGO SUPERIOR AMPLIADO ═══ */
    .nav-logo { display: flex; align-items: center; }
    .nav-logo-brand, .nav-logo img {
      height: 115px !important;
      max-height: 115px !important;
      width: auto !important;
      display: block !important;
      filter: brightness(0) invert(1) !important;
      transition: all 0.3s ease !important;
    }
    #navbar.scrolled .nav-logo-brand, #navbar.scrolled .nav-logo img {
      height: 90px !important;
      max-height: 90px !important;
      filter: none !important;
    }
    @media (max-width: 768px) {
      .nav-logo-brand, .nav-logo img {
        height: 85px !important;
        max-height: 85px !important;
      }
      #navbar.scrolled .nav-logo-brand, #navbar.scrolled .nav-logo img {
        height: 75px !important;
        max-height: 75px !important;
      }
    }

    /* ═══ BOX DE COLOR PARA CATEGORÍAS DEL CATÁLOGO ═══ */
    .category-block {
      margin-bottom: 52px;
    }
    .category-block-header {
      background: linear-gradient(135deg, #FAF4EB 0%, #F5ECDD 100%) !important;
      border: 1.5px solid #E4D5BE !important;
      border-radius: 20px !important;
      padding: 18px 24px !important;
      margin-bottom: 26px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      box-shadow: 0 4px 18px rgba(95, 15, 63, 0.05) !important;
      gap: 16px;
    }
    .category-block-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .category-box-badge-icon {
      display: flex;
      align-items: center;
    }
    .category-box-title {
      font-family: var(--ff-display);
      font-size: 1.45rem !important;
      font-weight: 800 !important;
      color: var(--wine) !important;
      line-height: 1.15;
      margin: 0;
    }
    .category-box-sub {
      font-size: 0.88rem !important;
      color: #6B5B52 !important;
      margin-top: 4px;
      font-weight: 500;
    }
    .category-box-count {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--wine);
      background: #FFFFFF;
      padding: 6px 16px;
      border-radius: 30px;
      border: 1px solid #D9C9B4;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }
    @media (max-width: 600px) {
      .category-block-header {
        flex-direction: column;
        align-items: flex-start;
        padding: 16px 18px !important;
      }
      .category-box-count {
        align-self: flex-start;
      }
    }

    /* ═══ TARJETAS DE PRODUCTO — IDEA ORIGINAL FORMATEADA ═══ */
    .product-list {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 26px !important;
      width: 100% !important;
    }
    @media (max-width: 960px) {
      .product-list { grid-template-columns: repeat(2, 1fr) !important; gap: 20px !important; }
    }
    @media (max-width: 580px) {
      .product-list { grid-template-columns: 1fr !important; gap: 18px !important; }
    }

    .product-card {
      background: #FFFFFF !important;
      border-radius: 20px !important;
      overflow: hidden !important;
      border: 1px solid #ECE4D8 !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06) !important;
      display: flex !important;
      flex-direction: column !important;
      transition: transform 0.28s ease, box-shadow 0.28s ease !important;
      cursor: pointer;
    }
    .product-card:hover {
      transform: translateY(-5px) !important;
      box-shadow: 0 10px 30px rgba(95, 15, 63, 0.12) !important;
      border-color: #D9C4AB !important;
    }
    .product-img {
      position: relative;
      width: 100%;
      height: 220px;
      background: #FAF8F3;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .product-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .product-card:hover .product-img img {
      transform: scale(1.05);
    }
    .product-body {
      padding: 18px 20px 20px !important;
      display: flex !important;
      flex-direction: column !important;
      flex: 1 !important;
    }
    .product-meta-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .product-category {
      font-size: 0.74rem !important;
      font-weight: 700 !important;
      color: var(--wine) !important;
      letter-spacing: 0.12em !important;
      text-transform: uppercase !important;
    }
    .product-price {
      font-size: 1.25rem !important;
      font-weight: 800 !important;
      color: var(--wine) !important;
      letter-spacing: -0.02em;
    }
    .product-name {
      font-family: var(--ff-display);
      font-size: 1.22rem !important;
      font-weight: 800 !important;
      color: #1C1611 !important;
      line-height: 1.2;
      margin-bottom: 4px;
    }
    .product-variante-sub {
      font-size: 0.85rem !important;
      color: #6B5B52 !important;
      margin-bottom: 12px;
      font-weight: 500;
    }
    .product-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 18px;
    }
    .tag-pill {
      font-size: 0.74rem !important;
      font-weight: 600 !important;
      padding: 4px 10px !important;
      border-radius: 20px !important;
      background: #FAF6EF !important;
      color: #55443B !important;
      border: 1px solid #EBE2D5 !important;
    }
    .tag-pill.tag-duracion {
      background: rgba(7, 188, 138, 0.12) !important;
      color: #04664A !important;
      border-color: rgba(7, 188, 138, 0.3) !important;
      font-weight: 700 !important;
    }
    .product-bottom-row {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid #F0E8DC;
    }
    .btn-quick-view {
      background: transparent;
      border: none;
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--wine);
      cursor: pointer;
      padding: 6px 4px;
      text-decoration: underline;
      text-underline-offset: 3px;
      transition: color 0.2s;
    }
    .btn-quick-view:hover {
      color: #8B1A5A;
    }
    .btn-wa-compact {
      background: #25D366 !important;
      color: #FFFFFF !important;
      font-size: 0.84rem !important;
      font-weight: 700 !important;
      padding: 8px 16px !important;
      border-radius: 30px !important;
      text-decoration: none !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      box-shadow: 0 3px 12px rgba(37, 211, 102, 0.32) !important;
      transition: transform 0.2s, box-shadow 0.2s !important;
    }
    .btn-wa-compact:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 5px 16px rgba(37, 211, 102, 0.45) !important;
    }

    /* ═══ BOTONES Y TEXTO DE GALERÍA DE ALTO CONTRASTE ═══ */
    #gallery {
      background: var(--wine) !important;
    }
    .gallery-pager-btn {
      background: #FFFFFF !important;
      color: var(--wine) !important;
      border: 2px solid #FFFFFF !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
    }
    .gallery-pager-btn:hover:not(:disabled) {
      background: #F4BF56 !important;
      color: #1C1611 !important;
      border-color: #F4BF56 !important;
    }
    .gallery-pager-info {
      color: #FFFFFF !important;
      background: rgba(255, 255, 255, 0.15) !important;
      border: 1px solid rgba(255, 255, 255, 0.25) !important;
    }
    .gallery-pager-info strong {
      color: #F4BF56 !important;
    }

    /* ═══ FOOTER LOGO BLANCO Y GRANDE ═══ */
    .footer-logo img, .footer-logo-img {
      height: 115px !important;
      max-height: 115px !important;
      width: auto !important;
      display: block !important;
      filter: brightness(0) invert(1) !important;
      opacity: 1 !important;
      margin-bottom: 16px !important;
    }
`;

// Insert inline css inside <style>
html = html.replace('</style>', inlineCssToAdd + '\n  </style>');

fs.writeFileSync(indexHtmlPath, html);
console.log('index.html updated with all user requests!');
