/* ═══════════════════════════════════════════════════════════
   LULIS — impacto-engine.js
   Motor de cálculo de impacto ambiental.

   FUENTE ÚNICA DE VERDAD para todas las fórmulas.
   Usado tanto por el sitio público como por el panel admin.
   Sin dependencias externas — funciona en cualquier contexto.

   ── Constantes del modelo ──────────────────────────────────
   Basadas en los parámetros definidos por LULIS:

   Equivalencias de reemplazo:
     Shampoo sólido 50g  → reemplaza 1.5 botellas convencionales
     Shampoo sólido 100g → reemplaza 3.0 botellas convencionales
     Acondicionador 50g  → reemplaza 1.0 botella convencional
       (acond. líquido tiene menos agua, factor conservador)

   Botella convencional:
     Volumen:    350 ml
     Agua:       80% del contenido = 280 ml = 0.280 L
     Plástico:   ~25 g por envase = 0.025 kg

   Agua evitada por botella no producida:
     0.350 L × 0.80 = 0.280 L

   ─────────────────────────────────────────────────────────── */

const LULIS_IMPACTO = (() => {

  /* ── Constantes del modelo ── */
  const K = Object.freeze({
    /* Equivalencias de botellas */
    BOTELLAS_POR_SHAMPOO_50G:   1.5,
    BOTELLAS_POR_SHAMPOO_100G:  3.0,
    BOTELLAS_POR_ACOND_50G:     1.0,

    /* Botella convencional */
    BOTELLA_ML:     350,          /* mililitros */
    BOTELLA_LITROS: 0.350,        /* litros */
    AGUA_PCT:       0.80,         /* 80% del contenido es agua */
    PLASTICO_KG:    0.025,        /* kg de plástico por envase */

    /* Derivados */
    get AGUA_LITROS_POR_BOTELLA() {
      return this.BOTELLA_LITROS * this.AGUA_PCT; /* 0.280 L */
    },
  });

  /**
   * Calcula todas las métricas de impacto ambiental.
   *
   * @param {Object} ventas
   * @param {number} ventas.shampoos50g   - Unidades de shampoo 50g vendidas
   * @param {number} ventas.shampoos100g  - Unidades de shampoo 100g vendidas
   * @param {number} ventas.acond50g      - Unidades de acondicionador 50g vendidas
   *
   * @returns {Object} Todas las métricas calculadas con desglose
   */
  function calcular(ventas) {
    const s50  = Math.max(0, Math.round(ventas.shampoos50g  || 0));
    const s100 = Math.max(0, Math.round(ventas.shampoos100g || 0));
    const a50  = Math.max(0, Math.round(ventas.acond50g     || 0));

    /* ── Productos ── */
    const totalVendidos = s50 + s100 + a50;

    /* ── Botellas reemplazadas ── */
    const botellasShampoo50  = s50  * K.BOTELLAS_POR_SHAMPOO_50G;
    const botellasShampoo100 = s100 * K.BOTELLAS_POR_SHAMPOO_100G;
    const botellasAcond      = a50  * K.BOTELLAS_POR_ACOND_50G;
    const totalBotellas      = botellasShampoo50 + botellasShampoo100 + botellasAcond;

    /* ── Agua evitada ── */
    const litrosAgua = totalBotellas * K.AGUA_LITROS_POR_BOTELLA;

    /* ── Plástico evitado ── */
    const kgPlastico = totalBotellas * K.PLASTICO_KG;

    /* ── Resultado ── */
    return {
      /* Inputs */
      ventas: { shampoos50g: s50, shampoos100g: s100, acond50g: a50 },

      /* Resultados principales */
      totalVendidos:       totalVendidos,
      botellasReemplazadas: Math.round(totalBotellas * 10) / 10,  /* 1 decimal */
      litrosAguaEvitados:  Math.round(litrosAgua  * 10) / 10,
      kgPlasticoEvitado:   Math.round(kgPlastico  * 100) / 100,   /* 2 decimales */

      /* Desglose (para la tabla del admin) */
      desglose: {
        shampoos50g: {
          unidades:   s50,
          botellas:   Math.round(botellasShampoo50  * 10) / 10,
          litros:     Math.round(botellasShampoo50  * K.AGUA_LITROS_POR_BOTELLA * 10) / 10,
          kg:         Math.round(botellasShampoo50  * K.PLASTICO_KG * 100) / 100,
        },
        shampoos100g: {
          unidades:   s100,
          botellas:   Math.round(botellasShampoo100 * 10) / 10,
          litros:     Math.round(botellasShampoo100 * K.AGUA_LITROS_POR_BOTELLA * 10) / 10,
          kg:         Math.round(botellasShampoo100 * K.PLASTICO_KG * 100) / 100,
        },
        acond50g: {
          unidades:   a50,
          botellas:   Math.round(botellasAcond      * 10) / 10,
          litros:     Math.round(botellasAcond      * K.AGUA_LITROS_POR_BOTELLA * 10) / 10,
          kg:         Math.round(botellasAcond      * K.PLASTICO_KG * 100) / 100,
        },
      },

      /* Constantes usadas (para transparencia y auditoría) */
      constantes: { ...K },

      /* Formato para hero (strings con unidad) */
      hero: {
        vendidos:  totalVendidos,
        botellas:  Math.round(totalBotellas),
        agua:      litrosAgua < 1
          ? `${Math.round(litrosAgua * 1000)} ml`
          : `${Math.round(litrosAgua * 10) / 10}L`,
        plastico:  kgPlastico < 1
          ? `${Math.round(kgPlastico * 1000)} g`
          : `${Math.round(kgPlastico * 10) / 10} kg`,
      },
    };
  }

  /**
   * Verifica si los datos de ventas son válidos para calcular.
   * @param {Object} ventas
   * @returns {{ valido: boolean, errores: string[] }}
   */
  function validar(ventas) {
    const errores = [];
    const campos  = ['shampoos50g', 'shampoos100g', 'acond50g'];

    campos.forEach(c => {
      const v = ventas[c];
      if (v === undefined || v === null || v === '') {
        errores.push(`El campo "${c}" es obligatorio`);
      } else if (isNaN(Number(v)) || Number(v) < 0) {
        errores.push(`El campo "${c}" debe ser un número positivo`);
      }
    });

    return { valido: errores.length === 0, errores };
  }

  /**
   * Genera un resumen textual del impacto para mostrar al admin
   * antes de confirmar el guardado.
   */
  function resumir(resultado) {
    const r = resultado;
    return [
      `📦 ${r.totalVendidos} productos vendidos`,
      `🚯 ${r.botellasReemplazadas} botellas plásticas reemplazadas`,
      `💧 ${r.litrosAguaEvitados} litros de agua evitados`,
      `♻️  ${r.kgPlasticoEvitado} kg de plástico eliminado`,
    ].join(' · ');
  }

  /* Exponer como objeto global y como módulo */
  return { calcular, validar, resumir, CONSTANTES: K };
})();

/* Disponible globalmente para el sitio público (script clásico) */
/* Y también como módulo ES cuando se importa */
if (typeof window !== 'undefined') window.LULIS_IMPACTO = LULIS_IMPACTO;

if (typeof module !== 'undefined') module.exports = LULIS_IMPACTO;
