/* ═══════════════════════════════════════════════════════════
   LULIS Admin — productos.js (v10)
   CRUD completo de productos con Firestore + Storage + Semilla inicial.
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut, uploadFile, deleteFile,
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot,
  serverTimestamp
} from './firebase-init.js';

const COL = 'productos';
const LOCAL_STORAGE_KEY = 'lulis_productos_cache_v2';
const $ = (id) => document.getElementById(id);

let allProductos = [];
let editingId    = null;
let deleteId     = null;
let deleteImgUrl = null;
let selectedFile = null;

function toast(msg, type = '') {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  $('logoutBtn')?.addEventListener('click', signOut);
  $('btnNuevo')?.addEventListener('click', openModalNew);
  $('modalClose')?.addEventListener('click', closeModal);
  $('btnCancelar')?.addEventListener('click', closeModal);
  $('btnGuardar')?.addEventListener('click', guardarProducto);
  $('confirmCancel')?.addEventListener('click', () => $('confirmOverlay').classList.remove('open'));
  $('confirmDelete')?.addEventListener('click', ejecutarBorrado);
  $('searchInput')?.addEventListener('input', renderTable);
  $('filterCat')?.addEventListener('change', renderTable);
  $('filterDisp')?.addEventListener('change', renderTable);
  $('btnCargarSemilla')?.addEventListener('click', cargarSemillaInicial);

  initUpload();
  subscribeProductos();
});

/* ─── Suscripción en tiempo real ─────────────────────────── */
function subscribeProductos() {
  try {
    const q = query(collection(db, COL), orderBy('orden', 'asc'));
    onSnapshot(q, (snap) => {
      allProductos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      $('tableLoading').style.display = 'none';
      
      if (allProductos.length === 0) {
        // Si está vacía la colección en Firestore, cargar fallback local
        cargarFallbackLocal();
      } else {
        guardarEnCacheLocal(allProductos);
        renderTable();
      }
    }, (err) => {
      console.warn('[productos]', err.code, err.message);
      $('tableLoading').style.display = 'none';
      if (err.code === 'permission-denied') {
        $('rulesNotice').style.display = 'block';
      }
      cargarFallbackLocal();
    });
  } catch (e) {
    console.error('Error inicializando suscripción:', e);
    $('tableLoading').style.display = 'none';
    cargarFallbackLocal();
  }
}

async function cargarFallbackLocal() {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      allProductos = JSON.parse(cached);
    } else {
      const res = await fetch('../data/products.json');
      if (res.ok) {
        allProductos = await res.json();
      }
    }
  } catch (_) {}
  renderTable();
}

function guardarEnCacheLocal(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

/* ─── Render tabla ───────────────────────────────────────── */
function renderTable() {
  const search   = $('searchInput').value.toLowerCase().trim();
  const cat      = $('filterCat').value;
  const disp     = $('filterDisp').value;

  const filtered = allProductos.filter(p => {
    const nombre = (p.nombre || '').toLowerCase();
    const variante = (p.variante || '').toLowerCase();
    const matchSearch = !search || nombre.includes(search) || variante.includes(search);
    const matchCat    = !cat    || (p.categoria || '').toLowerCase() === cat.toLowerCase();
    const matchDisp   = disp === '' || String(p.disponible !== false) === disp;
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

  const editIcon = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const delIcon  = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
  const bottleIcon = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;

  tbody.innerHTML = filtered.map(p => {
    let catBadgeColor = 'badge-purple';
    if (p.categoria === 'shampoo') catBadgeColor = 'badge-wine';
    else if (p.categoria === 'acondicionador') catBadgeColor = 'badge-green';
    else if (p.categoria === 'pack') catBadgeColor = 'badge-orange';

    const tipos = Array.isArray(p.tipoCabello) ? p.tipoCabello.join(', ') : (p.tipoCabello || '—');

    return `
    <tr>
      <td>
        ${p.imagenUrl
          ? `<img class="product-thumb" src="${p.imagenUrl.startsWith('http') || p.imagenUrl.startsWith('/') ? p.imagenUrl : '../' + p.imagenUrl}" alt="${escapeHtml(p.nombre)}" onerror="this.onerror=null;this.src='../Imagenes/logos/LOGO.jpg'">`
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
      <td><span class="badge ${catBadgeColor}">${capitalize(p.categoria) || 'Shampoo'}</span></td>
      <td><strong>${escapeHtml(p.precio) || '—'}</strong></td>
      <td><small>${escapeHtml(tipos)}</small></td>
      <td>${p.badge ? `<span class="badge badge-wine">${escapeHtml(p.badge)}</span>` : '—'}</td>
      <td>
        <span class="badge ${p.disponible !== false ? 'badge-green' : 'badge-red'}">
          ${p.disponible !== false ? 'Disponible' : 'Sin stock'}
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
  $('modalTitle').textContent     = 'Nuevo producto';
  $('btnGuardarText').textContent = 'Guardar producto';
  $('productoForm').reset();
  $('productoId').value           = '';
  $('imagenUrlActual').value      = '';
  $('pDisponible').checked        = true;
  $('pDestacado').checked         = false;
  $('pOrden').value               = allProductos.length + 1;
  resetUpload();
  $('modalOverlay').classList.add('open');
}

/* ─── Modal editar ───────────────────────────────────────── */
window.editarProducto = function(id) {
  const p = allProductos.find(x => x.id === id);
  if (!p) return;

  editingId = id;
  $('modalTitle').textContent     = 'Editar producto';
  $('btnGuardarText').textContent = 'Actualizar producto';
  $('productoId').value           = id;
  $('imagenUrlActual').value      = p.imagenUrl || '';
  $('pNombre').value              = p.nombre || '';
  $('pVariante').value            = p.variante || '';
  $('pCategoria').value           = p.categoria || 'shampoo';
  $('pPrecio').value              = p.precio || '';
  $('pSize').value                = p.size || '50g';
  $('pDuracion').value            = p.duracion || '';
  $('pBadge').value               = p.badge || '';
  $('pTipoCabello').value         = Array.isArray(p.tipoCabello) ? p.tipoCabello.join(', ') : (p.tipoCabello || '');
  $('pOrden').value               = p.orden ?? '';
  $('pImgRuta').value             = p.imagenUrl && !p.imagenUrl.startsWith('data:') && !p.imagenUrl.startsWith('http') ? p.imagenUrl : '';
  $('pDescripcion').value         = p.descripcion || '';
  $('pDescLarga').value           = p.descripcionLarga || '';
  $('pIngredientes').value        = p.ingredientes || '';
  $('pModoUso').value             = p.modoUso || '';
  $('pDisponible').checked        = p.disponible !== false;
  $('pDestacado').checked         = !!p.destacado;

  if (p.imagenUrl) {
    const src = p.imagenUrl.startsWith('http') || p.imagenUrl.startsWith('/') || p.imagenUrl.startsWith('data:') ? p.imagenUrl : '../' + p.imagenUrl;
    $('previewImg').src = src;
    $('uploadPreview').style.display = 'inline-block';
    $('uploadArea').style.display    = 'none';
  } else {
    resetUpload();
  }

  $('modalOverlay').classList.add('open');
};

/* ─── Guardar / Actualizar ───────────────────────────────── */
async function guardarProducto() {
  const nombre      = $('pNombre').value.trim();
  const categoria   = $('pCategoria').value;
  const descripcion = $('pDescripcion').value.trim();

  if (!nombre || !categoria || !descripcion) {
    toast('Completa los campos requeridos (*)', 'error');
    return;
  }

  setBtnLoading(true);

  try {
    let imagenUrl = $('pImgRuta').value.trim() || $('imagenUrlActual').value;
    
    // Subir imagen si seleccionó archivo
    if (selectedFile) {
      try {
        const path = `productos/${Date.now()}_${selectedFile.name}`;
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
    }

    if (!imagenUrl) {
      imagenUrl = 'Imagenes/productos/Jamaica.jpg';
    }

    const data = {
      nombre,
      variante:         $('pVariante').value.trim(),
      categoria,
      precio:           $('pPrecio').value.trim() || '35 Bs.',
      size:             $('pSize').value.trim() || '50g',
      duracion:         $('pDuracion').value.trim() || '35–45 lavadas',
      badge:            $('pBadge').value || '',
      tipoCabello:      $('pTipoCabello').value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
      orden:            parseInt($('pOrden').value, 10) || (allProductos.length + 1),
      descripcion,
      descripcionLarga: $('pDescLarga').value.trim(),
      ingredientes:     $('pIngredientes').value.trim(),
      modoUso:          $('pModoUso').value.trim(),
      imagenUrl,
      disponible:       $('pDisponible').checked,
      destacado:        $('pDestacado').checked,
      slug:             slugify(nombre),
      actualizadoEn:    serverTimestamp ? serverTimestamp() : new Date().toISOString()
    };

    let savedToFirestore = false;
    try {
      if (editingId) {
        await updateDoc(doc(db, COL, editingId), data);
      } else {
        data.creadoEn = serverTimestamp ? serverTimestamp() : new Date().toISOString();
        const docRef = await addDoc(collection(db, COL), data);
        data.id = docRef.id;
      }
      savedToFirestore = true;
    } catch (dbErr) {
      console.warn('Error guardando en Firestore (se guardará en cache local):', dbErr);
    }

    // Actualizar también en el array local
    if (editingId) {
      const idx = allProductos.findIndex(x => x.id === editingId);
      if (idx !== -1) allProductos[idx] = { ...allProductos[idx], ...data };
      toast('Producto actualizado con éxito ✅', 'success');
    } else {
      data.id = data.id || `local-${Date.now()}`;
      allProductos.push(data);
      toast('Producto creado con éxito ✅', 'success');
    }

    guardarEnCacheLocal(allProductos);
    renderTable();
    closeModal();
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'error');
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
    try {
      if (deleteImgUrl && deleteImgUrl.startsWith('http')) {
        await deleteFile(deleteImgUrl);
      }
      await deleteDoc(doc(db, COL, deleteId));
    } catch (e) {
      console.warn('Eliminación en Firestore no disponible, actualizando localmente:', e);
    }

    allProductos = allProductos.filter(x => x.id !== deleteId);
    guardarEnCacheLocal(allProductos);
    renderTable();
    toast('Producto eliminado del catálogo', 'success');
  } catch (err) {
    toast('Error al eliminar: ' + err.message, 'error');
  }
  deleteId = deleteImgUrl = null;
}

/* ─── Cargar Semilla Inicial ─────────────────────────────── */
async function cargarSemillaInicial() {
  if (!confirm('¿Deseas restaurar los 8 productos originales en el catálogo? Esto garantizará que todos los productos estén disponibles.')) {
    return;
  }
  setBtnLoading(true);
  try {
    const res = await fetch('../data/products.json');
    if (!res.ok) throw new Error('No se pudo leer data/products.json');
    const seed = await res.json();

    let uploaded = 0;
    for (const p of seed) {
      try {
        const itemData = {
          ...p,
          actualizadoEn: serverTimestamp ? serverTimestamp() : new Date().toISOString()
        };
        await addDoc(collection(db, COL), itemData);
        uploaded++;
      } catch (e) {
        console.warn('Firestore omitido durante semilla:', e.message);
      }
    }

    allProductos = seed;
    guardarEnCacheLocal(allProductos);
    renderTable();
    toast(`Catálogo restaurado (${allProductos.length} productos) ✅`, 'success');
  } catch (err) {
    console.error(err);
    toast('Error restaurando catálogo: ' + err.message, 'error');
  } finally {
    setBtnLoading(false);
  }
}

/* ─── Upload Helpers ─────────────────────────────────────── */
function initUpload() {
  const input    = $('imagenFile');
  const area     = $('uploadArea');
  const preview  = $('uploadPreview');
  const previewImg = $('previewImg');
  const progress = $('uploadProgress');

  input.addEventListener('change', handleFile);
  $('removeImg')?.addEventListener('click', () => {
    resetUpload();
    $('imagenUrlActual').value = '';
    $('pImgRuta').value = '';
  });

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
  if ($('imagenFile')) $('imagenFile').value = '';
  if ($('uploadPreview')) $('uploadPreview').style.display = 'none';
  if ($('uploadArea')) $('uploadArea').style.display = 'block';
  if ($('uploadProgress')) $('uploadProgress').classList.remove('show');
  if ($('progressFill')) $('progressFill').style.width = '0%';
  if ($('progressText')) $('progressText').textContent = '0%';
}

function closeModal() {
  $('modalOverlay').classList.remove('open');
  editingId    = null;
  selectedFile = null;
}

function setBtnLoading(on) {
  if ($('btnGuardar')) $('btnGuardar').disabled = on;
  if ($('btnGuardarText')) $('btnGuardarText').style.display = on ? 'none' : 'block';
  if ($('btnGuardarSpinner')) $('btnGuardarSpinner').style.display = on ? 'block' : 'none';
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
