/* ═══════════════════════════════════════════════════════════
   LULIS Admin — dashboard.js
   Analítica profesional del panel de gestión.
   KPIs, tendencia 6 meses, top productos, ventas por canal.
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  collection, doc,
  onSnapshot
} from './firebase-init.js';

const $ = (id) => document.getElementById(id);

let allVentas    = [];
let allProductos = [];
let allGaleria   = [];
let allMensajes  = [];
let allDirs      = [];

const fmtBs    = (n) => 'Bs ' + (n || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtNum   = (n) => (n || 0).toLocaleString('es-BO');
const fmtDate  = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
};
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

/* ── Init ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('logoutBtn')?.addEventListener('click', signOut);
  initDashboard();
});

function initDashboard() {
  const observer = new MutationObserver(() => {
    if (document.body.style.visibility === 'visible') {
      observer.disconnect();
      loadAll();
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
  setTimeout(loadAll, 600);
}

let _loaded = false;
function loadAll() {
  if (_loaded) return;
  _loaded = true;
  subscribeVentas();
  subscribeProductos();
  subscribeGaleria();
  subscribeMensajes();
}

function safeSubscribe(name, buildCollection, onData) {
  try {
    return onSnapshot(buildCollection(),
      (snap) => onData(snap),
      (err) => {
        console.warn(`[${name}] ${err.code}: ${err.message}`);
        onData({ size: 0, docs: [], empty: true, forEach: () => {}, error: err });
      }
    );
  } catch (err) {
    console.warn(`[${name}] setup error:`, err.message);
    return () => {};
  }
}

function subscribeVentas() {
  safeSubscribe('ventas', () => collection(db, 'ventas'), (snap) => {
    if (!snap.error) {
      allVentas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      allVentas = [];
    }
    render();
  });
}

function subscribeProductos() {
  safeSubscribe('productos', () => collection(db, 'productos'), (snap) => {
    if (!snap.error) {
      allProductos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      allProductos = [];
    }
    render();
  });
}

function subscribeGaleria() {
  safeSubscribe('galeria', () => collection(db, 'galeria'), (snap) => {
    if (!snap.error) {
      allGaleria = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      allGaleria = [];
    }
    render();
  });
}

function subscribeMensajes() {
  safeSubscribe('mensajes', () => collection(db, 'mensajes'), (snap) => {
    if (!snap.error) {
      allMensajes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      allMensajes = [];
    }
    render();
  });
}

/* ── Render global ─────────────────────────────────────── */
let _rendering = false;
function render() {
  if (_rendering) return;
  _rendering = true;

  // Esperar a que todas las colecciones hayan cargado al menos una vez
  // (Para evitar mostrar el dashboard incompleto al principio)
  // Hacemos render optimista: cuando TODAS estén listas, mostramos
  if (allVentas.length || allProductos.length) {
    $('pageLoading').style.display = 'none';
    $('dashContent').style.display = 'block';
  }

  try {
    renderKPIs();
    renderTendencia();
    renderTopProductos();
    renderCanales();
    renderLastVentas();
    renderLastMensajes();
    renderSubtitle();
  } finally {
    _rendering = false;
  }
}

function renderSubtitle() {
  const last = allVentas.length ? getLastDate(allVentas) : null;
  if (last) {
    $('dashSubtitle').textContent = `Última venta: ${fmtDate(last)} · ${allVentas.length} ventas registradas`;
  } else {
    $('dashSubtitle').textContent = 'Aún no hay ventas registradas';
  }
}

function getLastDate(ventas) {
  const sorted = [...ventas].sort((a, b) => {
    const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha || 0);
    const db = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha || 0);
    return db - da;
  });
  if (!sorted.length) return null;
  const v = sorted[0];
  return v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
}

/* ── KPIs principales ──────────────────────────────────── */
function renderKPIs() {
  const ventasValidas = allVentas.filter(v => v.estado !== 'cancelado');
  const totalIngresos = ventasValidas.reduce((s, v) => s + (v.total || 0), 0);
  const totalUnidades = ventasValidas.reduce((s, v) => s + (v.lineas || []).reduce((a, l) => a + (l.cantidad || 0), 0), 0);

  // Calcular botellas reemplazadas
  const totalBotellas = ventasValidas.reduce((s, v) =>
    s + (v.lineas || []).reduce((a, l) => a + botellasDeLinea(l), 0), 0);
  const agua     = totalBotellas * 0.300 * 0.70;
  const plastico = totalBotellas * 0.020;

  // Ventas del mes
  const hoy = new Date();
  const inicioMes = startOfMonth(hoy);
  const ventasMes = ventasValidas.filter(v => {
    const f = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
    return f >= inicioMes;
  });
  const ingresosMes = ventasMes.reduce((s, v) => s + (v.total || 0), 0);

  $('kpi-ingresos').textContent     = fmtBs(totalIngresos);
  $('kpi-ingresos-sub').textContent = `Bs ${fmtNum(ingresosMes)} este mes · ${ventasMes.length} ventas`;
  $('kpi-unidades').textContent     = fmtNum(totalUnidades);
  $('kpi-unidades-sub').textContent = `${fmtNum(ventasMes.reduce((s, v) => s + (v.lineas || []).reduce((a, l) => a + l.cantidad, 0), 0))} este mes`;
  $('kpi-ventas').textContent       = fmtNum(ventasValidas.length);
  $('kpi-ventas-sub').textContent   = `${ventasMes.length} este mes`;
  $('kpi-agua').textContent         = `${agua.toFixed(1)} L`;
  $('kpi-agua-sub').textContent     = `+ plástico: ${plastico.toFixed(2)} kg · ${totalBotellas.toFixed(0)} botellas`;
}

function botellasDeLinea(l) {
  if (l.tipo === 'shampoo') {
    return l.tamano === 100 ? 2.0 * l.cantidad : 1.0 * l.cantidad;
  } else if (l.tipo === 'pack') {
    return 2.0 * l.cantidad;
  } else if (l.tipo === 'acondicionador') {
    return 0.75 * l.cantidad;
  }
  return 0;
}

/* ── Tendencia de ventas (últimos 6 meses) ─────────────── */
function renderTendencia() {
  const chart = $('trendChart');
  if (!chart) return;
  const hoy = new Date();
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const next = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 1);
    const ventasMes = allVentas.filter(v => {
      if (v.estado === 'cancelado') return false;
      const f = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
      return f >= d && f < next;
    });
    const monto = ventasMes.reduce((s, v) => s + (v.total || 0), 0);
    meses.push({
      label: d.toLocaleDateString('es-BO', { month: 'short' }),
      monto: monto,
      count: ventasMes.length
    });
  }
  const maxMonto = Math.max(1, ...meses.map(m => m.monto));
  chart.innerHTML = meses.map(m => {
    const heightPct = Math.max(4, (m.monto / maxMonto) * 100);
    return `
      <div class="trend-bar" style="height:${heightPct}%" title="${m.label}: Bs ${fmtNum(m.monto)} (${m.count} ventas)">
        <span class="trend-value">${m.monto > 0 ? 'Bs ' + fmtNum(m.monto) : '—'}</span>
        <span class="trend-label">${m.label}</span>
      </div>
    `;
  }).join('');
}

/* ── Top productos más vendidos ────────────────────────── */
function renderTopProductos() {
  const list = $('topProductosList');
  if (!list) return;
  // Sumar unidades por producto
  const ventas = allVentas.filter(v => v.estado !== 'cancelado');
  const counts = {};
  ventas.forEach(v => {
    (v.lineas || []).forEach(l => {
      if (!l.productoId) return;
      if (!counts[l.productoId]) {
        counts[l.productoId] = { nombre: l.nombre, cantidad: 0, ingresos: 0 };
      }
      counts[l.productoId].cantidad += (l.cantidad || 0);
      counts[l.productoId].ingresos += (l.precio || 0) * (l.cantidad || 0);
    });
  });
  const top = Object.values(counts).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
  if (!top.length) {
    list.innerHTML = '<li><div class="empty-list">Sin ventas aún</div></li>';
    return;
  }
  const max = Math.max(...top.map(t => t.cantidad));
  list.innerHTML = top.map(t => {
    const pct = Math.max(8, (t.cantidad / max) * 100);
    return `
      <li>
        <div class="bar-info">
          <div class="bar-label">${escapeHtml(t.nombre)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="bar-value">${t.cantidad} und</div>
      </li>`;
  }).join('');
}

/* ── Ventas por canal ──────────────────────────────────── */
function renderCanales() {
  const list = $('canalesList');
  if (!list) return;
  const counts = { whatsapp: 0, instagram: 0, tienda: 0, feria: 0, otro: 0 };
  const ventas = allVentas.filter(v => v.estado !== 'cancelado');
  ventas.forEach(v => {
    const c = v.canal || 'otro';
    if (counts[c] !== undefined) counts[c] += (v.total || 0);
  });
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  if (total === 0) {
    list.innerHTML = '<li><div class="empty-list">Sin ventas aún</div></li>';
    return;
  }
  const orden = ['whatsapp', 'instagram', 'tienda', 'feria', 'otro'];
  const label = { whatsapp: 'WhatsApp', instagram: 'Instagram', tienda: 'Tienda', feria: 'Feria', otro: 'Otro' };
  list.innerHTML = orden.map(c => {
    const monto = counts[c];
    if (monto === 0) return '';
    const pct = (monto / total) * 100;
    return `
      <li>
        <div class="bar-info">
          <div class="bar-label">${label[c]}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, pct)}%"></div></div>
        </div>
        <div class="bar-value">${fmtBs(monto)}</div>
      </li>`;
  }).join('');
}

/* ── Últimas ventas ────────────────────────────────────── */
function renderLastVentas() {
  const list = $('lastVentas');
  if (!list) return;
  const sorted = [...allVentas]
    .sort((a, b) => {
      const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha || 0);
      const db = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha || 0);
      return db - da;
    })
    .slice(0, 5);
  if (!sorted.length) {
    list.innerHTML = '<li><div class="empty-list">Sin ventas aún</div></li>';
    return;
  }
  list.innerHTML = sorted.map(v => {
    const totalUnd = (v.lineas || []).reduce((s, l) => s + (l.cantidad || 0), 0);
    const initials = (v.cliente || 'CF').substring(0, 2).toUpperCase();
    return `
      <li>
        <div class="item-avatar">${initials}</div>
        <div class="item-content">
          <div class="item-title">${escapeHtml(v.cliente || 'Consumidor final')}</div>
          <div class="item-sub">${totalUnd} und · ${escapeHtml(v.canal || '—')}</div>
        </div>
        <div style="text-align:right">
          <div class="item-amount">${fmtBs(v.total)}</div>
          <div class="item-date">${fmtDate(v.fecha)}</div>
        </div>
      </li>`;
  }).join('');
}

/* ── Últimos mensajes ──────────────────────────────────── */
function renderLastMensajes() {
  const list = $('lastMsgs');
  if (!list) return;
  const sorted = [...allMensajes]
    .sort((a, b) => {
      const da = a.creadoEn?.toDate ? a.creadoEn.toDate() : new Date(a.creadoEn || 0);
      const db = b.creadoEn?.toDate ? b.creadoEn.toDate() : new Date(b.creadoEn || 0);
      return db - da;
    })
    .slice(0, 5);
  if (!sorted.length) {
    list.innerHTML = '<li><div class="empty-list">Sin mensajes aún</div></li>';
    // Badge de sidebar
    const badge = $('sb-unread');
    if (badge) badge.style.display = 'none';
    return;
  }
  const noLeidos = allMensajes.filter(m => !m.leido).length;
  const badge = $('sb-unread');
  if (badge) {
    badge.textContent   = noLeidos;
    badge.style.display = noLeidos > 0 ? 'block' : 'none';
  }
  list.innerHTML = sorted.map(m => {
    const ini = (m.nombre || '?').charAt(0).toUpperCase();
    return `
      <li style="${m.leido ? '' : 'background:#FFF7ED;margin:-12px 0;padding:12px;border-radius:8px'}">
        <div class="item-avatar">${ini}</div>
        <div class="item-content">
          <div class="item-title">${escapeHtml(m.nombre || '—')}</div>
          <div class="item-sub">${escapeHtml((m.mensaje || '').substring(0, 60))}…</div>
        </div>
        <div class="item-date">${fmtDate(m.creadoEn)}</div>
      </li>`;
  }).join('');
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
