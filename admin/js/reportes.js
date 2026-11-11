/* ═══════════════════════════════════════════════════════════
   LULIS Admin — reportes.js (v4 — Gestión Comercial & Financiera)
   - Consolidación automática de ventas, costos (COGS) y gastos
   - Cálculo del punto de equilibrio financiero en Bolivianos
   - Análisis de rentabilidad por producto y comparativo mensual
   - Exportación Excel (.xlsx) multi-hoja según Modelo_datos_y_reportes_Lulis.xlsx
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  collection, onSnapshot
} from './firebase-init.js';

import { toast } from './xlsx-helper.js';

const $ = (id) => document.getElementById(id);

let allVentas    = [];
let allGastos    = [];
let allProductos = [];

// Formateadores
const fmtBs = (n) => 'Bs ' + (Number(n) || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n) => (isNaN(n) ? '0.0' : Number(n).toFixed(1)) + '%';

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

/* ── DOM Ready ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initListeners();
  applyPeriodo('anio_actual');
  subscribeCollections();
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

/* ── Eventos y Filtros ─────────────────────────────────── */
function initListeners() {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      $(`tab-${btn.dataset.tab}`)?.classList.add('active');
    });
  });

  // Filtro de períodos
  $('rPeriodo')?.addEventListener('change', (e) => {
    applyPeriodo(e.target.value);
    calcularReportes();
  });

  ['rDesde', 'rHasta', 'rCanal', 'rMedioPago', 'rSoloPagadas'].forEach(id => {
    $(id)?.addEventListener('change', () => {
      if (id === 'rDesde' || id === 'rHasta') {
        if ($('rPeriodo')) $('rPeriodo').value = 'personalizado';
      }
      calcularReportes();
    });
  });

  // Botones de exportación
  $('btnExportarModelo')?.addEventListener('click', exportarModeloCompleto);
  $('btnExportarVentas')?.addEventListener('click', exportarVentasExcel);
  $('btnExportarGastos')?.addEventListener('click', exportarGastosExcel);
}

/* ── Períodos predefinidos ─────────────────────────────── */
function applyPeriodo(tipo) {
  const hoy = new Date();
  let desde, hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

  switch (tipo) {
    case 'mes_actual':
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      break;
    case 'mes_pasado':
      desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59);
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
      desde = new Date(2023, 0, 1);
      break;
    case 'personalizado':
      return; // mantener inputs actuales
    default:
      desde = new Date(hoy.getFullYear(), 0, 1);
  }

  if ($('rDesde')) $('rDesde').value = fmtDateInput(desde);
  if ($('rHasta')) $('rHasta').value = fmtDateInput(hasta);
}

/* ── Suscripciones Firestore ───────────────────────────── */
function subscribeCollections() {
  onSnapshot(collection(db, 'ventas'), snap => {
    allVentas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    calcularReportes();
  }, err => console.warn('[ventas]', err));

  onSnapshot(collection(db, 'gastos'), snap => {
    allGastos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    calcularReportes();
  }, err => console.warn('[gastos]', err));

  onSnapshot(collection(db, 'productos'), snap => {
    allProductos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    calcularReportes();
  }, err => console.warn('[productos]', err));
}

/* ── Proceso de Cálculo Principal ──────────────────────── */
let processedData = null;

function calcularReportes() {
  const fDesde = $('rDesde')?.value ? new Date($('rDesde').value + 'T00:00:00') : null;
  const fHasta = $('rHasta')?.value ? new Date($('rHasta').value + 'T23:59:59') : null;
  const fCanal = $('rCanal')?.value || '';
  const fMedio = $('rMedioPago')?.value || '';
  const soloPagadas = $('rSoloPagadas')?.value === 'pagadas';

  // 1. Filtrar ventas
  const ventasFiltradas = allVentas.filter(v => {
    const d = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
    if (fDesde && d < fDesde) return false;
    if (fHasta && d > fHasta) return false;
    if (fCanal && (v.canal || '').toLowerCase() !== fCanal.toLowerCase()) return false;
    if (fMedio && (v.medio_pago || '').toLowerCase() !== fMedio.toLowerCase()) return false;
    
    // Criterio financiero: solo operaciones efectivamente pagadas
    if (soloPagadas) {
      const est = (v.estado || '').toLowerCase();
      if (est === 'cancelado' || est === 'cancelada') return false;
    }
    return true;
  });

  // 2. Filtrar gastos
  const gastosFiltrados = allGastos.filter(g => {
    const d = g.fecha?.toDate ? g.fecha.toDate() : new Date(g.fecha);
    if (fDesde && d < fDesde) return false;
    if (fHasta && d > fHasta) return false;
    return true;
  });

  // 3. Normalizar líneas de producto de cada venta
  const prodMap = new Map();
  allProductos.forEach(p => {
    if (p.id) prodMap.set(p.id, p);
    if (p.nombre) prodMap.set(p.nombre.toLowerCase().trim(), p);
  });

  let totalIngresos = 0;
  let totalCOGS = 0;
  let totalDescuentos = 0;
  let totalUnidades = 0;
  const lineasVentas = [];
  const prodStats = {};

  ventasFiltradas.forEach(v => {
    const vId = v.venta_id || v.id;
    const vFecha = v.fecha;
    const vCanal = v.canal || 'Tienda física';
    const vMedio = v.medio_pago || 'Efectivo';
    const vEstado = v.estado || 'Pagada';
    const vDescuentoGlobal = parsePrice(v.descuento || 0);

    totalDescuentos += vDescuentoGlobal;

    // Si tiene arreglo de líneas detalladas
    if (Array.isArray(v.lineas) && v.lineas.length > 0) {
      let vTotalCalc = 0;
      v.lineas.forEach(l => {
        const prodName = l.producto_nombre || l.producto || 'Producto';
        const pKey = prodName.toLowerCase().trim();
        const catalogProd = prodMap.get(pKey);

        const sku = l.producto_sku || catalogProd?.sku || '-';
        const categoria = l.categoria || catalogProd?.categoria || 'General';
        const cant = Number(l.cantidad) || 1;
        const pu = parsePrice(l.precio_unitario_bs != null ? l.precio_unitario_bs : l.precio_unitario);
        const subtotal = pu * cant;
        const descLinea = parsePrice(l.descuento_linea_bs || 0);
        const totalLinea = subtotal - descLinea;

        // Costo unitario histórico o fallback del catálogo
        const cu = parsePrice(l.costo_unitario_historico_bs != null ? l.costo_unitario_historico_bs : (catalogProd?.costo || (pu * 0.4)));
        const costoTotalLinea = cu * cant;
        const margenBrutoLinea = totalLinea - costoTotalLinea;

        vTotalCalc += totalLinea;
        totalIngresos += totalLinea;
        totalCOGS += costoTotalLinea;
        totalUnidades += cant;

        lineasVentas.push({
          venta_id: vId,
          fecha: vFecha,
          cliente: v.cliente || 'Consumidor final',
          producto_sku: sku,
          producto: prodName,
          categoria: categoria,
          cantidad: cant,
          precio_unitario_bs: pu,
          subtotal_linea_bs: subtotal,
          descuento_linea_bs: descLinea,
          total_linea_bs: totalLinea,
          costo_unitario_historico_bs: cu,
          costo_total_linea_bs: costoTotalLinea,
          margen_bruto_linea_bs: margenBrutoLinea,
          canal: vCanal,
          medio_pago: vMedio,
          estado: vEstado,
          notas: v.notas || ''
        });

        // Agrupación por producto
        if (!prodStats[prodName]) {
          prodStats[prodName] = {
            sku: sku,
            nombre: prodName,
            categoria: categoria,
            cantidad: 0,
            ingresos: 0,
            costos: 0,
            margen: 0
          };
        }
        prodStats[prodName].cantidad += cant;
        prodStats[prodName].ingresos += totalLinea;
        prodStats[prodName].costos += costoTotalLinea;
        prodStats[prodName].margen += margenBrutoLinea;
      });
    } else {
      // Venta directa / legacy de un solo producto
      const prodName = v.producto || 'Venta directa';
      const pKey = prodName.toLowerCase().trim();
      const catalogProd = prodMap.get(pKey);

      const cant = Number(v.cantidad) || 1;
      const totalV = parsePrice(v.total || v.precio || 0);
      const pu = cant > 0 ? (totalV / cant) : totalV;
      const cu = parsePrice(catalogProd?.costo || (pu * 0.4));
      const cogs = cu * cant;
      const mb = totalV - cogs;

      totalIngresos += totalV;
      totalCOGS += cogs;
      totalUnidades += cant;

      lineasVentas.push({
        venta_id: vId,
        fecha: vFecha,
        cliente: v.cliente || 'Consumidor final',
        producto_sku: catalogProd?.sku || '-',
        producto: prodName,
        categoria: v.categoria || catalogProd?.categoria || 'General',
        cantidad: cant,
        precio_unitario_bs: pu,
        subtotal_linea_bs: totalV,
        descuento_linea_bs: vDescuentoGlobal,
        total_linea_bs: totalV,
        costo_unitario_historico_bs: cu,
        costo_total_linea_bs: cogs,
        margen_bruto_linea_bs: mb,
        canal: vCanal,
        medio_pago: vMedio,
        estado: vEstado,
        notas: v.notas || ''
      });

      if (!prodStats[prodName]) {
        prodStats[prodName] = {
          sku: catalogProd?.sku || '-',
          nombre: prodName,
          categoria: v.categoria || catalogProd?.categoria || 'General',
          cantidad: 0,
          ingresos: 0,
          costos: 0,
          margen: 0
        };
      }
      prodStats[prodName].cantidad += cant;
      prodStats[prodName].ingresos += totalV;
      prodStats[prodName].costos += cogs;
      prodStats[prodName].margen += mb;
    }
  });

  // 4. Procesar Gastos
  let gastosFijos = 0;
  let gastosVariables = 0;

  gastosFiltrados.forEach(g => {
    const imp = parsePrice(g.importe_bs || 0);
    if (g.tipo_gasto === 'Fijo') {
      gastosFijos += imp;
    } else {
      gastosVariables += imp;
    }
  });

  const totalGastos = gastosFijos + gastosVariables;

  // 5. Cálculos Financieros
  const margenBruto = totalIngresos - totalCOGS;
  const pctMargenBruto = totalIngresos > 0 ? (margenBruto / totalIngresos) * 100 : 0;

  // Margen de contribución = Ingresos - Costos Variables (COGS + Gastos Variables)
  const margenContribucion = totalIngresos - totalCOGS - gastosVariables;
  const pctMargenContribucion = totalIngresos > 0 ? (margenContribucion / totalIngresos) : 0;

  // Resultado operativo = Margen de Contribución - Gastos Fijos
  const resultadoOperativo = margenContribucion - gastosFijos;
  const rentabilidadPct = totalIngresos > 0 ? (resultadoOperativo / totalIngresos) * 100 : 0;

  // Punto de equilibrio en Bolivianos = Gastos Fijos / % Margen Contribución
  let puntoEquilibrioBs = 0;
  if (pctMargenContribucion > 0) {
    puntoEquilibrioBs = gastosFijos / pctMargenContribucion;
  }

  const difEquilibrio = totalIngresos - puntoEquilibrioBs;
  const enSuperavit = difEquilibrio >= 0 && puntoEquilibrioBs > 0;

  // Guardar datos en memoria para exportación
  processedData = {
    ventasFiltradas,
    gastosFiltrados,
    lineasVentas,
    prodStats,
    totalIngresos,
    totalCOGS,
    margenBruto,
    pctMargenBruto,
    gastosFijos,
    gastosVariables,
    totalGastos,
    margenContribucion,
    pctMargenContribucion: pctMargenContribucion * 100,
    resultadoOperativo,
    rentabilidadPct,
    puntoEquilibrioBs,
    difEquilibrio,
    enSuperavit,
    totalUnidades,
    totalDescuentos
  };

  renderKPIs(processedData);
  renderPuntoEquilibrio(processedData);
  renderEstadoResultados(processedData);
  renderVentasTab(ventasFiltradas);
  renderProductosTab(prodStats);
  renderComparativoMensual(allVentas, allGastos);
}

/* ── Render Tab 1: KPIs & Estado de Resultados ─────────── */
function renderKPIs(d) {
  if ($('f-ingresos')) $('f-ingresos').textContent = fmtBs(d.totalIngresos);
  if ($('f-ingresos-sub')) $('f-ingresos-sub').textContent = `${d.ventasFiltradas.length} operaciones (${d.totalUnidades} uds)`;
  if ($('f-cogs')) $('f-cogs').textContent = fmtBs(d.totalCOGS);
  if ($('f-margen-bruto')) $('f-margen-bruto').textContent = fmtBs(d.margenBruto);
  if ($('f-margen-bruto-pct')) $('f-margen-bruto-pct').textContent = `${fmtPct(d.pctMargenBruto)} s/ ingresos`;
  if ($('f-gastos-fijos')) $('f-gastos-fijos').textContent = fmtBs(d.gastosFijos);
  if ($('f-gastos-var')) $('f-gastos-var').textContent = fmtBs(d.gastosVariables);
  if ($('f-margen-contrib')) $('f-margen-contrib').textContent = fmtBs(d.margenContribucion);
  if ($('f-margen-contrib-pct')) $('f-margen-contrib-pct').textContent = `${fmtPct(d.pctMargenContribucion)} margen contrib.`;
  
  if ($('f-resultado-op')) {
    $('f-resultado-op').textContent = fmtBs(d.resultadoOperativo);
    $('f-resultado-op').style.color = d.resultadoOperativo >= 0 ? '#059669' : '#DC2626';
  }
  if ($('f-rentabilidad-pct')) {
    $('f-rentabilidad-pct').textContent = `Rentabilidad: ${fmtPct(d.rentabilidadPct)}`;
  }
}

function renderPuntoEquilibrio(d) {
  const peBs = $('pe-punto-bs');
  const ventasReales = $('pe-ventas-reales');
  const dif = $('pe-diferencia');
  const mcPct = $('pe-mc-pct');
  const badge = $('pe-status-badge');
  const aviso = $('pe-aviso');

  if (peBs) peBs.textContent = fmtBs(d.puntoEquilibrioBs);
  if (ventasReales) ventasReales.textContent = fmtBs(d.totalIngresos);
  if (mcPct) mcPct.textContent = fmtPct(d.pctMargenContribucion);

  if (dif) {
    const sign = d.difEquilibrio >= 0 ? '+' : '';
    dif.textContent = sign + fmtBs(d.difEquilibrio);
    dif.style.color = d.difEquilibrio >= 0 ? '#059669' : '#DC2626';
  }

  if (badge) {
    if (d.totalIngresos === 0 && d.gastosFijos === 0) {
      badge.className = 'pe-tag';
      badge.textContent = 'Sin datos';
      badge.style.background = '#E5E7EB';
      badge.style.color = '#374151';
    } else if (d.enSuperavit) {
      badge.className = 'pe-tag pe-tag-superavit';
      badge.textContent = 'Superávit Financiero';
    } else {
      badge.className = 'pe-tag pe-tag-deficit';
      badge.textContent = 'Bajo Punto Equilibrio';
    }
  }

  if (aviso) {
    if (d.gastosFijos === 0 || d.totalCOGS === 0) {
      aviso.style.display = 'block';
    } else {
      aviso.style.display = 'none';
    }
  }
}

function renderEstadoResultados(d) {
  const tbody = $('eerrBody');
  if (!tbody) return;

  const pct = (val) => d.totalIngresos > 0 ? fmtPct((val / d.totalIngresos) * 100) : '0.0%';

  tbody.innerHTML = `
    <tr style="font-weight:700">
      <td>(+) Ingresos Operativos por Ventas</td>
      <td class="num" style="color:var(--wine)">${fmtBs(d.totalIngresos)}</td>
      <td class="num">100.0%</td>
    </tr>
    <tr>
      <td style="padding-left:24px;color:#DC2626">(-) Costo de Productos Vendidos (COGS)</td>
      <td class="num" style="color:#DC2626">-${fmtBs(d.totalCOGS)}</td>
      <td class="num">${pct(d.totalCOGS)}</td>
    </tr>
    <tr style="background:#FAF8F3;font-weight:700">
      <td>(=) MARGEN BRUTO</td>
      <td class="num" style="color:#059669">${fmtBs(d.margenBruto)}</td>
      <td class="num">${fmtPct(d.pctMargenBruto)}</td>
    </tr>
    <tr>
      <td style="padding-left:24px;color:#D97706">(-) Gastos Variables (Insumos, empaque, comisiones)</td>
      <td class="num" style="color:#D97706">-${fmtBs(d.gastosVariables)}</td>
      <td class="num">${pct(d.gastosVariables)}</td>
    </tr>
    <tr style="background:#FAF8F3;font-weight:700">
      <td>(=) MARGEN DE CONTRIBUCIÓN</td>
      <td class="num" style="color:#2563EB">${fmtBs(d.margenContribucion)}</td>
      <td class="num">${fmtPct(d.pctMargenContribucion)}</td>
    </tr>
    <tr>
      <td style="padding-left:24px;color:#4F46E5">(-) Gastos Fijos (Alquiler, sueldos, servicios)</td>
      <td class="num" style="color:#4F46E5">-${fmtBs(d.gastosFijos)}</td>
      <td class="num">${pct(d.gastosFijos)}</td>
    </tr>
    <tr style="background:${d.resultadoOperativo >= 0 ? '#ECFDF5' : '#FEF2F2'};font-weight:800;font-size:.95rem">
      <td>(=) RESULTADO OPERATIVO ESTIMADO (Utilidad Operativa)</td>
      <td class="num" style="color:${d.resultadoOperativo >= 0 ? '#059669' : '#DC2626'}">${fmtBs(d.resultadoOperativo)}</td>
      <td class="num">${fmtPct(d.rentabilidadPct)}</td>
    </tr>
  `;
}

/* ── Render Tab 2: Ventas Detalladas ───────────────────── */
function renderVentasTab(ventas) {
  const tbody = $('ventasBody');
  const count = $('ventasCount');
  if (!tbody) return;

  if (count) count.textContent = `${ventas.length} operaciones`;

  if (ventas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF">No hay ventas registradas en el período seleccionado.</td></tr>`;
    return;
  }

  tbody.innerHTML = ventas.slice(0, 150).map(v => {
    const vId = v.venta_id || v.id;
    const itemsDesc = Array.isArray(v.lineas) && v.lineas.length > 0
      ? v.lineas.map(l => `${l.cantidad}x ${l.producto_nombre || l.producto}`).join(', ')
      : `${v.cantidad || 1}x ${v.producto || 'Producto'}`;

    const est = (v.estado || 'Pagada').toLowerCase();
    let badgeClass = 'badge-pagada';
    if (est.includes('entreg')) badgeClass = 'badge-entregado';
    if (est.includes('pend')) badgeClass = 'badge-pendiente';
    if (est.includes('canc')) badgeClass = 'badge-cancelado';

    return `
      <tr>
        <td style="font-weight:700;color:var(--wine)">${vId}</td>
        <td>${fmtDate(v.fecha)}</td>
        <td>${v.canal || 'Tienda física'}</td>
        <td>${v.medio_pago || 'Efectivo'}</td>
        <td style="max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escapeHtml(itemsDesc)}">
          ${escapeHtml(itemsDesc)}
        </td>
        <td><span class="badge-estado ${badgeClass}">${v.estado || 'Pagada'}</span></td>
        <td class="num">${parsePrice(v.descuento || 0) > 0 ? fmtBs(v.descuento) : '-'}</td>
        <td class="num" style="font-weight:700;color:var(--wine)">${fmtBs(v.total || v.precio || 0)}</td>
      </tr>
    `;
  }).join('');
}

/* ── Render Tab 3: Productos ───────────────────────────── */
function renderProductosTab(stats) {
  const tbody = $('productosBody');
  if (!tbody) return;

  const list = Object.values(stats).sort((a, b) => b.ingresos - a.ingresos);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF">Sin datos de productos en este período.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const pct = p.ingresos > 0 ? (p.margen / p.ingresos) * 100 : 0;
    return `
      <tr>
        <td style="font-weight:600;color:#1F2937">${escapeHtml(p.nombre)}</td>
        <td><span style="background:#F3F4F6;padding:2px 8px;border-radius:4px;font-size:.78rem">${p.categoria}</span></td>
        <td class="num">${p.cantidad}</td>
        <td class="num" style="color:var(--wine)">${fmtBs(p.ingresos)}</td>
        <td class="num" style="color:#DC2626">${fmtBs(p.costos)}</td>
        <td class="num" style="font-weight:700;color:#059669">${fmtBs(p.margen)}</td>
        <td class="num">${fmtPct(pct)}</td>
      </tr>
    `;
  }).join('');
}

/* ── Render Tab 4: Comparativo Mensual ─────────────────── */
function renderComparativoMensual(ventas, gastos) {
  const tbody = $('mensualBody');
  if (!tbody) return;

  const meses = {};

  // Acumular ventas por mes
  ventas.forEach(v => {
    const d = v.fecha?.toDate ? v.fecha.toDate() : new Date(v.fecha);
    if (isNaN(d.getTime())) return;
    const est = (v.estado || '').toLowerCase();
    if (est === 'cancelado' || est === 'cancelada') return;

    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!meses[mKey]) {
      meses[mKey] = {
        mes: mKey,
        ventas: 0,
        unidades: 0,
        cogs: 0,
        fijos: 0,
        variables: 0
      };
    }

    if (Array.isArray(v.lineas) && v.lineas.length > 0) {
      v.lineas.forEach(l => {
        const cant = Number(l.cantidad) || 1;
        const totalL = parsePrice(l.total_linea_bs != null ? l.total_linea_bs : (parsePrice(l.precio_unitario) * cant));
        const cu = parsePrice(l.costo_unitario_historico_bs || (totalL / cant * 0.4));
        meses[mKey].ventas += totalL;
        meses[mKey].unidades += cant;
        meses[mKey].cogs += (cu * cant);
      });
    } else {
      const cant = Number(v.cantidad) || 1;
      const totalV = parsePrice(v.total || v.precio || 0);
      meses[mKey].ventas += totalV;
      meses[mKey].unidades += cant;
      meses[mKey].cogs += (totalV * 0.4);
    }
  });

  // Acumular gastos por mes
  gastos.forEach(g => {
    const d = g.fecha?.toDate ? g.fecha.toDate() : new Date(g.fecha);
    if (isNaN(d.getTime())) return;
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!meses[mKey]) {
      meses[mKey] = {
        mes: mKey,
        ventas: 0,
        unidades: 0,
        cogs: 0,
        fijos: 0,
        variables: 0
      };
    }
    const imp = parsePrice(g.importe_bs || 0);
    if (g.tipo_gasto === 'Fijo') {
      meses[mKey].fijos += imp;
    } else {
      meses[mKey].variables += imp;
    }
  });

  const sortedKeys = Object.keys(meses).sort().reverse();

  if (sortedKeys.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF">No hay información histórica para comparar.</td></tr>`;
    return;
  }

  tbody.innerHTML = sortedKeys.map(k => {
    const m = meses[k];
    const mb = m.ventas - m.cogs;
    const resOp = mb - m.variables - m.fijos;

    // Nombre de mes bonito
    const [y, mesNum] = k.split('-');
    const dateObj = new Date(Number(y), Number(mesNum) - 1, 1);
    const mesNombre = dateObj.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });

    return `
      <tr>
        <td style="font-weight:700;text-transform:capitalize;color:var(--wine)">${mesNombre}</td>
        <td class="num">${fmtBs(m.ventas)}</td>
        <td class="num">${m.unidades}</td>
        <td class="num" style="color:#DC2626">${fmtBs(m.cogs)}</td>
        <td class="num" style="color:#059669">${fmtBs(mb)}</td>
        <td class="num" style="color:#4F46E5">${fmtBs(m.fijos)}</td>
        <td class="num" style="color:#D97706">${fmtBs(m.variables)}</td>
        <td class="num" style="font-weight:800;color:${resOp >= 0 ? '#059669' : '#DC2626'}">${fmtBs(resOp)}</td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

/* ═══════════════════════════════════════════════════════════
   EXPORTACIÓN EXCEL MULTI-HOJA
   Basado exactamente en Modelo_datos_y_reportes_Lulis.xlsx
   ═══════════════════════════════════════════════════════════ */
function exportarModeloCompleto() {
  if (typeof XLSX === 'undefined') {
    return toast('Librería de exportación cargando...', 'error');
  }

  if (!processedData || processedData.ventasFiltradas.length === 0) {
    return toast('No hay datos en el período para exportar', 'error');
  }

  const d = processedData;
  const wb = XLSX.utils.book_new();

  // 1. HOJA 1: RESUMEN FINANCIERO Y PUNTO DE EQUILIBRIO
  const resumenRows = [
    { 'CONCEPTO / INDICADOR': 'INGRESOS TOTALES POR VENTAS PAGADAS', 'IMPORTE (Bs)': d.totalIngresos, '% SOBRE INGRESOS': '100.0%' },
    { 'CONCEPTO / INDICADOR': '(-) Costo de Productos Vendidos (COGS)', 'IMPORTE (Bs)': -d.totalCOGS, '% SOBRE INGRESOS': fmtPct((d.totalCOGS / d.totalIngresos) * 100) },
    { 'CONCEPTO / INDICADOR': '(=) MARGEN BRUTO', 'IMPORTE (Bs)': d.margenBruto, '% SOBRE INGRESOS': fmtPct(d.pctMargenBruto) },
    { 'CONCEPTO / INDICADOR': '(-) Gastos Variables (Empaque, insumos, comisiones)', 'IMPORTE (Bs)': -d.gastosVariables, '% SOBRE INGRESOS': fmtPct((d.gastosVariables / d.totalIngresos) * 100) },
    { 'CONCEPTO / INDICADOR': '(=) MARGEN DE CONTRIBUCIÓN', 'IMPORTE (Bs)': d.margenContribucion, '% SOBRE INGRESOS': fmtPct(d.pctMargenContribucion) },
    { 'CONCEPTO / INDICADOR': '(-) Gastos Fijos (Alquiler, sueldos, servicios básicos)', 'IMPORTE (Bs)': -d.gastosFijos, '% SOBRE INGRESOS': fmtPct((d.gastosFijos / d.totalIngresos) * 100) },
    { 'CONCEPTO / INDICADOR': '(=) RESULTADO OPERATIVO ESTIMADO', 'IMPORTE (Bs)': d.resultadoOperativo, '% SOBRE INGRESOS': fmtPct(d.rentabilidadPct) },
    { 'CONCEPTO / INDICADOR': '', 'IMPORTE (Bs)': '', '% SOBRE INGRESOS': '' },
    { 'CONCEPTO / INDICADOR': '--- ANÁLISIS DE PUNTO DE EQUILIBRIO ---', 'IMPORTE (Bs)': '', '% SOBRE INGRESOS': '' },
    { 'CONCEPTO / INDICADOR': 'Gastos Fijos del Período', 'IMPORTE (Bs)': d.gastosFijos, '% SOBRE INGRESOS': '-' },
    { 'CONCEPTO / INDICADOR': 'Porcentaje de Margen de Contribución', 'IMPORTE (Bs)': d.pctMargenContribucion / 100, '% SOBRE INGRESOS': fmtPct(d.pctMargenContribucion) },
    { 'CONCEPTO / INDICADOR': 'PUNTO DE EQUILIBRIO EN BOLIVIANOS (Bs)', 'IMPORTE (Bs)': d.puntoEquilibrioBs, '% SOBRE INGRESOS': '-' },
    { 'CONCEPTO / INDICADOR': 'Ventas Reales del Período', 'IMPORTE (Bs)': d.totalIngresos, '% SOBRE INGRESOS': '-' },
    { 'CONCEPTO / INDICADOR': 'Diferencia (Superávit / Déficit)', 'IMPORTE (Bs)': d.difEquilibrio, '% SOBRE INGRESOS': d.enSuperavit ? 'SUPERÁVIT' : 'DÉFICIT' }
  ];
  const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Financiero');

  // 2. HOJA 2: DETALLE DE VENTAS (1 fila por producto vendido)
  const ventasRows = d.lineasVentas.map(l => ({
    'Fecha': fmtDate(l.fecha),
    'ID Venta': l.venta_id,
    'SKU': l.producto_sku,
    'Producto': l.producto,
    'Categoría': l.categoria,
    'Cantidad': l.cantidad,
    'Precio Unitario (Bs)': l.precio_unitario_bs,
    'Subtotal (Bs)': l.subtotal_linea_bs,
    'Descuento (Bs)': l.descuento_linea_bs,
    'Total Venta (Bs)': l.total_linea_bs,
    'Costo Unitario Histórico (Bs)': l.costo_unitario_historico_bs,
    'Costo Total Línea (Bs)': l.costo_total_linea_bs,
    'Margen Bruto (Bs)': l.margen_bruto_linea_bs,
    'Canal': l.canal,
    'Medio de Pago': l.medio_pago,
    'Estado': l.estado,
    'Observaciones': l.notas
  }));
  const wsVentas = XLSX.utils.json_to_sheet(ventasRows);
  XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas Detalladas');

  // 3. HOJA 3: GASTOS ADMINISTRATIVOS
  const gastosRows = d.gastosFiltrados.map(g => ({
    'ID Gasto': g.gasto_id || '',
    'Fecha': fmtDate(g.fecha),
    'Categoría': g.categoria_gasto || '',
    'Descripción': g.descripcion || '',
    'Tipo de Gasto': g.tipo_gasto || '',
    'Importe (Bs)': Number(g.importe_bs) || 0,
    'Medio de Pago': g.medio_pago || '',
    'Observaciones': g.notas || ''
  }));
  const wsGastos = XLSX.utils.json_to_sheet(gastosRows);
  XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos');

  // 4. HOJA 4: CATÁLOGO DE PRODUCTOS Y COSTOS
  const prodRows = allProductos.map(p => ({
    'SKU': p.sku || '',
    'Producto': p.nombre || '',
    'Categoría': p.categoria || '',
    'Costo Unitario Actual (Bs)': parsePrice(p.costo || 0),
    'Precio de Venta Actual (Bs)': parsePrice(p.precio || 0),
    'Margen Unitario (Bs)': parsePrice(p.precio || 0) - parsePrice(p.costo || 0),
    'Empaque': p.empaque || '',
    'Estado': p.activo !== false ? 'Activo' : 'Inactivo'
  }));
  const wsProd = XLSX.utils.json_to_sheet(prodRows);
  XLSX.utils.book_append_sheet(wb, wsProd, 'Productos y Costos');

  const fechaStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `LULIS_Modelo_Financiero_Gestion_${fechaStr}.xlsx`);
  toast('Archivo Excel con Modelo Financiero exportado exitosamente', 'success');
}

function exportarVentasExcel() {
  if (!processedData || processedData.lineasVentas.length === 0) {
    return toast('No hay ventas para exportar', 'error');
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(processedData.lineasVentas);
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
  XLSX.writeFile(wb, `LULIS_Ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  toast('Ventas exportadas a Excel', 'success');
}

function exportarGastosExcel() {
  if (!processedData || processedData.gastosFiltrados.length === 0) {
    return toast('No hay gastos para exportar', 'error');
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(processedData.gastosFiltrados);
  XLSX.utils.book_append_sheet(wb, ws, 'Gastos');
  XLSX.writeFile(wb, `LULIS_Gastos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  toast('Gastos exportados a Excel', 'success');
}
