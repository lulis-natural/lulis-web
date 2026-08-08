/* ═══════════════════════════════════════════════════════════
   LULIS Admin — ventas.js
   Registro profesional de ventas.
   - CRUD de ventas
   - Suscripción a productos para listar
   - Filtros por fecha/canal/estado
   - Resumen de período (conteo, unidades, total, ticket promedio)
   - Exportar a CSV
   - Recalcular impacto_ambiental/acumulado en cada cambio
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  collection, doc, setDoc,
  getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot,
  query, where, orderBy, limit,
  serverTimestamp, Timestamp
} from './firebase-init.js';

const COL_VENTAS = 'ventas';
const COL_PROD   = 'productos';
const COL_IMP    = 'impacto_ambiental';
const DOC_IMP    = 'acumulado';
const $ = (id) => document.getElementById(id);

let allVentas   = [];
let allProductos = [];
let editingId   = null;
let deleteId    = null;
let lineas      = [];   // líneas de la venta en edición

const fmtBs   = (n) => 'Bs ' + (n || 0).toLocaleString('es-BO', { minimumFractionDigits: 0 });
const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtDateISO = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().slice(0, 10);
};

/* ── Toast ──────────────────────────────────────────────── */
function toast(msg, type = '') {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3500);
}

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('logoutBtn')?.addEventListener('click', signOut);
  $('btnNueva')?.addEventListener('click', openModalNew);
  $('btnExportar')?.addEventListener('click', exportarCSV);
  $('modalClose')?.addEventListener('click', closeModal);
  $('btnCancelar')?.addEventListener('click', closeModal);
  $('btnGuardar')?.addEventListener('click', guardarVenta);
  $('btnAddLinea')?.addEventListener('click', addLinea);
  $('btnLimpiarFiltros')?.addEventListener('click', limpiarFiltros);
  $('confirmCancel')?.addEventListener('click', () => $('confirmOverlay')?.classList.remove('open'));
  $('confirmDelete')?.addEventListener('click', ejecutarBorrado);
  $('vDescuento')?.addEventListener('input', updateTotalPreview);

  // Filtros
  ['fDesde', 'fHasta', 'fCanal', 'fEstado'].forEach(id => {
    $(id)?.addEventListener('change', applyFilters);
    $(id)?.addEventListener('input', applyFilters);
  });

  // Default fechas: últimos 6 meses
  const hoy = new Date();
  const hace6 = new Date();
  hace6.setMonth(hace6.getMonth() - 6);
  $('fHasta').value = hoy.toISOString().slice(0, 10);
  $('fDesde').value = hace6.toISOString().slice(0, 10);

  subscribeProductos();
  subscribeVentas();
});

/* ── Suscripciones ────────────────────────────────────── */
function subscribeProductos() {
  onSnapshot(collection(db, COL_PROD), (snap) => {
    allProductos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Actualizar select del modal
    const sel = $('addLineaProducto');
    if (sel) {
      sel.innerHTML = '<option value="">Seleccionar producto…</option>' +
        allProductos
          .filter(p => p.disponible !== false)
          .sort((a, b) => (a.orden || 99) - (b.orden || 99))
          .map(p => `<option value="${p.id}">${escapeHtml(p.nombre)} — ${escapeHtml(p.gramos || '')} (${escapeHtml(p.precio || '')})</option>`)
          .join('');
    }
  }, (err) => {
    console.warn('[productos]', err.code, err.message);
  });
}

function subscribeVentas() {
  onSnapshot(collection(db, COL_VENTAS), (snap) => {
    allVentas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    applyFilters();
    $('ventasLoading').style.display = 'none';
  }, (err) => {
    console.warn('[ventas]', err.code, err.message);
    $('ventasLoading').style.display = 'none';
    $('ventasEmpty').style.display = 'block';
    $('ventasEmpty').innerHTML = `
      <h3>Sin permisos para leer ventas</h3>
      <p>Las reglas de Firestore bloquean el acceso.</p>`;
  });
}

/* ── Filtros ───────────────────────────────────────────── */
function applyFilters() {
  const desde  = $('fDesde')?.value;
  const hasta  = $('fHasta')?.value;
  const canal  = $('fCanal')?.value;
  const estado = $('fEstado')?.value;

  const filtered = allVentas.filter(v => {
    const fecha = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
    if (desde && fecha < new Date(desde)) return false;
    if (hasta && fecha > new Date(hasta + 'T23:59:59')) return false;
    if (canal && v.canal !== canal) return false;
    if (estado && v.estado !== estado) return false;
    return true;
  });

  renderTable(filtered);
  renderResumen(filtered);
}

function limpiarFiltros() {
  const hoy = new Date();
  const hace6 = new Date();
  hace6.setMonth(hace6.getMonth() - 6);
  $('fDesde').value = hace6.toISOString().slice(0, 10);
  $('fHasta').value = hoy.toISOString().slice(0, 10);
  $('fCanal').value = '';
  $('fEstado').value = '';
  applyFilters();
}

/* ── Render ────────────────────────────────────────────── */
function renderResumen(ventas) {
  const conteo    = ventas.length;
  const unidades  = ventas.reduce((s, v) => s + (v.lineas || []).reduce((a, l) => a + (l.cantidad || 0), 0), 0);
  const total     = ventas.reduce((s, v) => s + (v.total || 0), 0);
  const ticket    = conteo > 0 ? total / conteo : 0;

  $('r-conteo').textContent     = conteo;
  $('r-conteo-sub').textContent = conteo === 1 ? '1 venta' : `${conteo} ventas`;
  $('r-unidades').textContent   = unidades;
  $('r-total').textContent      = fmtBs(total);
  $('r-ticket').textContent     = fmtBs(ticket);
}

function renderTable(ventas) {
  const body = $('ventasBody');
  if (!ventas.length) {
    body.innerHTML = '';
    $('ventasEmpty').style.display = 'block';
    $('ventasTable').style.display = 'none';
    return;
  }
  $('ventasEmpty').style.display = 'none';
  $('ventasTable').style.display = 'block';

  // Ordenar por fecha desc
  const sorted = [...ventas].sort((a, b) => {
    const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha || 0);
    const db = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha || 0);
    return db - da;
  });

  const editIcon = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const delIcon  = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>`;

  body.innerHTML = sorted.map(v => {
    const fecha = fmtDate(v.fecha);
    const lineasTxt = (v.lineas || []).map(l => `${l.cantidad}× ${l.nombre}`).join(', ');
    const totalUnd = (v.lineas || []).reduce((s, l) => s + (l.cantidad || 0), 0);
    return `
    <div class="ventas-row">
      <div>${fecha}</div>
      <div>${escapeHtml(v.cliente || 'Consumidor final')}</div>
      <div title="${escapeAttr(lineasTxt)}">
        <strong>${totalUnd} und</strong>
        <div style="color:var(--mid);font-size:.78rem;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(lineasTxt)}</div>
      </div>
      <div><span class="canal-badge canal-${v.canal || 'otro'}">${v.canal || '—'}</span></div>
      <div><span class="estado-badge estado-${v.estado || 'pendiente'}">${v.estado || '—'}</span></div>
      <div><strong>${fmtBs(v.total)}</strong></div>
      <div style="text-align:right">
        <button class="btn btn-outline btn-sm btn-icon" onclick="editarVenta('${v.id}')" title="Editar">${editIcon}</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="confirmarBorrado('${v.id}')" title="Eliminar">${delIcon}</button>
      </div>
    </div>`;
  }).join('');
}

/* ── Modal: nueva venta ────────────────────────────────── */
function openModalNew() {
  editingId = null;
  lineas = [];
  $('ventaId').value = '';
  $('modalTitle').textContent = 'Nueva venta';
  $('vFecha').value = new Date().toISOString().slice(0, 10);
  $('vCliente').value = '';
  $('vCanal').value = 'whatsapp';
  $('vEstado').value = 'entregado';
  $('vDescuento').value = 0;
  $('vNotas').value = '';
  renderLineas();
  updateTotalPreview();
  $('modalOverlay').classList.add('open');
}

/* ── Modal: editar venta ───────────────────────────────── */
window.editarVenta = function(id) {
  const v = allVentas.find(x => x.id === id);
  if (!v) return;
  editingId = id;
  lineas = JSON.parse(JSON.stringify(v.lineas || []));
  $('ventaId').value = id;
  $('modalTitle').textContent = 'Editar venta';
  $('vFecha').value = fmtDateISO(v.fecha);
  $('vCliente').value = v.cliente || '';
  $('vCanal').value = v.canal || 'whatsapp';
  $('vEstado').value = v.estado || 'entregado';
  $('vDescuento').value = v.descuento || 0;
  $('vNotas').value = v.notas || '';
  renderLineas();
  updateTotalPreview();
  $('modalOverlay').classList.add('open');
};

function closeModal() {
  $('modalOverlay').classList.remove('open');
  editingId = null;
  lineas = [];
}

/* ── Gestión de líneas ─────────────────────────────────── */
function addLinea() {
  const prodId = $('addLineaProducto').value;
  const cant   = parseInt($('addLineaCantidad').value) || 1;
  if (!prodId) { toast('Selecciona un producto', 'error'); return; }
  if (cant < 1) { toast('La cantidad debe ser ≥ 1', 'error'); return; }
  const p = allProductos.find(x => x.id === prodId);
  if (!p) { toast('Producto no encontrado', 'error'); return; }

  // Verificar si ya está en la lista (sumar cantidad)
  const existing = lineas.find(l => l.productoId === prodId);
  if (existing) {
    existing.cantidad += cant;
  } else {
    lineas.push({
      productoId: p.id,
      nombre:     p.nombre,
      tipo:       p.tipo,
      tamano:     parseInt((p.gramos || '0').replace(/\D/g, '')) || 0,
      precio:     parseFloat((p.precio || '0').replace(/[^0-9.]/g, '')) || 0,
      cantidad:   cant
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
  renderLineas();
  updateTotalPreview();
}

function renderLineas() {
  const list = $('lineasList');
  if (!list) return;
  if (!lineas.length) {
    list.innerHTML = '<li style="background:transparent;border:1px dashed var(--beige);color:var(--mid);justify-content:center">Sin productos — agrega al menos uno</li>';
    return;
  }
  list.innerHTML = lineas.map((l, i) => `
    <li>
      <div class="linea-nombre">
        <strong>${escapeHtml(l.nombre)}</strong>
        <div class="linea-precio">${fmtBs(l.precio)} c/u</div>
      </div>
      <input type="number" class="linea-qty" min="1" step="1" value="${l.cantidad}"
             onchange="window.updateLineaCantidad(${i}, parseInt(this.value))">
      <span class="linea-precio"><strong>${fmtBs(l.precio * l.cantidad)}</strong></span>
      <button type="button" class="linea-del" onclick="window.removeLinea(${i})" title="Quitar">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y1="18"/><line x1="6" y1="6" x2="18" y1="18"/></svg>
      </button>
    </li>
  `).join('');
}

window.removeLinea = removeLinea;
window.updateLineaCantidad = updateLineaCantidad;

function updateTotalPreview() {
  const subtotal = lineas.reduce((s, l) => s + (l.precio * l.cantidad), 0);
  const desc = parseFloat($('vDescuento')?.value) || 0;
  const total = Math.max(0, subtotal - desc);
  $('vTotalPreview').textContent = fmtBs(total);
}

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
    const subtotal = lineas.reduce((s, l) => s + (l.precio * l.cantidad), 0);
    const descuento = parseFloat($('vDescuento').value) || 0;
    const total = Math.max(0, subtotal - descuento);

    const data = {
      fecha:        Timestamp.fromDate(fecha),
      cliente:      $('vCliente').value.trim() || null,
      canal:        $('vCanal').value,
      estado:       $('vEstado').value,
      lineas:       lineas,
      subtotal:     subtotal,
      descuento:    descuento,
      total:        total,
      notas:        $('vNotas').value.trim() || null,
      actualizadoEn: serverTimestamp()
    };

    if (editingId) {
      await updateDoc(doc(db, COL_VENTAS, editingId), data);
      toast('Venta actualizada ✅', 'success');
    } else {
      data.creadoEn = serverTimestamp();
      await addDoc(collection(db, COL_VENTAS), data);
      toast('Venta registrada ✅', 'success');
    }

    // Recalcular impacto acumulado
    await recalcularImpacto();

    closeModal();
  } catch (err) {
    console.error(err);
    toast('Error: ' + (err.message || ''), 'error');
  } finally {
    setBtnLoading(false);
  }
}

function setBtnLoading(on) {
  $('btnGuardar').disabled             = on;
  $('btnGuardarText').style.display    = on ? 'none' : 'block';
  $('btnGuardarSpinner').style.display = on ? 'block' : 'none';
}

/* ── Borrar venta ─────────────────────────────────────── */
window.confirmarBorrado = function(id) {
  deleteId = id;
  $('confirmOverlay').classList.add('open');
};

async function ejecutarBorrado() {
  $('confirmOverlay').classList.remove('open');
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

/* ── Recalcular impacto acumulado ──────────────────────── */
async function recalcularImpacto() {
  try {
    const snap = await getDocs(collection(db, COL_VENTAS));
    let totalUnidades = 0;
    let totalBotellas = 0;
    let totalMonto    = 0;
    const desglose = { shampoo50: 0, shampoo100: 0, acond50: 0, pack: 0 };
    const ventasEntregadas = [];

    snap.docs.forEach(d => {
      const v = d.data();
      if (v.estado === 'cancelado') return;
      ventasEntregadas.push(v);
      totalMonto += (v.total || 0);
      (v.lineas || []).forEach(l => {
        const cant = l.cantidad || 0;
        totalUnidades += cant;
        totalBotellas += botellasDeLinea(l);
        if (l.tipo === 'shampoo' && l.tamano === 50)  desglose.shampoo50  += cant;
        else if (l.tipo === 'shampoo' && l.tamano === 100) desglose.shampoo100 += cant;
        else if (l.tipo === 'acondicionador')             desglose.acond50    += cant;
        else if (l.tipo === 'pack')                       desglose.pack       += cant;
      });
    });

    const agua      = totalBotellas * 0.300 * 0.70;
    const plastico  = totalBotellas * 0.020;

    await setDoc(doc(db, COL_IMP, DOC_IMP), {
      ventasTotales:        totalUnidades,
      botellasReemplazadas: Math.round(totalBotellas * 10) / 10,
      litrosAguaEvitados:   Math.round(agua * 10) / 10,
      kgPlasticoEvitado:    Math.round(plastico * 100) / 100,
      totalVentasMonto:     totalMonto,
      totalVentasConteo:    ventasEntregadas.length,
      ventas: {
        shampoos50g:  desglose.shampoo50,
        shampoos100g: desglose.shampoo100,
        acond50g:     desglose.acond50,
        packs:        desglose.pack
      },
      actualizadoEn:         serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Error recalculando impacto:', err.message);
  }
}

function botellasDeLinea(l) {
  /* Fórmulas del motor de impacto (mismas que impacto-engine.js) */
  if (l.tipo === 'shampoo') {
    return l.tamano === 100 ? 2.0 * l.cantidad : 1.0 * l.cantidad;
  } else if (l.tipo === 'pack') {
    return 2.0 * l.cantidad;
  } else if (l.tipo === 'acondicionador') {
    return 0.75 * l.cantidad;
  }
  return 0;
}

/* ── Exportar CSV ──────────────────────────────────────── */
function exportarCSV() {
  if (!allVentas.length) {
    toast('No hay ventas para exportar', 'error');
    return;
  }
  const filtered = getFilteredVentas();
  if (!filtered.length) {
    toast('No hay ventas en el período seleccionado', 'error');
    return;
  }
  // Construir CSV
  const headers = ['Fecha', 'Cliente', 'Canal', 'Estado', 'Total (Bs)', 'Descuento (Bs)', 'Subtotal (Bs)', 'Notas'];
  const lines = filtered.map(v => {
    const fecha = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
    return [
      fecha.toLocaleDateString('es-BO'),
      v.cliente || 'Consumidor final',
      v.canal,
      v.estado,
      v.total || 0,
      v.descuento || 0,
      v.subtotal || 0,
      (v.notas || '').replace(/"/g, '""')
    ].map(c => `"${c}"`).join(',');
  });

  // CSV detalle de líneas
  const detalleHeaders = ['Fecha', 'Cliente', 'Canal', 'Estado', 'Producto', 'Tamaño (g)', 'Precio (Bs)', 'Cantidad', 'Subtotal línea (Bs)'];
  const detalleLines = [];
  filtered.forEach(v => {
    const fecha = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
    const fechaStr = fecha.toLocaleDateString('es-BO');
    const cliente = v.cliente || 'Consumidor final';
    (v.lineas || []).forEach(l => {
      detalleLines.push([
        fechaStr, cliente, v.canal, v.estado,
        l.nombre, l.tamano || '', l.precio || 0, l.cantidad || 0,
        (l.precio || 0) * (l.cantidad || 0)
      ].map(c => `"${c}"`).join(','));
    });
  });

  // Resumen al inicio
  const totalUnidades = filtered.reduce((s, v) => s + (v.lineas || []).reduce((a, l) => a + (l.cantidad || 0), 0), 0);
  const totalMonto = filtered.reduce((s, v) => s + (v.total || 0), 0);
  const resumen = [
    ['LULIS — Reporte de Ventas'],
    ['Generado', new Date().toLocaleString('es-BO')],
    ['Período', `${$('fDesde').value || 'inicio'} — ${$('fHasta').value || 'hoy'}`],
    ['Total ventas', filtered.length],
    ['Unidades vendidas', totalUnidades],
    ['Ingreso total', `Bs ${totalMonto}`],
    [],
    ['─── VENTAS ───'],
    headers.join(','),
    ...lines,
    [],
    ['─── DETALLE POR PRODUCTO ───'],
    detalleHeaders.join(','),
    ...detalleLines
  ];

  const csv = '﻿' + resumen.map(l => Array.isArray(l) ? l.join(',') : l).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lulis-ventas-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('CSV exportado ✅', 'success');
}

function getFilteredVentas() {
  const desde  = $('fDesde')?.value;
  const hasta  = $('fHasta')?.value;
  const canal  = $('fCanal')?.value;
  const estado = $('fEstado')?.value;
  return allVentas.filter(v => {
    const fecha = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
    if (desde && fecha < new Date(desde)) return false;
    if (hasta && fecha > new Date(hasta + 'T23:59:59')) return false;
    if (canal && v.canal !== canal) return false;
    if (estado && v.estado !== estado) return false;
    return true;
  });
}

/* ── Helpers ───────────────────────────────────────────── */
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
