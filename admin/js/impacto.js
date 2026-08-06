/* ═══════════════════════════════════════════════════════════
   LULIS Admin — impacto.js (v2 — cálculo automático)

   El admin ingresa ÚNICAMENTE las unidades vendidas por tipo.
   impacto-engine.js calcula todo lo demás automáticamente.
   Los resultados se guardan en Firestore y el sitio público
   los muestra en tiempo real.
   ═══════════════════════════════════════════════════════════ */

import {
  db, auth, signOut,
  doc, collection,
  setDoc, addDoc,
  onSnapshot,
  query, orderBy, limit,
  serverTimestamp
} from './firebase-init.js';

/* Cargar el motor de cálculo (ruta relativa desde admin/) */
const engineScript     = document.createElement('script');
engineScript.src       = '../js/services/impacto-engine.js';
engineScript.onload    = () => init();
engineScript.onerror   = () => {
  console.error('No se pudo cargar impacto-engine.js');
  init(); /* continuar sin el motor — modo manual */
};
document.head.appendChild(engineScript);

const $   = (id) => document.getElementById(id);
const DOC = 'acumulado';
const COL = 'impacto_ambiental';

/* ─── Toast ──────────────────────────────────────────────── */
function toast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className   = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3500);
}

/* ─── Init ───────────────────────────────────────────────── */
function init() {
  $('logoutBtn')?.addEventListener('click', signOut);
  $('btnGuardar').addEventListener('click', solicitarConfirmacion);
  $('confirmCancel').addEventListener('click', () => $('confirmOverlay').classList.remove('open'));
  $('confirmSave').addEventListener('click', guardarCambios);

  /* Recalcular en tiempo real cuando el admin cambia las ventas */
  ['vShampoo50', 'vShampoo100', 'vAcond50'].forEach(id => {
    $(id)?.addEventListener('input', recalcular);
  });

  cargarDatos();
  cargarHistorial();
}

/* ─── Cargar datos actuales desde Firestore ──────────────── */
function cargarDatos() {
  onSnapshot(doc(db, COL, DOC), (snap) => {
    $('pageLoading').style.display    = 'none';
    $('impactoContent').style.display = 'block';

    if (!snap.exists()) {
      /* Sin datos aún, solo recalcular para mostrar 0s */
      recalcular();
      return;
    }

    const d = snap.data();

    /* Rellenar los campos de ventas (inputs del admin) */
    $('vShampoo50').value  = d.ventas?.shampoos50g  ?? '';
    $('vShampoo100').value = d.ventas?.shampoos100g ?? '';
    $('vAcond50').value    = d.ventas?.acond50g     ?? '';
    $('mNota').value       = '';

    recalcular();
  }, (err) => {
    console.warn('[impacto]', err.code, err.message);
    $('pageLoading').style.display    = 'none';
    $('impactoContent').style.display = 'block';
    if (err.code === 'permission-denied') {
      toast('Sin permisos para leer el impacto ambiental. Verifica las reglas.', 'error');
    } else {
      toast('Error al cargar: ' + (err.message || ''), 'error');
    }
  });
}

/* ─── Recalcular con el motor ────────────────────────────── */
function recalcular() {
  const ventas = leerVentas();
  const engine = window.LULIS_IMPACTO;

  if (!engine) {
    /* Motor no disponible: mostrar guiones */
    ['res-vendidos','res-botellas','res-agua','res-kg'].forEach(id => {
      const el = $(id);
      if (el) el.textContent = '—';
    });
    return;
  }

  const { valido, errores } = engine.validar(ventas);
  if (!valido) {
    mostrarErroresValidacion(errores);
    return;
  }
  limpiarErrores();

  const r = engine.calcular(ventas);
  actualizarResultados(r);
}

function leerVentas() {
  return {
    shampoos50g:  parseInt($('vShampoo50').value)  || 0,
    shampoos100g: parseInt($('vShampoo100').value) || 0,
    acond50g:     parseInt($('vAcond50').value)    || 0,
  };
}

/* ─── Actualizar tabla de resultados ─────────────────────── */
function actualizarResultados(r) {
  /* Totales */
  $('res-vendidos').textContent = r.totalVendidos;
  $('res-botellas').textContent = r.botellasReemplazadas;
  $('res-agua').textContent     = `${r.litrosAguaEvitados} L`;
  $('res-kg').textContent       = `${r.kgPlasticoEvitado} kg`;

  /* Desglose shampoo 50g */
  $('des-s50-u').textContent  = r.desglose.shampoos50g.unidades;
  $('des-s50-b').textContent  = r.desglose.shampoos50g.botellas;
  $('des-s50-l').textContent  = `${r.desglose.shampoos50g.litros} L`;
  $('des-s50-k').textContent  = `${r.desglose.shampoos50g.kg} kg`;

  /* Desglose shampoo 100g */
  $('des-s100-u').textContent = r.desglose.shampoos100g.unidades;
  $('des-s100-b').textContent = r.desglose.shampoos100g.botellas;
  $('des-s100-l').textContent = `${r.desglose.shampoos100g.litros} L`;
  $('des-s100-k').textContent = `${r.desglose.shampoos100g.kg} kg`;

  /* Desglose acondicionador */
  $('des-a50-u').textContent  = r.desglose.acond50g.unidades;
  $('des-a50-b').textContent  = r.desglose.acond50g.botellas;
  $('des-a50-l').textContent  = `${r.desglose.acond50g.litros} L`;
  $('des-a50-k').textContent  = `${r.desglose.acond50g.kg} kg`;

  /* Preview de cómo se verá en el sitio */
  $('prev-vendidos').textContent = r.totalVendidos;
  $('prev-botellas').textContent = r.botellasReemplazadas;
  $('prev-agua').textContent     = r.hero.agua;
  $('prev-kg').textContent       = r.hero.plastico;

  /* Guardar resultado para usar al confirmar */
  window._impactoResultado = r;
}

/* ─── Confirmación ───────────────────────────────────────── */
function solicitarConfirmacion() {
  const engine = window.LULIS_IMPACTO;
  const r      = window._impactoResultado;

  if (!r) { toast('Ingresa las ventas primero', 'error'); return; }

  $('confirmMsg').innerHTML = engine
    ? `<strong>${engine.resumir(r)}</strong><br><small>Los números se publicarán inmediatamente en el sitio.</small>`
    : 'Los cambios se publicarán en el sitio inmediatamente.';

  $('confirmOverlay').classList.add('open');
}

/* ─── Guardar en Firestore ───────────────────────────────── */
async function guardarCambios() {
  $('confirmOverlay').classList.remove('open');
  setBtnLoading(true);

  const r    = window._impactoResultado;
  const nota = $('mNota').value.trim();

  if (!r) { setBtnLoading(false); return; }

  const payload = {
    /* Inputs — ventas por tipo */
    ventas: {
      shampoos50g:  r.ventas.shampoos50g,
      shampoos100g: r.ventas.shampoos100g,
      acond50g:     r.ventas.acond50g,
    },
    /* Resultados calculados automáticamente */
    totalVendidos:        r.totalVendidos,
    botellasReemplazadas: r.botellasReemplazadas,
    litrosAguaEvitados:   r.litrosAguaEvitados,
    kgPlasticoEvitado:    r.kgPlasticoEvitado,

    /* Compatibilidad con campos legacy */
    productosVendidos:   r.totalVendidos,
    envasesEvitados:     Math.round(r.botellasReemplazadas),
    litrosAguaAhorrados: r.litrosAguaEvitados,
    kgPlasticoEliminado: r.kgPlasticoEvitado,

    /* Strings formateados para el hero del sitio público */
    hero: {
      vendidos: r.hero.vendidos,
      botellas: r.hero.botellas,
      agua:     r.hero.agua,
      plastico: r.hero.plastico,
    },

    /* Constantes usadas (para auditoría) */
    constantesUsadas: {
      botellasPorShampoo50g:  1.5,
      botellasPorShampoo100g: 3.0,
      botellasPorAcond50g:    1.0,
      botellaMl:              350,
      aguaPct:                0.80,
      plasticoKgPorBotella:   0.025,
    },

    actualizadoEn:  serverTimestamp(),
    actualizadoPor: auth.currentUser?.email || 'admin',
  };

  try {
    await setDoc(doc(db, COL, DOC), payload, { merge: true });

    await addDoc(collection(db, COL, DOC, 'historial'), {
      ...payload,
      nota,
      guardadoEn: serverTimestamp(),
    });

    $('mNota').value         = '';
    window._impactoResultado = null;
    toast('✅ Métricas calculadas y publicadas en el sitio', 'success');
  } catch (err) {
    console.error(err);
    toast('Error al guardar: ' + err.message, 'error');
  } finally {
    setBtnLoading(false);
  }
}

/* ─── Historial ──────────────────────────────────────────── */
function cargarHistorial() {
  const q = query(
    collection(db, COL, DOC, 'historial'),
    orderBy('guardadoEn', 'desc'),
    limit(20)
  );

  onSnapshot(q, (snap) => {
    $('historialLoading').style.display = 'none';

    if (snap.empty) {
      $('historialEmpty').style.display = 'block';
      return;
    }

    $('historialWrap').style.display = 'block';
    $('historialEmpty').style.display = 'none';
    $('historialBody').innerHTML = snap.docs.map(d => {
      const h = d.data();
      const fecha = h.guardadoEn?.toDate?.()
        .toLocaleDateString('es-BO', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }) ?? '—';

      return `<tr>
        <td style="white-space:nowrap;font-size:.78rem">${fecha}</td>
        <td>${h.ventas?.shampoos50g  ?? '—'}</td>
        <td>${h.ventas?.shampoos100g ?? '—'}</td>
        <td>${h.ventas?.acond50g     ?? '—'}</td>
        <td><strong>${h.totalVendidos ?? '—'}</strong></td>
        <td>${h.botellasReemplazadas ?? '—'}</td>
        <td>${h.litrosAguaEvitados   ?? '—'} L</td>
        <td>${h.kgPlasticoEvitado    ?? '—'} kg</td>
        <td style="font-size:.78rem;color:var(--mid)">${h.nota || '—'}</td>
        <td style="font-size:.75rem;color:var(--mid)">${h.actualizadoPor || '—'}</td>
      </tr>`;
    }).join('');
  }, (err) => {
    console.warn('[impacto historial]', err.code, err.message);
    $('historialLoading').style.display = 'none';
    $('historialEmpty').style.display = 'block';
  });
}

/* ─── Helpers ────────────────────────────────────────────── */
function setBtnLoading(on) {
  $('btnGuardar').disabled              = on;
  $('btnGuardarText').style.display     = on ? 'none'  : 'inline';
  $('btnGuardarSpinner').style.display  = on ? 'block' : 'none';
}

function mostrarErroresValidacion(errores) {
  console.warn('Validación:', errores);
}
function limpiarErrores() {}
