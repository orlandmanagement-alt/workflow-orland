# Environment Variables Documentation
## ORLAND Management SaaS - Complete Variable Reference

**Status:** Updated April 9, 2026  
**Version:** 1.0.0

---

## 📋 Daftar Lengkap Environment Variables

### Kategori: Cloudflare Workers Setup
```ini
# ============================================================================
# CLOUDFLARE WORKERS - KONFIGURASI DASAR
# ============================================================================

# Akun Cloudflare dan API Token (WAJIB via wrangler CLI)
# Format: CP-xxxxxxxxxxxxxx...
# Diperoleh dari: Cloudflare Dashboard > My Profile > API Tokens > Create Token
CLOUDFLARE_API_TOKEN=your_api_token_here

# Account ID (dari dashboard URL: https://dash.cloudflare.com/ACCOUNT_ID)
CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# Environment production/staging/development
ENVIRONMENT=production
```

### Kategori: Database Configuration
```ini
# ============================================================================
# CLOUDFLARE D1 DATABASE
# ============================================================================

# Database IDs (dari Cloudflare D1 Dashboard)
# CATATAN: Dari workspace sebelumnya, kami memiliki:
# - DB_CORE (database utama untuk talents, projects, etc)
# - DB_SSO (database autentikasi dan sessions)
# - DB_LOGS (database logging dan analytics)
# - DB_ARCHIVE (database backup/archive)

# BUAT 4 DATABASE di Cloudflare jika belum ada:
# 1. wrangler d1 create orland-core
# 2. wrangler d1 create orland-sso
# 3. wrangler d1 create orland-logs
# 4. wrangler d1 create orland-archive

DB_CORE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DB_SSO_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DB_LOGS_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DB_ARCHIVE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Kategori: R2 Storage Configuration
```ini
# ============================================================================
# CLOUDFLARE R2 BUCKET (File Storage untuk Media)
# ============================================================================

# Bucket name (sesuai nama yang dibuat di Cloudflare)
R2_BUCKET_NAME=orland-media

# R2 Account ID (sama dengan CLOUDFLARE_ACCOUNT_ID)
R2_ACCOUNT_ID=your_account_id_here

# Public URL untuk R2 (custom domain/subdomain)
# Format: https://cdn.yourdomain.com atau https://r2.yourdomain.com
R2_PUBLIC_URL=https://cdn.orlandmanagement.com

# Access Key & Secret (buat di Cloudflare > R2 > Settings > API Tokens)
# PERHATIAN: Simpan di Cloudflare Secrets, TIDAK boleh di .env lokal
# Gunakan: wrangler secret put R2_ACCESS_KEY
# Gunakan: wrangler secret put R2_SECRET_KEY
# (Dalam file .dev.vars untuk localhost, atau via wrangler secret untuk production)
```

### Kategori: Authentication & Security
```ini
# ============================================================================
# JWT & AUTHENTIKASI
# ============================================================================

# JWT Secret untuk signing tokens
# WAJIB: Unique, secure, 32+ characters minimum
# Generate: openssl rand -base64 32
# Simpan di: wrangler secret put JWT_SECRET
# JANGAN pernah share atau commit ke Git!
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# JWT Expiration time (dalam detik)
JWT_EXPIRES_IN=86400  # 24 jam

# Refresh token expiration (dalam hari)
JWT_REFRESH_EXPIRES_IN=7  # 7 hari

# Hashing salt untuk password (atau gunakan bcrypt rounds)
BCRYPT_ROUNDS=10
```

### Kategori: Third-Party Services
```ini
# ============================================================================
# LAYANAN PIHAK KETIGA - EMAILER & OTP
# ============================================================================

# Resend API (Email Service)
# Diperoleh dari: https://resend.com/api-keys
# Gunakan: wrangler secret put RESEND_API_KEY
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxx

# Email sender address
EMAIL_FROM_ADDRESS=noreply@orlandmanagement.com
EMAIL_FROM_NAME=Orland Management

# ============================================================================
# SECURITY - TURNSTILE (Bot Protection)
# ============================================================================

# Cloudflare Turnstile Secret (untuk form submission bot check)
# Dapatkan dari: Cloudflare Dashboard > Turnstile
# Gunakan: wrangler secret put TURNSTILE_SECRET
TURNSTILE_SECRET=your_turnstile_secret_key

# Turnstile Site Key (untuk frontend)
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

### Kategori: Social Media & APIs (TAMBAHAN BARU)
```ini
# ============================================================================
# SOCIAL MEDIA & EXTERNAL APIS (NEW - untuk Mission Implementation)
# ============================================================================

# YouTube API Key (untuk bulk video import)
# Dapatkan dari: Google Cloud Console > YouTube Data API
# Gunakan: wrangler secret put YOUTUBE_API_KEY
YOUTUBE_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxxxxxx

# Optional: Social Media APIs untuk talent verification
# Instagram Graph API Token (jika dibutuhkan)
INSTAGRAM_API_TOKEN=

# TikTok API (jika dibutuhkan untuk analytics)
TIKTOK_API_KEY=

# Twitter/X API Key (jika dibutuhkan)
TWITTER_API_KEY=
```

### Kategori: Payment & Finance
```ini
# ============================================================================
# PAYMENT GATEWAY (untuk feature withdrawal/payout)
# ============================================================================

# Stripe API Keys
# Dashboard: https://dashboard.stripe.com/apikeys
# Gunakan: wrangler secret put STRIPE_SECRET_KEY
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# Xendit API (untuk Indonesia payment)
# Gunakan: wrangler secret put XENDIT_API_KEY
XENDIT_API_KEY=xnd_live_xxxxxxxxxxxxx

# Bank Account (untuk payout references)
COMPANY_BANK_ACCOUNT=your_bank_account_number
COMPANY_BANK_NAME=your_bank_name
```

### Kategori: Monitoring & Logging
```ini
# ============================================================================
# MONITORING, ANALYTICS & ERROR TRACKING
# ============================================================================

# Sentry (Error tracking & performance monitoring)
# Dapatkan dari: https://sentry.io
# Format: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_DSN=https://key@sentry.ingest.sentry.io/project_id

# Sentry Environment
SENTRY_ENVIRONMENT=production

# ============================================================================
# LOGGING & OBSERVABILITY
# ============================================================================

# Log Level (development/debug/info/warning/error)
LOG_LEVEL=info

# Enable detailed debug logs (true/false)
ENABLE_DEBUG_LOGS=false

# Analytics Engine (Cloudflare Analytics Engine)
ANALYTICS_ENABLED=true
```

### Kategori: Frontend Configuration
```ini
# ============================================================================
# FRONTEND - VITE VARIABLES (apps/apptalent, apps/appclient, apps/appadmin)
# ============================================================================

# API Base URLs
VITE_API_BASE_URL=https://api.orlandmanagement.com/api/v1
VITE_API_SSO_URL=https://sso.orlandmanagement.com

# R2 CDN URL (untuk image uploads)
VITE_R2_PUBLIC_URL=https://cdn.orlandmanagement.com

# Upload endpoint untuk presigned URLs
VITE_MEDIA_UPLOAD_ENDPOINT=https://api.orlandmanagement.com/api/v1/media/upload-url

# Turnstile Site Key (untuk bot protection UI)
VITE_TURNSTILE_SITE_KEY=your_site_key_here

# Feature Flags
VITE_ENABLE_BULK_IMPORT=true
VITE_ENABLE_AGENCY_ROSTER=true
VITE_ENABLE_PREMIUM_FEATURES=true

# Analytics
VITE_SENTRY_DSN=https://key@sentry.ingest.sentry.io/project_id

# Environment (development/staging/production)
VITE_ENVIRONMENT=production
```

### Kategori: Development Local
```ini
# ============================================================================
# LOCAL DEVELOPMENT (.dev.vars) - HANYA UNTUK npm run dev
# ============================================================================

# Database (gunakan lokal SQLite atau D1 lokal)
DATABASE_URL=file:./db.sqlite

# JWT Secret lokal (bisa sama dengan production atau beda)
JWT_SECRET=dev_secret_key_min_32_characters_here

# R2 Lokal (gunakan Minio atau local R2 emulator)
R2_ENDPOINT=http://localhost:9000
R2_ACCESS_KEY=minioadmin
R2_SECRET_KEY=minioadmin

# Email (gunakan MailHog atau test email service)
EMAIL_SERVICE=test

# Turnstile (disable untuk dev)
TURNSTILE_ENABLED=false
```

---

## 🔐 Panduan Setup Environment di Cloudflare

### Step 1: Buat API Token (sekali saja)
```bash
# Cloudflare Dashboard > My Profile > API Tokens > Create Token
# Permission: Account, All Accounts, Workers (Scripts), Edit
# Token: CP-xxxxxxxxxxxxxx...

# Simpan di lokal
export CLOUDFLARE_API_TOKEN=your_token
```

### Step 2: Setup Secrets di Cloudflare (Per Worker)
```bash
# Format: wrangler secret put <NAMA_SECRET> --name <nama-worker>

# Untuk appapi:
wrangler secret put JWT_SECRET --name orland-appapi
wrangler secret put R2_ACCESS_KEY --name orland-appapi
wrangler secret put R2_SECRET_KEY --name orland-appapi
wrangler secret put RESEND_API_KEY --name orland-appapi
wrangler secret put TURNSTILE_SECRET --name orland-appapi
wrangler secret put YOUTUBE_API_KEY --name orland-appapi

# Untuk appsso:
wrangler secret put JWT_SECRET --name orland-appsso
wrangler secret put TURNSTILE_SECRET --name orland-appsso
wrangler secret put RESEND_API_KEY --name orland-appsso

# Verify secrets
wrangler secret list --name orland-appapi
```

### Step 3: Setup Environment Variables di wrangler.toml

**apps/appapi/wrangler.toml:**
```toml
[env.production]
vars = { 
  ENVIRONMENT = "production",
  LOG_LEVEL = "info",
  ENABLE_DEBUG_LOGS = false,
  JWT_EXPIRES_IN = "86400",
  BCRYPT_ROUNDS = "10",
  R2_BUCKET_NAME = "orland-media",
  R2_PUBLIC_URL = "https://cdn.orlandmanagement.com",
  EMAIL_FROM_ADDRESS = "noreply@orlandmanagement.com",
  SENTRY_ENVIRONMENT = "production"
}

# Database Bindings
d1_databases = [
  { binding = "DB_CORE", database_id = "your_db_core_id" },
  { binding = "DB_SSO", database_id = "your_db_sso_id" },
  { binding = "DB_LOGS", database_id = "your_db_logs_id" },
  { binding = "DB_ARCHIVE", database_id = "your_db_archive_id" }
]

# R2 Bucket Binding
r2_buckets = [
  { binding = "MEDIA_BUCKET", bucket_name = "orland-media" }
]

# KV Namespace Binding
kv_namespaces = [
  { binding = "CACHE_KV", id = "your_kv_namespace_id" }
]
```

### Step 4: GitHub Secrets (untuk CI/CD)
```bash
# GitHub Settings > Secrets and variables > Actions > New repository secret

# Tambahkan:
CLOUDFLARE_API_TOKEN = your_token
CLOUDFLARE_ACCOUNT_ID = your_account_id
```

---

## 📝 Catatan Perubahan Environment Variables

### ✅ Variables dari Workspace Sebelumnya (TETAP SAMA)
- `CLOUDFLARE_ACCOUNT_ID`
- `DB_CORE_ID`, `DB_SSO_ID`, `DB_LOGS_ID`, `DB_ARCHIVE_ID`
- `R2_BUCKET_NAME = orland-media`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `TURNSTILE_SECRET`
- `STRIPE_SECRET_KEY`
- `XENDIT_API_KEY`
- `SENTRY_DSN`

### 🆕 Variables BARU (Untuk Mission Implementation)
- `YOUTUBE_API_KEY` ← **BARU** (untuk bulk video import)
- `VITE_API_BASE_URL` ← **UPDATE** (jika domain berubah)
- `VITE_ENABLE_BULK_IMPORT` ← **BARU**
- `VITE_ENABLE_AGENCY_ROSTER` ← **BARU**
- `VITE_ENABLE_PREMIUM_FEATURES` ← **BARU**
- `R2_PUBLIC_URL` ← **BARU** (untuk CDN custom domain)

### 🔄 Variables yang DIUBAH
- `R2_ACCESS_KEY` ← Sekarang simpan di Secrets, bukan .env
- `R2_SECRET_KEY` ← Sekarang simpan di Secrets, bukan .env

---

## ✅ Checklist Sebelum Upload ke GitHub

- [ ] Semua `.env.local` files di `.gitignore` (TIDAK boleh commit)
- [ ] Semua `.dev.vars` files di `.gitignore` (TIDAK boleh commit)
- [ ] `.env.example` sudah di-commit dengan semua variables (TANPA values)
- [ ] Semua secrets sudah di-setup di Cloudflare via `wrangler secret put`
- [ ] GitHub Actions secrets sudah di-setup (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- [ ] Database migrations sudah di-jalankan di Cloudflare
- [ ] R2 bucket sudah dibuat dan configured
- [ ] KV Namespace sudah dibuat (jika digunakan)

---

## 🚀 Safe GitHub Upload Flow

```bash
# 1. Pastikan .gitignore benar
cat .gitignore | grep -E "\.env|\.dev\.vars|secrets"

# 2. Review files sebelum push
git status

# 3. Commit hanya .env.example dan dokumentasi
git add apps/appapi/.env.example
git add .github/workflows/deploy.yml
git add ENV_VARIABLES.md
git commit -m "chore: add environment variables documentation and example"

# 4. Push ke GitHub
git push origin main

# 5. GitHub Actions akan trigger otomatis
# (lihat .github/workflows/deploy.yml untuk workflow)
```

---

**⚠️ PENTING: Environment Variables Checklist**

| Variable | Lokasi | Method | Status |
|----------|--------|--------|--------|
| CLOUDFLARE_API_TOKEN | GitHub Secrets | Manual | ✅ |
| JWT_SECRET | Cloudflare Secrets | wrangler CLI | ✅ |
| R2_ACCESS_KEY | Cloudflare Secrets | wrangler CLI | ✅ |
| R2_SECRET_KEY | Cloudflare Secrets | wrangler CLI | ✅ |
| YOUTUBE_API_KEY | Cloudflare Secrets | wrangler CLI | ✅ NEW |
| Database IDs | wrangler.toml | Manual | ✅ |
| R2_BUCKET_NAME | wrangler.toml | Manual | ✅ |

---

**Last Updated:** April 9, 2026  
**Version:** 1.0.0  
**Status:** Safe for GitHub Upload
