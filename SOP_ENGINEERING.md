# ORLAND MANAGEMENT SAAS - ENGINEERING SOP

Dokumen ini mengatur standar operasional pengembangan, deployment, dan keamanan lintas layanan dalam monorepo Turborepo.

## 1. MANAJEMEN ENVIRONMENT & SECRETS
- **Lokal (`wrangler dev`):** Gunakan file `.dev.vars` di masing-masing direktori `apps/`. DILARANG menaruh *production keys* di file ini. File ini sudah di-ignore di `.gitignore`.
- **Production (`wrangler deploy`):** Variabel biasa (non-rahasia) didefinisikan di `wrangler.toml` di bawah `[vars]`.
- **Secrets Production:** Kredensial sensitif (JWT Secret, Database Passwords eksternal, Payment Keys) WAJIB dimasukkan melalui CLI Cloudflare:
  `wrangler secret put <NAMA_SECRET> --name <nama-worker>`

## 2. STANDAR DATABASE (CLOUDFLARE D1)
- **Soft Deletes:** Dilarang menggunakan perintah `DELETE FROM`. Semua tabel utama wajib menggunakan kolom `is_deleted (INTEGER)` atau `deleted_at (INTEGER)`. Ubah nilainya menjadi 1 atau *timestamp* untuk menghapus data.
- **Migrasi Skema:** Perubahan struktur tabel WAJIB menggunakan Drizzle ORM migration.
  1. Ubah skema di `packages/db-schema/src/`.
  2. Jalankan `drizzle-kit generate:sqlite`.
  3. Terapkan migrasi ke D1 lokal: `wrangler d1 migrations apply DB_CORE --local`.
  4. Terapkan ke D1 production: `wrangler d1 migrations apply DB_CORE`.

## 3. VALIDASI DATA & KEAMANAN API (appapi)
- **Input Validation:** Semua *payload request* yang masuk ke API HARUS divalidasi menggunakan pustaka Zod (`zod`). Hono memiliki middleware Zod Validator resmi (`@hono/zod-validator`). Dilarang memproses `c.req.json()` secara mentah.
- **Autentikasi:** Endpoint yang membutuhkan login harus melewati middleware yang mengekstrak token JWT, memvalidasinya (melalui `appsso` atau *shared secret*), dan menyematkan `userId` ke dalam `c.get('userId')`.

## 4. ALUR KERJA DEPLOYMENT (Turborepo)
- **Build Paralel:** Lakukan pengecekan tipe TypeScript dan *build* aset secara paralel sebelum deploy menggunakan: `npm run build` (yang akan memicu `turbo run build`).
- **Pengecekan Kualitas:** Wajib menjalankan linter sebelum commit: `npm run lint`.
