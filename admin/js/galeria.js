/* ═══════════════════════════════════════════════════════════
   LULIS Admin — galeria.js
   Gestión de galería: subir a Storage, CRUD en Firestore.
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut, uploadFile, deleteFile,
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot,
  serverTimestamp
} from './firebase-init.js';

const COL = 'galeria';
const $   = (id) => document.getElementById(id);

let allItems  = [];
let editingId = null;
let deleteId  = null;
let deleteUrl = null;

function toast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className   = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3500);
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('logoutBtn')?.addEventListener('click', signOut);
  $('modalClose').addEventListener('click', closeModal);
  $('btnCancelar').addEventListener('click', closeModal);
  $('btnGuardar').addEventListener('click', guardarItem);
  $('confirmCancel').addEventListener('click', () => $('confirmOverlay').classList.remove('open'));
  $('confirmDelete').addEventListener('click', ejecutarBorrado);
  initMultiUpload();
  subscribeGaleria();
});

/* ─── Suscripción ────────────────────────────────────────── */
function subscribeGaleria() {
  const q = query(collection(db, COL), orderBy('orden', 'asc'));
  onSnapshot(q, (snap) => {
    allItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
  if (!allItems.length) {
    grid.style.display              = 'none';
    $('galeriaEmpty').style.display = 'block';
    return;
  }
  $('galeriaEmpty').style.display = 'none';
  grid.style.display = 'grid';

  const editIcon = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const delIcon  = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

  grid.innerHTML = allItems.map(item => `
    <div class="gallery-admin-item">
      <img class="gallery-admin-img"
           src="${escapeHtml(item.imageUrl) || ''}"
           alt="${escapeHtml(item.alt) || ''}"
           loading="lazy">
      <div class="item-overlay">
        <span class="item-status ${item.activo ? 'active' : 'inactive'}">
          ${item.activo ? 'Visible' : 'Oculto'}
        </span>
      </div>
      <div class="gallery-admin-body">
        <div class="gallery-admin-alt">${escapeHtml(item.alt) || 'Sin descripción'}</div>
        <div class="gallery-admin-actions">
          <button class="btn btn-outline btn-sm" onclick="editarItem('${item.id}')" title="Editar">${editIcon}Editar</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="confirmarBorrado('${item.id}','${escapeHtml(item.imageUrl || '')}')" title="Eliminar" aria-label="Eliminar">${delIcon}</button>
        </div>
      </div>
    </div>`
  ).join('');
}

/* Escape HTML for safe display */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ─── Upload múltiple ────────────────────────────────────── */
function initMultiUpload() {
  const input    = $('multiFile');
  const area     = $('multiUploadArea');
  const progress = $('multiProgress');
  const fill     = $('multiProgressFill');
  const text     = $('multiProgressText');

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
      if (f.size > 5 * 1024 * 1024) {
        toast(`"${f.name}" supera 5 MB, omitido`, 'error');
        return false;
      }
      return true;
    });
    if (!valid.length) return;

    progress.style.display = 'block';
    let done = 0;

    for (const file of valid) {
      const path = `galeria/${Date.now()}_${file.name}`;
      try {
        const url = await uploadFile(file, path, (pct) => {
          const overall = Math.round(((done / valid.length) + (pct / 100 / valid.length)) * 100);
          fill.style.width = overall + '%';
          text.textContent = `Subiendo ${done + 1} de ${valid.length}… ${overall}%`;
        });

        /* Crear documento en Firestore */
        await addDoc(collection(db, COL), {
          imageUrl:   url,
          storagePath: path,
          alt:        file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
          categoria:  'general',
          activo:     true,
          orden:      allItems.length + done + 1,
          creadoEn:   serverTimestamp(),
        });
        done++;
      } catch (err) {
        toast(`Error subiendo "${file.name}"`, 'error');
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

/* ─── Editar item ────────────────────────────────────────── */
window.editarItem = function(id) {
  const item = allItems.find(x => x.id === id);
  if (!item) return;
  editingId = id;
  $('galeriaItemId').value  = id;
  $('galeriaImgUrl').value  = item.imageUrl || '';
  $('galeriaPreview').src   = item.imageUrl || '';
  $('gAlt').value           = item.alt      || '';
  $('gCategoria').value     = item.categoria || 'general';
  $('gOrden').value         = item.orden    ?? '';
  $('gActivo').checked      = !!item.activo;
  $('modalOverlay').classList.add('open');
};

async function guardarItem() {
  const alt = $('gAlt').value.trim();
  if (!alt) { toast('El texto alternativo es obligatorio', 'error'); return; }

  try {
    await updateDoc(doc(db, COL, editingId), {
      alt,
      categoria:    $('gCategoria').value,
      orden:        parseInt($('gOrden').value) || 99,
      activo:       $('gActivo').checked,
      actualizadoEn: serverTimestamp(),
    });
    toast('Imagen actualizada ✅', 'success');
    closeModal();
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ─── Borrar ─────────────────────────────────────────────── */
window.confirmarBorrado = function(id, url) {
  deleteId  = id;
  deleteUrl = url;
  $('confirmOverlay').classList.add('open');
};

async function ejecutarBorrado() {
  $('confirmOverlay').classList.remove('open');
  if (!deleteId) return;
  try {
    if (deleteUrl) await deleteFile(deleteUrl);
    await deleteDoc(doc(db, COL, deleteId));
    toast('Imagen eliminada', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
  deleteId = deleteUrl = null;
}

function closeModal() {
  $('modalOverlay').classList.remove('open');
  editingId = null;
}
