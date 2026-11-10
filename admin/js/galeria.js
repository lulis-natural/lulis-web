/* ═══════════════════════════════════════════════════════════
   LULIS Admin — galeria.js
   Gestión de galería: Base64 en Firestore (sin Storage).
   Mismo patrón que productos.js: foto en Base64 dentro del doc.
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  onSnapshot,
  serverTimestamp
} from './firebase-init.js';

const COL = 'galeria';
const $   = (id) => document.getElementById(id);

let allItems  = [];
let editingId = null;
let deleteId  = null;
let currentFotoBase64 = null;  // foto actual (para edición sin re-subir)

function toast(msg, type = '') {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3500);
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('logoutBtn')?.addEventListener('click', signOut);
  $('btnNuevoItem')?.addEventListener('click', openModalNew);
  $('modalClose')?.addEventListener('click', closeModal);
  $('btnCancelar')?.addEventListener('click', closeModal);
  $('btnGuardar')?.addEventListener('click', guardarItem);
  $('confirmCancel')?.addEventListener('click', () => $('confirmOverlay')?.classList.remove('open'));
  $('confirmDelete')?.addEventListener('click', ejecutarBorrado);
  initMultiUpload();
  subscribeGaleria();
});

/* ─── Suscripción en tiempo real ─────────────────────────── */
function subscribeGaleria() {
  // Sin orderBy para evitar requerir índice. Ordenamos en JS.
  onSnapshot(collection(db, COL), (snap) => {
    allItems = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.orden || 99) - (b.orden || 99));
    renderGrid();
    $('galeriaLoading').style.display = 'none';
  }, (err) => {
    console.warn('[galeria]', err.code, err.message);
    $('galeriaLoading').style.display = 'none';
    if (err.code === 'permission-denied') {
      $('galeriaEmpty').style.display = 'block';
      $('galeriaEmpty').innerHTML = `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.4;margin-bottom:12px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <h3>Sin permisos para leer la galería</h3>
        <p>Las reglas de Firestore bloquean el acceso. Verifica las reglas del proyecto.</p>`;
    } else {
      toast('Error al cargar galería: ' + (err.message || ''), 'error');
    }
  });
}

/* ─── Render grid ────────────────────────────────────────── */
function renderGrid() {
  const grid = $('galeriaGrid');
  if (!grid) return;
  if (!allItems.length) {
    grid.style.display              = 'none';
    $('galeriaEmpty').style.display = 'block';
    return;
  }
  $('galeriaEmpty').style.display = 'none';
  grid.style.display = 'grid';

  const editIcon = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const delIcon  = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
  const placeholder = `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

  grid.innerHTML = allItems.map(item => {
    const foto = item.foto || '';
    return `
    <div class="gallery-admin-item">
      <div class="gallery-admin-img-wrap">
        ${foto
          ? `<img class="gallery-admin-img" src="${escapeAttr(foto)}" alt="${escapeAttr(item.alt) || ''}" loading="lazy">`
          : `<div class="gallery-admin-img-placeholder">${placeholder}</div>`}
      </div>
      <div class="item-overlay">
        <span class="item-status ${item.activo !== false ? 'active' : 'inactive'}">
          ${item.activo !== false ? 'Visible' : 'Oculto'}
        </span>
      </div>
      <div class="gallery-admin-body">
        <div class="gallery-admin-alt">${escapeHtml(item.alt) || 'Sin descripción'}</div>
        <div class="gallery-admin-actions">
          <button class="btn btn-outline btn-sm" onclick="editarItem('${item.id}')" title="Editar">${editIcon}Editar</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="confirmarBorrado('${item.id}')" title="Eliminar" aria-label="Eliminar">${delIcon}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* Escape HTML / attr */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function escapeAttr(str) {
  if (str == null) return '';
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ─── Modal nuevo ────────────────────────────────────────── */
function openModalNew() {
  editingId = null;
  currentFotoBase64 = null;
  $('galeriaItemId').value = '';
  $('galeriaImgUrl').value = '';
  $('galeriaPreview').src  = '';
  $('gAlt').value          = '';
  $('gCategoria').value    = 'general';
  $('gOrden').value        = (allItems.length || 0) + 1;
  $('gActivo').checked     = true;
  $('modalOverlay').classList.add('open');
}

/* ─── Editar item ────────────────────────────────────────── */
window.editarItem = function(id) {
  const item = allItems.find(x => x.id === id);
  if (!item) return;
  editingId = id;
  currentFotoBase64 = item.foto || null;
  $('galeriaItemId').value = id;
  $('galeriaImgUrl').value = item.foto || '';
  $('galeriaPreview').src  = item.foto || '';
  $('gAlt').value          = item.alt      || '';
  $('gCategoria').value    = item.categoria || 'general';
  $('gOrden').value        = item.orden    ?? '';
  $('gActivo').checked     = item.activo !== false;
  $('modalOverlay').classList.add('open');
};

async function guardarItem() {
  const alt = $('gAlt').value.trim();
  if (!alt) { toast('El texto alternativo es obligatorio', 'error'); return; }

  try {
    const data = {
      alt,
      categoria:     $('gCategoria').value || 'general',
      orden:         parseInt($('gOrden').value) || 99,
      activo:        $('gActivo').checked,
      actualizadoEn: serverTimestamp(),
    };
    if (currentFotoBase64) data.foto = currentFotoBase64;

    if (editingId) {
      await updateDoc(doc(db, COL, editingId), data);
      toast('Imagen actualizada ✅', 'success');
    } else {
      // Para crear nuevo, la foto es obligatoria
      if (!currentFotoBase64) {
        toast('Subí una imagen primero', 'error');
        return;
      }
      data.foto = currentFotoBase64;
      data.creadoEn = serverTimestamp();
      await addDoc(collection(db, COL), data);
      toast('Imagen agregada ✅', 'success');
    }
    closeModal();
  } catch (err) {
    console.error(err);
    toast('Error: ' + (err.message || ''), 'error');
  }
}

/* ─── Upload múltiple a Base64 ──────────────────────────── */
function initMultiUpload() {
  const input    = $('multiFile');
  const area     = $('multiUploadArea');
  const progress = $('multiProgress');
  const fill     = $('multiProgressFill');
  const text     = $('multiProgressText');

  if (!input || !area) return;

  input.addEventListener('change', () => handleFiles(input.files));

  area.addEventListener('dragover',  (e) => { e.preventDefault(); area.classList.add('drag-over'); });
  area.addEventListener('dragleave', ()  => area.classList.remove('drag-over'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  async function handleFiles(files) {
    const valid = Array.from(files).filter(f => {
      if (f.size > 2 * 1024 * 1024) {
        toast(`"${f.name}" supera 2 MB, omitido`, 'error');
        return false;
      }
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
        toast(`"${f.name}" formato no soportado`, 'error');
        return false;
      }
      return true;
    });
    if (!valid.length) return;

    progress.style.display = 'block';
    let done = 0;

    for (const file of valid) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        const compressed = await compressImage(dataUrl, 1200, 0.85);
        const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');

        await addDoc(collection(db, COL), {
          foto:      compressed,
          alt,
          categoria: 'general',
          activo:    true,
          orden:     allItems.length + done + 1,
          creadoEn:  serverTimestamp(),
        });
        done++;
        const overall = Math.round((done / valid.length) * 100);
        fill.style.width = overall + '%';
        text.textContent = `Subiendo ${done} de ${valid.length}… ${overall}%`;
      } catch (err) {
        console.error('Error procesando', file.name, err);
        toast(`Error procesando "${file.name}"`, 'error');
      }
    }

    fill.style.width  = '100%';
    text.textContent  = `✅ ${done} imagen${done !== 1 ? 'es' : ''} subida${done !== 1 ? 's' : ''}`;
    setTimeout(() => {
      progress.style.display = 'none';
      fill.style.width = '0%';
      input.value = '';
    }, 2500);

    toast(`${done} imagen${done !== 1 ? 'es subidas' : ' subida'} ✅`, 'success');
  }
}

/* Lee un File como dataURL */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = e => resolve(e.target.result);
    r.onerror = () => reject(new Error('No se pudo leer el archivo'));
    r.readAsDataURL(file);
  });
}

/* Comprime una imagen dataURL via canvas */
function compressImage(dataUrl, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((maxSize / width) * height);
          width  = maxSize;
        } else {
          width  = Math.round((maxSize / height) * width);
          height = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      try { resolve(canvas.toDataURL('image/jpeg', quality)); }
      catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = dataUrl;
  });
}

/* ─── Borrar ─────────────────────────────────────────────── */
window.confirmarBorrado = function(id) {
  deleteId = id;
  $('confirmOverlay').classList.add('open');
};

async function ejecutarBorrado() {
  $('confirmOverlay').classList.remove('open');
  if (!deleteId) return;
  try {
    await deleteDoc(doc(db, COL, deleteId));
    toast('Imagen eliminada', 'success');
  } catch (err) {
    toast('Error: ' + (err.message || ''), 'error');
  }
  deleteId = null;
}

function closeModal() {
  $('modalOverlay').classList.remove('open');
  editingId = null;
  currentFotoBase64 = null;
}
