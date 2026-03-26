# ORLAND MANAGEMENT SAAS - AI AGENT MASTER RULES

## 1. PROJECT ARCHITECTURE (TURBO MONOREPO)
Proyek ini menggunakan arsitektur Turborepo. Semua kode terbagi ke dalam `apps/` (layanan spesifik) dan `packages/` (kode yang digunakan bersama). Agen AI HARUS menghormati batasan direktori ini dan tidak menduplikasi kode.

### Direktori `apps/` (Layanan & Frontend)
- `apps/appsso`: Hono Worker khusus otentikasi, JWT, dan validasi role. (Terkoneksi HANYA ke DB_SSO).
- `apps/appapi`: Hono Worker untuk Core Business API. (Terkoneksi ke DB_CORE, DB_LOGS, DB_ARCHIVES, dan KV).
- `apps/appcdn`: Hono Worker untuk mengelola aset gambar R2 (terhubung ke domain `cdn.orlandmanagement.com`).
- `apps/appclient`: UI Dashboard Klien (Pencari talent/PH).
- `apps/apptalent`: UI Dashboard Talent.
- `apps/appadmin`: UI Dashboard Admin/Superadmin internal.

### Direktori `packages/` (Shared Modules)
- `packages/db-schema`: Skema database terpusat (Drizzle ORM / Raw SQL).
- `packages/ui`: Komponen UI Tailwind CSS yang dipakai berulang di semua frontend.
- `packages/tsconfig`: Konfigurasi dasar TypeScript.

## 2. DATA STRATEGY & INFRASTRUCTURE
Sistem backend menggunakan ekosistem Cloudflare Serverless dengan aturan ketat:
- **Cloudflare Workers + Hono:** Framework utama untuk semua backend (`appsso`, `appapi`, `appcdn`).
- **Cloudflare D1 (SQLite) Terpisah:**
  - `DB_SSO`: Khusus data otentikasi dan kredensial.
  - `DB_CORE`: Data operasional utama (talent, proyek aktif).
  - `DB_LOGS`: Pencatatan aktivitas sistem dan audit trail.
  - `DB_ARCHIVES`: Penyimpanan data lama (proyek selesai > 6 bulan) untuk meringankan DB_CORE. Pindahan dilakukan via Worker Cron Triggers.
- **Cloudflare KV (Caching Layer):** Agen WAJIB mengimplementasikan pola "Read-Through Cache". Endpoint GET harus mengecek KV terlebih dahulu untuk filtering/indexing sebelum melakukan query ke DB_CORE.
- **Cloudflare R2:** Semua upload file media/gambar disimpan di R2 via `appcdn`.

## 3. CODING STANDARDS
- **Strict TypeScript:** Wajib. Tidak ada tipe `any`.
- **API Response:** Gunakan standar JSON: `{ success: boolean, source?: 'KV' | 'D1', data?: any, error?: string }`.
- **Database Access:** Frontend dilarang keras memanggil D1 langsung. Semua alur data adalah: Frontend -> Hono API (cek KV -> D1) -> Frontend.

## 4. AI AGENT EXECUTION RULES
1. **Analyze First:** Sebelum menulis kode, baca struktur di `packages/` untuk melihat apakah komponen/skema sudah ada.
2. **Context Isolation:** Saat bekerja di satu `app`, jangan mengubah file di `app` lain tanpa izin pengguna.
3. **Drafting (Artifacts):** Buat rencana implementasi saat mengubah logika database atau routing Hono sebelum mengeksekusi penulisan file.
