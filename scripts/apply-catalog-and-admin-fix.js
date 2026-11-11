const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. UPDATE index.html
const indexPath = path.join(rootDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Replace the entire catalog product list section with the framed, turquoise-styled cards
const catalogProductsRegex = /<!-- ═══ BLOQUE 1: SHAMPOOS SÓLIDOS ═══ -->[\s\S]*?<!-- ═══ BLOQUE 4: MANTECAS CORPORALES[\s\S]*?<\/div>\s*<\/section>/;

const newCatalogHtml = `<!-- ═══ BLOQUE 1: SHAMPOOS SÓLIDOS ═══ -->
      <div class="category-block reveal" data-category="shampoo">
        <div class="category-block-header">
          <div class="category-block-header-left">
            <span class="category-box-badge-icon"><span class="emoji-badge">🌿</span></span>
            <div>
              <h3 class="category-block-title">Shampoos Sólidos</h3>
              <p class="category-block-sub">35–45 lavadas · Cero plástico · 50g</p>
            </div>
          </div>
          <span class="category-block-count">3 variedades</span>
        </div>
        <div class="product-list" id="list-shampoo">
          
          <!-- Jamaica -->
          <article class="product-card" data-id="shampoo-jamaica" data-category="shampoo" data-name="shampoo sólido jamaica" onclick="openProductModal('shampoo-jamaica')">
            <div class="product-img-box">
              <img src="Imagenes/productos/Jamaica.jpg" alt="Shampoo Sólido Jamaica" loading="lazy" decoding="async">
            </div>
            <div class="product-info-box">
              <div class="product-meta-top">
                <span class="product-category-label">Shampoo Sólido</span>
                <span class="product-price-val">Bs 35,00</span>
              </div>
              <h3 class="product-title">Shampoo Sólido Jamaica</h3>
              
              <!-- DESCRIPCIÓN BOTÁNICA EN TURQUESA DE LA MARCA -->
              <div class="product-desc-turquoise">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2L9.5 8.5 3 9.5 8 14l-1.5 7 5.5-3.5 5.5 3.5-1.5-7 5-4.5-6.5-1z"/></svg>
                <span>Jamaica & Flor de Hibisco · Cuidado equilibrado</span>
              </div>

              <div class="product-tags">
                <span class="tag-pill tag-turquesa">50g</span>
                <span class="tag-pill tag-turquesa">35–45 lavadas</span>
                <span class="tag-pill">Cabello mixto</span>
                <span class="tag-pill">Normal</span>
              </div>
              
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-more-info" onclick="openProductModal('shampoo-jamaica')">
                  ℹ️ Más info
                </button>
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
            <div class="product-img-box">
              <img src="Imagenes/productos/Romeros.jpg" alt="Shampoo Sólido Romero" loading="lazy" decoding="async">
            </div>
            <div class="product-info-box">
              <div class="product-meta-top">
                <span class="product-category-label">Shampoo Sólido</span>
                <span class="product-price-val">Bs 35,00</span>
              </div>
              <h3 class="product-title">Shampoo Sólido Romero</h3>
              
              <!-- DESCRIPCIÓN BOTÁNICA EN TURQUESA DE LA MARCA -->
              <div class="product-desc-turquoise">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2L9.5 8.5 3 9.5 8 14l-1.5 7 5.5-3.5 5.5 3.5-1.5-7 5-4.5-6.5-1z"/></svg>
                <span>Romero & Menta Silvestre · Anticaída y fuerza</span>
              </div>

              <div class="product-tags">
                <span class="tag-pill tag-turquesa">50g</span>
                <span class="tag-pill tag-turquesa">35–45 lavadas</span>
                <span class="tag-pill">Cabello graso</span>
                <span class="tag-pill">Mixto</span>
              </div>
              
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-more-info" onclick="openProductModal('shampoo-romero')">
                  ℹ️ Más info
                </button>
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
            <div class="product-img-box">
              <img src="Imagenes/productos/Coco.jpg" alt="Shampoo Sólido Coco" loading="lazy" decoding="async">
            </div>
            <div class="product-info-box">
              <div class="product-meta-top">
                <span class="product-category-label">Shampoo Sólido</span>
                <span class="product-price-val">Bs 35,00</span>
              </div>
              <h3 class="product-title">Shampoo Sólido Coco</h3>
              
              <!-- DESCRIPCIÓN BOTÁNICA EN TURQUESA DE LA MARCA -->
              <div class="product-desc-turquoise">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2L9.5 8.5 3 9.5 8 14l-1.5 7 5.5-3.5 5.5 3.5-1.5-7 5-4.5-6.5-1z"/></svg>
                <span>Coco & Almendras Dulces · Nutrición intensa</span>
              </div>

              <div class="product-tags">
                <span class="tag-pill tag-turquesa">50g</span>
                <span class="tag-pill tag-turquesa">35–45 lavadas</span>
                <span class="tag-pill">Cabello seco</span>
                <span class="tag-pill">Rizado</span>
              </div>
              
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-more-info" onclick="openProductModal('shampoo-coco')">
                  ℹ️ Más info
                </button>
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
      <div class="category-block reveal delay-1" data-category="acondicionador">
        <div class="category-block-header">
          <div class="category-block-header-left">
            <span class="category-box-badge-icon"><span class="emoji-badge">✨</span></span>
            <div>
              <h3 class="category-block-title">Acondicionadores Sólidos</h3>
              <p class="category-block-sub">50g · Desenredado botánico y nutrición profunda</p>
            </div>
          </div>
          <span class="category-block-count">2 variedades</span>
        </div>
        <div class="product-list" id="list-acondicionador">
          
          <!-- Melón -->
          <article class="product-card" data-id="acond-melon" data-category="acondicionador" data-name="acondicionador sólido melón" onclick="openProductModal('acond-melon')">
            <div class="product-img-box">
              <img src="Imagenes/productos/Pack_coco_y_melon.jpeg" alt="Acondicionador Sólido Melón" loading="lazy" decoding="async">
            </div>
            <div class="product-info-box">
              <div class="product-meta-top">
                <span class="product-category-label">Acondicionador</span>
                <span class="product-price-val">Bs 38,00</span>
              </div>
              <h3 class="product-title">Acondicionador Sólido Melón</h3>
              
              <!-- DESCRIPCIÓN BOTÁNICA EN TURQUESA DE LA MARCA -->
              <div class="product-desc-turquoise">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2L9.5 8.5 3 9.5 8 14l-1.5 7 5.5-3.5 5.5 3.5-1.5-7 5-4.5-6.5-1z"/></svg>
                <span>Melón & Semillas de Chía · Desenredo suave</span>
              </div>

              <div class="product-tags">
                <span class="tag-pill tag-turquesa">50g</span>
                <span class="tag-pill tag-turquesa">40–50 lavadas</span>
                <span class="tag-pill">Cabello fino</span>
                <span class="tag-pill">Mixto</span>
              </div>
              
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-more-info" onclick="openProductModal('acond-melon')">
                  ℹ️ Más info
                </button>
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
          <article class="product-card" data-id="acond-uva-jamaica" data-category="acondicionador" data-name="acondicionador sólido uva y jamaica" onclick="openProductModal('acond-uva-jamaica')">
            <div class="product-img-box">
              <img src="Imagenes/productos/Pack_jamaica_y_jamaica.jpeg" alt="Acondicionador Uva & Jamaica" loading="lazy" decoding="async">
            </div>
            <div class="product-info-box">
              <div class="product-meta-top">
                <span class="product-category-label">Acondicionador</span>
                <span class="product-price-val">Bs 38,00</span>
              </div>
              <h3 class="product-title">Acondicionador Uva & Jamaica</h3>
              
              <!-- DESCRIPCIÓN BOTÁNICA EN TURQUESA DE LA MARCA -->
              <div class="product-desc-turquoise">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2L9.5 8.5 3 9.5 8 14l-1.5 7 5.5-3.5 5.5 3.5-1.5-7 5-4.5-6.5-1z"/></svg>
                <span>Uva Negra & Jamaica · Reparación y brillo</span>
              </div>

              <div class="product-tags">
                <span class="tag-pill tag-turquesa">50g</span>
                <span class="tag-pill tag-turquesa">40–50 lavadas</span>
                <span class="tag-pill">Cabello seco</span>
                <span class="tag-pill">Dañado</span>
              </div>
              
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-more-info" onclick="openProductModal('acond-uva-jamaica')">
                  ℹ️ Más info
                </button>
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

      <!-- ═══ BLOQUE 3: PACKS & DÚOS ═══ -->
      <div class="category-block reveal delay-2" data-category="pack">
        <div class="category-block-header">
          <div class="category-block-header-left">
            <span class="category-box-badge-icon"><span class="emoji-badge">🎁</span></span>
            <div>
              <h3 class="category-block-title">Packs & Dúos Ahorro</h3>
              <p class="category-block-sub">Dúos completos con caja de semillas plantables</p>
            </div>
          </div>
          <span class="category-block-count">3 packs</span>
        </div>
        <div class="product-list" id="list-pack">
          
          <!-- Pureza -->
          <article class="product-card" data-id="pack-duo-romero-melon" data-category="pack" data-name="pack dúo pureza (romero + melón)" onclick="openProductModal('pack-duo-romero-melon')">
            <div class="product-img-box">
              <img src="Imagenes/productos/Pack_romero_y_melon.jpeg" alt="Pack Dúo Pureza" loading="lazy" decoding="async">
            </div>
            <div class="product-info-box">
              <div class="product-meta-top">
                <span class="product-category-label">Pack Dúo</span>
                <span class="product-price-val">Bs 68,00</span>
              </div>
              <h3 class="product-title">Pack Dúo Pureza (Romero + Melón)</h3>
              
              <!-- DESCRIPCIÓN BOTÁNICA EN TURQUESA DE LA MARCA -->
              <div class="product-desc-turquoise">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2L9.5 8.5 3 9.5 8 14l-1.5 7 5.5-3.5 5.5 3.5-1.5-7 5-4.5-6.5-1z"/></svg>
                <span>Romero 50g + Melón 50g · Raíz limpia y puntas suaves</span>
              </div>

              <div class="product-tags">
                <span class="tag-pill tag-turquesa">2 barras 100g</span>
                <span class="tag-pill tag-turquesa">Hasta 90 lavadas</span>
                <span class="tag-pill">Graso</span>
                <span class="tag-pill">Mixto</span>
              </div>
              
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-more-info" onclick="openProductModal('pack-duo-romero-melon')">
                  ℹ️ Más info
                </button>
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

          <!-- Hidratación -->
          <article class="product-card" data-id="pack-duo-coco-melon" data-category="pack" data-name="pack dúo hidratación (coco + melón)" onclick="openProductModal('pack-duo-coco-melon')">
            <div class="product-img-box">
              <img src="Imagenes/productos/Pack_coco_y_melon.jpeg" alt="Pack Dúo Hidratación" loading="lazy" decoding="async">
            </div>
            <div class="product-info-box">
              <div class="product-meta-top">
                <span class="product-category-label">Pack Dúo</span>
                <span class="product-price-val">Bs 68,00</span>
              </div>
              <h3 class="product-title">Pack Dúo Hidratación (Coco + Melón)</h3>
              
              <!-- DESCRIPCIÓN BOTÁNICA EN TURQUESA DE LA MARCA -->
              <div class="product-desc-turquoise">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2L9.5 8.5 3 9.5 8 14l-1.5 7 5.5-3.5 5.5 3.5-1.5-7 5-4.5-6.5-1z"/></svg>
                <span>Coco 50g + Melón 50g · Máxima sedosidad</span>
              </div>

              <div class="product-tags">
                <span class="tag-pill tag-turquesa">2 barras 100g</span>
                <span class="tag-pill tag-turquesa">Hasta 90 lavadas</span>
                <span class="tag-pill">Seco</span>
                <span class="tag-pill">Rizado</span>
              </div>
              
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-more-info" onclick="openProductModal('pack-duo-coco-melon')">
                  ℹ️ Más info
                </button>
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

          <!-- Botánico -->
          <article class="product-card" data-id="pack-duo-jamaica-romero" data-category="pack" data-name="pack dúo botánico (jamaica + romero)" onclick="openProductModal('pack-duo-jamaica-romero')">
            <div class="product-img-box">
              <img src="Imagenes/productos/Jamaica y romero.jpg" alt="Pack Dúo Botánico" loading="lazy" decoding="async">
            </div>
            <div class="product-info-box">
              <div class="product-meta-top">
                <span class="product-category-label">Pack Dúo</span>
                <span class="product-price-val">Bs 65,00</span>
              </div>
              <h3 class="product-title">Pack Dúo Botánico (Jamaica + Romero)</h3>
              
              <!-- DESCRIPCIÓN BOTÁNICA EN TURQUESA DE LA MARCA -->
              <div class="product-desc-turquoise">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2L9.5 8.5 3 9.5 8 14l-1.5 7 5.5-3.5 5.5 3.5-1.5-7 5-4.5-6.5-1z"/></svg>
                <span>2 Shampoos 50g · Brillo vibrante y fortaleza</span>
              </div>

              <div class="product-tags">
                <span class="tag-pill tag-turquesa">2 barras 100g</span>
                <span class="tag-pill tag-turquesa">Hasta 90 lavadas</span>
                <span class="tag-pill">Todo cabello</span>
                <span class="tag-pill">Mixto</span>
              </div>
              
              <div class="product-bottom-row" onclick="event.stopPropagation()">
                <button type="button" class="btn-more-info" onclick="openProductModal('pack-duo-jamaica-romero')">
                  ℹ️ Más info
                </button>
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
      <div class="category-block reveal delay-3" data-category="manteca">
        <div class="category-block-header">
          <div class="category-block-header-left">
            <span class="category-box-badge-icon"><span class="emoji-badge">🥑</span></span>
            <div>
              <h3 class="category-block-title">Mantecas Corporales</h3>
              <p class="category-block-sub">Nutrición botánica intensiva para cuerpo y manos · Cero plástico</p>
            </div>
          </div>
          <span class="category-block-count">Próximo lanzamiento</span>
        </div>
        <div class="product-list" id="list-manteca">
          <article class="product-card" data-id="manteca-corporal-karite-cacao" data-category="manteca" style="grid-column: 1 / -1; max-width: 600px; margin: 0 auto; width: 100%;" onclick="openProductModal('manteca-corporal-karite-cacao')">
            <div class="product-info-box" style="padding: 30px; text-align: center;">
              <span class="product-category-label" style="justify-content:center;">LÍNEA CORPORAL BOTÁNICA</span>
              <h3 class="product-title" style="font-size: 1.5rem; margin: 8px 0 12px;">Mantecas Corporales Sólidas</h3>
              
              <div class="product-desc-turquoise" style="justify-content:center;">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2L9.5 8.5 3 9.5 8 14l-1.5 7 5.5-3.5 5.5 3.5-1.5-7 5-4.5-6.5-1z"/></svg>
                <span>Cacao Puro Boliviano & Karité · Hidratación ultra profunda</span>
              </div>
              
              <div class="product-tags" style="justify-content:center; margin: 16px 0 20px;">
                <span class="tag-pill tag-turquesa">Zero Waste</span>
                <span class="tag-pill tag-turquesa">100% Biodegradable</span>
                <span class="tag-pill">Manteca de Cacao</span>
                <span class="tag-pill">Karité</span>
              </div>
              <div class="product-bottom-row" style="justify-content:center; gap: 14px;" onclick="event.stopPropagation()">
                <button type="button" class="btn-more-info" onclick="openProductModal('manteca-corporal-karite-cacao')">
                  ℹ️ Más info
                </button>
                <a href="https://wa.me/59173515698?text=Hola%20LULIS%20%F0%9F%91%8B%20Quisiera%20reservar%20o%20conocer%20m%C3%A1s%20sobre%20las%20nuevas%20Mantecas%20Corporales."
                   class="btn-wa-compact"
                   target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Consultar disponibilidad
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>`;

html = html.replace(catalogProductsRegex, newCatalogHtml);

// Inject updated CSS for card frame and turquoise styling inside <style>
const turquoiseCss = `
    /* ═══ MARCO DISTINTIVO DE PRODUCTO (NO SE PIERDE CON EL FONDO) ═══ */
    .product-card {
      background: #FFFFFF !important;
      border: 2.5px solid #DEC8B0 !important;
      border-radius: 22px !important;
      box-shadow: 0 8px 24px rgba(95, 15, 63, 0.08) !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      transition: transform 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease !important;
      cursor: pointer !important;
    }
    .product-card:hover {
      transform: translateY(-6px) !important;
      border-color: #07BC8A !important;
      box-shadow: 0 14px 36px rgba(7, 188, 138, 0.22) !important;
    }
    .product-img-box {
      width: 100% !important;
      height: 220px !important;
      background: #FAF8F3 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: hidden !important;
      border-bottom: 2px solid #EFE5D7 !important;
    }
    .product-img-box img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      transition: transform 0.4s ease !important;
    }
    .product-card:hover .product-img-box img {
      transform: scale(1.06) !important;
    }
    .product-info-box {
      padding: 20px 22px !important;
      display: flex !important;
      flex-direction: column !important;
      flex: 1 !important;
    }
    .product-meta-top {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin-bottom: 6px !important;
    }
    .product-category-label {
      font-size: 0.74rem !important;
      font-weight: 700 !important;
      color: var(--wine) !important;
      letter-spacing: 0.12em !important;
      text-transform: uppercase !important;
    }
    .product-price-val {
      font-size: 1.35rem !important;
      font-weight: 800 !important;
      color: var(--wine) !important;
    }
    .product-title {
      font-family: var(--ff-display) !important;
      font-size: 1.25rem !important;
      font-weight: 800 !important;
      color: #1C1611 !important;
      line-height: 1.2 !important;
      margin-bottom: 8px !important;
    }

    /* ═══ DESCRIPCIÓN EN TURQUESA DE LA MARCA (#07BC8A) ═══ */
    .product-desc-turquoise {
      background: rgba(7, 188, 138, 0.10) !important;
      border: 1.5px solid rgba(7, 188, 138, 0.35) !important;
      color: #067A5B !important;
      font-weight: 700 !important;
      font-size: 0.84rem !important;
      border-radius: 10px !important;
      padding: 6px 12px !important;
      margin: 4px 0 12px !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      line-height: 1.35 !important;
    }
    .product-tags {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      margin-bottom: 18px !important;
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
    .tag-pill.tag-turquesa {
      background: rgba(7, 188, 138, 0.12) !important;
      color: #058562 !important;
      border-color: #07BC8A !important;
      font-weight: 700 !important;
    }

    /* ═══ BOTONES INFERIORES: MÁS INFO & PEDIR WHATSAPP ═══ */
    .product-bottom-row {
      margin-top: auto !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 8px !important;
      padding-top: 14px !important;
      border-top: 1.5px solid #F0E8DC !important;
    }
    .btn-more-info {
      background: #FAF8F3 !important;
      border: 1.5px solid #07BC8A !important;
      color: #067A5B !important;
      font-weight: 700 !important;
      font-size: 0.82rem !important;
      padding: 7px 12px !important;
      border-radius: 20px !important;
      cursor: pointer !important;
      transition: all 0.22s ease !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
    }
    .btn-more-info:hover {
      background: #07BC8A !important;
      color: #FFFFFF !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 12px rgba(7, 188, 138, 0.35) !important;
    }
    .btn-wa-compact {
      background: #25D366 !important;
      color: #FFFFFF !important;
      font-size: 0.84rem !important;
      font-weight: 700 !important;
      padding: 8px 15px !important;
      border-radius: 30px !important;
      text-decoration: none !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      box-shadow: 0 3px 12px rgba(37, 211, 102, 0.32) !important;
      transition: transform 0.2s, box-shadow 0.2s !important;
    }
    .btn-wa-compact:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 5px 16px rgba(37, 211, 102, 0.45) !important;
    }
`;

html = html.replace('</style>', turquoiseCss + '\n  </style>');

// Inject the global openProductModal & closeProductModal logic before </body>
const modalLogicScript = `
<script>
  /* ═══ LULIS PRODUCT MODAL LOGIC (100% FUNCIONAL Y REACTIVO) ═══ */
  var LULIS_MODAL_DATA = {
    'shampoo-jamaica': {
      nombre: 'Shampoo Sólido Jamaica',
      categoria: 'SHAMPOO SÓLIDO',
      precio: 'Bs 35,00',
      img: 'Imagenes/productos/Jamaica.jpg',
      desc: 'Formulado con extracto natural de Flor de Jamaica y manteca pura. Brinda brillo vibrante, fortalecimiento desde la raíz y limpieza equilibrada sin resecar el cuero cabelludo.',
      ingredientes: 'Tensioactivo vegetal de coco (SCI), infusión concentrada de flor de Jamaica, arcilla blanca caolín, aceite de ricino prensado en frío, manteca de cacao.',
      duracion: '50g · Rinde de 35 a 45 lavadas (equivale a 2–3 botellas de shampoo tradicional).',
      waText: 'Hola LULIS 👋 Quisiera pedir el Shampoo Sólido Jamaica (Bs 35).'
    },
    'shampoo-romero': {
      nombre: 'Shampoo Sólido Romero',
      categoria: 'SHAMPOO SÓLIDO',
      precio: 'Bs 35,00',
      img: 'Imagenes/productos/Romeros.jpg',
      desc: 'Formulado con romero silvestre y menta silvestre. Estimula la microcirculación capilar, previene la caída, fortalece la raíz y regula el exceso de sebo.',
      ingredientes: 'Tensioactivo vegetal de coco (SCI), romero en polvo y aceite esencial de romero, menta silvestre, ortiga verde, aceite de jojoba.',
      duracion: '50g · Rinde de 35 a 45 lavadas.',
      waText: 'Hola LULIS 👋 Quisiera pedir el Shampoo Sólido Romero (Bs 35).'
    },
    'shampoo-coco': {
      nombre: 'Shampoo Sólido Coco',
      categoria: 'SHAMPOO SÓLIDO',
      precio: 'Bs 35,00',
      img: 'Imagenes/productos/Coco.jpg',
      desc: 'Ultra hidratante para cabellos secos, rizados o dañados. Restaura la elasticidad, suavidad y sedosidad natural con nutrientes botánicos puros.',
      ingredientes: 'Tensioactivo vegetal de coco (SCI), aceite virgen de coco prensado en frío, manteca de karité, proteína de trigo hidrolizada, extracto botánico.',
      duracion: '50g · Rinde de 35 a 45 lavadas.',
      waText: 'Hola LULIS 👋 Quisiera pedir el Shampoo Sólido Coco (Bs 35).'
    },
    'acond-melon': {
      nombre: 'Acondicionador Sólido Melón',
      categoria: 'ACONDICIONADOR SÓLIDO',
      precio: 'Bs 38,00',
      img: 'Imagenes/productos/Pack_coco_y_melon.jpeg',
      desc: 'Desenredado botánico instantáneo y suavidad profunda sin dejar residuo graso. Deja el cabello ligero, sedoso y perfumado.',
      ingredientes: 'Manteca de karité pura, extracto de melón, semillas de chía, alcohol cetoestearílico vegetal, vitamina E.',
      duracion: '50g · Rinde de 40 a 50 lavadas.',
      waText: 'Hola LULIS 👋 Quisiera pedir el Acondicionador Sólido Melón (Bs 38).'
    },
    'acond-uva-jamaica': {
      nombre: 'Acondicionador Uva & Jamaica',
      categoria: 'ACONDICIONADOR SÓLIDO',
      precio: 'Bs 38,00',
      img: 'Imagenes/productos/Pack_jamaica_y_jamaica.jpeg',
      desc: 'Poder antioxidante para cabellos teñidos, tratados o resecos. Sella las cutículas, previene el frizz y potencia el brillo natural.',
      ingredientes: 'Manteca de cacao boliviana, extracto de uva negra, infusión de flor de Jamaica, aceite de argán puro.',
      duracion: '50g · Rinde de 40 a 50 lavadas.',
      waText: 'Hola LULIS 👋 Quisiera pedir el Acondicionador Uva & Jamaica (Bs 38).'
    },
    'pack-duo-romero-melon': {
      nombre: 'Pack Dúo Pureza (Romero + Melón)',
      categoria: 'PACK DÚO AHORRO',
      precio: 'Bs 68,00',
      img: 'Imagenes/productos/Pack_romero_y_melon.jpeg',
      desc: 'Rutina capilar integral: Shampoo Romero para purificar y estimular la raíz + Acondicionador Melón para desenredar y sellar puntas.',
      ingredientes: '1 Shampoo Romero 50g + 1 Acondicionador Melón 50g + Caja plantable con semillas.',
      duracion: 'Hasta 90 lavadas combinadas.',
      waText: 'Hola LULIS 👋 Quisiera pedir el Pack Dúo Pureza (Bs 68).'
    },
    'pack-duo-coco-melon': {
      nombre: 'Pack Dúo Hidratación (Coco + Melón)',
      categoria: 'PACK DÚO AHORRO',
      precio: 'Bs 68,00',
      img: 'Imagenes/productos/Pack_coco_y_melon.jpeg',
      desc: 'Nutrición máxima para cabellos secos o rizados. Aporta suavidad, brillo y definición sin químicos agresivos.',
      ingredientes: '1 Shampoo Coco 50g + 1 Acondicionador Melón 50g + Caja plantable con semillas.',
      duracion: 'Hasta 90 lavadas combinadas.',
      waText: 'Hola LULIS 👋 Quisiera pedir el Pack Dúo Hidratación (Bs 68).'
    },
    'pack-duo-jamaica-romero': {
      nombre: 'Pack Dúo Botánico (Jamaica + Romero)',
      categoria: 'PACK DÚO AHORRO',
      precio: 'Bs 65,00',
      img: 'Imagenes/productos/Jamaica y romero.jpg',
      desc: 'Dúo de 2 shampoos complementarios: brillo y equilibrio con Jamaica + fuerza y estimulación con Romero.',
      ingredientes: '1 Shampoo Jamaica 50g + 1 Shampoo Romero 50g + Caja plantable con semillas.',
      duracion: 'Hasta 90 lavadas combinadas.',
      waText: 'Hola LULIS 👋 Quisiera pedir el Pack Dúo Botánico (Bs 65).'
    },
    'manteca-corporal-karite-cacao': {
      nombre: 'Mantecas Corporales Sólidas',
      categoria: 'LÍNEA CORPORAL BOTÁNICA',
      precio: 'Próximo lanzamiento',
      img: 'Imagenes/galeria/packagin.jpeg',
      desc: 'Nutrición botánica en barra a base de manteca de cacao pura boliviana y karité virgen. Hidrata la piel profundamente sin envases plásticos.',
      ingredientes: 'Manteca de cacao virgen boliviana, manteca de karité, aceites vegetales andinos, aceites esenciales aromáticos.',
      duracion: 'Barra corporal sólida de larga duración.',
      waText: 'Hola LULIS 👋 Quisiera más información sobre el lanzamiento de las Mantecas Corporales.'
    }
  };

  window.openProductModal = function(id) {
    var data = LULIS_MODAL_DATA[id] || LULIS_MODAL_DATA['shampoo-jamaica'];
    var modal = document.getElementById('productDetailModal');
    if (!modal) return;

    var imgEl = document.getElementById('modalProductImg');
    var nameEl = document.getElementById('modalProductName');
    var catEl = document.getElementById('modalProductCategory');
    var priceEl = document.getElementById('modalProductPrice');
    var descEl = document.getElementById('modalProductDesc');
    var ingEl = document.getElementById('modalProductIngredients');
    var durEl = document.getElementById('modalProductDuration');
    var waBtn = document.getElementById('modalProductWaBtn');

    if (imgEl) imgEl.src = data.img;
    if (nameEl) nameEl.textContent = data.nombre;
    if (catEl) catEl.textContent = data.categoria;
    if (priceEl) priceEl.textContent = data.precio;
    if (descEl) descEl.textContent = data.desc;
    if (ingEl) ingEl.textContent = data.ingredientes;
    if (durEl) durEl.textContent = data.duracion;
    if (waBtn) waBtn.href = 'https://wa.me/59173515698?text=' + encodeURIComponent(data.waText);

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  window.closeProductModal = function(e) {
    var modal = document.getElementById('productDetailModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') window.closeProductModal();
  });
</script>
`;

html = html.replace('</body>', modalLogicScript + '\n</body>');

fs.writeFileSync(indexPath, html);
console.log('index.html updated with framed cards, turquoise description, and interactive modal!');

// 2. UPDATE admin/productos.html & admin/js/productos.js
const adminProdHtmlPath = path.join(rootDir, 'admin', 'productos.html');
let adminProdHtml = fs.readFileSync(adminProdHtmlPath, 'utf8');

// Ensure upload area status and button are always clear
if (!adminProdHtml.includes('id="uploadStatusText"')) {
  adminProdHtml = adminProdHtml.replace(
    '<div class="upload-progress" id="uploadProgress">',
    `<div id="uploadStatusText" style="display:none;margin-top:10px;padding:8px 12px;background:rgba(7,188,138,0.12);border:1px solid #07BC8A;border-radius:8px;font-weight:700;font-size:0.86rem;color:#04664A;">
      ✅ Imagen seleccionada correctamente. Lista para guardar.
    </div>
    <div class="upload-progress" id="uploadProgress">`
  );
  fs.writeFileSync(adminProdHtmlPath, adminProdHtml);
  console.log('admin/productos.html updated with clear status banner!');
}

const adminProdJsPath = path.join(rootDir, 'admin', 'js', 'productos.js');
let adminProdJs = fs.readFileSync(adminProdJsPath, 'utf8');

// Fix handleFile to NOT show hanging 0% progress bar, but show clear ready status
adminProdJs = adminProdJs.replace(
  /reader\.onload = \(e\) => \{[\s\S]*?progress\.classList\.add\('show'\);[\s\S]*?\};/,
  `reader.onload = (e) => {
      previewImg.src = e.target.result;
      preview.style.display = 'inline-block';
      area.style.display    = 'none';
      if ($('uploadStatusText')) {
        $('uploadStatusText').style.display = 'block';
        $('uploadStatusText').textContent = '✅ Imagen "' + file.name + '" lista para guardar.';
      }
      if ($('uploadProgress')) $('uploadProgress').classList.remove('show');
      setBtnLoading(false);
    };`
);

// Fix guardarProducto so it never hangs on image upload
const uploadBlockOld = `    if (selectedFile) {
      try {
        const path = \`productos/\${Date.now()}_\${selectedFile.name}\`;
        imagenUrl = await uploadFile(selectedFile, path, (pct) => {
          $('progressFill').style.width = pct + '%';
          $('progressText').textContent = pct + '%';
        });
      } catch (uploadErr) {
        console.warn('Error subiendo imagen a Firebase Storage, usando DataURL/local:', uploadErr);
        if ($('previewImg').src) {
          imagenUrl = $('previewImg').src;
        }
      }
    }`;

const uploadBlockNew = `    if (selectedFile) {
      if ($('uploadProgress')) $('uploadProgress').classList.add('show');
      try {
        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '');
        const path = \`productos/\${Date.now()}_\${cleanName}\`;
        
        // Timeout de seguridad de 3 segundos para que nunca se congele
        const uploadTask = uploadFile(selectedFile, path, (pct) => {
          if ($('progressFill')) $('progressFill').style.width = pct + '%';
          if ($('progressText')) $('progressText').textContent = pct + '%';
        });
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Storage timeout')), 3000));
        
        imagenUrl = await Promise.race([uploadTask, timeout]);
      } catch (uploadErr) {
        console.warn('Aviso: guardando imagen optimizada en local/base64:', uploadErr);
        if ($('previewImg') && $('previewImg').src) {
          imagenUrl = $('previewImg').src;
        }
      }
    }`;

adminProdJs = adminProdJs.replace(uploadBlockOld, uploadBlockNew);

fs.writeFileSync(adminProdJsPath, adminProdJs);
console.log('admin/js/productos.js updated with instant image processing & timeout safety!');
