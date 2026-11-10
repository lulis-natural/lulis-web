const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. UPDATE admin/productos.html
const adminProdHtmlPath = path.join(rootDir, 'admin', 'productos.html');
let html = fs.readFileSync(adminProdHtmlPath, 'utf8');

const targetSelect = `<div class="form-group">
            <label class="label-required" for="pCategoria">Categoría</label>
            <select id="pCategoria" required>
              <option value="">Seleccionar categoría…</option>
              <option value="shampoo">Shampoo Sólido</option>
              <option value="acondicionador">Acondicionador Sólido</option>
              <option value="pack">Pack / Dúo</option>
            </select>
          </div>`;

const replacementSelect = `<div class="form-group">
            <label class="label-required" for="pCategoria">Categoría / Bloque del Catálogo</label>
            <select id="pCategoria" required>
              <option value="">Seleccionar categoría…</option>
              <option value="shampoo">🌿 Shampoos Sólidos</option>
              <option value="acondicionador">✨ Acondicionadores Sólidos</option>
              <option value="pack">🎁 Packs y Dúos</option>
              <option value="__nuevo__">➕ Crear nuevo bloque / categoría…</option>
            </select>
            <div id="nuevaCategoriaWrap" style="display:none;margin-top:8px">
              <input type="text" id="pCategoriaNueva" placeholder="Nombre del nuevo bloque (ej: Jabones Sólidos, Aceites, etc.)" style="width:100%;padding:8px 12px;border:1.5px solid var(--wine);border-radius:6px;font-size:0.9rem">
              <span class="field-hint" style="color:var(--wine)">Se creará automáticamente una nueva columna para este bloque en el catálogo.</span>
            </div>
          </div>`;

if (html.includes(targetSelect)) {
  html = html.replace(targetSelect, replacementSelect);
  fs.writeFileSync(adminProdHtmlPath, html, 'utf8');
  console.log('admin/productos.html updated with custom block creation option');
}

// 2. UPDATE admin/js/productos.js
const adminJsPath = path.join(rootDir, 'admin', 'js', 'productos.js');
let js = fs.readFileSync(adminJsPath, 'utf8');

if (!js.includes('pCategoriaNueva')) {
  // Add change listener to pCategoria
  const domLoadedSearch = `document.addEventListener('DOMContentLoaded', () => {`;
  const domLoadedReplace = `document.addEventListener('DOMContentLoaded', () => {
  $('pCategoria')?.addEventListener('change', (e) => {
    const wrap = $('nuevaCategoriaWrap');
    if (wrap) wrap.style.display = e.target.value === '__nuevo__' ? 'block' : 'none';
  });`;
  js = js.replace(domLoadedSearch, domLoadedReplace);

  // In openModalNew: reset wrap
  const openModalNewSearch = `function openModalNew() {`;
  const openModalNewReplace = `function openModalNew() {
  const wrap = $('nuevaCategoriaWrap');
  if (wrap) wrap.style.display = 'none';
  if ($('pCategoriaNueva')) $('pCategoriaNueva').value = '';`;
  js = js.replace(openModalNewSearch, openModalNewReplace);

  // In openModalEdit: handle custom category option if needed
  const openModalEditSearch = `$('pCategoria').value           = p.categoria || 'shampoo';`;
  const openModalEditReplace = `let catOpt = Array.from($('pCategoria').options).find(o => o.value === p.categoria);
  if (!catOpt && p.categoria) {
    const opt = document.createElement('option');
    opt.value = p.categoria;
    opt.textContent = p.categoriaLabel || p.categoria;
    $('pCategoria').appendChild(opt);
  }
  $('pCategoria').value           = p.categoria || 'shampoo';
  const wrapEdit = $('nuevaCategoriaWrap');
  if (wrapEdit) wrapEdit.style.display = 'none';`;
  js = js.replace(openModalEditSearch, openModalEditReplace);

  // In guardarProducto: extract custom category
  const guardarCatSearch = `const categoria   = $('pCategoria').value;`;
  const guardarCatReplace = `let categoria   = $('pCategoria').value;
  let categoriaLabel = '';
  if (categoria === '__nuevo__') {
    const customName = ($('pCategoriaNueva')?.value || '').trim();
    if (!customName) {
      toast('Escribe el nombre del nuevo bloque', 'error');
      setBtnLoading(false);
      return;
    }
    categoria = customName.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9\\-]/g, '');
    categoriaLabel = customName;
  } else {
    categoriaLabel = ({
      shampoo: 'Shampoo Sólido',
      acondicionador: 'Acondicionador Sólido',
      pack: 'Pack Dúo'
    })[categoria] || categoria;
  }`;
  js = js.replace(guardarCatSearch, guardarCatReplace);

  // In data object: add categoriaLabel
  const dataObjectSearch = `categoria,
      precio:           $('pPrecio').value.trim() || '35 Bs.',`;
  const dataObjectReplace = `categoria,
      categoriaLabel,
      precio:           $('pPrecio').value.trim() || '35 Bs.',`;
  js = js.replace(dataObjectSearch, dataObjectReplace);

  fs.writeFileSync(adminJsPath, js, 'utf8');
  console.log('admin/js/productos.js updated to support custom block categories');
}
