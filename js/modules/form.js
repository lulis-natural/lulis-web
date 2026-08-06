/* ═══════════════════════════════════════════════════════════
   LULIS — modules/form.js
   Formulario de contacto → envía via FormSubmit (gratis) a
   lulis.natural@gmail.com. Adicionalmente, intenta guardar en
   Firestore como backup (si las reglas lo permiten).
   ═══════════════════════════════════════════════════════════ */

(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', handleSubmit);

  async function handleSubmit(e) {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const originalText = btn.textContent;
    btn.textContent = 'Enviando...';
    btn.disabled    = true;

    const data = {
      nombre:   (form.fname?.value   || form.nombre?.value   || '').trim(),
      email:    (form.femail?.value  || form.email?.value    || '').trim(),
      telefono: (form.fphone?.value  || form.telefono?.value || '').trim(),
      asunto:   (form.fsubject?.value|| form.asunto?.value   || '').trim(),
      mensaje:  (form.fmessage?.value|| form.mensaje?.value  || '').trim(),
    };

    /* Validar campos requeridos */
    if (!data.nombre || !data.email || !data.mensaje) {
      showToast('Por favor completa todos los campos requeridos.', 'error');
      btn.textContent = originalText;
      btn.disabled = false;
      return;
    }

    /* Backup en Firestore (no bloquea si falla) */
    const projectId = window.LULIS_CONFIG?.firebaseProjectId;
    if (projectId) {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/mensajes`;
        const body = {
          fields: {
            nombre:     { stringValue: data.nombre },
            email:      { stringValue: data.email },
            telefono:   { stringValue: data.telefono },
            asunto:     { stringValue: data.asunto },
            mensaje:    { stringValue: data.mensaje },
            leido:      { booleanValue: false },
            respondido: { booleanValue: false },
            origen:     { stringValue: 'formulario-web' },
            creadoEn:   { timestampValue: new Date().toISOString() },
          }
        };
        await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        });
      } catch (err) {
        console.warn('LULIS form: backup Firestore no enviado:', err.message);
      }
    }

    /* Enviar via FormSubmit (gratis, sin tarjeta) */
    try {
      const formData = new FormData(form);
      const res = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok || res.status === 0) {
        form.reset();
        showToast('¡Mensaje enviado! Te respondemos pronto.', 'success');
      } else {
        throw new Error(`FormSubmit ${res.status}`);
      }
    } catch (err) {
      // Si FormSubmit falla, fallback a mailto:
      const subject = encodeURIComponent(`[LULIS Web] ${data.asunto || 'Consulta'}`);
      const body = encodeURIComponent(
        `Nombre: ${data.nombre}\nEmail: ${data.email}\nTeléfono: ${data.telefono}\n\nMensaje:\n${data.mensaje}`
      );
      window.location.href = `mailto:lulis.natural@gmail.com?subject=${subject}&body=${body}`;
      showToast('Abriendo tu cliente de correo...', 'success');
      form.reset();
    }

    btn.textContent = originalText;
    btn.disabled = false;
  }

  function showToast(msg, type) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast is-show ' + (type || 'success');
    setTimeout(() => t.classList.remove('is-show'), 4000);
  }
})();
