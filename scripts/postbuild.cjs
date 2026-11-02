const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const docsDir = path.resolve(__dirname, '../docs');

// Create .nojekyll in dist
fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');

// Copy index.html to 404.html in dist for SPA routing fallback
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));
}

// Mirror dist to docs
fs.cpSync(distDir, docsDir, { recursive: true });

console.log('Postbuild complete: .nojekyll, 404.html, and docs/ mirror ready.');
