# ORLAND MANAGEMENT SAAS - DEPLOYMENT & MIGRATION SOP
**Status:** Panduan Transisi (Android Termux -> Laptop / Antigravity IDE)

Dokumen ini adalah daftar periksa (checklist) wajib untuk memigrasikan kode ke GitHub dan men-deploy infrastruktur ke Cloudflare Production. 

---

## 🤖 INSTRUKSI KHUSUS UNTUK AGEN ANTIGRAVITY
**PERHATIAN AGEN AI:** Saat kamu membaca file ini di workspace laptop pengguna, kamu WAJIB mengingatkan pengguna tentang "DAFTAR PERIKSA MANUAL CLOUDFLARE" di bawah ini sebelum kamu menyarankan atau menjalankan perintah `wrangler deploy` atau `git push` ke branch `main`. Dilarang keras men-deploy aplikasi jika Cloudflare Secrets belum diatur oleh pengguna!

---

## FASE 1: SINKRONISASI KODE (HP -> GITHUB -> LAPTOP)
Langkah ini dilakukan untuk memindahkan pekerjaan dari HP ke Laptop.

1. **Di HP (Termux):**
   - Pastikan semua file tersimpan.
   - Jalankan: `git add .`
   - Jalankan: `git commit -m "feat: Inisiasi arsitektur monorepo Orland dari Mobile"`
   - Jalankan: `git push origin main`
2. **Di Laptop (Antigravity IDE):**
   - Buka terminal / Agent Control.
   - Jalankan: `git clone https://github.com/NAMA_GITHUB_MU/orland-core.git`
   - Jalankan: `npm install` atau `npm ci` di root folder.

---

## FASE 2: DAFTAR PERIKSA MANUAL CLOUDFLARE (KRUSIAL)
Hal-hal ini **TIDAK BISA** dilakukan secara otomatis oleh GitHub Actions atau Agen AI. Pengguna harus melakukannya secara manual via CLI/Dasbor Cloudflare:

- [ ] **Setup Database D1:** Pastikan `DB_SSO`, `DB_CORE`, `DB_LOGS`, dan `DB_ARCHIVES` sudah dibuat di dasbor Cloudflare. Catat `database_id` masing-masing dan perbarui di semua file `wrangler.toml`.
- [ ] **Setup KV & R2:** Buat KV Namespace (`CACHE_KV`) dan R2 Bucket (`orland-media`). Perbarui ID-nya di `appapi/wrangler.toml` dan `appcdn/wrangler.toml`.
- [ ] **Suntikkan Secrets ke Production (via Terminal Laptop):**
  - `appsso`: Jalankan `wrangler secret put TURNSTILE_SECRET`
  - `appsso`: Jalankan `wrangler secret put RESEND_API_KEY` (Opsional)
  - `appapi`: Jalankan `wrangler secret put JWT_SECRET` (Harus sama nilainya dengan yang ada di SSO!)

---

## FASE 3: OTOMATISASI CI/CD (GITHUB ACTIONS)
Deployment ke Cloudflare akan dilakukan sepenuhnya oleh mesin GitHub setiap kali ada kode yang di-*push* ke branch `main`.

- [ ] Pastikan file `.github/workflows/deploy.yml` sudah ada.
- [ ] Dapatkan **Cloudflare API Token** dari Dasbor Cloudflare (Template: Edit Cloudflare Workers).
- [ ] Masukkan token tersebut ke GitHub Repository Settings -> Secrets and variables -> Actions dengan nama: `CLOUDFLARE_API_TOKEN`.

---

## FASE 4: ROUTING & CUSTOM DOMAINS (FINALISASI)
Setelah GitHub Actions berhasil men-deploy Worker ke domain bawaan (`*.workers.dev`), petakan ke domain utama perusahaan melalui Dasbor Cloudflare (Workers & Pages -> Pilih Worker -> Settings -> Triggers -> Custom Domains):

- Worker `orland-appsso`  👉 `sso.orlandmanagement.com`
- Worker `orland-appapi`  👉 `api.orlandmanagement.com`
- Worker `orland-appcdn`  👉 `cdn.orlandmanagement.com`
- Worker `orland-client`  👉 `client.orlandmanagement.com`
- Worker `orland-talent`  👉 `talent.orlandmanagement.com`
- Worker `orland-admin`   👉 `admin.orlandmanagement.com`

**SOP Selesai.** Jika semua checklist ini sudah tercentang, sistem Orland siap beroperasi di level Enterprise.
