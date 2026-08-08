/* ═══════════════════════════════════════════════════════════
   LULIS — impacto-publico.js
   Conecta el sitio público con los datos de Firestore.

   Responsabilidades:
   1. Leer impacto_ambiental/acumulado en tiempo real
   2. Calcular métricas con impacto-engine.js
   3. Actualizar todos los elementos del DOM:
      - Contadores del Hero (#hero-stat-num)
      - Sección de impacto (#impact-env)
   4. Animar los números con el counter de counters.js

   Requiere: impacto-engine.js cargado antes que este archivo.
   ═══════════════════════════════════════════════════════════ */

(function initImpactoPublico() {

  /* ── Configuración de Firebase ─────────────────────────── */
  /* Reutilizamos la instancia ya inicializada en firebase.js */
  /* Si Firebase no está configurado, el módulo falla silenciosamente */

  const FIRESTORE_URL = (() => {
    try {
      /* Leer projectId desde LULIS_CONFIG (definido en config.js) */
      const pid = window.LULIS_CONFIG?.firebaseProjectId;
      if (pid) {
        return `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/impacto_ambiental/acumulado`;
      }
    } catch (_) {}
    return null;
  })();

  /* ── Selectores del DOM ────────────────────────────────── */
  /* Hero stats */
  const heroEls = {
    vendidos:  document.querySelector('[data-impact="vendidos"]'),
    botellas:  document.querySelector('[data-impact="botellas"]'),
    agua:      document.querySelector('[data-impact="agua"]'),
    plastico:  document.querySelector('[data-impact="plastico"]'),
  };

  /* Sección de impacto */
  const impactoEls = {
    agua:       document.querySelector('[data-metric="agua"]'),
    botellas:   document.querySelector('[data-metric="botellas"]'),
    kg:         document.querySelector('[data-metric="kg"]'),
    vendidos:   document.querySelector('[data-metric="vendidos"]'),
  };

  /* ── Detectar si hay elementos que actualizar ──────────── */
  const hayElementos = Object.values({ ...heroEls, ...impactoEls })
    .some(el => el !== null);

  if (!hayElementos) {
    /* El HTML todavía no tiene los atributos data-impact/data-metric.
       Fallback: intentar por clase legacy */
    initLegacy();
    return;
  }

  /* ── Polling a Firestore REST API (sin SDK) ────────────── */
  /* Esto funciona sin inicializar el SDK completo,
     siempre que la regla de Firestore permita leer
     impacto_ambiental/acumulado públicamente (✅ ya está en las rules). */

  if (!FIRESTORE_URL) {
    /* Modo silencioso: usa los valores hardcoded del HTML como fallback.
       No se necesita warning porque los contadores tienen valores por defecto. */
    return;
  }

  cargarYActualizar();
  /* Refrescar cada 5 minutos */
  setInterval(cargarYActualizar, 5 * 60 * 1000);

  async function cargarYActualizar() {
    try {
      const res  = await fetch(FIRESTORE_URL);
      if (!res.ok) return;
      const json = await res.json();
      const data = parseFirestoreDoc(json);
      actualizarDOM(data);
    } catch (err) {
      console.info('LULIS: No se pudo cargar impacto desde Firestore:', err.message);
    }
  }

  /* ── Actualizar DOM con los resultados ─────────────────── */
  function actualizarDOM(data) {
    if (!data) {
      console.info('LULIS impacto: no data');
      return;
    }
    console.info('LULIS impacto: data=', JSON.stringify(data));

    /* Si hay desglose de ventas, calcular con el motor. Si no, usar totales directos. */
    const ventas = data.ventas;
    const hasDesglose = ventas && (ventas.shampoos50g || ventas.shampoos100g || ventas.acond50g || ventas.packs);

    let vals;
    if (hasDesglose && window.LULIS_IMPACTO) {
      const r = LULIS_IMPACTO.calcular({
        shampoos50g:  ventas.shampoos50g  || 0,
        shampoos100g: ventas.shampoos100g || 0,
        acond50g:     ventas.acond50g     || 0,
      });
      vals = {
        vendidos: r.totalVendidos         ?? data.ventasTotales        ?? 0,
        botellas: r.botellasReemplazadas  ?? data.botellasReemplazadas ?? 0,
        agua:     r.litrosAguaEvitados    ?? data.litrosAguaEvitados   ?? 0,
        kg:       r.kgPlasticoEvitado     ?? data.kgPlasticoEvitado    ?? 0,
      };
    } else {
      /* Usar totales ya calculados en Firestore (por el recalcularImpacto del admin) */
      vals = {
        vendidos: data.ventasTotales        ?? data.productosVendidos    ?? 0,
        botellas: data.botellasReemplazadas ?? 0,
        agua:     data.litrosAguaEvitados   ?? 0,
        kg:       data.kgPlasticoEvitado    ?? 0,
      };
    }
    console.info('LULIS impacto: vals=', JSON.stringify(vals));

    /* ── Hero stats ── */
    if (heroEls.vendidos) animarNumero(heroEls.vendidos, vals.vendidos);
    if (heroEls.botellas) animarNumero(heroEls.botellas, vals.botellas);
    if (heroEls.agua)     actualizarTexto(heroEls.agua,  formatAgua(vals.agua));
    if (heroEls.plastico) actualizarTexto(heroEls.plastico, formatKg(vals.kg));

    /* ── Sección de impacto ── */
    if (impactoEls.agua)      animarNumero(impactoEls.agua,     vals.agua,     1);
    if (impactoEls.botellas)  animarNumero(impactoEls.botellas, vals.botellas, 0);
    if (impactoEls.kg)        animarNumero(impactoEls.kg,       vals.kg,       2);
    if (impactoEls.vendidos)  animarNumero(impactoEls.vendidos, vals.vendidos, 0);
  }

  /* ── Parsear respuesta de Firestore REST ───────────────── */
  function parseFirestoreDoc(json) {
    if (!json?.fields) return null;
    const out = {};
    for (const [key, val] of Object.entries(json.fields)) {
      if      (val.integerValue  !== undefined) out[key] = Number(val.integerValue);
      else if (val.doubleValue   !== undefined) out[key] = Number(val.doubleValue);
      else if (val.stringValue   !== undefined) out[key] = val.stringValue;
      else if (val.booleanValue  !== undefined) out[key] = val.booleanValue;
      else if (val.mapValue?.fields) {
        out[key] = parseFirestoreDoc(val.mapValue);
      }
    }
    return out;
  }

  /* ── Animación de contador ─────────────────────────────── */
  function animarNumero(el, target, decimales = 0) {
    if (!el || isNaN(target)) return;

    const duration  = 1800;
    const start     = performance.now();
    const from      = parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 0;

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);  /* ease-out cubic */
      const value    = from + (target - from) * eased;

      el.textContent = decimales > 0
        ? value.toFixed(decimales)
        : Math.floor(value).toString();

      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = decimales > 0 ? target.toFixed(decimales) : target.toString();
    }

    requestAnimationFrame(step);
  }

  function actualizarTexto(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  /* ── Formatos ────────────────────────────────────────────── */
  function formatAgua(litros) {
    if (!litros) return '—';
    return litros < 1
      ? `${Math.round(litros * 1000)} ml`
      : `${(Math.round(litros * 10) / 10)}L`;
  }

  function formatKg(kg) {
    if (!kg) return '—';
    return kg < 1
      ? `${Math.round(kg * 1000)} g`
      : `${(Math.round(kg * 10) / 10)} kg`;
  }

  /* ── Fallback legacy: actualiza por clase si no hay data-attrs ── */
  function initLegacy() {
    /* Se ejecuta solo si el HTML no tiene los atributos data-impact/data-metric.
       En ese caso los números estáticos del HTML se mantienen intactos.
       Ver DEPLOY.md sección "Agregar atributos data al HTML" para migrar. */
    console.info('LULIS: impacto-publico.js en modo legacy (HTML estático)');
  }

})();
