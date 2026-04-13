# 🔐 CHECKLIST SECRETS & ENV CLOUDFLARE (APPAPI)

Dokumen ini berisi daftar kunci rahasia yang **WAJIB** dimasukkan ke server Cloudflare sebelum melakukan `wrangler deploy` untuk API Core.

## 1. ID Binding (Update Manual di `wrangler.toml`)
Kamu harus membuat layanan ini di Dasbor Cloudflare terlebih dahulu, lalu menyalin ID-nya dan menempelkannya di `wrangler.toml`:
- [ ] `database_id` untuk `DB_CORE`
- [ ] `database_id` untuk `DB_LOGS`
- [ ] `database_id` untuk `DB_ARCHIVES`
- [ ] `id` untuk `ORLAND_CACHE` (Workers & Pages -> KV)
- [ ] `CF_ACCOUNT_ID` di bagian `[vars]` (Ada di URL Dasbor Cloudflare-mu atau menu Workers Overview)

## 2. Secrets (Eksekusi via Termux / Dasbor Web)
Jalankan perintah ini satu per satu di Termux pada folder `apps/appapi`, atau tambahkan melalui Dasbor Cloudflare (Settings -> Variables and Secrets):

- [ ] **`JWT_SECRET`** (WAJIB: Harus sama persis dengan yang ada di `appsso`!)
  `npx wrangler secret put JWT_SECRET`

- [ ] **`R2_ACCESS_KEY_ID`** (WAJIB: Untuk upload media presigned URL)
  `npx wrangler secret put R2_ACCESS_KEY_ID`

- [ ] **`R2_SECRET_ACCESS_KEY`** (WAJIB: Pasangan dari Access Key di atas)
  `npx wrangler secret put R2_SECRET_ACCESS_KEY`

*(Catatan: R2 API Token bisa dibuat di Dasbor Cloudflare -> R2 -> Manage R2 API Tokens. Pastikan memiliki izin "Object Read & Write")*
