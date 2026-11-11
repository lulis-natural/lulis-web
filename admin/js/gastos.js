/* ═══════════════════════════════════════════════════════════
   LULIS Admin — gastos.js (Gestión Administrativa y Financiera)
   - Registro de gastos fijos y variables
   - Cálculo automático para punto de equilibrio y estados financieros
   - Exportación Excel según Modelo_datos_y_reportes_Lulis.xlsx
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  onSnapshot,
  query, orderBy,
  serverTimestamp, Timestamp
} from './firebase-init.js';

import { toast } from './xlsx-helper.js';

const COL_GASTOS = 'gastos';
const CACHE_KEY  = 'lulis_gastos_cache_v1';

const $ = (id) => document.getElementById(id);

let allGastos      = [];
let filteredGastos = [];
let editingId      = null;
let deleteId       = null;

/* ── Formateadores ─────────────────────────────────────── */
const fmtBs = (n) => 'Bs ' + (Number(n) || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (ts) => {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtDateInput = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function generateGastoId(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const r = Math.floor(100 + Math.random() * 900);
  return `GAS-${y}${m}${day}-${r}`;
}

function sanitizeForFirestore(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Timestamp || obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)).filter(v => v !== undefined);
  }
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean;
}

/* ── DOM Ready ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initListeners();
  loadCachedGastos();
  subscribeGastos();
});

/* ── Sidebar ───────────────────────────────────────────── */
function initSidebar() {
  const sidebar = $('sidebar');
  const toggle  = $('sidebarToggle');
  const menuBtn = $('menuToggle');
  const logoutBtn = $('logoutBtn');

  toggle?.addEventListener('click', () => sidebar?.classList.toggle('collapsed'));
  menuBtn?.addEventListener('click', () => sidebar?.classList.toggle('open'));

  logoutBtn?.addEventListener('click', async () => {
    try {
      await signOut();
      window.location.href = '/admin/login';
    } catch (e) {
      toast('Error al cerrar sesión', 'error');
    }
  });
}

/* ── Eventos ───────────────────────────────────────────── */
function initListeners() {
  $('btnNuevoGasto')?.addEventListener('click', () => abrirModal());
  $('modalClose')?.addEventListener('click', cerrarModal);
  $('btnCancelar')?.addEventListener('click', cerrarModal);
  $('btnGuardar')?.addEventListener('click', guardarGasto);

  $('confirmCancel')?.addEventListener('click', () => {
    $('confirmOverlay').classList.remove('open');
    deleteId = null;
  });

  $('confirmDelete')?.addEventListener('click', ejecutarBorrado);

  // Filtros
  ['gBuscar', 'gDesde', 'gHasta', 'gTipo', 'gCat'].forEach(id => {
    $(id)?.addEventListener('input', aplicarFiltros);
    $(id)?.addEventListener('change', aplicarFiltros);
  });

  $('btnLimpiar')?.addEventListener('click', () => {
    if ($('gBuscar')) $('gBuscar').value = '';
    if ($('gDesde')) $('gDesde').value = '';
    if ($('gHasta')) $('gHasta').value = '';
    if ($('gTipo')) $('gTipo').value = '';
    if ($('gCat')) $('gCat').value = '';
    aplicarFiltros();
  });

  $('btnExportar')?.addEventListener('click', exportarGastosExcel);
}

/* ── Cache Local ───────────────────────────────────────── */
function loadCachedGastos() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allGastos = parsed;
        aplicarFiltros();
        $('gastosLoading').style.display = 'none';
      }
    }
  } catch (e) {
    console.warn('[Gastos] Cache corrupto:', e);
  }
}

function saveCache(data) {
  try {
    const serializable = data.map(g => ({
      ...g,
      fecha: g.fecha?.toDate ? g.fecha.toDate().toISOString() : g.fecha,
      createdAt: null,
      updatedAt: null
    }));
    localStorage.setItem(CACHE_KEY, JSON.stringify(serializable));
  } catch (e) {
    console.warn('[Gastos] Error guardando cache:', e);
  }
}

/* ── Firestore Listener ────────────────────────────────── */
function subscribeGastos() {
  const q = query(collection(db, COL_GASTOS), orderBy('fecha', 'desc'));

  onSnapshot(q, (snapshot) => {
    $('gastosLoading').style.display = 'none';
    allGastos = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    saveCache(allGastos);
    aplicarFiltros();
  }, (err) => {
    console.error('[Gastos] Error Firestore:', err);
    $('gastosLoading').style.display = 'none';
    toast('Error al sincronizar gastos: ' + err.message, 'error');
  });
}

/* ── Filtros y Render ──────────────────────────────────── */
function aplicarFiltros() {
  const qTexto = ($('gBuscar')?.value || '').toLowerCase().trim();
  const fDesde = $('gDesde')?.value ? new Date($('gDesde').value + 'T00:00:00') : null;
  const fHasta = $('gHasta')?.value ? new Date($('gHasta').value + 'T23:59:59') : null;
  const fTipo  = $('gTipo')?.value || '';
  const fCat   = $('gCat')?.value || '';

  filteredGastos = allGastos.filter(g => {
    // Fecha
    const d = g.fecha?.toDate ? g.fecha.toDate() : new Date(g.fecha);
    if (fDesde && d < fDesde) return false;
    if (fHasta && d > fHasta) return false;

    // Tipo
    if (fTipo && g.tipo_gasto !== fTipo) return false;

    // Categoría
    if (fCat && g.categoria_gasto !== fCat) return false;

    // Texto
    if (qTexto) {
      const matchId = (g.gasto_id || '').toLowerCase().includes(qTexto);
      const matchDesc = (g.descripcion || '').toLowerCase().includes(qTexto);
      const matchCat = (g.categoria_gasto || '').toLowerCase().includes(qTexto);
      const matchNotas = (g.notas || '').toLowerCase().includes(qTexto);
      if (!matchId && !matchDesc && !matchCat && !matchNotas) return false;
    }

    return true;
  });

  renderResumen();
  renderTabla();
}

/* ── KPIs Resumen ──────────────────────────────────────── */
function renderResumen() {
  let total = 0;
  let fijos = 0;
  let variables = 0;

  filteredGastos.forEach(g => {
    const imp = Number(g.importe_bs) || 0;
    total += imp;
    if (g.tipo_gasto === 'Fijo') {
      fijos += imp;
    } else {
      variables += imp;
    }
  });

  const pctFijos = total > 0 ? Math.round((fijos / total) * 100) : 0;
  const pctVar   = total > 0 ? (100 - pctFijos) : 0;

  if ($('r-gastos-total')) $('r-gastos-total').textContent = fmtBs(total);
  if ($('r-gastos-sub'))   $('r-gastos-sub').textContent   = `${filteredGastos.length} registros`;
  if ($('r-gastos-fijos')) $('r-gastos-fijos').textContent = fmtBs(fijos);
  if ($('r-gastos-var'))   $('r-gastos-var').textContent   = fmtBs(variables);
  if ($('r-gastos-ratio')) $('r-gastos-ratio').textContent = `${pctFijos}% / ${pctVar}%`;
}

/* ── Tabla ─────────────────────────────────────────────── */
function renderTabla() {
  const tbody = $('gastosBody');
  const empty = $('gastosEmpty');
  if (!tbody) return;

  if (filteredGastos.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  tbody.innerHTML = filteredGastos.map(g => {
    const isFijo = g.tipo_gasto === 'Fijo';
    const tipoBadge = isFijo
      ? `<span class="badge-fijo">Fijo</span>`
      : `<span class="badge-variable">Variable</span>`;

    return `
      <div class="gastos-row" data-id="${g.id}">
        <div style="font-weight:700;color:var(--wine)">${g.gasto_id || '-'}</div>
        <div>${fmtDate(g.fecha)}</div>
        <div><span class="badge-cat">${g.categoria_gasto || 'Otro'}</span></div>
        <div style="font-weight:500;color:#1F2937">${escapeHtml(g.descripcion || '-')}</div>
        <div>${tipoBadge}</div>
        <div style="font-weight:700;color:#DC2626">${fmtBs(g.importe_bs)}</div>
        <div style="font-size:0.8rem;color:#4B5563">${g.medio_pago || 'Efectivo'}</div>
        <div style="text-align:right;display:flex;gap:4px;justify-content:flex-end">
          <button class="btn-action-icon" data-action="edit" data-id="${g.id}" title="Editar gasto">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button class="btn-action-icon" data-action="delete" data-id="${g.id}" title="Eliminar gasto" style="color:#DC2626">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Listeners de acciones
  tbody.querySelectorAll('.btn-action-icon').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === 'edit') editarGasto(id);
      if (action === 'delete') confirmarBorrado(id);
    });
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

/* ── Modal Nuevo / Edición ─────────────────────────────── */
function abrirModal(gasto = null) {
  editingId = gasto ? gasto.id : null;

  if (gasto) {
    $('modalTitle').textContent = 'Editar gasto';
    $('gastoDocId').value = gasto.id;
    $('gIdDisplay').value = gasto.gasto_id || generateGastoId();
    
    const d = gasto.fecha?.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
    $('gFecha').value = !isNaN(d.getTime()) ? fmtDateInput(d) : fmtDateInput(new Date());

    $('gCategoriaGasto').value = gasto.categoria_gasto || 'Otro';
    $('gTipoGasto').value      = gasto.tipo_gasto || 'Fijo';
    $('gImporte').value        = Number(gasto.importe_bs) || 0;
    $('gMedioPago').value      = gasto.medio_pago || 'Transferencia';
    $('gDescripcion').value    = gasto.descripcion || '';
    $('gNotas').value          = gasto.notas || '';
  } else {
    $('modalTitle').textContent = 'Registrar gasto';
    $('gastoDocId').value = '';
    $('gIdDisplay').value = generateGastoId();
    $('gFecha').value = fmtDateInput(new Date());
    $('gCategoriaGasto').value = 'Alquiler';
    $('gTipoGasto').value      = 'Fijo';
    $('gImporte').value        = '';
    $('gMedioPago').value      = 'Transferencia';
    $('gDescripcion').value    = '';
    $('gNotas').value          = '';
  }

  $('modalOverlay').classList.add('open');
  setTimeout(() => $('gImporte')?.focus(), 100);
}

function cerrarModal() {
  $('modalOverlay').classList.remove('open');
  editingId = null;
}

function editarGasto(id) {
  const g = allGastos.find(item => item.id === id);
  if (!g) return toast('Gasto no encontrado', 'error');
  abrirModal(g);
}

function confirmarBorrado(id) {
  deleteId = id;
  $('confirmOverlay').classList.add('open');
}

async function ejecutarBorrado() {
  if (!deleteId) return;
  try {
    await deleteDoc(doc(db, COL_GASTOS, deleteId));
    toast('Gasto eliminado correctamente', 'success');
  } catch (e) {
    console.error('[Gastos] Error al eliminar:', e);
    toast('Error al eliminar: ' + e.message, 'error');
  } finally {
    $('confirmOverlay').classList.remove('open');
    deleteId = null;
  }
}

/* ── Guardar Gasto ─────────────────────────────────────── */
async function guardarGasto(e) {
  e.preventDefault();

  const fechaVal = $('gFecha').value;
  const categoria = $('gCategoriaGasto').value;
  const tipo      = $('gTipoGasto').value;
  const importe   = parseFloat($('gImporte').value);
  const desc      = $('gDescripcion').value.trim();
  const medioPago = $('gMedioPago').value;
  const notas     = $('gNotas').value.trim();
  const gastoId   = $('gIdDisplay').value || generateGastoId();

  if (!fechaVal) return toast('Selecciona la fecha del gasto', 'error');
  if (isNaN(importe) || importe <= 0) return toast('Ingresa un importe válido mayor a 0', 'error');
  if (!desc) return toast('Ingresa una descripción del gasto', 'error');

  const fechaDate = new Date(fechaVal + 'T12:00:00');
  const payload = sanitizeForFirestore({
    gasto_id: gastoId,
    fecha: Timestamp.fromDate(fechaDate),
    categoria_gasto: categoria,
    tipo_gasto: tipo,
    importe_bs: Math.round(importe * 100) / 100,
    medio_pago: medioPago,
    descripcion: desc,
    notas: notas || '',
    updatedAt: serverTimestamp()
  });

  const btnText = $('btnGuardarText');
  const btnSpin = $('btnGuardarSpinner');
  const btn     = $('btnGuardar');

  btn.disabled = true;
  btnText.style.display = 'none';
  btnSpin.style.display = 'inline-block';

  try {
    if (editingId) {
      await updateDoc(doc(db, COL_GASTOS, editingId), payload);
      toast('Gasto actualizado con éxito', 'success');
    } else {
      payload.createdAt = serverTimestamp();
      await addDoc(collection(db, COL_GASTOS), payload);
      toast('Gasto registrado con éxito', 'success');
    }
    cerrarModal();
  } catch (err) {
    console.error('[Gastos] Error guardando:', err);
    toast('Error al guardar gasto: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btnText.style.display = 'inline-block';
    btnSpin.style.display = 'none';
  }
}

/* ── Exportar a Excel ──────────────────────────────────── */
function exportarGastosExcel() {
  if (typeof XLSX === 'undefined') {
    return toast('Librería Excel cargando, por favor intenta en unos segundos', 'error');
  }

  if (filteredGastos.length === 0) {
    return toast('No hay gastos en el período para exportar', 'error');
  }

  const filas = filteredGastos.map(g => ({
    'ID Gasto': g.gasto_id || '',
    'Fecha': fmtDate(g.fecha),
    'Categoría': g.categoria_gasto || '',
    'Descripción': g.descripcion || '',
    'Tipo de Gasto': g.tipo_gasto || '',
    'Importe (Bs)': Number(g.importe_bs) || 0,
    'Medio de Pago': g.medio_pago || '',
    'Notas / Recibo': g.notas || ''
  }));

  const ws = XLSX.utils.json_to_sheet(filas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Gastos');

  const fechaStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `LULIS_Registro_Gastos_${fechaStr}.xlsx`);
  toast('Archivo Excel de gastos generado exitosamente', 'success');
}
