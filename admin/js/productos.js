/* ═══════════════════════════════════════════════════════════
   LULIS Admin — productos.js
   CRUD completo de productos con Firestore.
   Las imágenes se guardan como Base64 dentro del documento
   (no requiere Firebase Storage / plan Blaze).
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  onSnapshot,
  serverTimestamp
} from './firebase-init.js';

const COL = 'productos';
const $ = (id) => document.getElementById(id);

let allProductos = [];
let editingId    = null;
let deleteId     = null;
let currentFotoBase64 = null;   // foto actual (para edición sin re-subir)

/* ─── Toast ─────────────────────────────────────────────── */
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
  // Sin orderBy para evitar requerir índice compuesto. Ordenamos en JS.
  onSnapshot(collection(db, COL), (snap) => {
    allProductos = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.orden || 99) - (b.orden || 99));
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
        <p>Las reglas de Firestore bloquean el acceso. Verificá las reglas del proyecto.</p>`;
    } else {
      toast('Error al cargar productos: ' + (err.message || ''), 'error');
    }
  });
}

/* ─── Render tabla ───────────────────────────────────────── */
function renderTable() {
  const search   = $('searchInput').value.toLowerCase().trim();
  const cat      = $('filterCat').value;
  const disp     = $('filterDisp').value;

  const filtered = allProductos.filter(p => {
    const matchSearch = !search
      || (p.nombre   || '').toLowerCase().includes(search)
      || (p.tipo     || '').toLowerCase().includes(search)
      || (p.gramos   || '').toLowerCase().includes(search)
      || (p.precio   || '').toLowerCase().includes(search)
      || (p.descripcion || '').toLowerCase().includes(search);
    const matchCat    = !cat    || p.tipo === cat;
    const matchDisp   = disp === '' || String(!!p.disponible) === disp;
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

  const iconEdit = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const iconDel = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
  const iconBottle = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;

  tbody.innerHTML = filtered.map(p => {
    const fotoSrc = p.foto || '';
    return `
    <tr>
      <td>
        ${fotoSrc
          ? `<img class="product-thumb" src="${escapeAttr(fotoSrc)}" alt="${escapeAttr(p.nombre)}">`
          : `<div class="product-thumb-placeholder">${iconBottle}</div>`}
      </td>
      <td>
        <div class="td-product-name">
          <div>
            <strong>${escapeHtml(p.nombre) || '—'}</strong>
            ${p.badge ? `<br><span class="badge badge-wine" style="margin-top:4px">${escapeHtml(p.badge)}</span>` : ''}
          </div>
        </div>
      </td>
      <td>${tipoLabel(p.tipo)}</td>
      <td>${escapeHtml(p.gramos) || '—'}</td>
      <td><strong>${escapeHtml(p.precio) || '—'}</strong></td>
      <td>
        <span class="badge ${p.disponible ? 'badge-green' : 'badge-red'}">
          ${p.disponible ? 'Disponible' : 'No disponible'}
        </span>
      </td>
      <td>${p.orden ?? '—'}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-outline btn-sm btn-icon" onclick="editarProducto('${p.id}')" title="Editar" aria-label="Editar">${iconEdit}</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="confirmarBorrado('${p.id}')" title="Eliminar" aria-label="Eliminar">${iconDel}</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function tipoLabel(t) {
  return {
    shampoo: 'Shampoo',
    acondicionador: 'Acondicionador',
    pack: 'Pack / Combo',
  }[t] || '—';
}

/* ─── Modal nuevo ────────────────────────────────────────── */
function openModalNew() {
  editingId = null;
  currentFotoBase64 = null;
  $('modalTitle').textContent     = 'Nuevo producto';
  $('btnGuardarText').textContent = 'Guardar producto';
  $('productoForm').reset();
  $('productoId').value    = '';
  $('fotoActual').value     = '';
  $('pDisponible').checked  = true;
  $('pDestacado').checked   = false;
  $('pOrden').value         = (allProductos.length || 0) + 1;
  resetUpload();
  $('modalOverlay').classList.add('open');
}

/* ─── Modal editar ───────────────────────────────────────── */
window.editarProducto = function(id) {
  const p = allProductos.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  currentFotoBase64 = p.foto || null;
  $('modalTitle').textContent     = 'Editar producto';
  $('btnGuardarText').textContent = 'Actualizar producto';
  $('productoId').value         = id;
  $('pNombre').value            = p.nombre       || '';
  $('pPrecio').value            = p.precio       || '';
  $('pTipo').value              = p.tipo         || '';
  $('pGramos').value            = p.gramos       || '';
  $('pBadge').value             = p.badge        || '';
  $('pOrden').value             = p.orden        ?? '';
  $('pDescripcion').value       = p.descripcion  || '';
  $('pDisponible').checked      = p.disponible !== false;
  $('pDestacado').checked       = !!p.destacado;
  $('fotoActual').value         = p.foto || '';

  /* Mostrar imagen actual si existe */
  if (p.foto) {
    $('previewImg').src = p.foto;
    $('uploadPreview').style.display = 'inline-block';
    $('uploadArea').style.display    = 'none';
  } else {
    resetUpload();
  }

  $('modalOverlay').classList.add('open');
};

/* ─── Guardar / Actualizar ───────────────────────────────── */
async function guardarProducto() {
  const nombre = $('pNombre').value.trim();
  const precio = $('pPrecio').value.trim();
  const tipo   = $('pTipo').value;
  const gramos = $('pGramos').value.trim();
  const descripcion = $('pDescripcion').value.trim();

  if (!nombre || !precio || !tipo || !gramos || !descripcion) {
    toast('Completa todos los campos obligatorios', 'error');
    return;
  }

  setBtnLoading(true);

  try {
    /* Resolver la foto: si el usuario subió una nueva, usar esa; si no, mantener la actual */
    let foto = currentFotoBase64;
    if (!foto) {
      // No hay foto (ni nueva ni existente)
      foto = null;
    }

    const data = {
      nombre,
      precio,
      tipo,
      gramos,
      descripcion,
      badge:       $('pBadge').value.trim() || null,
      orden:       parseInt($('pOrden').value) || 99,
      foto,
      disponible:  $('pDisponible').checked,
      destacado:   $('pDestacado').checked,
      actualizadoEn: serverTimestamp(),
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
    toast('Error al guardar: ' + (err.message || ''), 'error');
  } finally {
    setBtnLoading(false);
  }
}

/* ─── Eliminar ───────────────────────────────────────────── */
window.confirmarBorrado = function(id) {
  deleteId = id;
  $('confirmOverlay').classList.add('open');
};

async function ejecutarBorrado() {
  if (!deleteId) return;
  $('confirmOverlay').classList.remove('open');
  try {
    await deleteDoc(doc(db, COL, deleteId));
    toast('Producto eliminado', 'success');
  } catch (err) {
    toast('Error al eliminar: ' + (err.message || ''), 'error');
  }
  deleteId = null;
}

/* ─── Upload de imagen a Base64 ─────────────────────────── */
function initUpload() {
  const input    = $('imagenFile');
  const area     = $('uploadArea');
  const preview  = $('uploadPreview');
  const previewImg = $('previewImg');
  const progress = $('uploadProgress');

  input.addEventListener('change', handleFile);
  $('removeImg').addEventListener('click', () => {
    resetUpload();
    currentFotoBase64 = null;
    $('fotoActual').value = '';
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
    if (file.size > 2 * 1024 * 1024) {
      toast('La imagen no puede superar 2 MB', 'error');
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast('Formato no soportado. Usá JPG, PNG o WebP.', 'error');
      return;
    }
    progress.classList.add('show');
    $('progressFill').style.width = '30%';
    $('progressText').textContent = 'Procesando…';

    const reader = new FileReader();
    reader.onload = (e) => {
      /* Comprimir la imagen con canvas antes de guardar */
      compressImage(e.target.result, 1200, 0.85).then(compressed => {
        currentFotoBase64 = compressed;
        previewImg.src = compressed;
        preview.style.display = 'inline-block';
        area.style.display    = 'none';
        $('progressFill').style.width = '100%';
        $('progressText').textContent = '✅ Imagen lista';
        setTimeout(() => progress.classList.remove('show'), 800);
      }).catch(err => {
        console.error('Error comprimiendo:', err);
        /* Si falla la compresión, guardar la imagen tal cual */
        currentFotoBase64 = e.target.result;
        previewImg.src = e.target.result;
        preview.style.display = 'inline-block';
        area.style.display    = 'none';
        progress.classList.remove('show');
      });
    };
    reader.onerror = () => {
      toast('Error al leer el archivo', 'error');
      progress.classList.remove('show');
    };
    reader.readAsDataURL(file);
  }
}

/* Comprime una imagen dataURL a un tamaño max en bytes */
function compressImage(dataUrl, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      /* Escalar manteniendo aspect ratio */
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((maxSize / width) * height);
          width = maxSize;
        } else {
          width = Math.round((maxSize / height) * width);
          height = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = dataUrl;
  });
}

function resetUpload() {
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
  editingId = null;
  currentFotoBase64 = null;
}

function setBtnLoading(on) {
  $('btnGuardar').disabled             = on;
  $('btnGuardarText').style.display    = on ? 'none' : 'block';
  $('btnGuardarSpinner').style.display = on ? 'block' : 'none';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
