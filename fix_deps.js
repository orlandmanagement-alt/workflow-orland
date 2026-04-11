import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appsDir = path.join(__dirname, 'apps');

// Pastikan Anda menangani semua portal
const apps = ['apptalent', 'appclient', 'appagency', 'appadmin'];

console.log('--- MEMULAI SINKRONISASI VERSI VITE ---');

apps.forEach(app => {
  const pkgPath = path.join(appsDir, app, 'package.json');
  
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      
      let modified = false;
      if (pkg.devDependencies) {
        // Kembalikan Vite ke versi stabil 6.x
        if (pkg.devDependencies['vite']) {
          pkg.devDependencies['vite'] = '^6.0.0';
          modified = true;
        }
        // Pastikan plugin react menggunakan versi stabil terbaru 4.x
        if (pkg.devDependencies['@vitejs/plugin-react']) {
          pkg.devDependencies['@vitejs/plugin-react'] = '^4.3.4';
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
        console.log(`✅ Diperbaiki: ${app}/package.json`);
      }
    } catch (e) {
      console.error(`❌ Gagal membaca ${app}/package.json`, e);
    }
  } else {
    console.log(`⚠️ Dilewati: ${app} tidak ditemukan.`);
  }
});

console.log('--- SINKRONISASI SELESAI ---');