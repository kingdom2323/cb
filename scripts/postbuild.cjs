const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(__dirname, '../dist');
const docsDir = path.resolve(__dirname, '../docs');
const rootAssetsDir = path.resolve(__dirname, '../assets');

// Create .nojekyll in dist and root
fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');
fs.writeFileSync(path.join(rootDir, '.nojekyll'), '', 'utf8');

// Copy index.html to 404.html in dist for SPA routing fallback
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));
}

// Mirror dist to docs
fs.cpSync(distDir, docsDir, { recursive: true });

// Copy dist/assets to root assets for direct root serving fallback
if (fs.existsSync(path.join(distDir, 'assets'))) {
  fs.cpSync(path.join(distDir, 'assets'), rootAssetsDir, { recursive: true });
}

console.log('Postbuild complete: .nojekyll, 404.html, docs/ mirror, and root assets ready.');
