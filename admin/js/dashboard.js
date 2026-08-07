/* ═══════════════════════════════════════════════════════════
   LULIS Admin — dashboard.js
   Carga estadísticas en tiempo real con onSnapshot.
   Maneja errores de permission-denied gracefully.
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  collection, doc, query, orderBy, limit,
  onSnapshot
} from './firebase-init.js';

/* ─── UI helpers ─────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const toast = (msg, type = '') => {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3500);
};

/* Suscripción segura que no rompe la página si hay permission-denied */
function safeSubscribe(name, buildQuery, onData, onError) {
  try {
    const q = buildQuery();
    return onSnapshot(q,
      (snap) => onData(snap),
      (err) => {
        console.warn(`[${name}] ${err.code}: ${err.message}`);
        if (onError) onError(err);
        // Mostrar 0/— en lugar del error
        onData({ size: 0, docs: [], empty: true, forEach: () => {}, error: err });
      }
    );
  } catch (err) {
    console.warn(`[${name}] setup error:`, err.message);
    return () => {};
  }
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-BO', { day:'2-digit', month:'short' });
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('logoutBtn')?.addEventListener('click', signOut);
  initDashboard();
});

function initDashboard() {
  /* Mostrar contenido cuando auth.js confirme la sesión */
  const observer = new MutationObserver(() => {
    if (document.body.style.visibility === 'visible') {
      observer.disconnect();
      loadAll();
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

  /* También intentar directamente */
  setTimeout(loadAll, 600);
}

let _loaded = false;
function loadAll() {
  if (_loaded) return;
  _loaded = true;

  $('pageLoading').style.display  = 'none';
  $('dashContent').style.display  = 'block';

  subscribeProductos();
  subscribeVentas();
  subscribeMensajes();
  subscribeGaleria();
  subscribeImpacto();
  loadLastMensajes();
  loadLastVentas();
}

/* ─── Suscripciones en tiempo real ───────────────────────── */
function subscribeProductos() {
  safeSubscribe('productos',
    () => query(collection(db, 'productos')),
    (snap) => {
      if (snap.error) {
        $('st-productos').textContent = '0';
        $('st-productos-sub').textContent = 'Sin datos';
        return;
      }
      const total    = snap.size;
      const activos  = snap.docs.filter(d => d.data().disponible).length;
      $('st-productos').textContent     = activos;
      $('st-productos-sub').textContent = `${total} total · ${total - activos} sin stock`;
    }
  );
}

function subscribeVentas() {
  safeSubscribe('ventas',
    () => query(collection(db, 'ventas')),
    (snap) => {
      if (snap.error) {
        $('st-ventas').textContent = '0';
        $('st-ventas-sub').textContent = 'Sin datos';
        return;
      }
      const total  = snap.size;
      const monto  = snap.docs.reduce((s, d) => s + (d.data().total || 0), 0);
      $('st-ventas').textContent     = total;
      $('st-ventas-sub').textContent = `Bs ${monto.toFixed(0)} acumulado`;
    }
  );
}

function subscribeMensajes() {
  safeSubscribe('mensajes',
    () => query(collection(db, 'mensajes')),
    (snap) => {
      if (snap.error) {
        $('st-mensajes').textContent = '0';
        $('st-mensajes-sub').textContent = 'Sin datos';
        const badge = $('sb-unread');
        if (badge) badge.style.display = 'none';
        return;
      }
      const noLeidos = snap.docs.filter(d => !d.data().leido).length;
      $('st-mensajes').textContent     = noLeidos;
      $('st-mensajes-sub').textContent = `${snap.size} mensajes totales`;

      /* Badge en sidebar */
      const badge = $('sb-unread');
      if (badge) {
        badge.textContent    = noLeidos;
        badge.style.display  = noLeidos > 0 ? 'block' : 'none';
      }
    }
  );
}

function subscribeGaleria() {
  safeSubscribe('galeria',
    () => query(collection(db, 'galeria')),
    (snap) => {
      if (snap.error) {
        $('st-galeria').textContent = '0';
        $('st-galeria-sub').textContent = 'Sin datos';
        return;
      }
      const activos = snap.docs.filter(d => d.data().activo).length;
      $('st-galeria').textContent     = activos;
      $('st-galeria-sub').textContent = `${snap.size} total · ${snap.size - activos} ocultos`;
    }
  );
}

function subscribeImpacto() {
  safeSubscribe('impacto',
    () => doc(db, 'impacto_ambiental', 'acumulado'),
    (snap) => {
      if (snap.error || !snap.exists) {
        $('imp-agua').textContent     = '0';
        $('imp-plastico').textContent = '0';
        $('imp-kg').textContent       = '0';
        $('imp-vendidos').textContent = '0';
        return;
      }
      const d = snap.data();
      // Soportar tanto nombres legacy como nuevos
      $('imp-agua').textContent      = d.litrosAguaAhorrados ?? d.litrosAguaEvitados ?? '—';
      $('imp-plastico').textContent  = d.envasesEvitados      ?? d.botellasReemplazadas ?? '—';
      $('imp-kg').textContent        = d.kgPlasticoEliminado  ?? d.kgPlasticoEvitado  ?? '—';
      $('imp-vendidos').textContent  = d.productosVendidos    ?? d.totalVendidos       ?? '—';
    }
  );
}

/* ─── Listas de vista previa ─────────────────────────────── */
function loadLastMensajes() {
  safeSubscribe('lastMensajes',
    () => query(collection(db, 'mensajes'), orderBy('creadoEn', 'desc'), limit(5)),
    (snap) => {
      const container = $('lastMsgs');
      if (!container) return;

      if (snap.error || snap.empty) {
        container.innerHTML = `<div class="empty-state" style="padding:28px">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.4;margin-bottom:8px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <p>${snap.error ? 'Sin acceso a mensajes' : 'Sin mensajes aún'}</p>
        </div>`;
        return;
      }

      container.innerHTML = snap.docs.map(d => {
        const m   = d.data();
        const ini = (m.nombre || '?').charAt(0).toUpperCase();
        return `
        <div class="msg-item ${!m.leido ? 'unread' : ''}">
          <div class="msg-avatar">${ini}</div>
          <div>
            <div class="msg-sender">${m.nombre || '—'}</div>
            <div class="msg-preview">${(m.mensaje || '').substring(0, 80)}…</div>
          </div>
          <div class="msg-date">${formatDate(m.creadoEn)}</div>
        </div>`;
      }).join('');
    }
  );
}

function loadLastVentas() {
  safeSubscribe('lastVentas',
    () => query(collection(db, 'ventas'), orderBy('creadoEn', 'desc'), limit(5)),
    (snap) => {
      const container = $('lastVentas');
      if (!container) return;

      if (snap.error || snap.empty) {
        container.innerHTML = `<div class="empty-state" style="padding:28px">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.4;margin-bottom:8px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <p>${snap.error ? 'Sin acceso a ventas' : 'Sin ventas registradas aún'}</p>
        </div>`;
        return;
      }

      container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Cliente</th><th>Total</th><th>Canal</th><th>Estado</th><th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${snap.docs.map(d => {
            const v = d.data();
            const estadoBadge = {
              pendiente:  'badge-orange',
              confirmado: 'badge-green',
              entregado:  'badge-blue',
              cancelado:  'badge-red',
            }[v.estado] || 'badge-gray';
            return `
              <tr>
                <td>${v.cliente?.nombre || '—'}</td>
                <td><strong>Bs ${(v.total || 0).toFixed(0)}</strong></td>
                <td>${v.canal || '—'}</td>
                <td><span class="badge ${estadoBadge}">${v.estado || '—'}</span></td>
                <td>${formatDate(v.creadoEn)}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;
    }
  );
}
