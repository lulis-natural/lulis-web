/* ═══════════════════════════════════════════════════════════
   LULIS Admin — direcciones.js
   CRUD de tiendas/direcciones (carrusel de ubicaciones).
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot,
  serverTimestamp
} from './firebase-init.js';

const COL = 'direcciones';
const $ = (id) => document.getElementById(id);

let allDirs   = [];
let editingId = null;
let deleteId  = null;

/* ─── Toast ──────────────────────────────────────────────── */
function toast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className   = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3500);
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('logoutBtn')?.addEventListener('click', signOut);
  $('btnNueva').addEventListener('click', openModalNew);
  $('modalClose').addEventListener('click', closeModal);
  $('btnCancelar').addEventListener('click', closeModal);
  $('btnGuardar').addEventListener('click', guardar);
  $('confirmCancel').addEventListener('click', () => $('confirmOverlay').classList.remove('open'));
  $('confirmDelete').addEventListener('click', ejecutarBorrado);
  subscribeDirecciones();
});

/* ─── Suscripción en tiempo real ─────────────────────────── */
function subscribeDirecciones() {
  const q = query(collection(db, COL), orderBy('orden', 'asc'));
  onSnapshot(q, (snap) => {
    allDirs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable();
    $('dirLoading').style.display = 'none';
  }, (err) => {
    console.warn('[direcciones]', err.code, err.message);
    $('dirLoading').style.display = 'none';
    if (err.code === 'permission-denied') {
      $('dirEmpty').style.display = 'block';
      $('dirEmpty').innerHTML = `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.4;margin-bottom:12px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <h3>Sin permisos para leer tiendas</h3>
        <p>Las reglas de Firestore bloquean el acceso. Verifica las reglas del proyecto.</p>`;
    } else {
      toast('Error al cargar tiendas: ' + (err.message || ''), 'error');
    }
  });
}

/* ─── Render tabla ───────────────────────────────────────── */
function renderTable() {
  const tbody = $('dirBody');

  if (!allDirs.length) {
    $('dirWrap').style.display  = 'none';
    $('dirEmpty').style.display = 'block';
    $('countDir').textContent   = '';
    return;
  }
  $('dirWrap').style.display  = 'block';
  $('dirEmpty').style.display = 'none';
  $('countDir').textContent   = `${allDirs.length} tienda${allDirs.length !== 1 ? 's' : ''}`;

  tbody.innerHTML = allDirs.map(d => {
    const tipoLabel = d.tipo === 'showroom' ? 'Showroom' : 'Punto de venta';
    const tipoBadge = d.tipo === 'showroom' ? 'badge-green' : 'badge-wine';
    const estadoBadge = d.activo ? 'badge-green' : 'badge-gray';
    const estadoLabel = d.activo ? 'Activa' : 'Oculta';

    return `
    <tr>
      <td><strong>${d.nombre || '—'}</strong></td>
      <td><span class="badge ${tipoBadge}">${tipoLabel}</span></td>
      <td><span style="font-size:.82rem;color:var(--mid)">${d.direccion || '—'}</span></td>
      <td><span style="font-size:.82rem">${d.horarios || '—'}</span></td>
      <td>${d.orden ?? '—'}</td>
      <td><span class="badge ${estadoBadge}">${estadoLabel}</span></td>
      <td>
        <div class="td-actions">
          <button class="btn btn-outline btn-sm btn-icon" onclick="editarDir('${d.id}')" title="Editar" aria-label="Editar">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="confirmarBorrado('${d.id}')" title="Eliminar" aria-label="Eliminar">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ─── Modal nuevo ────────────────────────────────────────── */
function openModalNew() {
  editingId = null;
  $('modalTitle').textContent     = 'Nueva tienda';
  $('btnGuardarText').textContent = 'Guardar tienda';
  $('dirForm').reset();
  $('dirId').value    = '';
  $('dActivo').checked = true;
  $('dOrden').value   = (allDirs.length || 0) + 1;
  $('modalOverlay').classList.add('open');
}

/* ─── Modal editar ───────────────────────────────────────── */
window.editarDir = function(id) {
  const d = allDirs.find(x => x.id === id);
  if (!d) return;
  editingId = id;
  $('modalTitle').textContent     = 'Editar tienda';
  $('btnGuardarText').textContent = 'Actualizar tienda';
  $('dirId').value         = id;
  $('dNombre').value       = d.nombre     || '';
  $('dTipo').value         = d.tipo       || '';
  $('dDireccion').value    = d.direccion  || '';
  $('dMapsQuery').value    = d.mapsQuery  || '';
  $('dMapsUrl').value      = d.mapsUrl    || '';
  $('dHorarios').value     = d.horarios   || '';
  $('dWhatsapp').value     = d.whatsapp   || '';
  $('dNotas').value        = d.notas      || '';
  $('dOrden').value        = d.orden      ?? '';
  $('dActivo').checked     = d.activo !== false;
  $('modalOverlay').classList.add('open');
};

/* ─── Guardar / Actualizar ───────────────────────────────── */
async function guardar() {
  const nombre    = $('dNombre').value.trim();
  const tipo      = $('dTipo').value;
  const direccion = $('dDireccion').value.trim();
  const mapsQuery = $('dMapsQuery').value.trim();
  const horarios  = $('dHorarios').value.trim();

  if (!nombre || !tipo || !direccion || !mapsQuery || !horarios) {
    toast('Completa los campos obligatorios', 'error');
    return;
  }

  setBtnLoading(true);
  try {
    const data = {
      nombre,
      tipo,
      direccion,
      mapsQuery,
      mapsUrl:     $('dMapsUrl').value.trim()  || null,
      horarios,
      whatsapp:    $('dWhatsapp').value.trim() || null,
      notas:       $('dNotas').value.trim()    || null,
      orden:       parseInt($('dOrden').value) || 99,
      activo:      $('dActivo').checked,
      actualizadoEn: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, COL, editingId), data);
      toast('Tienda actualizada ✅', 'success');
    } else {
      data.creadoEn = serverTimestamp();
      await addDoc(collection(db, COL), data);
      toast('Tienda creada ✅', 'success');
    }

    closeModal();
  } catch (err) {
    console.error(err);
    toast('Error al guardar: ' + (err.message || ''), 'error');
  } finally {
    setBtnLoading(false);
  }
}

/* ─── Eliminar ───────────────────────────────────────────── */
window.confirmarBorrado = function(id) {
  deleteId = id;
  $('confirmOverlay').classList.add('open');
};

async function ejecutarBorrado() {
  if (!deleteId) return;
  $('confirmOverlay').classList.remove('open');
  try {
    await deleteDoc(doc(db, COL, deleteId));
    toast('Tienda eliminada', 'success');
  } catch (err) {
    toast('Error al eliminar: ' + (err.message || ''), 'error');
  }
  deleteId = null;
}

/* ─── Helpers ────────────────────────────────────────────── */
function closeModal() {
  $('modalOverlay').classList.remove('open');
  editingId = null;
}

function setBtnLoading(on) {
  $('btnGuardar').disabled             = on;
  $('btnGuardarText').style.display    = on ? 'none' : 'block';
  $('btnGuardarSpinner').style.display = on ? 'block' : 'none';
}
