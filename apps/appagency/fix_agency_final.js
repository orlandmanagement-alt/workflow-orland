import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target folder aplikasi Agency
const appPath = path.join(__dirname, 'apps', 'appagency');

const files = {
  // 1. INDEX.HTML (WAJIB di root folder apps/appagency)
  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Orland Management | Agency Portal</title>
  </head>
  <body class="dark bg-[#071122]">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,

  // 2. VITE.CONFIG.TS (Pastikan path alias @ benar)
  'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})`,

  // 3. SRC/MAIN.TSX (Entry point React)
  'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/Dashboard'
import AuthCallback from './pages/auth/callback'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)`
};

// Eksekusi pembuatan file
console.log('--- RECOVERY START: Fixing AppAgency Structure ---');

Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(appPath, filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  fs.writeFileSync(fullPath, content);
  console.log('✅ File Created: ' + fullPath);
});

console.log('--- RECOVERY FINISHED ---');