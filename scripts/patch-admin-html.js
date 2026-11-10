const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'admin', 'productos.html');
let html = fs.readFileSync(filePath, 'utf8');

const oldBlock = `<select id="pCategoria" required>
              <option value="">Seleccionar categoría…</option>
              <option value="shampoo">Shampoo Sólido</option>
              <option value="acondicionador">Acondicionador Sólido</option>
              <option value="pack">Pack / Dúo</option>
            </select>`;

const newBlock = `<select id="pCategoria" required>
              <option value="">Seleccionar categoría…</option>
              <option value="shampoo">🌿 Shampoos Sólidos</option>
              <option value="acondicionador">✨ Acondicionadores Sólidos</option>
              <option value="pack">🎁 Packs y Dúos</option>
              <option value="__nuevo__">➕ Crear nuevo bloque / categoría…</option>
            </select>
            <div id="nuevaCategoriaWrap" style="display:none;margin-top:8px">
              <input type="text" id="pCategoriaNueva" placeholder="Nombre del nuevo bloque (ej: Jabones Sólidos, Aceites, etc.)" style="width:100%;padding:8px 12px;border:1.5px solid var(--wine);border-radius:6px;font-size:0.9rem">
              <span class="field-hint" style="color:var(--wine)">Se creará automáticamente una nueva columna para este bloque en el catálogo.</span>
            </div>`;

if (html.includes('<select id="pCategoria" required>')) {
  html = html.replace(/<select id="pCategoria" required>[\s\S]*?<\/select>/, newBlock);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('admin/productos.html successfully patched!');
} else {
  console.log('Already patched or not found');
}
