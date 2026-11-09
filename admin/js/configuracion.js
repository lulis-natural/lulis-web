/* ═══════════════════════════════════════════════════════════
   LULIS Admin — configuracion.js
   Gestión de datos de la marca, contacto, redes y avisos.
   ═══════════════════════════════════════════════════════════ */

import {
  db, signOut,
  doc, setDoc, getDoc,
  serverTimestamp
} from './firebase-init.js';

const CONFIG_DOC = 'sitio';
const CONFIG_COL = 'configuracion';
const LOCAL_CONFIG_KEY = 'lulis_sitio_config_v2';

const $ = (id) => document.getElementById(id);

function toast(msg, type = '') {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  $('logoutBtn')?.addEventListener('click', signOut);
  $('btnGuardarConfig')?.addEventListener('click', guardarConfiguracion);
  cargarConfiguracion();
});

async function cargarConfiguracion() {
  // Valores por defecto
  let data = {
    whatsapp: '59173515698',
    email: 'lulis.natural@gmail.com',
    mensajeWhatsApp: 'Hola LULIS 👋 Me interesa saber más sobre sus productos y envíos.',
    instagram: 'https://www.instagram.com/lulis.natural?igsh=c3l1dmRkenM3eDR6',
    facebook: 'https://www.facebook.com/share/14iBbMU7oS6/',
    tiktok: 'https://tiktok.com/@lulis.natural',
    bannerActivo: true,
    bannerTexto: '🌿 ¡Envíos a toda Bolivia! Cosmética consciente hecha a mano en La Paz. Cero plástico.'
  };

  // 1. Intentar Firestore
  try {
    const snap = await getDoc(doc(db, CONFIG_COL, CONFIG_DOC));
    if (snap.exists()) {
      data = { ...data, ...snap.data() };
    }
  } catch (err) {
    console.warn('[configuracion] Usando cache local:', err.message);
    try {
      const cached = localStorage.getItem(LOCAL_CONFIG_KEY);
      if (cached) data = { ...data, ...JSON.parse(cached) };
    } catch (_) {}
  }

  // Poblar formulario
  if ($('cWhatsApp')) $('cWhatsApp').value = data.whatsapp || '';
  if ($('cEmail')) $('cEmail').value = data.email || '';
  if ($('cMensajeWhatsApp')) $('cMensajeWhatsApp').value = data.mensajeWhatsApp || '';
  if ($('cInstagram')) $('cInstagram').value = data.instagram || '';
  if ($('cFacebook')) $('cFacebook').value = data.facebook || '';
  if ($('cTikTok')) $('cTikTok').value = data.tiktok || '';
  if ($('cBannerActivo')) $('cBannerActivo').checked = data.bannerActivo !== false;
  if ($('cBannerTexto')) $('cBannerTexto').value = data.bannerTexto || '';
}

async function guardarConfiguracion(e) {
  if (e) e.preventDefault();

  const whatsapp = $('cWhatsApp').value.trim();
  const email    = $('cEmail').value.trim();

  if (!whatsapp || !email) {
    toast('WhatsApp y Correo son obligatorios', 'error');
    return;
  }

  setBtnLoading(true);

  const configData = {
    whatsapp,
    email,
    mensajeWhatsApp: $('cMensajeWhatsApp').value.trim(),
    instagram:       $('cInstagram').value.trim(),
    facebook:        $('cFacebook').value.trim(),
    tiktok:          $('cTikTok').value.trim(),
    bannerActivo:    $('cBannerActivo').checked,
    bannerTexto:     $('cBannerTexto').value.trim(),
    actualizadoEn:   serverTimestamp ? serverTimestamp() : new Date().toISOString()
  };

  try {
    // Guardar en Firestore
    try {
      await setDoc(doc(db, CONFIG_COL, CONFIG_DOC), configData, { merge: true });
    } catch (e) {
      console.warn('Firestore no disponible, guardando localmente:', e);
    }

    // Guardar en cache local
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(configData));
    toast('Configuración guardada exitosamente ✅', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  } finally {
    setBtnLoading(false);
  }
}

function setBtnLoading(on) {
  if ($('btnGuardarConfig')) $('btnGuardarConfig').disabled = on;
  if ($('btnGuardarText')) $('btnGuardarText').style.display = on ? 'none' : 'block';
  if ($('btnGuardarSpinner')) $('btnGuardarSpinner').style.display = on ? 'block' : 'none';
}
