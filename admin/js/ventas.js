/* ═══════════════════════════════════════════════════════════
   LULIS Admin — ventas.js
   Registro profesional de ventas.
   - CRUD de ventas con líneas de productos
   - Filtros por fecha / canal / estado
   - Resumen de período (conteo, unidades, total, ticket promedio)
   - Exportar a Excel (.xlsx) con formato profesional (multi-hoja)
   - Importar ventas en masa desde .xlsx o .csv
   - Recalcular impacto_ambiental/acumulado en cada cambio
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  collection, doc, setDoc, writeBatch,
  getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot,
  query, where, orderBy, limit,
  serverTimestamp, Timestamp
} from './firebase-init.js';

import { exportarXLSX, importarXLSX, descargarPlantillaVentas, toast } from './xlsx-helper.js';

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
const parseFecha = (str) => {
  if (!str) return null;
  if (str instanceof Date) return str;
  const s = String(str).trim();
  // Acepta YYYY-MM-DD o DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s + 'T12:00:00');
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
    const [d, m, y] = s.split('/');
    return new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T12:00:00`);
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

/* ── Init ───────────────────────────────────────────────── */
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
  $('vDescuento')?.addEventListener('input', updateTotalPreview);

  // Import modal handlers
  initImportModal();

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
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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

/* ═══════════════════════════════════════════════════════════
   EXPORTAR A EXCEL — Multi-hoja con formato profesional
   ═══════════════════════════════════════════════════════════ */

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

function exportarExcel() {
  const filtered = getFilteredVentas();
  if (!filtered.length) {
    toast('No hay ventas en el período seleccionado', 'error');
    return;
  }

  const desde  = $('fDesde')?.value || 'inicio';
  const hasta  = $('fHasta')?.value || 'hoy';
  const canal  = $('fCanal')?.value || 'todos';
  const estado = $('fEstado')?.value || 'todos';

  /* ── Hoja 1: Resumen de ventas ── */
  const headersResumen = ['Fecha', 'Cliente', 'Canal', 'Estado', 'Subtotal (Bs)', 'Descuento (Bs)', 'Total (Bs)', 'Unidades', 'Notas'];
  const dataResumen = [...filtered]
    .sort((a, b) => {
      const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha || 0);
      const db2 = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha || 0);
      return db2 - da;
    })
    .map(v => {
      const f = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
      const totalUnd = (v.lineas || []).reduce((s, l) => s + (l.cantidad || 0), 0);
      return [
        f.toISOString().slice(0, 10),
        v.cliente || 'Consumidor final',
        v.canal || '',
        v.estado || '',
        Number(v.subtotal || 0),
        Number(v.descuento || 0),
        Number(v.total || 0),
        totalUnd,
        v.notas || ''
      ];
    });

  const totalUnidades = filtered.reduce((s, v) => s + (v.lineas || []).reduce((a, l) => a + (l.cantidad || 0), 0), 0);
  const totalMonto    = filtered.reduce((s, v) => s + (v.total || 0), 0);
  const totalSubtotal = filtered.reduce((s, v) => s + (v.subtotal || 0), 0);
  const totalDesc     = filtered.reduce((s, v) => s + (v.descuento || 0), 0);
  const totalsResumen = [
    'TOTAL',
    `${filtered.length} ventas`,
    '',
    '',
    Math.round(totalSubtotal * 100) / 100,
    Math.round(totalDesc * 100) / 100,
    Math.round(totalMonto * 100) / 100,
    totalUnidades,
    ''
  ];

  /* ── Hoja 2: Detalle por línea ── */
  const headersDetalle = ['Fecha', 'Cliente', 'Canal', 'Estado', 'Producto', 'Tipo', 'Tamaño (g)', 'Precio unitario (Bs)', 'Cantidad', 'Subtotal línea (Bs)'];
  const dataDetalle = [];
  filtered.forEach(v => {
    const f = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
    const fechaStr = f.toISOString().slice(0, 10);
    const cliente = v.cliente || 'Consumidor final';
    (v.lineas || []).forEach(l => {
      dataDetalle.push([
        fechaStr,
        cliente,
        v.canal || '',
        v.estado || '',
        l.nombre || '',
        l.tipo || '',
        l.tamano || '',
        Number(l.precio || 0),
        Number(l.cantidad || 0),
        Math.round((Number(l.precio || 0) * Number(l.cantidad || 0)) * 100) / 100
      ]);
    });
  });
  const totalLineasCant = dataDetalle.reduce((s, r) => s + r[8], 0);
  const totalLineasSub  = dataDetalle.reduce((s, r) => s + r[9], 0);
  const totalsDetalle = [
    'TOTAL', '', '', '', `${dataDetalle.length} líneas`, '', '',
    '',
    totalLineasCant,
    Math.round(totalLineasSub * 100) / 100
  ];

  /* ── Hoja 3: Resumen por producto ── */
  const counts = {};
  filtered.forEach(v => {
    (v.lineas || []).forEach(l => {
      if (!l.productoId) return;
      if (!counts[l.productoId]) {
        counts[l.productoId] = { nombre: l.nombre, tipo: l.tipo, tamano: l.tamano, cantidad: 0, ingresos: 0, ventas: 0 };
      }
      counts[l.productoId].cantidad += Number(l.cantidad || 0);
      counts[l.productoId].ingresos  += Number(l.precio || 0) * Number(l.cantidad || 0);
      counts[l.productoId].ventas    += 1;
    });
  });
  const listProd = Object.values(counts).sort((a, b) => b.cantidad - a.cantidad);
  const headersProd = ['Producto', 'Tipo', 'Tamaño (g)', 'Unidades vendidas', 'Ingreso (Bs)', 'N° ventas', 'Precio promedio (Bs)'];
  const dataProd = listProd.map(t => [
    t.nombre,
    t.tipo,
    t.tamano || '',
    t.cantidad,
    Math.round(t.ingresos * 100) / 100,
    t.ventas,
    t.cantidad > 0 ? Math.round((t.ingresos / t.cantidad) * 100) / 100 : 0
  ]);
  const totalsProd = [
    'TOTAL',
    `${listProd.length} productos`,
    '',
    listProd.reduce((s, t) => s + t.cantidad, 0),
    Math.round(listProd.reduce((s, t) => s + t.ingresos, 0) * 100) / 100,
    listProd.reduce((s, t) => s + t.ventas, 0),
    ''
  ];

  const filename = `lulis-ventas-${desde}_a_${hasta}.xlsx`.replace(/[^\w\-_.]/g, '_');
  try {
    const name = exportarXLSX({
      title: 'Reporte de Ventas — LULIS',
      subtitle: `Período: ${desde} a ${hasta} · Canal: ${canal} · Estado: ${estado}`,
      filename,
      sheets: [
        {
          name: 'Resumen',
          headers: headersResumen,
          data: dataResumen,
          totals: totalsResumen,
          meta: {
            'Total ventas': filtered.length,
            'Unidades vendidas': totalUnidades,
            'Ingreso total (Bs)': Math.round(totalMonto * 100) / 100,
            'Ticket promedio (Bs)': filtered.length > 0 ? Math.round((totalMonto / filtered.length) * 100) / 100 : 0
          }
        },
        {
          name: 'Detalle por línea',
          headers: headersDetalle,
          data: dataDetalle,
          totals: totalsDetalle,
          meta: { 'Total líneas': dataDetalle.length }
        },
        {
          name: 'Por producto',
          headers: headersProd,
          data: dataProd,
          totals: totalsProd,
          meta: { 'Productos distintos': listProd.length }
        }
      ]
    });
    toast(`${name} exportado ✅`, 'success');
  } catch (err) {
    console.error(err);
    toast('Error al exportar: ' + err.message, 'error');
  }
}

/* ═══════════════════════════════════════════════════════════
   IMPORTAR MASIVAMENTE — XLSX / CSV
   ═══════════════════════════════════════════════════════════ */

let importData = null;  // {headers, rows, data, sheetName}

function openImportModal() {
  importData = null;
  $('importPreviewWrap').style.display = 'none';
  $('importMode').style.display = 'none';
  $('importConfirm').disabled = true;
  $('importFile').value = '';
  $('importErrors').style.display = 'none';
  $('importCount').textContent = '0';
  $('importSummary').textContent = '';
  $('importPreview').innerHTML = '';
  $('importOverlay').classList.add('open');
}

function initImportModal() {
  $('importClose')?.addEventListener('click', () => $('importOverlay').classList.remove('open'));
  $('importCancel')?.addEventListener('click', () => $('importOverlay').classList.remove('open'));
  $('linkPlantilla')?.addEventListener('click', (e) => {
    e.preventDefault();
    try {
      descargarPlantillaVentas();
      toast('Plantilla descargada ✅', 'success');
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    }
  });
  $('importConfirm')?.addEventListener('click', ejecutarImportacion);

  // File input
  $('importFile')?.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) handleImportFile(f);
  });

  // Drag & drop
  const area = $('importArea');
  if (area) {
    area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('dragover'); });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.classList.remove('dragover');
      const f = e.dataTransfer.files[0];
      if (f) {
        $('importFile').files = e.dataTransfer.files;
        handleImportFile(f);
      }
    });
  }

  // Mode radios
  document.querySelectorAll('input[name="importMode"]').forEach(r => {
    r.addEventListener('change', (e) => {
      document.querySelectorAll('.import-mode label').forEach(l => l.classList.remove('checked'));
      e.target.closest('label').classList.add('checked');
    });
  });
  // Marcar el default
  const firstRadio = document.querySelector('input[name="importMode"]');
  if (firstRadio) firstRadio.closest('label').classList.add('checked');
}

async function handleImportFile(file) {
  if (file.size > 5 * 1024 * 1024) {
    toast('El archivo es muy grande (máx 5MB)', 'error');
    return;
  }
  try {
    const result = await importarXLSX(file);
    importData = result;
    renderImportPreview(result);
    $('importMode').style.display = 'flex';
    $('importConfirm').disabled = false;
  } catch (err) {
    console.error(err);
    toast('Error al leer el archivo: ' + err.message, 'error');
    importData = null;
    $('importPreviewWrap').style.display = 'none';
    $('importConfirm').disabled = true;
  }
}

function renderImportPreview(result) {
  const { headers, data } = result;
  $('importPreviewWrap').style.display = 'block';
  $('importCount').textContent = data.length;

  /* Validar y agrupar por (fecha + cliente + canal) → cada grupo = una venta */
  const errores = [];
  const grupos = {};  // key: `${fecha}|${cliente}|${canal}` → array de lineas
  let totalIngresos = 0;
  let totalUnidades = 0;

  data.forEach((row, idx) => {
    const fecha = parseFecha(row.fecha || row.Fecha || '');
    const cliente = (row.cliente || row.Cliente || '').trim() || 'Consumidor final';
    const canal = (row.canal || row.Canal || 'whatsapp').toLowerCase().trim();
    const estado = (row.estado || row.Estado || 'entregado').toLowerCase().trim();
    const prodNombre = (row.producto_nombre || row['producto nombre'] || row.Producto || '').trim();
    const prodTipo = (row.producto_tipo || row['producto tipo'] || '').toLowerCase().trim();
    const prodGramos = parseInt(row.producto_gramos || row['producto gramos'] || row.Gramos || '0') || 0;
    const cant = parseInt(row.cantidad || row.Cantidad || '0') || 0;
    const precio = parseFloat(String(row.precio_unitario || row['precio unitario'] || row.Precio || '0').replace(',', '.')) || 0;
    const descuento = parseFloat(String(row.descuento || row.Descuento || '0').replace(',', '.')) || 0;
    const notas = (row.notas || row.Notas || '').trim();

    const filaValida = fecha && prodNombre && cant > 0 && precio >= 0;
    if (!filaValida) {
      errores.push(`Fila ${idx + 2}: falta fecha, producto, cantidad o precio`);
      return;
    }
    if (!['whatsapp', 'instagram', 'tienda', 'feria', 'otro'].includes(canal)) {
      errores.push(`Fila ${idx + 2}: canal "${canal}" no es válido`);
      return;
    }
    if (!['entregado', 'confirmado', 'pendiente', 'cancelado'].includes(estado)) {
      errores.push(`Fila ${idx + 2}: estado "${estado}" no es válido`);
      return;
    }

    const key = `${fecha.toISOString().slice(0,10)}|${cliente}|${canal}|${estado}|${notas}|${descuento}`;
    if (!grupos[key]) {
      grupos[key] = { fecha, cliente, canal, estado, notas, descuento, lineas: [] };
    }
    grupos[key].lineas.push({
      nombre: prodNombre,
      tipo: prodTipo || 'shampoo',
      tamano: prodGramos,
      precio,
      cantidad: cant
    });
    totalIngresos += precio * cant;
    totalUnidades += cant;
  });

  const ventas = Object.values(grupos);

  $('importSummary').textContent = `${ventas.length} venta(s) · ${totalUnidades} unidades · ${fmtBs(totalIngresos)}`;

  /* Errores */
  const errBox = $('importErrors');
  if (errores.length) {
    errBox.style.display = 'block';
    errBox.innerHTML = `<strong>⚠️ ${errores.length} fila(s) con errores:</strong><ul style="margin:6px 0 0 18px;padding:0">${errores.slice(0, 10).map(e => `<li>${escapeHtml(e)}</li>`).join('')}${errores.length > 10 ? `<li>... y ${errores.length - 10} más</li>` : ''}</ul>`;
  } else {
    errBox.style.display = 'none';
  }

  /* Tabla preview (primeras 20 filas) */
  const preview = data.slice(0, 20);
  $('importPreview').innerHTML = `
    <table>
      <thead>
        <tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${preview.map(row => `
          <tr>
            ${headers.map(h => `<td>${escapeHtml(row[h] || '')}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${data.length > 20 ? `<p style="text-align:center;padding:8px;color:var(--mid);font-size:.78rem;margin:0">Mostrando 20 de ${data.length} filas</p>` : ''}
  `;

  /* Guardar ventas procesadas para la confirmación */
  importData.ventas = ventas;
  importData.errores = errores;
}

async function ejecutarImportacion() {
  if (!importData || !importData.ventas) {
    toast('No hay datos para importar', 'error');
    return;
  }
  const mode = document.querySelector('input[name="importMode"]:checked')?.value || 'append';

  setImportLoading(true);
  try {
    /* Modo replace: borrar todas las ventas existentes */
    if (mode === 'replace') {
      const snap = await getDocs(collection(db, COL_VENTAS));
      const batchSize = 400;
      let batch = writeBatch(db);
      let count = 0;
      const commits = [];
      for (const d of snap.docs) {
        batch.delete(d.ref);
        count++;
        if (count >= batchSize) {
          commits.push(batch.commit());
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) commits.push(batch.commit());
      await Promise.all(commits);
    }

    /* Insertar las nuevas ventas */
    let insertados = 0;
    const batchSize = 400;
    let batch = writeBatch(db);
    let count = 0;
    const commits = [];

    for (const v of importData.ventas) {
      const subtotal = v.lineas.reduce((s, l) => s + (l.precio * l.cantidad), 0);
      const descuento = v.descuento || 0;
      const total = Math.max(0, subtotal - descuento);
      const newRef = doc(collection(db, COL_VENTAS));
      batch.set(newRef, {
        fecha:        Timestamp.fromDate(v.fecha),
        cliente:      v.cliente || null,
        canal:        v.canal,
        estado:       v.estado,
        lineas:       v.lineas,
        subtotal:     subtotal,
        descuento:    descuento,
        total:        total,
        notas:        v.notas || null,
        creadoEn:     serverTimestamp(),
        actualizadoEn: serverTimestamp()
      });
      insertados++;
      count++;
      if (count >= batchSize) {
        commits.push(batch.commit());
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) commits.push(batch.commit());
    await Promise.all(commits);

    /* Recalcular impacto */
    await recalcularImpacto();

    toast(`✅ ${insertados} venta(s) importadas correctamente`, 'success');
    $('importOverlay').classList.remove('open');
  } catch (err) {
    console.error(err);
    toast('Error al importar: ' + err.message, 'error');
  } finally {
    setImportLoading(false);
  }
}

function setImportLoading(on) {
  $('importConfirm').disabled             = on;
  $('importConfirmText').textContent      = on ? 'Importando…' : 'Importar';
  $('importConfirmSpinner').style.display = on ? 'inline-block' : 'none';
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
