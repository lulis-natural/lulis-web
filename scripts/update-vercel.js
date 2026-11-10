const fs = require('fs');
const path = require('path');

const vercelPath = path.join(__dirname, '..', 'vercel.json');
const vj = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));

vj.trailingSlash = false;
vj.rewrites = [
  { "source": "/admin", "destination": "/admin/index.html" },
  { "source": "/admin/", "destination": "/admin/index.html" }
];
vj.redirects = [
  { "source": "/index.html", "destination": "/", "permanent": true },
  { "source": "/home", "destination": "/", "permanent": true },
  { "source": "/catalogo", "destination": "/#products", "permanent": false },
  { "source": "/catalogo/", "destination": "/#products", "permanent": false },
  { "source": "/nosotros", "destination": "/#about", "permanent": false },
  { "source": "/nosotros/", "destination": "/#about", "permanent": false },
  { "source": "/galeria", "destination": "/#gallery", "permanent": false },
  { "source": "/galeria/", "destination": "/#gallery", "permanent": false },
  { "source": "/ubicaciones", "destination": "/#ubicaciones", "permanent": false },
  { "source": "/ubicaciones/", "destination": "/#ubicaciones", "permanent": false },
  { "source": "/contacto", "destination": "/#contact", "permanent": false },
  { "source": "/contacto/", "destination": "/#contact", "permanent": false }
];

fs.writeFileSync(vercelPath, JSON.stringify(vj, null, 2), 'utf8');
console.log('vercel.json updated successfully');
