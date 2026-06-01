const fs = require('fs');

fs.copyFileSync('restored/components/AdminPanel.tsx', 'components/AdminPanel.tsx');
fs.copyFileSync('restored/components/VendorPanel.tsx', 'components/VendorPanel.tsx');
fs.copyFileSync('restored/components/Layout.tsx', 'components/Layout.tsx');

// The original CSS and HTML might have specific styles too.
if (fs.existsSync('restored/index.css')) {
  fs.copyFileSync('restored/index.css', 'index.css');
}
if (fs.existsSync('restored/index.html')) {
  fs.copyFileSync('restored/index.html', 'index.html');
}

console.log('Restored remaining UI files');
