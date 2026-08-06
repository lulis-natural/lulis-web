# 🌿 LULIS — Shampoo Sólido Natural desde Bolivia

Sitio web oficial + panel administrativo de **LULIS**, marca de shampoos y acondicionadores sólidos naturales, hechos en La Paz, Bolivia. Cero plástico, alta calidad, cosmética consciente.

🌐 **Sitio en producción:** [lulis-natural.vercel.app](https://lulis-natural.vercel.app)
🔐 **Panel admin:** `/admin/` (requiere login con Firebase Auth)

---

## ✨ Características

### 🌐 Landing pública
- **9 secciones** con diseño orgánico y responsivo
- **Mobile-first** con menú hamburguesa
- **3 ubicaciones físicas** con carrusel de Google Maps
- **Feed de Instagram** embebido
- **Catálogo dinámico** desde Firestore
- **Galería** con paginación
- **Formulario de contacto** vía FormSubmit (gratis, sin tarjeta)
- **WhatsApp flotante** con mensajes pre-armados
- **Contadores animados** de impacto ambiental
- **0 dependencias de npm** — HTML/CSS/JS vanilla

### 🔐 Panel administrativo (`/admin/`)
- **6 páginas funcionales:**
  1. **Dashboard** — estadísticas en tiempo real
  2. **Productos** — CRUD completo con upload de imágenes
  3. **Galería** — múltiples imágenes con edición
  4. **Direcciones** — gestión de tiendas (Showroom / Punto de venta)
  5. **Mensajes** — bandeja de entrada del formulario de contacto
  6. **Impacto Ambiental** — calculadora con publicación automática al sitio
- **Login con Firebase Auth** (email/password)
- **Manejo de errores graceful** (si las reglas de Firestore bloquean algo, muestra estado vacío en vez de romper la UI)
- **Mobile-friendly** con sidebar colapsable
- **0 emojis en la UI** — todo usa SVG inline (Feather Icons)

---

## 🛠 Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 + JavaScript ES2022 (vanilla) |
| Hosting | Vercel (deploy estático) |
| Backend | Firebase (BaaS) |
| Auth | Firebase Authentication |
| DB | Cloud Firestore |
| Storage | Firebase Storage (imágenes) |
| Forms | FormSubmit (envío de emails sin backend) |
| Iconos | SVG inline (Feather Icons) |
| Fonts | Google Fonts (League Spartan + Inter) |

**Sin frameworks JS.** Sin React, sin Vue, sin npm. Todo vanilla para máximo rendimiento y mínimo costo.

---

## 📁 Estructura del proyecto

```
lulis-web/
├── index.html                    # Landing pública
├── admin/                         # Panel administrativo
│   ├── index.html                 #   → Login
│   ├── dashboard.html             #   → Estadísticas
│   ├── productos.html             #   → CRUD productos
│   ├── galeria.html               #   → CRUD galería
│   ├── direcciones.html           #   → CRUD tiendas
│   ├── mensajes.html              #   → Bandeja de entrada
│   ├── impacto.html               #   → Métricas ambientales
│   ├── css/admin.css              #   → Estilos del panel
│   └── js/                        #   → Lógica del panel
├── css/                           # Estilos de la landing
│   ├── main.css                   #   → Entry point
│   ├── critical.css               #   → Above-the-fold crítico
│   ├── base/                      #   → Reset, tokens, animaciones
│   └── components/                #   → Hero, navbar, productos, etc.
├── js/                            # Lógica de la landing
│   ├── config.js                  #   → Constantes (FB project ID, WA, etc.)
│   ├── services/                  #   → Firebase, toast, WhatsApp, impacto
│   └── modules/                   #   → Navbar, FAQ, form, contadores, etc.
├── Imagenes/                      # Assets (productos, logos, galería)
├── data/                          # Seed de productos (referencia)
├── assets/                        # Iconos SVG
├── firebase/                      # Reglas e índices de Firestore/Storage
├── scripts/                       # Utilidades de optimización
├── firebase.json                  # Config Firebase Hosting
├── vercel.json                    # Config Vercel
├── robots.txt                     # SEO
├── sitemap.xml                    # SEO
└── .env.example                   # Plantilla de variables de entorno
```

---

## 🚀 Empezar (desarrollo local)

### Requisitos
- Un servidor estático (Python, Node, o Vercel CLI)
- Un navegador moderno
- **NO** requiere npm, node_modules, ni build

### Pasos

1. **Clonar el repo:**
   ```bash
   git clone https://github.com/lulis-natural/lulis-web.git
   cd lulis-web
   ```

2. **Configurar Firebase** (ver sección siguiente)

3. **Levantar servidor local:**
   ```bash
   # Opción A: Python
   py -m http.server 5500

   # Opción B: Node
   npx serve -p 5500

   # Opción C: Vercel CLI
   vercel dev
   ```

4. **Abrir en el navegador:**
   - Landing: http://localhost:5500/
   - Admin: http://localhost:5500/admin/

---

## 🔥 Configurar Firebase

### 1. Crear proyecto
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. **Agregar proyecto** → nombre: `lulis-natural` (o el que prefieras)
3. Desactivar Google Analytics (no es necesario)

### 2. Habilitar servicios
- **Authentication** → Sign-in method → habilitar **Email/Password**
- **Firestore Database** → crear en modo producción, ubicación `nam5`
- **Storage** → activar

### 3. Crear usuario admin
- En **Authentication → Users → Add user**
- Anotar email y password (los necesitarás para entrar al panel)

### 4. Obtener API keys
- Volver a **Home** del proyecto
- Click en el ícono **`</>`** (Web app)
- Nickname: `LULIS Web`
- **Copiar el bloque `firebaseConfig`**

### 5. Configurar el código

Editar **2 archivos** con tus API keys:

**`admin/js/firebase-init.js`** (líneas 33-42):
```javascript
const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "tu-proyecto.firebaseapp.com",
  projectId:         "tu-proyecto",
  storageBucket:     "tu-proyecto.firebasestorage.app",
  messagingSenderId: "123456789",
  appId:             "1:123...:web:abc...",
};
```

**`js/config.js`** (línea 12):
```javascript
firebaseProjectId: 'tu-proyecto',  // ← solo el projectId
```

### 6. Publicar reglas de seguridad

Las reglas están en `firebase/firestore.rules` y `firebase/storage.rules`. Para publicarlas:

**Opción A — Consola web (recomendado para empezar):**
1. Firebase Console → Firestore → Rules
2. Copiar el contenido de `firebase/firestore.rules`
3. Pegar y **Publicar**

**Opción B — Firebase CLI:**
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 7. (Opcional) Configurar custom claim de admin

Para que el admin pueda escribir, el usuario necesita el custom claim `admin:true`:

**Opción A — Cloud Function (recomendado para producción):**
```javascript
// functions/index.js
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp();

export const setAdminClaim = functions.https.onCall(async (data, context) => {
  if (context.auth.token.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Solo admins');
  }
  await getAuth().setCustomUserClaims(data.uid, { admin: true });
  return { success: true };
});
```

**Opción B — Firebase CLI (temporal, para testing):**
```bash
firebase auth:export users.json
# Editar users.json y agregar "admin": true al usuario
firebase auth:import users.json
```

Si no configuras el custom claim, el admin **no podrá escribir** en Firestore (las reglas lo bloquean).

---

## 🌍 Deploy a Vercel

### Opción 1: Desde GitHub (recomendado)

1. Ir a [vercel.com](https://vercel.com) → **Add New → Project**
2. **Import** el repo `lulis-natural/lulis-web`
3. **Configure Project:**
   - Framework Preset: **Other**
   - Build Command: (vacío)
   - Output Directory: (vacío o `.`)
   - Install Command: (vacío)
4. Click **Deploy**
5. Vercel detecta el push y hace deploy automático en cada `git push` a `main`

### Opción 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Configurar dominio personalizado (opcional)

En Vercel → Project → Settings → Domains → agregar `lulis.bo` o el que tengan.

---

## 📧 Configurar formulario de contacto

El form usa [FormSubmit](https://formsubmit.co) — servicio gratuito, sin tarjeta.

**Archivo:** `index.html`, línea ~1117

**Cambiar el email** al real de la marca:
```html
<form action="https://formsubmit.co/TU_EMAIL_AQUI@gmail.com" method="POST">
```

**Activar FormSubmit:**
1. Hacer el primer envío de prueba
2. FormSubmit manda un email de activación a la dirección
3. Click en el link de confirmación
4. Listo, ahora todos los mensajes llegan a ese email

---

## 🎨 Paleta de colores (brand)

```css
--coral:   #FF694C    /* Acento cálido */
--yellow:  #F4BF56    /* Mostaza, badges */
--beige:   #E5D8BD    /* Kraft, fondos suaves */
--olive:   #B5AE6D    /* Oliva natural */
--emerald: #07BC8A    /* Esmeralda, CTAs */
--purple:  #824670    /* Violeta medio */
--wine:    #5F0F3F    /* Violeta oscuro (principal) */
--rose:    #A2708A    /* Rosa viejo */
--cream:   #FAF8F3    /* Crema, fondo */
--dark:    #1C1611    /* Texto principal */
--mid:     #4A3728    /* Texto secundario */
```

---

## 🧪 Testing

Para hacer testing del panel admin:
1. Crear el usuario admin en Firebase Authentication
2. Asignarle el custom claim `admin:true` (ver sección 7)
3. Login en `/admin/`
4. Crear productos, agregar imágenes, configurar tiendas, etc.

Para datos de prueba, los productos seed están en `data/products.json` y `firebase/seed/productos.json`.

---

## 📜 Licencia

Este proyecto es propiedad de **LULIS** y se distribuye bajo licencia privada. Todos los derechos reservados.

---

## 🌱 Sobre LULIS

LULIS nace en La Paz, Bolivia, de un equipo multidisciplinario de amigos con una visión: **transformar el consumo cotidiano en una experiencia más consciente**.

- 🌿 Shampoos y acondicionadores **sólidos** de alta calidad
- 🚯 **Cero plástico** — 35-45 lavadas por barra
- 💧 Ahorro de agua vs. shampoo líquido convencional
- 🧪 Formulados con criterio técnico

Síguenos:
- 📸 [Instagram](https://instagram.com/lulis.natural)
- 📘 [Facebook](https://facebook.com/lulis.natural)
- 🎵 [TikTok](https://tiktok.com/@lulis.natural)
- 💬 [WhatsApp](https://wa.me/59173515698)

---

> Hecho con 💜 en Bolivia · 2026
