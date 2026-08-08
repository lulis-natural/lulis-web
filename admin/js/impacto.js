/* ═══════════════════════════════════════════════════════════
   LULIS Admin — impacto.js
   Impacto Ambiental calculado automáticamente desde ventas.
   Lee la colección `ventas` y aplica el motor de fórmulas.
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  collection, doc, setDoc,
  onSnapshot
} from './firebase-init.js';

const $ = (id) => document.getElementById(id);

let allVentas = [];

const fmtBs = (n) => 'Bs ' + (n || 0).toLocaleString('es-BO', { minimumFractionDigits: 0 });

/* ── Init ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('logoutBtn')?.addEventListener('click', signOut);
  initImpacto();
});

function initImpacto() {
  const observer = new MutationObserver(() => {
    if (document.body.style.visibility === 'visible') {
      observer.disconnect();
      load();
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
  setTimeout(load, 600);
}

let _loaded = false;
function load() {
  if (_loaded) return;
  _loaded = true;
  subscribeVentas();
}

function subscribeVentas() {
  onSnapshot(collection(db, 'ventas'), (snap) => {
    allVentas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  }, (err) => {
    console.warn('[ventas]', err.code, err.message);
    $('pageLoading').style.display = 'none';
    $('impactoContent').style.display = 'block';
  });
}

/* ── Cálculo de impacto ───────────────────────────────── */
function calcular() {
  const ventasValidas = allVentas.filter(v => v.estado !== 'cancelado');

  // Sumar por tipo de producto
  const porTipo = {
    shampoo50:  { und: 0, botellas: 0, factor: 1.0,  label: 'Shampoo 50g',   gramo: 50  },
    shampoo100: { und: 0, botellas: 0, factor: 2.0,  label: 'Shampoo 100g',  gramo: 100 },
    acond50:    { und: 0, botellas: 0, factor: 0.75, label: 'Acondicionador 50g', gramo: 50 },
    pack:       { und: 0, botellas: 0, factor: 2.0,  label: 'Pack / Combo',  gramo: 100 }
  };

  let totalUnidades = 0;
  let totalBotellas = 0;
  let totalMonto    = 0;

  ventasValidas.forEach(v => {
    totalMonto += (v.total || 0);
    (v.lineas || []).forEach(l => {
      const cant = l.cantidad || 0;
      totalUnidades += cant;
      let key = null;
      if (l.tipo === 'shampoo' && l.tamano === 50)  key = 'shampoo50';
      else if (l.tipo === 'shampoo' && l.tamano === 100) key = 'shampoo100';
      else if (l.tipo === 'acondicionador')             key = 'acond50';
      else if (l.tipo === 'pack')                       key = 'pack';
      if (key) {
        porTipo[key].und += cant;
        porTipo[key].botellas += cant * porTipo[key].factor;
        totalBotellas += cant * porTipo[key].factor;
      }
    });
  });

  const agua      = totalBotellas * 0.300 * 0.70;
  const plastico  = totalBotellas * 0.020;

  return {
    totalUnidades, totalBotellas, totalMonto,
    ventasCount: ventasValidas.length,
    agua: Math.round(agua * 10) / 10,
    plastico: Math.round(plastico * 100) / 100,
    porTipo
  };
}

/* ── Render ───────────────────────────────────────────── */
function render() {
  $('pageLoading').style.display = 'none';
  $('impactoContent').style.display = 'block';

  const r = calcular();

  // KPIs
  $('r-vendidos').textContent     = r.totalUnidades;
  $('r-vendidos-sub').textContent = `${r.ventasCount} ventas registradas`;
  $('r-botellas').textContent     = r.totalBotellas.toFixed(0);
  $('r-botellas-sub').textContent = `≈ ${r.porTipo.shampoo50.botellas.toFixed(0)} shampoo50 + ${r.porTipo.shampoo100.botellas.toFixed(0)} shampoo100 + ${r.porTipo.acond50.botellas.toFixed(0)} acond + ${r.porTipo.pack.botellas.toFixed(0)} pack`;
  $('r-agua').textContent         = `${r.agua.toFixed(1)} L`;
  $('r-agua-sub').textContent     = `botellas × 0.300L × 70%`;
  $('r-kg').textContent           = `${r.plastico.toFixed(2)} kg`;
  $('r-kg-sub').textContent       = `botellas × 0.020 kg`;

  // Desglose por producto
  const tbody = $('desgloseBody');
  const rows = Object.entries(r.porTipo)
    .filter(([k, v]) => v.und > 0)
    .sort((a, b) => b[1].und - a[1].und);

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--mid)">Aún no hay ventas registradas. Las métricas se calcularán automáticamente al registrar ventas.</td></tr>`;
  } else {
    tbody.innerHTML = rows.map(([k, t]) => {
      const botellas = t.botellas;
      const agua     = botellas * 0.300 * 0.70;
      const plastico = botellas * 0.020;
      return `
        <tr>
          <td><strong>${escapeHtml(t.label)}</strong></td>
          <td><span class="td-factor">×${t.factor} botellas c/u</span></td>
          <td class="td-num td-strong">${t.und}</td>
          <td class="td-num td-strong">${botellas.toFixed(0)}</td>
          <td class="td-num">${agua.toFixed(1)} L</td>
          <td class="td-num">${plastico.toFixed(2)} kg</td>
        </tr>`;
    }).join('');
  }
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
