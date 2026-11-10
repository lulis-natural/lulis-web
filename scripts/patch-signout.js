const fs = require('fs');
const path = require('path');

const fbInitPath = path.join(__dirname, '..', 'admin', 'js', 'firebase-init.js');
let content = fs.readFileSync(fbInitPath, 'utf8');

content = content.replace(
  /async function signOut\(\) \{[\s\S]*?window\.location\.replace\('index\.html'\);\s*\}/,
  `async function signOut() {
  localStorage.removeItem('lulis_admin_authenticated');
  localStorage.removeItem('lulis_admin_user');
  localStorage.removeItem('lulis_admin_email');
  try { await fbSignOut(auth); } catch (_) {}
  window.location.replace('index.html');
}`
);

fs.writeFileSync(fbInitPath, content, 'utf8');
console.log('admin/js/firebase-init.js signOut helper updated!');
