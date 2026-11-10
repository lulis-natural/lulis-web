const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// ═════════════════════════════════════════════════════════════
// 1. UPDATE NAVBAR LOGO SIZE (css/components/navbar.css & index.html)
// ═════════════════════════════════════════════════════════════
const navbarCssPath = path.join(rootDir, 'css', 'components', 'navbar.css');
let navbarCss = fs.readFileSync(navbarCssPath, 'utf8');

navbarCss = navbarCss.replace(/\.nav-logo img\s*\{[^}]*\}/, `.nav-logo img {
  height: 110px;
  width: auto;
  display: block;
  filter: brightness(0) invert(1);
  transition: all 0.3s ease;
}`);

navbarCss = navbarCss.replace(/#navbar\.scrolled \.nav-logo img\s*\{[^}]*\}/, `#navbar.scrolled .nav-logo img {
  height: 90px;
  filter: none;
}`);

fs.writeFileSync(navbarCssPath, navbarCss, 'utf8');

// Also update index.html inline styles for logo
const indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

indexHtml = indexHtml.replace(
  /\.nav-logo img\{height:80px;width:auto;display:block;filter:brightness\(0\) invert\(1\);transition:filter \.3s\}/,
  '.nav-logo img{height:110px;width:auto;display:block;filter:brightness(0) invert(1);transition:all .3s ease}'
);
indexHtml = indexHtml.replace(
  /#navbar\.scrolled \.nav-logo img\{filter:none\}/,
  '#navbar.scrolled .nav-logo img{height:90px;filter:none}'
);
indexHtml = indexHtml.replace(
  /\.nav-logo img\{height:72px\}/,
  '.nav-logo img{height:85px}'
);

// ═════════════════════════════════════════════════════════════
// 2. CONTRAST FIX IN "POR QUÉ SHAMPOO SÓLIDO" (css/components/sections.css)
// ═════════════════════════════════════════════════════════════
const sectionsCssPath = path.join(rootDir, 'css', 'components', 'sections.css');
let sectionsCss = fs.readFileSync(sectionsCssPath, 'utf8');

// Replace .circular-step and icon CSS with high-contrast cards
const oldCircularPattern = /\.circular-step\s*\{[\s\S]*?\.circular-step-text\s*\{[^}]*?\}/;
const newCircularCss = `.circular-step {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #ffffff;
  border-radius: 14px;
  padding: 14px 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.circular-step:hover {
  transform: translateX(4px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}
.circular-step-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  background: #FAF6EF;
  border: 1.5px solid #F4BF56;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: var(--wine);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.circular-step-text {
  font-size: 0.92rem;
  color: #1C1611;
  font-weight: 600;
  line-height: 1.4;
}`;

sectionsCss = sectionsCss.replace(oldCircularPattern, newCircularCss);
fs.writeFileSync(sectionsCssPath, sectionsCss, 'utf8');
console.log('sections.css updated with high-contrast circular step cards!');

// ═════════════════════════════════════════════════════════════
// 3. UPDATE IMPACT SECTION WITH FORMULA EQUIVALENCE & LIVE GROWTH NOTICE
// ═════════════════════════════════════════════════════════════
const oldImpactStatsPattern = /<div class="impact-stats" role="list"[\s\S]*?<\/div>\s*<\/div>\s*<div class="circular-section/;

const newImpactStats = `<div class="impact-stats" role="list" aria-label="Estadísticas de impacto ambiental">
      <div class="impact-stat-card reveal delay-1" role="listitem">
        <div class="impact-icon-big" aria-hidden="true">💧</div>
        <div class="impact-num" data-metric="agua">30.2</div>
        <div class="impact-unit">litros de agua evitados</div>
        <div class="impact-lbl"><strong>80% agua eliminada:</strong> un shampoo comercial es 80% agua; en LULIS concentramos solo activos botánicos puros.</div>
      </div>
      <div class="impact-stat-card reveal delay-2" role="listitem">
        <div class="impact-icon-big" aria-hidden="true">🧴</div>
        <div class="impact-num" data-metric="botellas">108</div>
        <div class="impact-unit">botellas plásticas reemplazadas</div>
        <div class="impact-lbl"><strong>1 barra = 3 botellas comerciales:</strong> 100% libre de plástico que nunca llegará a ríos o vertederos.</div>
      </div>
      <div class="impact-stat-card reveal delay-3" role="listitem">
        <div class="impact-icon-big" aria-hidden="true">⚖️</div>
        <div class="impact-num" data-metric="kg">2.7</div>
        <div class="impact-unit">kg de plástico eliminado</div>
        <div class="impact-lbl"><strong>~35g plástico virgen por barra:</strong> reducción directa del ciclo de consumo de envases descartables.</div>
      </div>
      <div class="impact-stat-card reveal delay-4" role="listitem">
        <div class="impact-icon-big" aria-hidden="true">🌱</div>
        <div class="impact-num" data-metric="vendidos">72</div>
        <div class="impact-unit">barras conscientes entregadas</div>
        <div class="impact-lbl"><strong>100% empaque con semillas:</strong> papel reciclado artesanal que se planta y germina en vida vegetal.</div>
      </div>
    </div>

    <!-- Indicador de datos en crecimiento -->
    <div class="impact-growth-notice reveal" style="text-align:center;margin:28px auto 44px;max-width:640px;padding:12px 24px;background:rgba(7,188,138,0.12);border:1.5px solid var(--emerald);border-radius:50px;font-size:0.86rem;color:#065F46;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px">
      <span style="display:inline-block;width:10px;height:10px;background:var(--emerald);border-radius:50%;animation:pulse 2s infinite"></span>
      <span><strong>Métricas vivas en crecimiento constante:</strong> se actualizan automáticamente con cada barra producida y vendida.</span>
    </div>

    <div class="circular-section`;

indexHtml = indexHtml.replace(oldImpactStatsPattern, newImpactStats);
fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('index.html updated with formula percentages, growth notice and bigger logo!');

console.log('All user adjustments applied!');
