#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# LULIS — optimize-images.sh
# Convierte todas las imágenes del proyecto a WebP con calidad
# optimizada y genera versiones responsive (srcset).
#
# Requiere: cwebp (libwebp) y optipng/jpegoptim
# Instalar en macOS: brew install webp jpegoptim optipng
# Instalar en Ubuntu: sudo apt install webp jpegoptim optipng
#
# Uso: bash scripts/optimize-images.sh
# ═══════════════════════════════════════════════════════════

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGENES="$PROJECT_ROOT/Imagenes"
QUALITY=82       # Calidad WebP (82 = óptimo calidad/peso)
QUALITY_PROD=75  # Calidad para la versión pequeña (mobile)

echo "🖼️  LULIS — Optimización de imágenes"
echo "   Directorio: $IMAGENES"
echo ""

# Verificar dependencias
check_dep() {
  if ! command -v "$1" &>/dev/null; then
    echo "❌ '$1' no está instalado."
    echo "   macOS: brew install webp"
    echo "   Ubuntu: sudo apt install webp"
    exit 1
  fi
}
check_dep cwebp

CONVERTED=0
SKIPPED=0
SAVED_BYTES=0

# Procesar todas las imágenes
find "$IMAGENES" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r img; do

  dir="$(dirname "$img")"
  base="$(basename "$img")"
  name="${base%.*}"
  out_webp="$dir/$name.webp"
  out_480="$dir/${name}-480w.webp"
  out_800="$dir/${name}-800w.webp"

  original_size=$(wc -c < "$img")

  echo "  ⚙️  $base"

  # Convertir a WebP calidad estándar
  cwebp -q $QUALITY -mt -quiet "$img" -o "$out_webp"
  webp_size=$(wc -c < "$out_webp")
  saved=$(( original_size - webp_size ))
  pct=$(( saved * 100 / original_size ))

  echo "     → $(basename "$out_webp") — ${original_size} B → ${webp_size} B (${pct}% menos)"

  # Generar versión 800w para tablets
  if command -v convert &>/dev/null; then
    convert "$img" -resize '800x>' -quality 85 /tmp/tmp_800.jpg 2>/dev/null && \
    cwebp -q $QUALITY -mt -quiet /tmp/tmp_800.jpg -o "$out_800" && \
    echo "     → $(basename "$out_800") (800w)"

    # Generar versión 480w para mobile
    convert "$img" -resize '480x>' -quality 80 /tmp/tmp_480.jpg 2>/dev/null && \
    cwebp -q $QUALITY_PROD -mt -quiet /tmp/tmp_480.jpg -o "$out_480" && \
    echo "     → $(basename "$out_480") (480w)"

    rm -f /tmp/tmp_800.jpg /tmp/tmp_480.jpg
  fi

  CONVERTED=$((CONVERTED + 1))

done

echo ""
echo "✅ Completado."
echo ""
echo "──────────────────────────────────────────────────────"
echo "SIGUIENTE PASO: actualizar las etiquetas <img> en"
echo "index.html para usar <picture> con WebP y fallback JPG."
echo ""
echo "Ejemplo:"
echo '<picture>'
echo '  <source srcset="Imagenes/productos/Jamaica.webp" type="image/webp">'
echo '  <img src="Imagenes/productos/Jamaica.jpg" alt="Shampoo Jamaica LULIS" loading="lazy" width="400" height="300">'
echo '</picture>'
echo "──────────────────────────────────────────────────────"
