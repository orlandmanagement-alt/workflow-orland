import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Gunakan dedupe untuk memaksa resolusi ke satu versi React di monorepo
    dedupe: ['react', 'react-dom']
  },
})