#!/bin/bash
echo "=== MEMULAI BUILD KHUSUS ORLAND ==="
echo "1. Menghapus package-lock.json lama yang bermasalah..."
rm -f package-lock.json

echo "2. Melakukan instalasi npm secara paksa..."
npm install --legacy-peer-deps

echo "3. Menjalankan proses build aplikasi..."
npm run build
echo "=== BUILD SELESAI ==="
