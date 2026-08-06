/* ═══════════════════════════════════════════════════════════
   LULIS Admin — mensajes.js
   Bandeja de mensajes: listar, leer, marcar, eliminar.
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  collection, doc,
  updateDoc, deleteDoc, writeBatch,
  query, orderBy, onSnapshot,
  serverTimestamp
} from './firebase-init.js';

const $   = (id) => document.getElementById(id);
const COL = 'mensajes';

let allMsgs   = [];
let activeId  = null;
let deleteId  = null;

function toast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className   = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3500);
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('logoutBtn')?.addEventListener('click', signOut);
  $('searchMsg').addEventListener('input', renderList);
  $('filterLeido').addEventListener('change', renderList);
  $('btnMarkAllRead').addEventListener('click', marcarTodosLeidos);
  $('confirmCancel').addEventListener('click', () => $('confirmOverlay').classList.remove('open'));
  $('confirmDelete').addEventListener('click', ejecutarBorrado);
  subscribeMessages();
});

/* ─── Suscripción ────────────────────────────────────────── */
function subscribeMessages() {
  const q = query(collection(db, COL), orderBy('creadoEn', 'desc'));
  onSnapshot(q, (snap) => {
    allMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderList();
    $('msgLoading').style.display = 'none';

    /* Badge sidebar */
    const noLeidos = allMsgs.filter(m => !m.leido).length;
    const badge    = $('sb-unread');
    if (badge) {
      badge.textContent   = noLeidos;
      badge.style.display = noLeidos > 0 ? 'block' : 'none';
    }
  }, (err) => {
    console.warn('[mensajes]', err.code, err.message);
    $('msgLoading').style.display = 'none';
    if (err.code === 'permission-denied') {
      $('msgEmpty').style.display = 'block';
      $('msgEmpty').innerHTML = `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.4;margin-bottom:12px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <h3>Sin permisos para leer mensajes</h3>
        <p>Las reglas de Firestore bloquean el acceso. Verifica las reglas del proyecto.</p>`;
    } else {
      toast('Error al cargar mensajes: ' + (err.message || ''), 'error');
    }
  });
}

/* ─── Render lista ───────────────────────────────────────── */
function renderList() {
  const search = $('searchMsg').value.toLowerCase();
  const leido  = $('filterLeido').value;

  const filtered = allMsgs.filter(m => {
    const matchSearch = !search
      || (m.nombre  || '').toLowerCase().includes(search)
      || (m.email   || '').toLowerCase().includes(search)
      || (m.mensaje || '').toLowerCase().includes(search);
    const matchLeido = leido === '' || String(!!m.leido) === leido;
    return matchSearch && matchLeido;
  });

  const list = $('msgList');

  if (!filtered.length) {
    list.innerHTML              = '';
    $('msgEmpty').style.display = 'block';
    return;
  }
  $('msgEmpty').style.display = 'none';

  list.innerHTML = filtered.map(m => {
    const ini  = (m.nombre || '?').charAt(0).toUpperCase();
    const date = m.creadoEn
      ? (m.creadoEn.toDate ? m.creadoEn.toDate() : new Date(m.creadoEn))
          .toLocaleDateString('es-BO', { day:'2-digit', month:'short' })
      : '—';
    return `
      <div class="msg-item ${!m.leido ? 'unread' : ''} ${m.id === activeId ? 'active' : ''}"
           onclick="abrirMensaje('${m.id}')" style="cursor:pointer">
        <div class="msg-avatar" style="background:${stringToColor(m.nombre || '?')}">${ini}</div>
        <div style="overflow:hidden">
          <div class="msg-sender">${escapeHtml(m.nombre) || '—'} <small style="font-weight:400;color:var(--mid)">&lt;${escapeHtml(m.email) || ''}&gt;</small></div>
          <div class="msg-subject">${escapeHtml(m.asunto) || 'Sin asunto'}</div>
          <div class="msg-preview">${escapeHtml((m.mensaje || '').substring(0, 80))}…</div>
        </div>
        <div class="msg-date">${date}</div>
      </div>`;
  }).join('');
}

/* ─── Abrir mensaje ──────────────────────────────────────── */
window.abrirMensaje = async function(id) {
  activeId = id;
  const m  = allMsgs.find(x => x.id === id);
  if (!m) return;

  renderList(); /* re-render para highlight */

  /* Marcar como leído */
  if (!m.leido) {
    try {
      await updateDoc(doc(db, COL, id), {
        leido:     true,
        leidoEn:   serverTimestamp(),
      });
    } catch (err) {
      console.warn('No se pudo marcar como leído:', err.message);
    }
  }

  /* SVGs inline para reemplazar emojis */
  const svgMail  = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
  const svgPhone = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  const svgCal   = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  const svgTag   = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
  const svgDel   = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
  const svgCheck = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>';

  /* Renderizar detalle */
  const detail = $('msgDetail');
  detail.innerHTML = `
    <div class="msg-detail-header">
      <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:12px">
        <div>
          <div class="msg-detail-sender">${escapeHtml(m.nombre) || '—'}</div>
          <div class="msg-detail-meta">
            <span>${svgMail} ${escapeHtml(m.email) || '—'}</span>
            ${m.telefono ? `<span>${svgPhone} ${escapeHtml(m.telefono)}</span>` : ''}
            <span>${svgCal} ${formatDate(m.creadoEn)}</span>
            ${m.asunto ? `<span>${svgTag} ${escapeHtml(m.asunto)}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${m.email ? `
            <a href="mailto:${escapeHtml(m.email)}?subject=Re: ${encodeURIComponent(m.asunto || 'Tu mensaje en LULIS')}"
               class="btn btn-emerald btn-sm">${svgMail} Responder</a>` : ''}
          ${m.telefono ? `
            <a href="https://wa.me/${m.telefono.replace(/\D/g, '')}"
               class="btn btn-sm" style="background:#25D366;color:#fff"
               target="_blank" rel="noopener noreferrer">${svgPhone} WhatsApp</a>` : ''}
          <button class="btn btn-danger btn-sm" onclick="confirmarBorrado('${id}')">${svgDel}Eliminar</button>
        </div>
      </div>
    </div>
    <div class="msg-detail-body">${escapeHtml(m.mensaje) || ''}</div>
    ${m.respondido ? `
      <div style="margin-top:16px;padding:12px 16px;background:#d1fae5;border-radius:var(--radius);font-size:.82rem;color:#065f46;display:flex;align-items:center;gap:6px">
        ${svgCheck} Respondido el ${formatDate(m.respondidoEn)}
      </div>` : `
      <div style="margin-top:16px">
        <button class="btn btn-outline btn-sm" onclick="marcarRespondido('${id}')">
          ${svgCheck} Marcar como respondido
        </button>
      </div>`}`;
};

window.marcarRespondido = async function(id) {
  try {
    await updateDoc(doc(db, COL, id), {
      respondido:   true,
      respondidoEn: serverTimestamp(),
    });
    toast('Marcado como respondido', 'success');
    abrirMensaje(id);
  } catch (err) {
    toast('Error: ' + (err.message || ''), 'error');
  }
};

/* ─── Marcar todos leídos ────────────────────────────────── */
async function marcarTodosLeidos() {
  const noLeidos = allMsgs.filter(m => !m.leido);
  if (!noLeidos.length) { toast('No hay mensajes sin leer'); return; }

  try {
    const wb = writeBatch(db);
    noLeidos.forEach(m => wb.update(doc(db, COL, m.id), { leido: true }));
    await wb.commit();
    toast(`${noLeidos.length} mensajes marcados como leídos`, 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ─── Borrar ─────────────────────────────────────────────── */
window.confirmarBorrado = function(id) {
  deleteId = id;
  $('confirmOverlay').classList.add('open');
};

async function ejecutarBorrado() {
  $('confirmOverlay').classList.remove('open');
  if (!deleteId) return;
  try {
    await deleteDoc(doc(db, COL, deleteId));
    if (activeId === deleteId) {
      activeId = null;
      $('msgDetail').innerHTML = `<div class="inbox-empty-detail">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <p>Selecciona un mensaje para leerlo</p>
      </div>`;
    }
    toast('Mensaje eliminado', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
  deleteId = null;
}

/* ─── Helpers ────────────────────────────────────────────── */
function stringToColor(str) {
  const colors = ['#5F0F3F','#824670','#07BC8A','#FF694C','#F4BF56','#3b82f6'];
  let hash = 0;
  for (const c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
