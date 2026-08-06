/* ═══════════════════════════════════════════════════════════
   LULIS Admin — productos.js
   CRUD completo de productos con Firestore + Storage.
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut, uploadFile, deleteFile,
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot,
  serverTimestamp
} from './firebase-init.js';

/* ─── Referencias ────────────────────────────────────────── */
const COL = 'productos';
const $ = (id) => document.getElementById(id);

/* ─── Estado ─────────────────────────────────────────────── */
let allProductos = [];
let editingId    = null;
let deleteId     = null;
let deleteImgUrl = null;
let selectedFile = null;

/* ─── Toast ──────────────────────────────────────────────── */
function toast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3500);
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('logoutBtn')?.addEventListener('click', signOut);
  $('btnNuevo').addEventListener('click', openModalNew);
  $('modalClose').addEventListener('click', closeModal);
  $('btnCancelar').addEventListener('click', closeModal);
  $('btnGuardar').addEventListener('click', guardarProducto);
  $('confirmCancel').addEventListener('click', () => $('confirmOverlay').classList.remove('open'));
  $('confirmDelete').addEventListener('click', ejecutarBorrado);
  $('searchInput').addEventListener('input', renderTable);
  $('filterCat').addEventListener('change', renderTable);
  $('filterDisp').addEventListener('change', renderTable);
  initUpload();
  subscribeProductos();
});

/* ─── Suscripción en tiempo real ─────────────────────────── */
function subscribeProductos() {
  const q = query(collection(db, COL), orderBy('orden', 'asc'));
  onSnapshot(q, (snap) => {
    allProductos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable();
    $('tableLoading').style.display = 'none';
    $('tableWrap').style.display    = 'block';
  }, (err) => {
    console.warn('[productos]', err.code, err.message);
    $('tableLoading').style.display = 'none';
    if (err.code === 'permission-denied') {
      $('emptyState').style.display = 'block';
      $('emptyState').innerHTML = `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.4;margin-bottom:12px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <h3>Sin permisos para leer productos</h3>
        <p>Las reglas de Firestore bloquean el acceso. Verifica las reglas del proyecto.</p>`;
    } else {
      toast('Error al cargar productos: ' + (err.message || ''), 'error');
    }
  });
}

/* ─── Render tabla ───────────────────────────────────────── */
function renderTable() {
  const search   = $('searchInput').value.toLowerCase();
  const cat      = $('filterCat').value;
  const disp     = $('filterDisp').value;

  const filtered = allProductos.filter(p => {
    const matchSearch = !search || p.nombre?.toLowerCase().includes(search);
    const matchCat    = !cat    || p.categoria === cat;
    const matchDisp   = disp === '' || String(p.disponible) === disp;
    return matchSearch && matchCat && matchDisp;
  });

  const tbody = $('productosBody');

  if (!filtered.length) {
    $('tableWrap').style.display  = 'none';
    $('emptyState').style.display = 'block';
    return;
  }
  $('tableWrap').style.display  = 'block';
  $('emptyState').style.display = 'none';

  tbody.innerHTML = filtered.map(p => {
    const editIcon = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const delIcon  = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
    const bottleIcon = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
    return `
    <tr>
      <td>
        ${p.imagenUrl
          ? `<img class="product-thumb" src="${p.imagenUrl}" alt="${escapeHtml(p.nombre)}">`
          : `<div class="product-thumb-placeholder">${bottleIcon}</div>`}
      </td>
      <td>
        <div class="td-product-name">
          <div>
            <strong>${escapeHtml(p.nombre) || '—'}</strong><br>
            <small style="color:var(--mid)">${escapeHtml(p.variante) || ''}</small>
          </div>
        </div>
      </td>
      <td>${capitalize(p.categoria) || '—'}</td>
      <td>${(p.tipoCabello || []).join(', ') || '—'}</td>
      <td>${p.badge ? `<span class="badge badge-wine">${p.badge}</span>` : '—'}</td>
      <td>
        <span class="badge ${p.disponible ? 'badge-green' : 'badge-red'}">
          ${p.disponible ? 'Disponible' : 'Sin stock'}
        </span>
      </td>
      <td>${p.orden ?? '—'}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-outline btn-sm btn-icon" onclick="editarProducto('${p.id}')" title="Editar" aria-label="Editar">${editIcon}</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="confirmarBorrado('${p.id}','${(p.imagenUrl || '').replace(/'/g, "\\'")}')" title="Eliminar" aria-label="Eliminar">${delIcon}</button>
        </div>
      </td>
    </tr>`;
  }).join('');
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

/* ─── Modal nuevo ────────────────────────────────────────── */
function openModalNew() {
  editingId = null;
  $('modalTitle').textContent    = 'Nuevo producto';
  $('btnGuardarText').textContent = 'Guardar producto';
  $('productoForm').reset();
  $('productoId').value         = '';
  $('imagenUrlActual').value    = '';
  resetUpload();
  $('modalOverlay').classList.add('open');
}

/* ─── Modal editar ───────────────────────────────────────── */
window.editarProducto = function(id) {
  const p = allProductos.find(x => x.id === id);
  if (!p) return;

  editingId = id;
  $('modalTitle').textContent     = 'Editar producto';
  $('btnGuardarText').textContent  = 'Actualizar producto';
  $('productoId').value           = id;
  $('imagenUrlActual').value      = p.imagenUrl || '';
  $('pNombre').value              = p.nombre       || '';
  $('pVariante').value            = p.variante     || '';
  $('pCategoria').value           = p.categoria    || '';
  $('pBadge').value               = p.badge        || '';
  $('pTipoCabello').value         = (p.tipoCabello || []).join(', ');
  $('pOrden').value               = p.orden        ?? '';
  $('pDescripcion').value         = p.descripcion  || '';
  $('pDescLarga').value           = p.descripcionLarga || '';
  $('pDisponible').checked        = !!p.disponible;
  $('pDestacado').checked         = !!p.destacado;

  /* Mostrar imagen actual */
  if (p.imagenUrl) {
    $('previewImg').src = p.imagenUrl;
    $('uploadPreview').style.display = 'inline-block';
    $('uploadArea').style.display    = 'none';
  } else {
    resetUpload();
  }

  $('modalOverlay').classList.add('open');
};

/* ─── Guardar / Actualizar ───────────────────────────────── */
async function guardarProducto() {
  const nombre     = $('pNombre').value.trim();
  const categoria  = $('pCategoria').value;
  const descripcion = $('pDescripcion').value.trim();

  if (!nombre || !categoria || !descripcion) {
    toast('Completa los campos obligatorios', 'error'); return;
  }

  setBtnLoading(true);

  try {
    /* Subir imagen si se seleccionó una nueva */
    let imagenUrl = $('imagenUrlActual').value;
    if (selectedFile) {
      const path = `productos/${Date.now()}_${selectedFile.name}`;
      imagenUrl  = await uploadFile(selectedFile, path, (pct) => {
        $('progressFill').style.width = pct + '%';
        $('progressText').textContent = pct + '%';
      });
    }

    const data = {
      nombre,
      variante:         $('pVariante').value.trim(),
      categoria,
      badge:            $('pBadge').value || null,
      tipoCabello:      $('pTipoCabello').value.split(',').map(s => s.trim()).filter(Boolean),
      orden:            parseInt($('pOrden').value) || 99,
      descripcion,
      descripcionLarga: $('pDescLarga').value.trim(),
      imagenUrl,
      disponible:       $('pDisponible').checked,
      destacado:        $('pDestacado').checked,
      slug:             slugify(nombre),
      actualizadoEn:    serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, COL, editingId), data);
      toast('Producto actualizado ✅', 'success');
    } else {
      data.creadoEn = serverTimestamp();
      await addDoc(collection(db, COL), data);
      toast('Producto creado ✅', 'success');
    }

    closeModal();
  } catch (err) {
    console.error(err);
    toast('Error al guardar: ' + err.message, 'error');
  } finally {
    setBtnLoading(false);
  }
}

/* ─── Eliminar ───────────────────────────────────────────── */
window.confirmarBorrado = function(id, imgUrl) {
  deleteId     = id;
  deleteImgUrl = imgUrl;
  $('confirmOverlay').classList.add('open');
};

async function ejecutarBorrado() {
  if (!deleteId) return;
  $('confirmOverlay').classList.remove('open');
  try {
    if (deleteImgUrl) await deleteFile(deleteImgUrl);
    await deleteDoc(doc(db, COL, deleteId));
    toast('Producto eliminado', 'success');
  } catch (err) {
    toast('Error al eliminar: ' + err.message, 'error');
  }
  deleteId = deleteImgUrl = null;
}

/* ─── Upload ─────────────────────────────────────────────── */
function initUpload() {
  const input    = $('imagenFile');
  const area     = $('uploadArea');
  const preview  = $('uploadPreview');
  const previewImg = $('previewImg');
  const progress = $('uploadProgress');

  input.addEventListener('change', handleFile);
  $('removeImg').addEventListener('click', () => {
    resetUpload();
    $('imagenUrlActual').value = '';
  });

  /* Drag & drop */
  area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('drag-over'); });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) {
      input.files = e.dataTransfer.files;
      handleFile();
    }
  });

  function handleFile() {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('La imagen no puede superar 5 MB', 'error'); return;
    }
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      preview.style.display = 'inline-block';
      area.style.display    = 'none';
      progress.classList.add('show');
    };
    reader.readAsDataURL(file);
  }
}

function resetUpload() {
  selectedFile = null;
  $('imagenFile').value        = '';
  $('uploadPreview').style.display = 'none';
  $('uploadArea').style.display    = 'block';
  $('uploadProgress').classList.remove('show');
  $('progressFill').style.width    = '0%';
  $('progressText').textContent    = '0%';
}

/* ─── Helpers ────────────────────────────────────────────── */
function closeModal() {
  $('modalOverlay').classList.remove('open');
  editingId    = null;
  selectedFile = null;
}

function setBtnLoading(on) {
  $('btnGuardar').disabled             = on;
  $('btnGuardarText').style.display    = on ? 'none' : 'block';
  $('btnGuardarSpinner').style.display = on ? 'block' : 'none';
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
