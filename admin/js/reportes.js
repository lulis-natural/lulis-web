/* ═══════════════════════════════════════════════════════════
   LULIS Admin — reportes.js
   Reportes con filtros avanzados y exportación a CSV.
   Tres tipos de export:
   - Resumen de ventas (1 fila por venta)
   - Detalle por línea de producto (1 fila por producto vendido)
   - Resumen por producto (1 fila por producto, agregado)
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  collection, onSnapshot
} from './firebase-init.js';

const $ = (id) => document.getElementById(id);

let allVentas    = [];
let allProductos = [];

const fmtBs  = (n) => 'Bs ' + (n || 0).toLocaleString('es-BO', { minimumFractionDigits: 0 });
const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const todayISO   = () => new Date().toISOString().slice(0, 10);
const addDays    = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const startOf    = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isoFrom    = (d) => d.toISOString().slice(0, 10);

/* ── Init ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('logoutBtn')?.addEventListener('click', signOut);
  $('btnExportar')?.addEventListener('click', () => exportarCSV('resumen'));
  $('btnExportarDetalle')?.addEventListener('click', () => exportarCSV('detalle'));
  $('btnExportarProductos')?.addEventListener('click', () => exportarCSV('productos'));

  // Filtros
  ['rPeriodo', 'rDesde', 'rHasta', 'rCanal', 'rEstado', 'rProducto'].forEach(id => {
    $(id)?.addEventListener('change', applyFilters);
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  // Default: últimos 6 meses
  applyPeriodo('ultimos_6');
  initDashboard();
});

function initDashboard() {
  const observer = new MutationObserver(() => {
    if (document.body.style.visibility === 'visible') {
      observer.disconnect();
      subscribeAll();
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
  setTimeout(subscribeAll, 600);
}

function subscribeAll() {
  onSnapshot(collection(db, 'ventas'), (snap) => {
    allVentas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    populateProductos();
    applyFilters();
  }, (err) => console.warn('[ventas]', err.message));

  onSnapshot(collection(db, 'productos'), (snap) => {
    allProductos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    populateProductos();
  }, (err) => console.warn('[productos]', err.message));
}

function populateProductos() {
  const sel = $('rProducto');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Todos</option>' +
    allProductos
      .sort((a, b) => (a.orden || 99) - (b.orden || 99))
      .map(p => `<option value="${p.id}">${escapeHtml(p.nombre)}</option>`)
      .join('');
  sel.value = current;
}

/* ── Período predefinido ───────────────────────────────── */
function applyPeriodo(value) {
  const hoy = new Date();
  let desde, hasta = hoy;
  switch (value) {
    case 'mes_actual':
      desde = startOf(hoy);
      break;
    case 'mes_pasado':
      desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      break;
    case 'ultimos_3':
      desde = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
      break;
    case 'ultimos_6':
      desde = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
      break;
    case 'anio_actual':
      desde = new Date(hoy.getFullYear(), 0, 1);
      break;
    case 'todo':
      desde = new Date(2020, 0, 1);
      break;
    case 'personalizado':
      return; // no modificar fechas
  }
  $('rDesde').value = isoFrom(desde);
  $('rHasta').value = isoFrom(hasta);
}

$('rPeriodo')?.addEventListener && null;

/* ── Filtros ──────────────────────────────────────────── */
function applyFilters() {
  const periodo = $('rPeriodo').value;
  if (periodo !== 'personalizado') applyPeriodo(periodo);

  const desde  = $('rDesde')?.value;
  const hasta  = $('rHasta')?.value;
  const canal  = $('rCanal')?.value;
  const estado = $('rEstado')?.value;
  const prod   = $('rProducto')?.value;

  const filtered = allVentas.filter(v => {
    if (estado && v.estado !== estado) return false;
    if (canal && v.canal !== canal) return false;
    const f = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
    if (desde && f < new Date(desde)) return false;
    if (hasta && f > new Date(hasta + 'T23:59:59')) return false;
    if (prod) {
      const tiene = (v.lineas || []).some(l => l.productoId === prod);
      if (!tiene) return false;
    }
    return true;
  });

  renderResumen(filtered);
  renderTopProductos(filtered);
  renderCanales(filtered);
}

function renderResumen(ventas) {
  const conteo    = ventas.length;
  const unidades  = ventas.reduce((s, v) => s + (v.lineas || []).reduce((a, l) => a + l.cantidad, 0), 0);
  const total     = ventas.reduce((s, v) => s + (v.total || 0), 0);
  const ticket    = conteo > 0 ? total / conteo : 0;

  $('prev-ventas').textContent   = conteo;
  $('prev-unidades').textContent = unidades;
  $('prev-ingreso').textContent  = fmtBs(total);
  $('prev-ticket').textContent   = fmtBs(ticket);
  $('ventasCount').textContent   = conteo + ' ventas';

  const sorted = [...ventas].sort((a, b) => {
    const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha || 0);
    const db = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha || 0);
    return db - da;
  });
  const body = $('ventasPreviewBody');
  if (!sorted.length) {
    body.innerHTML = `<tr><td colspan="6" class="preview-empty">No hay ventas en el período seleccionado</td></tr>`;
    return;
  }
  body.innerHTML = sorted.slice(0, 100).map(v => {
    const totalUnd = (v.lineas || []).reduce((s, l) => s + l.cantidad, 0);
    return `
      <tr>
        <td>${fmtDate(v.fecha)}</td>
        <td>${escapeHtml(v.cliente || 'Consumidor final')}</td>
        <td>${totalUnd} und</td>
        <td>${escapeHtml(v.canal || '—')}</td>
        <td>${escapeHtml(v.estado || '—')}</td>
        <td class="td-num td-strong">${fmtBs(v.total)}</td>
      </tr>`;
  }).join('');
}

function renderTopProductos(ventas) {
  const list = $('topProductosList');
  if (!list) return;
  const counts = {};
  ventas.forEach(v => {
    (v.lineas || []).forEach(l => {
      if (!l.productoId) return;
      if (!counts[l.productoId]) counts[l.productoId] = { nombre: l.nombre, cantidad: 0, ingresos: 0 };
      counts[l.productoId].cantidad += l.cantidad;
      counts[l.productoId].ingresos  += l.precio * l.cantidad;
    });
  });
  const top = Object.values(counts).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
  if (!top.length) {
    list.innerHTML = '<li><div class="preview-empty">Sin datos</div></li>';
    return;
  }
  list.innerHTML = top.map((t, i) => `
    <li>
      <div class="rank">${i + 1}</div>
      <div class="producto-info">
        <div class="producto-nombre">${escapeHtml(t.nombre)}</div>
        <div class="producto-stats">${t.cantidad} und · ${fmtBs(t.ingresos)}</div>
      </div>
      <div class="producto-total">${t.cantidad}</div>
    </li>`).join('');
}

function renderCanales(ventas) {
  const body = $('canalesBody');
  if (!body) return;
  const canales = ['whatsapp', 'instagram', 'tienda', 'feria', 'otro'];
  const label   = { whatsapp: 'WhatsApp', instagram: 'Instagram', tienda: 'Tienda', feria: 'Feria', otro: 'Otro' };
  const totales = ventas.reduce((acc, v) => {
    const c = v.canal || 'otro';
    if (!acc[c]) acc[c] = { count: 0, unidades: 0, ingreso: 0 };
    acc[c].count    += 1;
    acc[c].ingreso  += (v.total || 0);
    acc[c].unidades += (v.lineas || []).reduce((s, l) => s + l.cantidad, 0);
    return acc;
  }, {});
  const totalIngreso = ventas.reduce((s, v) => s + (v.total || 0), 0);
  if (!ventas.length) {
    body.innerHTML = `<tr><td colspan="5" class="preview-empty">Sin datos</td></tr>`;
    return;
  }
  body.innerHTML = canales.filter(c => totales[c]).map(c => {
    const t = totales[c];
    const pct = totalIngreso > 0 ? ((t.ingreso / totalIngreso) * 100).toFixed(1) : '0';
    return `
      <tr>
        <td>${label[c]}</td>
        <td class="td-num">${t.count}</td>
        <td class="td-num">${t.unidades}</td>
        <td class="td-num td-strong">${fmtBs(t.ingreso)}</td>
        <td class="td-num">${pct}%</td>
      </tr>`;
  }).join('');
}

/* ── Tabs ─────────────────────────────────────────────── */
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
}

/* ── Exportar CSV ─────────────────────────────────────── */
function getFilteredVentas() {
  const desde  = $('rDesde')?.value;
  const hasta  = $('rHasta')?.value;
  const canal  = $('rCanal')?.value;
  const estado = $('rEstado')?.value;
  const prod   = $('rProducto')?.value;

  return allVentas.filter(v => {
    if (estado && v.estado !== estado) return false;
    if (canal && v.canal !== canal) return false;
    const f = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
    if (desde && f < new Date(desde)) return false;
    if (hasta && f > new Date(hasta + 'T23:59:59')) return false;
    if (prod) {
      const tiene = (v.lineas || []).some(l => l.productoId === prod);
      if (!tiene) return false;
    }
    return true;
  });
}

function exportarCSV(tipo) {
  const ventas = getFilteredVentas();
  if (!ventas.length && tipo !== 'productos') {
    toast('No hay datos para exportar', 'error');
    return;
  }

  const desde = $('rDesde')?.value || 'inicio';
  const hasta = $('rHasta')?.value || 'hoy';
  const periodo = `${desde}_a_${hasta}`;
  const fecha = new Date().toISOString().slice(0, 10);

  let csv = '';
  let filename = '';

  if (tipo === 'resumen') {
    const headers = ['Fecha', 'Cliente', 'Canal', 'Estado', 'Subtotal (Bs)', 'Descuento (Bs)', 'Total (Bs)', 'Notas'];
    const lines = ventas.map(v => {
      const f = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
      return [
        f.toISOString().slice(0, 10),
        v.cliente || 'Consumidor final',
        v.canal || '',
        v.estado || '',
        v.subtotal || 0,
        v.descuento || 0,
        v.total || 0,
        (v.notas || '').replace(/"/g, '""')
      ].map(c => `"${c}"`).join(',');
    });
    csv = buildCsv('Reporte de Ventas — Resumen', [
      ['LULIS — Reporte de Ventas'],
      ['Generado', new Date().toLocaleString('es-BO')],
      ['Período', `${desde} — ${hasta}`],
      ['Ventas', ventas.length],
      ['Ingreso total', `Bs ${ventas.reduce((s, v) => s + (v.total || 0), 0)}`],
      [],
      headers.join(','),
      ...lines
    ]);
    filename = `lulis-ventas-${periodo}-${fecha}.csv`;
  } else if (tipo === 'detalle') {
    const headers = ['Fecha', 'Cliente', 'Canal', 'Estado', 'Producto', 'Tipo', 'Tamaño (g)', 'Precio unitario (Bs)', 'Cantidad', 'Subtotal línea (Bs)'];
    const lines = [];
    ventas.forEach(v => {
      const f = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
      const fechaStr = f.toISOString().slice(0, 10);
      const cliente = v.cliente || 'Consumidor final';
      (v.lineas || []).forEach(l => {
        lines.push([
          fechaStr, cliente, v.canal || '', v.estado || '',
          l.nombre || '', l.tipo || '', l.tamano || '',
          l.precio || 0, l.cantidad || 0,
          (l.precio || 0) * (l.cantidad || 0)
        ].map(c => `"${c}"`).join(','));
      });
    });
    csv = buildCsv('Reporte de Ventas — Detalle por línea', [
      ['LULIS — Reporte de Ventas (Detalle por línea)'],
      ['Generado', new Date().toLocaleString('es-BO')],
      ['Período', `${desde} — ${hasta}`],
      ['Líneas', lines.length],
      [],
      headers.join(','),
      ...lines
    ]);
    filename = `lulis-ventas-detalle-${periodo}-${fecha}.csv`;
  } else if (tipo === 'productos') {
    const counts = {};
    ventas.forEach(v => {
      (v.lineas || []).forEach(l => {
        if (!l.productoId) return;
        if (!counts[l.productoId]) {
          counts[l.productoId] = { nombre: l.nombre, tipo: l.tipo, tamano: l.tamano, cantidad: 0, ingresos: 0, ventas: 0 };
        }
        counts[l.productoId].cantidad += l.cantidad;
        counts[l.productoId].ingresos  += l.precio * l.cantidad;
        counts[l.productoId].ventas    += 1;
      });
    });
    const list = Object.values(counts).sort((a, b) => b.cantidad - a.cantidad);
    if (!list.length) {
      toast('No hay datos para exportar', 'error');
      return;
    }
    const headers = ['Producto', 'Tipo', 'Tamaño (g)', 'Unidades vendidas', 'Ingreso (Bs)', 'Veces vendido', 'Precio promedio (Bs)'];
    const lines = list.map(t => [
      t.nombre, t.tipo, t.tamano || '',
      t.cantidad, t.ingresos, t.ventas,
      t.cantidad > 0 ? (t.ingresos / t.cantidad).toFixed(2) : 0
    ].map(c => `"${c}"`).join(','));
    csv = buildCsv('Reporte de Ventas — Resumen por producto', [
      ['LULIS — Resumen por producto'],
      ['Generado', new Date().toLocaleString('es-BO')],
      ['Período', `${desde} — ${hasta}`],
      ['Productos', list.length],
      ['Total unidades', list.reduce((s, t) => s + t.cantidad, 0)],
      ['Total ingreso', `Bs ${list.reduce((s, t) => s + t.ingresos, 0)}`],
      [],
      headers.join(','),
      ...lines
    ]);
    filename = `lulis-productos-${periodo}-${fecha}.csv`;
  }

  // BOM para Excel reconozca UTF-8
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast(`${filename} exportado ✅`, 'success');
}

function buildCsv(titulo, rows) {
  return rows.map(r => Array.isArray(r) ? r.join(',') : r).join('\n');
}

/* ── Toast ────────────────────────────────────────────── */
function toast(msg, type = '') {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3500);
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
