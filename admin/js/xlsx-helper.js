/* ═══════════════════════════════════════════════════════════
   LULIS Admin — xlsx-helper.js
   Helpers para exportar e importar archivos Excel (.xlsx) usando SheetJS.

   Requiere que SheetJS esté cargado antes:
     <script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>

   Uso desde otros módulos:
     import { exportarXLSX, importarXLSX, descargarPlantillaXLSX } from './xlsx-helper.js';
   ═══════════════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);

/* ── Verificar que SheetJS está cargado ─────────────────── */
function ensureXLSX() {
  if (typeof window.XLSX === 'undefined') {
    throw new Error('SheetJS no está cargado. Agrega <script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script> antes de este módulo.');
  }
  return window.XLSX;
}

/* ── Estilos por defecto para encabezados ───────────────── */
const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
  fill: { fgColor: { rgb: '5F0F3F' } },        // wine
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top:    { style: 'thin', color: { rgb: 'BFA3B0' } },
    bottom: { style: 'thin', color: { rgb: 'BFA3B0' } },
    left:   { style: 'thin', color: { rgb: 'BFA3B0' } },
    right:  { style: 'thin', color: { rgb: 'BFA3B0' } },
  }
};
const TOTAL_STYLE = {
  font: { bold: true, color: { rgb: '5F0F3F' }, sz: 11, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FAF8F3' } },
  border: {
    top:    { style: 'medium', color: { rgb: '5F0F3F' } },
    bottom: { style: 'medium', color: { rgb: '5F0F3F' } },
    left:   { style: 'thin',   color: { rgb: 'BFA3B0' } },
    right:  { style: 'thin',   color: { rgb: 'BFA3B0' } },
  }
};
const META_STYLE = {
  font: { bold: true, color: { rgb: '5F0F3F' }, sz: 10, name: 'Calibri' },
  fill: { fgColor: { rgb: 'F5F0E8' } },
};
const CELL_STYLE = {
  font: { sz: 10, name: 'Calibri' },
  border: {
    top:    { style: 'thin', color: { rgb: 'E5DCD0' } },
    bottom: { style: 'thin', color: { rgb: 'E5DCD0' } },
    left:   { style: 'thin', color: { rgb: 'E5DCD0' } },
    right:  { style: 'thin', color: { rgb: 'E5DCD0' } },
  },
  alignment: { vertical: 'center', wrapText: true }
};

/* ── Aplicar estilo a un rango de celdas ────────────────── */
function styleRange(ws, range, style) {
  if (!range) return;
  const [start, end] = range.split(':');
  const colLetter = (cell) => (cell.match(/[A-Z]+/) || [''])[0];
  const rowNum    = (cell) => parseInt((cell.match(/\d+/) || ['0'])[0], 10);
  const startCol  = colLetter(start);
  const startRow  = rowNum(start);
  const endCol    = colLetter(end) || startCol;
  const endRow    = rowNum(end) || startRow;
  for (let r = startRow; r <= endRow; r++) {
    for (let cIdx = XLSX.utils.decode_col(startCol); cIdx <= XLSX.utils.decode_col(endCol); cIdx++) {
      const addr = XLSX.utils.encode_cell({ r: r - 1, c: cIdx });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = style;
    }
  }
}

/* ── Auto-ajustar ancho de columnas ─────────────────────── */
function autoSizeColumns(ws, headers, data) {
  const cols = headers.map((h, i) => {
    let max = String(h).length;
    data.forEach(row => {
      const val = row[i];
      if (val != null) {
        const len = String(val).length;
        if (len > max) max = len;
      }
    });
    return { wch: Math.min(Math.max(max + 2, 10), 50) };
  });
  ws['!cols'] = cols;
}

/* ═══════════════════════════════════════════════════════════
   EXPORTAR XLSX — Multi-sheet con formato profesional
   ═══════════════════════════════════════════════════════════ */

/**
 * Exporta un libro Excel con una o varias hojas.
 * @param {Object} opts
 * @param {string} opts.filename      - nombre del archivo (sin extensión)
 * @param {Array<{name:string, headers:string[], data:any[][], meta?:Object}>} opts.sheets
 * @param {string} [opts.subtitle]    - subtítulo del reporte (opcional)
 */
export function exportarXLSX(opts) {
  const XLSX = ensureXLSX();
  const wb = XLSX.utils.book_new();
  const fecha = new Date();
  const fechaStr = fecha.toISOString().slice(0, 10);
  const filename = `${opts.filename}-${fechaStr}.xlsx`;

  opts.sheets.forEach((sheet) => {
    const ws = {};

    /* ── Fila 1: Título del libro ── */
    const titleText = opts.title || sheet.name;
    ws['A1'] = { t: 's', v: titleText, s: { font: { bold: true, sz: 16, color: { rgb: '5F0F3F' }, name: 'Calibri' } } };
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(sheet.headers.length - 1, 0) } });

    /* ── Fila 2: Subtítulo / período ── */
    let rowOffset = 2;
    if (opts.subtitle) {
      ws['A2'] = { t: 's', v: opts.subtitle, s: { font: { italic: true, sz: 10, color: { rgb: '4A3728' }, name: 'Calibri' } } };
      ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(sheet.headers.length - 1, 0) } });
      rowOffset = 3;
    }

    /* ── Fila meta: generado el ── */
    const metaRow = rowOffset;
    ws[`A${metaRow}`] = { t: 's', v: 'Generado', s: META_STYLE };
    ws[`B${metaRow}`] = { t: 's', v: fecha.toLocaleString('es-BO'), s: CELL_STYLE };
    rowOffset++;

    /* ── Meta del sheet específico ── */
    if (sheet.meta) {
      Object.entries(sheet.meta).forEach(([k, v]) => {
        ws[`A${rowOffset}`] = { t: 's', v: k, s: META_STYLE };
        ws[`B${rowOffset}`] = { t: typeof v === 'number' ? 'n' : 's', v, s: CELL_STYLE };
        rowOffset++;
      });
    }

    /* ── Línea vacía antes de la tabla ── */
    rowOffset++;

    /* ── Headers de la tabla ── */
    const headerRow = rowOffset;
    sheet.headers.forEach((h, i) => {
      const addr = XLSX.utils.encode_cell({ r: headerRow - 1, c: i });
      ws[addr] = { t: 's', v: h, s: HEADER_STYLE };
    });
    rowOffset++;

    /* ── Filas de datos ── */
    const dataStart = rowOffset;
    sheet.data.forEach((row) => {
      row.forEach((val, i) => {
        const addr = XLSX.utils.encode_cell({ r: rowOffset - 1, c: i });
        if (val == null || val === '') {
          ws[addr] = { t: 's', v: '', s: CELL_STYLE };
        } else if (typeof val === 'number') {
          ws[addr] = { t: 'n', v: val, s: CELL_STYLE };
        } else if (typeof val === 'boolean') {
          ws[addr] = { t: 'b', v: val, s: CELL_STYLE };
        } else {
          /* Detectar si es fecha ISO */
          const str = String(val);
          if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
            ws[addr] = { t: 's', v: str, s: CELL_STYLE };
          } else {
            ws[addr] = { t: 's', v: str, s: CELL_STYLE };
          }
        }
      });
      rowOffset++;
    });

    /* ── Fila de totales (si hay totales) ── */
    if (sheet.totals) {
      const totalRow = rowOffset;
      const cols = sheet.headers.length;
      for (let c = 0; c < cols; c++) {
        const addr = XLSX.utils.encode_cell({ r: totalRow - 1, c });
        if (c === 0) {
          ws[addr] = { t: 's', v: sheet.totals[0] || 'TOTAL', s: TOTAL_STYLE };
        } else if (sheet.totals[c] != null) {
          const v = sheet.totals[c];
          ws[addr] = { t: typeof v === 'number' ? 'n' : 's', v, s: TOTAL_STYLE };
        } else {
          ws[addr] = { t: 's', v: '', s: TOTAL_STYLE };
        }
      }
      rowOffset++;
    }

    /* ── Anchos de columna ── */
    ws['!cols'] = sheet.headers.map((h, i) => {
      let max = String(h).length;
      sheet.data.forEach(row => {
        const val = row[i];
        if (val != null) {
          const len = String(val).length;
          if (len > max) max = len;
        }
      });
      return { wch: Math.min(Math.max(max + 2, 12), 50) };
    });

    /* ── Rango de celdas (ref) ── */
    const lastCol = XLSX.utils.encode_col(sheet.headers.length - 1);
    ws['!ref'] = `A1:${lastCol}${rowOffset - 1}`;

    /* ── Freeze pane (debajo del header) ── */
    ws['!freeze'] = { xSplit: 0, ySplit: dataStart - 1 };
    ws['!views'] = [{ state: 'frozen', ySplit: dataStart - 1 }];

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  });

  /* ── Descargar ── */
  XLSX.writeFile(wb, filename, { bookType: 'xlsx', compression: true });
  return filename;
}

/* ═══════════════════════════════════════════════════════════
   IMPORTAR XLSX — Lee archivo y devuelve filas como objetos
   ═══════════════════════════════════════════════════════════ */

/**
 * Lee un archivo .xlsx o .csv y devuelve la primera hoja como array de objetos.
 * Las claves se derivan de la primera fila (encabezados).
 * @param {File} file
 * @returns {Promise<{headers: string[], rows: any[][], data: Object[]}>}
 */
export async function importarXLSX(file) {
  const XLSX = ensureXLSX();
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  /* header: 1 → array de arrays; defval '' para celdas vacías */
  const all = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false, raw: false });
  if (!all.length) throw new Error('El archivo está vacío');

  /* Buscar la fila de headers (primera fila no vacía con palabras clave) */
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, all.length); i++) {
    const row = all[i] || [];
    const text = row.map(c => String(c || '').toLowerCase()).join('|');
    if (text.includes('fecha') || text.includes('producto') || text.includes('cliente') || text.includes('canal')) {
      headerIdx = i;
      break;
    }
  }

  const headers = all[headerIdx].map(h => String(h || '').trim());
  const rowsRaw = all.slice(headerIdx + 1);
  const data = rowsRaw
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = r[i] != null ? String(r[i]).trim() : '';
      });
      return obj;
    })
    .filter(o => Object.values(o).some(v => v !== '')); // descartar filas totalmente vacías

  return { headers, rows: rowsRaw, data, sheetName };
}

/* ═══════════════════════════════════════════════════════════
   PLANTILLA — Genera y descarga una plantilla XLSX de ejemplo
   ═══════════════════════════════════════════════════════════ */

const PLANTILLA_VENTAS_HEADERS = [
  'fecha',        // YYYY-MM-DD
  'cliente',      // texto
  'canal',        // whatsapp | instagram | tienda | feria | otro
  'estado',       // entregado | confirmado | pendiente | cancelado
  'producto_nombre',  // texto
  'producto_tipo',    // shampoo | acondicionador | pack
  'producto_gramos',  // 50 | 100
  'cantidad',         // número
  'precio_unitario',  // número (Bs)
  'descuento',        // número (Bs) — opcional
  'notas'             // texto — opcional
];

/**
 * Genera y descarga una plantilla XLSX con headers y una fila de ejemplo.
 * @param {string} [filename]
 */
export function descargarPlantillaVentas(filename = 'lulis-plantilla-ventas.xlsx') {
  const XLSX = ensureXLSX();
  const wb = XLSX.utils.book_new();
  const ws = {};

  /* Título */
  ws['A1'] = { t: 's', v: 'LULIS — Plantilla de Ventas', s: { font: { bold: true, sz: 16, color: { rgb: '5F0F3F' }, name: 'Calibri' } } };
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: PLANTILLA_VENTAS_HEADERS.length - 1 } });

  /* Subtítulo */
  ws['A2'] = { t: 's', v: 'Completá las filas siguientes. Una línea por producto dentro de cada venta.', s: { font: { italic: true, sz: 10, color: { rgb: '4A3728' } } } };
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: PLANTILLA_VENTAS_HEADERS.length - 1 } });

  /* Leyenda */
  ws['A3'] = { t: 's', v: 'canal: whatsapp | instagram | tienda | feria | otro', s: META_STYLE };
  ws['B3'] = { t: 's', v: 'estado: entregado | confirmado | pendiente | cancelado', s: META_STYLE };
  ws['C3'] = { t: 's', v: 'producto_tipo: shampoo | acondicionador | pack', s: META_STYLE };
  ws['D3'] = { t: 's', v: 'gramos: 50 | 100', s: META_STYLE };
  ws['!merges'].push(
    { s: { r: 2, c: 0 }, e: { r: 2, c: 0 } },
    { s: { r: 2, c: 1 }, e: { r: 2, c: 1 } },
    { s: { r: 2, c: 2 }, e: { r: 2, c: 2 } },
    { s: { r: 2, c: 3 }, e: { r: 2, c: 3 } }
  );

  /* Headers */
  let row = 5;
  PLANTILLA_VENTAS_HEADERS.forEach((h, i) => {
    const addr = XLSX.utils.encode_cell({ r: row - 1, c: i });
    ws[addr] = { t: 's', v: h, s: HEADER_STYLE };
  });
  row++;

  /* Fila de ejemplo */
  const ejemplo = [
    new Date().toISOString().slice(0, 10),
    'Consumidor final',
    'whatsapp',
    'entregado',
    'Shampoo Sólido Jamaica',
    'shampoo',
    '50',
    '2',
    '50',
    '0',
    ''
  ];
  ejemplo.forEach((v, i) => {
    const addr = XLSX.utils.encode_cell({ r: row - 1, c: i });
    ws[addr] = { t: typeof v === 'number' ? 'n' : 's', v, s: CELL_STYLE };
  });
  row++;

  /* Segunda fila de ejemplo */
  const ejemplo2 = [
    new Date().toISOString().slice(0, 10),
    'María Pérez',
    'tienda',
    'entregado',
    'Acondicionador Sólido Melón',
    'acondicionador',
    '50',
    '1',
    '45',
    '0',
    'Cliente frecuente'
  ];
  ejemplo2.forEach((v, i) => {
    const addr = XLSX.utils.encode_cell({ r: row - 1, c: i });
    ws[addr] = { t: typeof v === 'number' ? 'n' : 's', v, s: CELL_STYLE };
  });
  row++;

  /* Anchos */
  ws['!cols'] = PLANTILLA_VENTAS_HEADERS.map(h => ({ wch: Math.max(String(h).length + 2, 14) }));
  ws['!ref'] = `A1:${XLSX.utils.encode_col(PLANTILLA_VENTAS_HEADERS.length - 1)}${row - 1}`;
  ws['!views'] = [{ state: 'frozen', ySplit: 5 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
  XLSX.writeFile(wb, filename, { bookType: 'xlsx', compression: true });
  return filename;
}

/* ═══════════════════════════════════════════════════════════
   HELPERS DE UI — Toast común
   ═══════════════════════════════════════════════════════════ */
export function toast(msg, type = '') {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3500);
}
