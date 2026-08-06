/* ═══════════════════════════════════════════════════════════
   LULIS Admin — firebase-init.js
   Inicialización centralizada de Firebase para el panel.
   Todos los módulos admin importan desde aquí.

   ⚠️  ANTES DE USAR:
   Reemplaza los valores de firebaseConfig con los de tu
   proyecto en: Firebase Console → Configuración → Tu app web
   ═══════════════════════════════════════════════════════════ */

import { initializeApp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signOut as fbSignOut }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  collection, doc,
  getDocs, getDoc,
  addDoc, setDoc, updateDoc, deleteDoc,
  writeBatch,
  query, where, orderBy, limit,
  onSnapshot,
  serverTimestamp, Timestamp,
  increment
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getStorage,
  ref, uploadBytesResumable,
  getDownloadURL, deleteObject
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

/* ── Configuración ──
   👇 PEGA AQUÍ TUS API KEYS DE FIREBASE 👇
   Obtén estas claves en: Firebase Console → Project Settings → Your apps → Web app
*/
const firebaseConfig = {
  apiKey:            "TU_API_KEY_AQUI",
  authDomain:        "TU_PROYECTO.firebaseapp.com",
  projectId:         "TU_PROYECTO",
  storageBucket:     "TU_PROYECTO.firebasestorage.app",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId:             "TU_APP_ID",
  // measurementId es opcional, solo si usas Google Analytics
  // measurementId: "G-XXXXXXXXXX"
};

/* ── Inicializar ── */
const app     = initializeApp(firebaseConfig);
const auth    = getAuth(app);
const db      = getFirestore(app);
const storage = getStorage(app);

/* ── Logout helper ── */
async function signOut() {
  await fbSignOut(auth);
  window.location.replace('index.html');
}

/* ── Upload helper con progreso ──
   Sube un archivo a Storage y devuelve la URL de descarga.
   @param {File}     file        - Archivo a subir
   @param {string}   path        - Ruta en Storage (ej: 'productos/id/foto.jpg')
   @param {Function} onProgress  - Callback(percent) opcional
   @returns {Promise<string>}    - URL pública del archivo
*/
async function uploadFile(file, path, onProgress) {
  const storageRef = ref(storage, path);
  const task       = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on('state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        if (onProgress) onProgress(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

/* ── Delete storage file helper ── */
async function deleteFile(url) {
  if (!url) return;
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (e) {
    /* Ignorar si el archivo ya no existe */
    if (e.code !== 'storage/object-not-found') throw e;
  }
}

export {
  /* instancias */
  app, auth, db, storage,
  /* auth helpers */
  signOut,
  /* storage helpers */
  uploadFile, deleteFile,
  /* firestore re-exports (para no repetir imports) */
  collection, doc,
  getDocs, getDoc,
  addDoc, setDoc, updateDoc, deleteDoc,
  writeBatch,
  query, where, orderBy, limit,
  onSnapshot,
  serverTimestamp, Timestamp,
  increment,
  /* storage re-exports */
  ref, getDownloadURL
};
