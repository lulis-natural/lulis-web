/* ═══════════════════════════════════════════════════════════
   LULIS Admin — ventas.js (v3 — Gestión Comercial y Financiera)
   - Parseo exacto en Bolivianos (sin ceros adelante)
   - Sanitización contra undefined para addDoc
   - Estructura normalizada según Modelo_datos_y_reportes_Lulis.xlsx
   - Trazabilidad de costo histórico y cálculo de márgenes
   - Soporte multi-producto por venta_id
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  collection, doc, setDoc, writeBatch,
  getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot,
  query, where, orderBy, limit,
  serverTimestamp, Timestamp
} from './firebase-init.js';

import { exportarXLSX, descargarPlantillaVentas, toast } from './xlsx-helper.js';

const COL_VENTAS    = 'ventas';
const COL_PROD      = 'productos';
const COL_IMPACTO   = 'impacto';
const CACHE_KEY     = 'lulis_ventas_cache_v2';

const $ = (id) => document.getElementById(id);

let allVentas     = [];   // datos crudos desde Firestore
let allProductos  = [];   // catálogo para autocompletar líneas
let filteredVentas = [];
let editingId     = null;
let deleteId      = null;
let lineas        = [];   // líneas de la venta en edición

/* ── Formateadores ─────────────────────────────────────── */
export function parsePrice(val) {
  if (val == null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let s = String(val).trim();
  s = s.replace(/^[bB][sS]\.?\s*/, '').replace(/\s*[bB][sS]\.?$/, '').trim();
  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

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

function generateVentaId(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const r = Math.floor(100 + Math.random() * 900);
  return `VTA-${y}${m}${day}-${r}`;
}

function sanitizeForFirestore(obj) {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  if (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Timestamp)) {
    const clean = {};
    for (const k in obj) {
      clean[k] = obj[k] !== undefined ? sanitizeForFirestore(obj[k]) : null;
    }
    return clean;
  }
  return obj;
}

/* ── Init ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('logoutBtn')?.addEventListener('click', signOut);
  $('btnNueva')?.addEventListener('click', openModalNew);
  $('btnExportar')?.addEventListener('click', exportarExcel);
  $('btnImportar')?.addEventListener('click', openImportModal);
  $('modalClose')?.addEventListener('click', closeModal);
  $('btnCancelar')?.addEventListener('click', closeModal);
  $('btnGuardar')?.addEventListener('click', guardarVenta);
  $('btnAddLinea')?.addEventListener('click', addLinea);
  $('btnLimpiarFiltros')?.addEventListener('click', limpiarFiltros);
  $('confirmCancel')?.addEventListener('click', () => $('confirmOverlay')?.classList.remove('open'));
  $('confirmDelete')?.addEventListener('click', ejecutarBorrado);

  // Filtros interactivos
  ['fDesde', 'fHasta', 'fCanal', 'fEstado', 'fBuscar'].forEach(id => {
    $(id)?.addEventListener('input', aplicarFiltros);
    $(id)?.addEventListener('change', aplicarFiltros);
  });

  initFechasFiltro();
  subscribeProductos();
  subscribeVentas();
});

function initFechasFiltro() {
  const hoy = new Date();
  const hace30d = new Date();
  hace30d.setDate(hoy.getDate() - 30);
  if ($('fDesde')) $('fDesde').value = fmtDateInput(hace30d);
  if ($('fHasta')) $('fHasta').value = fmtDateInput(hoy);
}

/* ── Suscripción a productos (para armar líneas) ────────── */
function subscribeProductos() {
  onSnapshot(collection(db, COL_PROD), (snap) => {
    allProductos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const select = $('addLineaProducto');
    if (select) {
      select.innerHTML = '<option value="">Seleccionar producto…</option>' +
        allProductos
          .filter(p => p.disponible !== false)
          .sort((a, b) => (a.orden || 99) - (b.orden || 99))
          .map(p => {
            const precioReal = parsePrice(p.precio);
            return `<option value="${p.id}">${escapeHtml(p.nombre)} - ${escapeHtml(p.size || p.gramos || '50g')} (${fmtBs(precioReal)})</option>`;
          })
          .join('');
    }
  }, (err) => {
    console.warn('[ventas] Error cargando productos:', err);
  });
}

/* ── Suscripción a ventas ──────────────────────────────── */
function subscribeVentas() {
  // Carga inmediata de cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      allVentas = JSON.parse(cached);
      aplicarFiltros();
      $('ventasLoading').style.display = 'none';
    }
  } catch (e) {}

  onSnapshot(collection(db, COL_VENTAS), (snap) => {
    allVentas = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha || 0);
        const db = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha || 0);
        return db - da;
      });

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(allVentas));
    } catch (e) {}

    $('ventasLoading').style.display = 'none';
    aplicarFiltros();
  }, (err) => {
    console.warn('[ventas] Error en snapshot:', err);
    $('ventasLoading').style.display = 'none';
    if (!allVentas.length) {
      $('ventasEmpty').style.display = 'block';
    }
  });
}

/* ── Filtros ───────────────────────────────────────────── */
function aplicarFiltros() {
  const desdeStr = $('fDesde')?.value;
  const hastaStr = $('fHasta')?.value;
  const canal    = ($('fCanal')?.value || '').toLowerCase().trim();
  const estado   = ($('fEstado')?.value || '').toLowerCase().trim();
  const buscar   = ($('fBuscar')?.value || '').toLowerCase().trim();

  const desde = desdeStr ? new Date(desdeStr + 'T00:00:00') : null;
  const hasta = hastaStr ? new Date(hastaStr + 'T23:59:59') : null;

  filteredVentas = allVentas.filter(v => {
    const f = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
    if (desde && f < desde) return false;
    if (hasta && f > hasta) return false;
    if (canal && (v.canal || '').toLowerCase() !== canal) return false;
    if (estado && (v.estado || '').toLowerCase() !== estado) return false;
    if (buscar) {
      const vid = (v.venta_id || v.id || '').toLowerCase();
      const cli = (v.cliente || '').toLowerCase();
      const prods = (v.lineas || []).map(l => (l.producto || l.nombre || '').toLowerCase()).join(' ');
      if (!vid.includes(buscar) && !cli.includes(buscar) && !prods.includes(buscar)) return false;
    }
    return true;
  });

  renderResumen(filteredVentas);
  renderTable(filteredVentas);
}

function limpiarFiltros() {
  initFechasFiltro();
  if ($('fCanal')) $('fCanal').value = '';
  if ($('fEstado')) $('fEstado').value = '';
  if ($('fBuscar')) $('fBuscar').value = '';
  aplicarFiltros();
}

/* ── Resumen superior ──────────────────────────────────── */
function renderResumen(ventas) {
  const conteo   = ventas.length;
  const unidades = ventas.reduce((s, v) => s + (v.lineas || []).reduce((sl, l) => sl + (Number(l.cantidad) || 0), 0), 0);
  const total    = ventas.reduce((s, v) => s + (parsePrice(v.total) || 0), 0);
  const ticket   = conteo ? Math.round(total / conteo) : 0;

  if ($('r-conteo')) $('r-conteo').textContent = conteo;
  if ($('r-conteo-sub')) $('r-conteo-sub').textContent = conteo === 1 ? '1 venta' : `${conteo} ventas`;
  if ($('r-unidades')) $('r-unidades').textContent = unidades;
  if ($('r-total')) $('r-total').textContent = fmtBs(total);
  if ($('r-ticket')) $('r-ticket').textContent = fmtBs(ticket);
}

/* ── Render tabla ──────────────────────────────────────── */
function renderTable(ventas) {
  const body = $('ventasBody');
  if (!body) return;

  if (!ventas.length) {
    body.innerHTML = '<div style="padding:40px;text-align:center;color:var(--mid)">No hay ventas que coincidan con los filtros</div>';
    return;
  }

  const editIcon = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const delIcon  = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

  body.innerHTML = ventas.map(v => {
    const prodsStr = (v.lineas || []).map(l => {
      const cant = Number(l.cantidad) || 1;
      const nom = l.producto || l.nombre || 'Producto';
      return `${cant}x ${escapeHtml(nom)}`;
    }).join(', ');

    const vId = v.venta_id || v.id.substring(0, 10).toUpperCase();
    const canal = v.canal || 'WhatsApp';
    const medioPago = v.medio_pago || 'QR';
    const estado = v.estado || 'Pagada';
    const totalBs = parsePrice(v.total);

    const isPagada = estado.toLowerCase().includes('pagad') || estado.toLowerCase().includes('entregad');
    const badgeColor = isPagada ? '#04664A' : (estado.toLowerCase().includes('canc') ? '#DC2626' : '#92400E');
    const badgeBg = isPagada ? '#D1FAE5' : (estado.toLowerCase().includes('canc') ? '#FEE2E2' : '#FEF3C7');

    return `
    <div class="ventas-row">
      <div><strong style="color:var(--wine);font-size:0.82rem;font-family:monospace">${escapeHtml(vId)}</strong></div>
      <div style="font-size:0.85rem">${fmtDate(v.fecha)}</div>
      <div style="font-weight:600;font-size:0.88rem">${escapeHtml(v.cliente || 'Consumidor final')}</div>
      <div style="font-size:0.82rem;color:var(--dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escapeHtml(prodsStr)}">${escapeHtml(prodsStr) || '—'}</div>
      <div><span style="display:inline-block;padding:3px 8px;border-radius:20px;font-size:0.75rem;background:#F5F0E8;font-weight:600">${escapeHtml(canal)}</span></div>
      <div><span style="display:inline-block;padding:3px 8px;border-radius:20px;font-size:0.75rem;background:#EBF5FF;color:#1E40AF;font-weight:600">${escapeHtml(medioPago)}</span></div>
      <div><span style="display:inline-block;padding:3px 8px;border-radius:20px;font-size:0.75rem;background:${badgeBg};color:${badgeColor};font-weight:700">${escapeHtml(estado)}</span></div>
      <div><strong style="color:var(--wine);font-size:0.95rem">${fmtBs(totalBs)}</strong></div>
      <div style="text-align:right">
        <button class="btn btn-outline btn-sm btn-icon" onclick="window.editarVenta('${v.id}')" title="Editar">${editIcon}</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="window.confirmarBorrado('${v.id}')" title="Eliminar">${delIcon}</button>
      </div>
    </div>`;
  }).join('');
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ── Modal nuevo / editar ──────────────────────────────── */
function openModalNew() {
  editingId = null;
  lineas = [];
  if ($('modalTitle')) $('modalTitle').textContent = 'Nueva venta';
  if ($('ventaId')) $('ventaId').value = '';
  if ($('vVentaId')) $('vVentaId').value = generateVentaId();
  if ($('vFecha')) $('vFecha').value = fmtDateInput(new Date());
  if ($('vCliente')) $('vCliente').value = '';
  if ($('vCanal')) $('vCanal').value = 'WhatsApp';
  if ($('vMedioPago')) $('vMedioPago').value = 'QR';
  if ($('vEstado')) $('vEstado').value = 'Pagada';
  if ($('vDescuento')) $('vDescuento').value = 0;
  if ($('vNotas')) $('vNotas').value = '';
  renderLineas();
  updateTotalPreview();
  const modal = $('modalOverlay');
  if (modal) modal.classList.add('open');
}
window.openModalNew = openModalNew;

window.editarVenta = function(id) {
  const v = allVentas.find(x => x.id === id);
  if (!v) return;

  editingId = id;
  $('modalTitle').textContent = 'Editar venta';
  $('ventaId').value = id;
  $('vVentaId').value = v.venta_id || id.substring(0, 10).toUpperCase();

  const d = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
  $('vFecha').value = fmtDateInput(d);
  $('vCliente').value = v.cliente || '';
  $('vCanal').value = v.canal || 'WhatsApp';
  if ($('vMedioPago')) $('vMedioPago').value = v.medio_pago || 'QR';
  $('vEstado').value = v.estado || 'Pagada';
  $('vDescuento').value = v.descuento || 0;
  $('vNotas').value = v.notas || '';

  // Líneas normalizadas
  lineas = (v.lineas || []).map(l => {
    const pU = parsePrice(l.precio_unitario_bs != null ? l.precio_unitario_bs : l.precio);
    const cU = parsePrice(l.costo_unitario_historico_bs != null ? l.costo_unitario_historico_bs : l.costo);
    const cant = Number(l.cantidad) || 1;
    return {
      productoId: l.productoId || '',
      producto_sku: l.producto_sku || 'PROD-01',
      producto: l.producto || l.nombre || 'Producto',
      categoria: l.categoria || l.tipo || 'shampoo',
      cantidad: cant,
      precio_unitario_bs: pU,
      costo_unitario_historico_bs: cU || (pU * 0.38),
      subtotal_linea_bs: pU * cant,
      descuento_linea_bs: Number(l.descuento_linea_bs) || 0,
      total_linea_bs: (pU * cant) - (Number(l.descuento_linea_bs) || 0),
      costo_total_linea_bs: (cU || (pU * 0.38)) * cant,
      margen_bruto_linea_bs: ((pU * cant) - (Number(l.descuento_linea_bs) || 0)) - ((cU || (pU * 0.38)) * cant),
      // Props de vista
      nombre: l.producto || l.nombre || 'Producto',
      precio: pU
    };
  });

  renderLineas();
  updateTotalPreview();
  $('modalOverlay').classList.add('open');
};

function closeModal() {
  $('modalOverlay')?.classList.remove('open');
  editingId = null;
}

/* ── Gestión de líneas ─────────────────────────────────── */
function addLinea() {
  const prodId = $('addLineaProducto').value;
  const cant   = parseInt($('addLineaCantidad').value) || 1;
  if (!prodId) { toast('Selecciona un producto', 'error'); return; }
  if (cant < 1) { toast('La cantidad debe ser ≥ 1', 'error'); return; }
  const p = allProductos.find(x => x.id === prodId);
  if (!p) { toast('Producto no encontrado', 'error'); return; }

  const pUnit = parsePrice(p.precio) || 35;
  const cUnit = parsePrice(p.costo) || (pUnit * 0.38);
  const sku = p.sku || (p.categoria ? `${p.categoria.toUpperCase().slice(0,3)}-${p.nombre.toUpperCase().slice(0,3)}-50` : 'PROD-01');

  const existing = lineas.find(l => l.productoId === prodId);
  if (existing) {
    existing.cantidad += cant;
    existing.subtotal_linea_bs = existing.cantidad * existing.precio_unitario_bs;
    existing.total_linea_bs = existing.subtotal_linea_bs - (existing.descuento_linea_bs || 0);
    existing.costo_total_linea_bs = existing.cantidad * existing.costo_unitario_historico_bs;
    existing.margen_bruto_linea_bs = existing.total_linea_bs - existing.costo_total_linea_bs;
  } else {
    lineas.push({
      productoId: p.id,
      producto_sku: sku,
      producto: p.nombre,
      categoria: p.categoria || p.tipo || 'shampoo',
      cantidad: cant,
      precio_unitario_bs: pUnit,
      costo_unitario_historico_bs: cUnit,
      subtotal_linea_bs: pUnit * cant,
      descuento_linea_bs: 0,
      total_linea_bs: pUnit * cant,
      costo_total_linea_bs: cUnit * cant,
      margen_bruto_linea_bs: (pUnit * cant) - (cUnit * cant),
      // Vista
      nombre: p.nombre,
      precio: pUnit
    });
  }

  $('addLineaProducto').value = '';
  $('addLineaCantidad').value = 1;
  renderLineas();
  updateTotalPreview();
}

function removeLinea(idx) {
  lineas.splice(idx, 1);
  renderLineas();
  updateTotalPreview();
}

function updateLineaCantidad(idx, cant) {
  if (cant < 1) cant = 1;
  lineas[idx].cantidad = cant;
  lineas[idx].subtotal_linea_bs = cant * lineas[idx].precio_unitario_bs;
  lineas[idx].total_linea_bs = lineas[idx].subtotal_linea_bs - (lineas[idx].descuento_linea_bs || 0);
  lineas[idx].costo_total_linea_bs = cant * lineas[idx].costo_unitario_historico_bs;
  lineas[idx].margen_bruto_linea_bs = lineas[idx].total_linea_bs - lineas[idx].costo_total_linea_bs;
  renderLineas();
  updateTotalPreview();
}

function renderLineas() {
  const list = $('lineasList');
  if (!list) return;
  if (!lineas.length) {
    list.innerHTML = '<li style="background:transparent;border:1px dashed var(--beige);color:var(--mid);justify-content:center;padding:12px">Sin productos — agrega al menos uno</li>';
    return;
  }
  list.innerHTML = lineas.map((l, i) => `
    <li style="display:flex;align-items:center;gap:12px;padding:8px 12px;background:#fff;border-radius:8px;margin-bottom:6px;border:1px solid var(--beige)">
      <div class="linea-nombre" style="flex:1">
        <strong>${escapeHtml(l.producto || l.nombre)}</strong>
        <div class="linea-precio" style="font-size:0.8rem;color:var(--mid)">${fmtBs(l.precio_unitario_bs || l.precio)} c/u</div>
      </div>
      <input type="number" class="linea-qty" min="1" step="1" value="${l.cantidad}"
             style="width:65px;padding:4px 8px;border:1px solid var(--beige);border-radius:6px;text-align:center"
             onchange="window.updateLineaCantidad(${i}, parseInt(this.value))">
      <span class="linea-precio" style="min-width:85px;text-align:right"><strong>${fmtBs((l.precio_unitario_bs || l.precio) * l.cantidad)}</strong></span>
      <button type="button" class="linea-del" onclick="window.removeLinea(${i})" title="Quitar" style="background:none;border:none;color:#DC2626;cursor:pointer;padding:4px">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </li>
  `).join('');
}

window.removeLinea = removeLinea;
window.updateLineaCantidad = updateLineaCantidad;

function updateTotalPreview() {
  const subtotal = lineas.reduce((s, l) => s + ((l.precio_unitario_bs || l.precio) * l.cantidad), 0);
  const desc = parsePrice($('vDescuento')?.value) || 0;
  const total = Math.max(0, subtotal - desc);
  if ($('vTotalPreview')) $('vTotalPreview').textContent = fmtBs(total);
}

$('vDescuento')?.addEventListener('input', updateTotalPreview);

/* ── Guardar venta ────────────────────────────────────── */
async function guardarVenta() {
  if (!lineas.length) {
    toast('Agrega al menos un producto', 'error');
    return;
  }
  const fechaStr = $('vFecha').value;
  if (!fechaStr) {
    toast('La fecha es obligatoria', 'error');
    return;
  }

  setBtnLoading(true);
  try {
    const fecha = new Date(fechaStr + 'T12:00:00');
    const subtotal = lineas.reduce((s, l) => s + ((l.precio_unitario_bs || l.precio) * l.cantidad), 0);
    const descuento = parsePrice($('vDescuento').value) || 0;
    const total = Math.max(0, subtotal - descuento);
    const costoTotal = lineas.reduce((s, l) => s + ((l.costo_unitario_historico_bs || 0) * l.cantidad), 0);
    const margenBruto = total - costoTotal;

    const ventaIdVal = $('vVentaId')?.value.trim() || generateVentaId(fecha);

    // Distribuir descuento proporcional en cada línea
    const cleanLineas = lineas.map(l => {
      const pU = parsePrice(l.precio_unitario_bs || l.precio);
      const cU = parsePrice(l.costo_unitario_historico_bs || (pU * 0.38));
      const cant = Number(l.cantidad) || 1;
      const subL = pU * cant;
      const descProp = subtotal > 0 ? (subL / subtotal) * descuento : 0;
      const totL = subL - descProp;
      const costL = cU * cant;
      return {
        productoId: l.productoId || '',
        producto_sku: l.producto_sku || 'PROD-01',
        producto: l.producto || l.nombre || 'Producto',
        categoria: l.categoria || l.tipo || 'shampoo',
        cantidad: cant,
        precio_unitario_bs: pU,
        costo_unitario_historico_bs: cU,
        subtotal_linea_bs: subL,
        descuento_linea_bs: Math.round(descProp * 100) / 100,
        total_linea_bs: Math.round(totL * 100) / 100,
        costo_total_linea_bs: Math.round(costL * 100) / 100,
        margen_bruto_linea_bs: Math.round((totL - costL) * 100) / 100,
        nombre: l.producto || l.nombre || 'Producto',
        tipo: l.categoria || l.tipo || 'shampoo',
        tamano: l.tamano || 50,
        precio: pU
      };
    });

    const rawData = {
      venta_id:             ventaIdVal,
      fecha:                Timestamp.fromDate(fecha),
      cliente:              $('vCliente').value.trim() || 'Consumidor final',
      canal:                $('vCanal').value || 'WhatsApp',
      medio_pago:           $('vMedioPago')?.value || 'QR',
      estado:               $('vEstado').value || 'Pagada',
      lineas:               cleanLineas,
      subtotal:             subtotal,
      descuento:            descuento,
      total:                total,
      costo_total_historico: costoTotal,
      margen_bruto_total:   margenBruto,
      notas:                $('vNotas').value.trim() || '',
      actualizadoEn:        serverTimestamp()
    };

    const cleanData = sanitizeForFirestore(rawData);

    if (editingId) {
      await updateDoc(doc(db, COL_VENTAS, editingId), cleanData);
      toast('Venta actualizada ✅', 'success');
    } else {
      cleanData.creadoEn = serverTimestamp();
      await addDoc(collection(db, COL_VENTAS), cleanData);
      toast('Venta registrada ✅', 'success');
    }

    await recalcularImpacto();
    closeModal();
  } catch (err) {
    console.error('[guardarVenta error]', err);
    toast('Error: ' + (err.message || ''), 'error');
  } finally {
    setBtnLoading(false);
  }
}

function setBtnLoading(on) {
  if ($('btnGuardar')) $('btnGuardar').disabled = on;
  if ($('btnGuardarText')) $('btnGuardarText').style.display = on ? 'none' : 'block';
  if ($('btnGuardarSpinner')) $('btnGuardarSpinner').style.display = on ? 'block' : 'none';
}

/* ── Borrado ───────────────────────────────────────────── */
window.confirmarBorrado = function(id) {
  deleteId = id;
  $('confirmOverlay')?.classList.add('open');
};

async function ejecutarBorrado() {
  $('confirmOverlay')?.classList.remove('open');
  if (!deleteId) return;
  try {
    await deleteDoc(doc(db, COL_VENTAS, deleteId));
    toast('Venta eliminada', 'success');
    await recalcularImpacto();
  } catch (err) {
    toast('Error: ' + (err.message || ''), 'error');
  }
  deleteId = null;
}

/* ── Recalcular impacto ambiental ──────────────────────── */
async function recalcularImpacto() {
  try {
    const snap = await getDocs(collection(db, COL_VENTAS));
    let totalUnidades = 0;
    let totalBotellas = 0;
    let totalMonto    = 0;
    const desglose = { shampoo50: 0, shampoo100: 0, acond50: 0, pack: 0, manteca: 0 };

    snap.forEach(docSnap => {
      const v = docSnap.data();
      const st = (v.estado || '').toLowerCase();
      if (st.includes('canc')) return; // ignorar canceladas

      (v.lineas || []).forEach(l => {
        const cant = Number(l.cantidad) || 0;
        const tipo = (l.categoria || l.tipo || '').toLowerCase();
        const nom = (l.producto || l.nombre || '').toLowerCase();
        totalUnidades += cant;

        if (tipo.includes('shampoo') || nom.includes('shampoo')) {
          totalBotellas += cant * 3;
          desglose.shampoo50 += cant;
        } else if (tipo.includes('acond') || nom.includes('acond')) {
          totalBotellas += cant * 2;
          desglose.acond50 += cant;
        } else if (tipo.includes('pack') || nom.includes('pack') || nom.includes('dúo')) {
          totalBotellas += cant * 5;
          desglose.pack += cant;
        } else if (tipo.includes('manteca') || nom.includes('manteca')) {
          totalBotellas += cant * 2;
          desglose.manteca += cant;
        } else {
          totalBotellas += cant * 2;
        }
      });
      totalMonto += parsePrice(v.total);
    });

    const plasticoKg = (totalBotellas * 0.025); // 25g por botella plástica evitada
    const aguaLitros = totalUnidades * 120;     // 120L de agua ahorrada por formulación anhidra

    await setDoc(doc(db, COL_IMPACTO, 'metricas'), {
      botellasAhorradas: Math.round(totalBotellas),
      plasticoEvitadoKg: Math.round(plasticoKg * 10) / 10,
      aguaAhorradaL:     Math.round(aguaLitros),
      barrasVendidas:    totalUnidades,
      totalVentasBs:     Math.round(totalMonto),
      actualizadoEn:     serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn('[impacto] Error recalculando:', e);
  }
}

/* ── Exportar a Excel según Modelo_datos_y_reportes_Lulis ─ */
function exportarExcel() {
  if (!filteredVentas.length) {
    toast('No hay ventas para exportar', 'error');
    return;
  }

  // 1 fila por producto vendido con las 17 columnas exactas del modelo
  const headers = [
    'fecha',
    'venta_id',
    'producto_sku',
    'producto',
    'categoria',
    'cantidad',
    'precio_unitario_bs',
    'subtotal_linea_bs',
    'descuento_linea_bs',
    'total_linea_bs',
    'costo_unitario_historico_bs',
    'costo_total_linea_bs',
    'margen_bruto_linea_bs',
    'canal',
    'medio_pago',
    'estado',
    'notas'
  ];

  const rows = [];
  filteredVentas.forEach(v => {
    const fStr = fmtDate(v.fecha);
    const vId = v.venta_id || v.id.substring(0, 10).toUpperCase();
    const canal = v.canal || 'WhatsApp';
    const medioPago = v.medio_pago || 'QR';
    const estado = v.estado || 'Pagada';
    const notas = v.notas || '';

    (v.lineas || []).forEach(l => {
      const pU = parsePrice(l.precio_unitario_bs != null ? l.precio_unitario_bs : l.precio);
      const cU = parsePrice(l.costo_unitario_historico_bs != null ? l.costo_unitario_historico_bs : l.costo);
      const cant = Number(l.cantidad) || 1;
      const subL = Number(l.subtotal_linea_bs != null ? l.subtotal_linea_bs : (pU * cant));
      const descL = Number(l.descuento_linea_bs != null ? l.descuento_linea_bs : 0);
      const totL = Number(l.total_linea_bs != null ? l.total_linea_bs : (subL - descL));
      const costL = Number(l.costo_total_linea_bs != null ? l.costo_total_linea_bs : (cU * cant));
      const margL = Number(l.margen_bruto_linea_bs != null ? l.margen_bruto_linea_bs : (totL - costL));

      rows.push([
        fStr,
        vId,
        l.producto_sku || 'PROD-01',
        l.producto || l.nombre || 'Producto',
        l.categoria || l.tipo || 'shampoo',
        cant,
        pU,
        subL,
        descL,
        totL,
        cU,
        costL,
        margL,
        canal,
        medioPago,
        estado,
        notas
      ]);
    });
  });

  exportarXLSX({
    filename: 'LULIS-Registro-Ventas',
    title: 'LULIS | REGISTRO DETALLADO DE VENTAS',
    subtitle: 'Datos transaccionales exportados — Una fila por producto vendido',
    sheets: [{
      name: 'VENTAS',
      headers: headers,
      data: rows
    }]
  });
}

function openImportModal() {
  toast('Para importar masivamente, usa la plantilla Excel del sistema', '');
}
