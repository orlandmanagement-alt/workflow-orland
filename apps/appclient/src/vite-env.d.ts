/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Tambahkan env lain di sini jika ada
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
