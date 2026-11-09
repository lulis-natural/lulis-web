/* ═══════════════════════════════════════════════════════════
   LULIS — catalogo-service.js
   Servicio unificado de datos para el catálogo y destacados.
   Conecta con Firestore REST API con fallback instantáneo a data/products.json.
   ═══════════════════════════════════════════════════════════ */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LulisCatalog = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {

  const CACHE_KEY = 'lulis_productos_cache_v2';
  const CACHE_TIME_KEY = 'lulis_productos_cache_time_v2';
  const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos

  /** Parsear campos de un documento de Firestore REST API */
  function parseFirestoreDoc(doc) {
    const fields = doc.fields || {};
    const getVal = (f) => {
      if (!f) return null;
      if (f.stringValue !== undefined) return f.stringValue;
      if (f.integerValue !== undefined) return parseInt(f.integerValue, 10);
      if (f.doubleValue !== undefined) return parseFloat(f.doubleValue);
      if (f.booleanValue !== undefined) return f.booleanValue;
      if (f.arrayValue !== undefined) {
        return (f.arrayValue.values || []).map(getVal);
      }
      if (f.mapValue !== undefined) {
        const m = {};
        for (const k in f.mapValue.fields) m[k] = getVal(f.mapValue.fields[k]);
        return m;
      }
      return null;
    };

    const id = doc.name ? doc.name.split('/').pop() : Math.random().toString(36).substring(7);
    const data = { id };
    for (const k in fields) {
      data[k] = getVal(fields[k]);
    }
    return data;
  }

  /** Formatear producto para garantizar todos los atributos necesarios en la UI */
  function normalizeProduct(p, idx) {
    const categoria = (p.categoria || 'shampoo').toLowerCase();
    let categoriaLabel = 'Shampoo Sólido';
    if (categoria.includes('acond') || categoria === 'acondicionador') {
      categoriaLabel = 'Acondicionador Sólido';
    } else if (categoria.includes('pack') || categoria === 'duo') {
      categoriaLabel = 'Pack Dúo Sólido';
    }

    let badgeClass = 'badge-new';
    const b = (p.badge || '').toLowerCase();
    if (b.includes('pop') || b.includes('hot')) badgeClass = 'badge-hot';
    else if (b.includes('eco') || b.includes('verde')) badgeClass = 'badge-eco';
    else if (b.includes('oferta') || b.includes('desc')) badgeClass = 'badge-hot';

    let tipoCabelloArr = [];
    if (Array.isArray(p.tipoCabello)) {
      tipoCabelloArr = p.tipoCabello;
    } else if (typeof p.tipoCabello === 'string') {
      tipoCabelloArr = p.tipoCabello.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    }
    if (tipoCabelloArr.length === 0) tipoCabelloArr = ['todos'];

    return {
      id: p.id || `prod-${idx}`,
      nombre: p.nombre || p.name || 'Producto LULIS',
      variante: p.variante || p.variant || '',
      categoria: categoria,
      categoriaLabel: p.categoriaLabel || categoriaLabel,
      size: p.size || '50g',
      duracion: p.duracion || (categoria === 'shampoo' ? '35–45 lavadas' : '40–50 lavadas'),
      precio: p.precio || (categoria === 'pack' ? '68 Bs.' : (categoria === 'acondicionador' ? '38 Bs.' : '35 Bs.')),
      tipoCabello: tipoCabelloArr,
      badge: p.badge || '',
      badgeClass: p.badgeClass || badgeClass,
      disponible: p.disponible !== false,
      destacado: !!p.destacado,
      orden: typeof p.orden === 'number' ? p.orden : (idx + 1),
      imagenUrl: p.imagenUrl || p.image || 'Imagenes/productos/Jamaica.jpg',
      descripcion: p.descripcion || p.description || 'Cosmética sólida natural hecha a mano en La Paz, Bolivia.',
      descripcionLarga: p.descripcionLarga || p.descripcion || '',
      ingredientes: p.ingredientes || 'Ingredientes botánicos 100% naturales, mantecas vegetales puras, aceites esenciales andinos. Cero sulfatos, siliconas ni plásticos.',
      modoUso: p.modoUso || 'Humedecer la barra y aplicar directamente sobre el cabello mojado. Masajear suavemente y aclarar. Guardar en jabonera seca.'
    };
  }

  /** Cargar productos locales de respaldo desde data/products.json */
  async function fetchLocalProducts() {
    try {
      const paths = ['data/products.json', '/data/products.json', '../data/products.json'];
      for (const p of paths) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) return data.map(normalizeProduct);
            if (data && (data.shampoos || data.conditioners)) {
              const all = [...(data.shampoos || []), ...(data.conditioners || [])];
              return all.map(normalizeProduct);
            }
          }
        } catch (_) {}
      }
    } catch (e) {
      console.warn('[LulisCatalog] Error leyendo JSON local:', e);
    }
    return getFallbackStaticProducts();
  }

  /** Fallback estático en memoria si la red falla totalmente */
  function getFallbackStaticProducts() {
    return [
      {
        id: 'shampoo-jamaica',
        nombre: 'Shampoo Sólido Jamaica',
        variante: 'Jamaica & Hibisco',
        categoria: 'shampoo',
        categoriaLabel: 'Shampoo Sólido',
        size: '50g',
        duracion: '35–45 lavadas',
        precio: '35 Bs.',
        tipoCabello: ['mixto', 'normal'],
        badge: 'Nuevo',
        badgeClass: 'badge-hot',
        disponible: true,
        destacado: true,
        orden: 1,
        imagenUrl: 'Imagenes/productos/Jamaica.jpg',
        descripcion: 'Equilibrio y revitalización para cabello mixto. Limpieza suave, espuma abundante y aroma natural a flor de hibisco.',
        descripcionLarga: 'Elaborado con infusión concentrada de flor de Jamaica, arcillas minerales y aceites botánicos andinos. Equilibra las raíces grasas mientras hidrata las puntas resecas.',
        ingredientes: 'Tensioactivo vegetal SCI derivado del coco, infusión de Jamaica, manteca de karité, aceite de ricino, provitamina B5.',
        modoUso: 'Frotar la barra húmeda en el cuero cabelludo mojado hasta generar espuma abundante. Masajear y enjuagar.'
      },
      {
        id: 'shampoo-romero',
        nombre: 'Shampoo Sólido Romero',
        variante: 'Romero & Menta Silvestre',
        categoria: 'shampoo',
        categoriaLabel: 'Shampoo Sólido',
        size: '50g',
        duracion: '35–45 lavadas',
        precio: '35 Bs.',
        tipoCabello: ['graso', 'mixto'],
        badge: 'Popular',
        badgeClass: 'badge-hot',
        disponible: true,
        destacado: true,
        orden: 2,
        imagenUrl: 'Imagenes/productos/Romeros.jpg',
        descripcion: 'Fortalecimiento y control de grasa. Purifica el cuero cabelludo, previene la caída y estimula el crecimiento saludable.',
        descripcionLarga: 'Concentrado botánico de romero cosechado en valles paceños con propiedades astringentes y tónicas. Regula el sebo sin resecar.',
        ingredientes: 'Tensioactivo vegetal SCI, extracto puro de Romero, arcilla verde bentonita, aceite de jojoba, aceite esencial de menta.',
        modoUso: 'Masajear suavemente sobre el cuero cabelludo 1-2 minutos y aclarar con agua templada.'
      },
      {
        id: 'shampoo-coco',
        nombre: 'Shampoo Sólido Coco',
        variante: 'Coco & Almendras Dulces',
        categoria: 'shampoo',
        categoriaLabel: 'Shampoo Sólido',
        size: '50g',
        duracion: '35–45 lavadas',
        precio: '35 Bs.',
        tipoCabello: ['seco', 'rizado', 'dañado'],
        badge: 'Nuevo',
        badgeClass: 'badge-new',
        disponible: true,
        destacado: true,
        orden: 3,
        imagenUrl: 'Imagenes/productos/Coco.jpg',
        descripcion: 'Hidratación profunda para cabello seco o maltratado. Nutrición intensa desde la primera lavada sin apelmazar.',
        descripcionLarga: 'Fórmula ultra nutritiva con manteca pura de coco prensada en frío y leche vegetal para sellar cutículas y combatir el frizz.',
        ingredientes: 'Tensioactivo vegetal SCI, aceite virgen de coco, manteca de cacao boliviano, proteína de avena hidrolizada y vitamina E.',
        modoUso: 'Frotar de medios a puntas, crear espuma suave, masajear y enjuagar.'
      },
      {
        id: 'acond-melon',
        nombre: 'Acondicionador Sólido Melón',
        variante: 'Melón & Semillas de Chía',
        categoria: 'acondicionador',
        categoriaLabel: 'Acondicionador Sólido',
        size: '50g',
        duracion: '40–50 lavadas',
        precio: '38 Bs.',
        tipoCabello: ['graso', 'mixto', 'fino'],
        badge: 'Eco',
        badgeClass: 'badge-eco',
        disponible: true,
        destacado: true,
        orden: 4,
        imagenUrl: 'Imagenes/productos/Pack_coco_y_melon.jpeg',
        descripcion: 'Ligero, sedoso y desenredante. Ideal para cabello graso o fino. Acondiciona y aporta brillo sin dejar residuo pesado.',
        descripcionLarga: 'Emulsión sólida ligera con extracto de melón andino y lípidos vegetales. Desenreda al instante sin restar volumen.',
        ingredientes: 'Cera BTMS vegetal, manteca de mango, aceite de semilla de melón, glicerina vegetal, pantenol.',
        modoUso: 'Frotar la barra húmeda de medios a puntas sobre el cabello recién lavado. Dejar 2 minutos y enjuagar.'
      },
      {
        id: 'acond-uva-jamaica',
        nombre: 'Acondicionador Uva & Jamaica',
        variante: 'Uva Negra & Flor de Jamaica',
        categoria: 'acondicionador',
        categoriaLabel: 'Acondicionador Sólido',
        size: '50g',
        duracion: '40–50 lavadas',
        precio: '38 Bs.',
        tipoCabello: ['seco', 'dañado', 'teñido'],
        badge: 'Popular',
        badgeClass: 'badge-hot',
        disponible: true,
        destacado: true,
        orden: 5,
        imagenUrl: 'Imagenes/productos/Pack_jamaica_y_jamaica.jpeg',
        descripcion: 'Nutrición e hidratación intensa para cabello seco o con color. Efecto sellador de puntas y brillo espejo.',
        descripcionLarga: 'Poderoso antioxidante a base de aceite de semilla de uva y extracto de flor de Jamaica para máxima protección y suavidad.',
        ingredientes: 'Cera acondicionadora vegetal, aceite de pepita de uva, manteca de karité cruda, extracto de flor de Jamaica, vitamina E.',
        modoUso: 'Aplicar en largos y puntas, desenredar con los dedos, reposar 2 minutos y aclarar.'
      },
      {
        id: 'pack-duo-romero-melon',
        nombre: 'Pack Dúo Pureza (Romero + Melón)',
        variante: 'Shampoo Romero + Acondicionador Melón',
        categoria: 'pack',
        categoriaLabel: 'Pack Dúo',
        size: '50g + 50g',
        duracion: 'Hasta 90 lavadas',
        precio: '68 Bs.',
        tipoCabello: ['graso', 'mixto'],
        badge: 'Oferta',
        badgeClass: 'badge-hot',
        disponible: true,
        destacado: true,
        orden: 6,
        imagenUrl: 'Imagenes/productos/Pack_romero_y_melon.jpeg',
        descripcion: 'El dúo perfecto para control de grasa y frescura completa. Incluye caja ecológica con semillas plantables.',
        descripcionLarga: 'Combina el poder regulador del Shampoo Romero con la ligereza desenredante del Acondicionador Melón. Ahorra 6 botellas plásticas.',
        ingredientes: '1 Shampoo Romero 50g + 1 Acondicionador Melón 50g.',
        modoUso: 'Usar shampoo para limpiar y acondicionador para sellar.'
      },
      {
        id: 'pack-duo-coco-melon',
        nombre: 'Pack Dúo Hidratación (Coco + Melón)',
        variante: 'Shampoo Coco + Acondicionador Melón',
        categoria: 'pack',
        categoriaLabel: 'Pack Dúo',
        size: '50g + 50g',
        duracion: 'Hasta 90 lavadas',
        precio: '68 Bs.',
        tipoCabello: ['seco', 'mixto'],
        badge: 'Popular',
        badgeClass: 'badge-hot',
        disponible: true,
        destacado: true,
        orden: 7,
        imagenUrl: 'Imagenes/productos/Pack_coco_y_melon.jpeg',
        descripcion: 'Nutrición equilibrada para raíces limpias y puntas ultra hidratadas. Ideal para uso familiar.',
        descripcionLarga: 'La barra de Coco nutre profundamente la fibra capilar mientras el acondicionador sella la humedad sin dejar efecto graso.',
        ingredientes: '1 Shampoo Coco 50g + 1 Acondicionador Melón 50g.',
        modoUso: 'Uso diario o interdiario.'
      },
      {
        id: 'pack-duo-jamaica-romero',
        nombre: 'Pack Dúo Botánico (Jamaica + Romero)',
        variante: '2 Shampoos Sólidos 50g',
        categoria: 'pack',
        categoriaLabel: 'Pack Dúo',
        size: '50g + 50g',
        duracion: 'Hasta 90 lavadas',
        precio: '65 Bs.',
        tipoCabello: ['todos', 'mixto', 'graso'],
        badge: 'Nuevo',
        badgeClass: 'badge-new',
        disponible: true,
        destacado: false,
        orden: 8,
        imagenUrl: 'Imagenes/productos/Jamaica y romero.jpg',
        descripcion: 'Doble poder herbal: equilibrio con Jamaica y estimulación tónica con Romero. Excelente para regalar.',
        descripcionLarga: 'Alterna entre ambos shampoos según las necesidades de tu cuero cabelludo.',
        ingredientes: '1 Shampoo Jamaica 50g + 1 Shampoo Romero 50g.',
        modoUso: 'Alternar según necesidad del cuero cabelludo.'
      }
    ].map(normalizeProduct);
  }

  /**
   * Obtener todos los productos disponibles.
   * Prioridad:
   * 1. Consulta en vivo a Firestore (REST API sin dependencias)
   * 2. Cache local reciente de localStorage
   * 3. Fallback a data/products.json
   */
  async function getAllProducts() {
    // 1. Intentar Firestore REST API
    try {
      const pid = (window.LULIS_CONFIG && window.LULIS_CONFIG.firebaseProjectId) || 'lulis-web';
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/productos`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const res = await fetch(firestoreUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.documents && json.documents.length > 0) {
          const list = json.documents.map((doc, i) => normalizeProduct(parseFirestoreDoc(doc), i));
          // Ordenar por campo 'orden'
          list.sort((a, b) => (a.orden || 99) - (b.orden || 99));
          // Guardar en cache
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(list));
            localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
          } catch (_) {}
          return list;
        }
      }
    } catch (err) {
      console.warn('[LulisCatalog] Firestore no disponible o bloqueado, usando respaldo:', err.message);
    }

    // 2. Intentar Cache local
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch (_) {}

    // 3. Fallback a archivo JSON local / estático
    return await fetchLocalProducts();
  }

  /**
   * Generar enlace directo a WhatsApp para un producto.
   */
  function getWhatsAppUrl(product) {
    const waNumber = (window.LULIS_CONFIG && window.LULIS_CONFIG.whatsapp && window.LULIS_CONFIG.whatsapp.number) || '59173515698';
    const name = typeof product === 'string' ? product : (product.nombre || 'Shampoo Sólido LULIS');
    const msg = `¡Hola LULIS! 👋 Me gustaría consultar la disponibilidad y pedir: *${name}* (${product.precio || '50g'}). ¿Me brindan más información sobre el envío? Gracias 🌱`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
  }

  return {
    getAllProducts,
    getFallbackStaticProducts,
    getWhatsAppUrl,
    normalizeProduct
  };
});
