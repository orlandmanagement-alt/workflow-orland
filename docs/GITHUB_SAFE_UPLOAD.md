# GitHub Safe Upload Guide untuk Orland Management

**Status:** Safe untuk Upload  
**Date:** April 9, 2026

---

## ✅ Pre-Upload Checklist

Sebelum `git push` ke GitHub, pastikan sudah selesai:

- [ ] **Cloudflare Setup Sudah Selesai**
  ```bash
  # Semua database dibuat
  wrangler d1 list
  # Output: DB_CORE, DB_SSO, DB_LOGS, DB_ARCHIVE
  
  # Semua secrets sudah di-setup
  wrangler secret list --name orland-appapi
  # Harus ada: JWT_SECRET, R2_ACCESS_KEY, R2_SECRET_KEY, YOUTUBE_API_KEY
  ```

- [ ] **Local Environment Files Tidak di-Track**
  ```bash
  git status
  # Pastikan TIDAK ada:
  # - .env (red)
  # - .dev.vars (red)
  # - .env.production (red)
  # Jika ada, jalankan: git rm --cached [filename]
  ```

- [ ] **GitHub Secrets Sudah di-Setup**
  ```
  GitHub Settings > Secrets and variables > Actions
  - CLOUDFLARE_API_TOKEN
  - CLOUDFLARE_ACCOUNT_ID
  ```

---

## 🚀 Langkah-Langkah Upload ke GitHub

### Step 1: Verifikasi .gitignore

```bash
# Buka .gitignore di root folder
nano .gitignore

# Pastikan berisi:
.env
.env.local
.env.*.local
.dev.vars
.dev.vars.toml
dist/
node_modules/
.DS_Store
*.log
```

### Step 2: Verifikasi File yang Akan di-Upload

```bash
# Lihat semua file yang akan di-commit
git status

# HARUS TIDAK ADA:
# - .env
# - .dev.vars
# - **/dist (folder build)

# HARUS ADA:
# - .env.example (dengan komentar, TANPA values)
# - .github/workflows/deploy.yml
# - ENV_VARIABLES.md

# Jika ada file yang tidak seharusnya, hapus tracking-nya
git rm --cached FILE_NAME
```

### Step 3: Setup GitHub Actions Secrets

**Via GitHub CLI:**
```bash
# Pastikan sudah install: https://cli.github.com/

# Login ke GitHub
gh auth login

# Set secrets
gh secret set CLOUDFLARE_API_TOKEN --body "your_token_here"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "your_account_id"

# Verify
gh secret list
```

**Via GitHub Web Dashboard:**
1. Buka: https://github.com/USERNAME/orland-core/settings/secrets/actions
2. Klik "New repository secret"
3. Tambahkan:
   - Name: `CLOUDFLARE_API_TOKEN`, Value: `your_token`
   - Name: `CLOUDFLARE_ACCOUNT_ID`, Value: `your_account_id`

### Step 4: Commit dan Push

```bash
# Staged semua files yang diizinkan
git add .

# Review sebelum commit
git status

# Commit dengan message yang jelas
git commit -m "chore: add environment setup and GitHub Actions workflow

- Add ENV_VARIABLES.md with complete reference
- Add .github/workflows/deploy.yml for CI/CD
- Add mission implementation files
- Add deployment guides and documentation"

# Push ke GitHub
git push origin main
```

### Step 5: Monitor GitHub Actions

```bash
# Via CLI
gh run list --repo USERNAME/orland-core
gh run view RUN_ID  # get logs

# Via Web
# Buka: https://github.com/USERNAME/orland-core/actions
# Lihat workflow "Deploy to Cloudflare" running
```

---

## 🔐 Keamanan: Environment Variables

### TIDAK BOLEH Commit ke GitHub:
```
❌ .env files dengan values
❌ .dev.vars files dengan secrets
❌ API keys, passwords, tokens apapun
❌ Database credentials
```

### BOLEH Commit ke GitHub:
```
✅ .env.example (dengan komentar, NO values)
✅ ENV_VARIABLES.md (dokumentasi)
✅ .gitignore (pastikan lengkap)
✅ .github/workflows/deploy.yml (CI/CD config)
```

### Dimana Secrets Seharusnya Disimpan:
```
Production Secrets:
  └─ Cloudflare Worker Secrets (via wrangler secret put)
  
Development Secrets:
  └─ Local .dev.vars (di .gitignore, TIDAK commit)
  
GitHub Actions Secrets:
  └─ GitHub Settings > Secrets (untuk API tokens di CI/CD)
```

---

## 🔍 Verifikasi Setelah Push

### Pastikan GitHub Actions Berjalan:

```bash
# Check workflow status
gh run list --repo USERNAME/orland-core --limit 5

# Expected output:
# status   title              workflow            commit
# completed Deploy to Cloudflow deploy.yml        abc123
```

### Pastikan Deployment Berhasil:

```bash
# Check Cloudflare Workers
wrangler list --env production

# Expected: 
# ✓ orland-appapi
# ✓ orland-appsso
# ✓ orland-appcdn

# Check Cloudflare Pages
# Buka: https://dash.cloudflare.com > Pages > Select Project > Deployments
# Expected: Production deployment completed 5 minutes ago
```

### Test Endpoints:

```bash
# Test API
curl https://api.orlandmanagement.com/health
# Expected: {"status":"ok"}

# Test Frontend
curl https://apptalent.orlandmanagement.com | grep "<!DOCTYPE"
# Expected: HTML content
```

---

## 📋 Checklist Akhir

| Item | Status |
|------|--------|
| .env files NOT committed | ✅ |
| .env.example EXISTS with comments | ✅ |
| GitHub Secrets configured | ✅ |
| Cloudflare Secrets configured | ✅ |
| .gitignore is complete | ✅ |
| .github/workflows/deploy.yml EXISTS | ✅ |
| ENV_VARIABLES.md EXISTS | ✅ |
| Git push successful | ✅ |
| GitHub Actions running | ✅ |
| Cloudflare deployment verified | ✅ |

---

## 🚨 Troubleshooting: Jika Ada Error

### Error: "API token is invalid"

```bash
# Verify GitHub Secret
gh secret list | grep CLOUDFLARE_API_TOKEN

# Jika ada, update:
gh secret set CLOUDFLARE_API_TOKEN --body "new_token"

# Jika tidak ada, create:
gh secret set CLOUDFLARE_API_TOKEN --body "your_token"
```

### Error: "Database not found"

```bash
# Verify Database IDs di wrangler.toml
cat apps/appapi/wrangler.toml | grep database_id

# Harus match dengan actual database IDs di Cloudflare:
wrangler d1 list
```

### Error: ".env file not found"

```bash
# GitHub Actions mencari nilai dari Cloudflare Secrets, bukan .env
# Pastikan secrets sudah di-setup:
wrangler secret list --name orland-appapi

# Jika hilang, setup ulang:
wrangler secret put JWT_SECRET
wrangler secret put R2_ACCESS_KEY
wrangler secret put R2_SECRET_KEY
```

### Workflow tidak trigger otomatis

```bash
# Check GitHub Actions is enabled
# Settings > Actions > All workflows

# Jika "Disabled", enable ulang

# Atau coba trigger manual:
# Actions > Deploy to Cloudflow > Run workflow
```

---

## 📚 Related Documentation

- **ENV_VARIABLES.md** - Complete environment variables reference
- **DEPLOYMENT_GUIDE.md** - Full deployment steps
- **.env.example** - Template environment file
- **SOP_DEPLOYMENT.md** - Deployment SOP

---

## 🎯 Next Steps Setelah GitHub Push

1. ✅ Monitor GitHub Actions sampai selesai
2. ✅ Verify Cloudflare deployments
3. ✅ Test semua endpoints
4. ✅ Celebrate 🎉

---

**Safe to Upload!** Jika semua checklist di atas sudah dicentang, Anda aman untuk `git push` ke GitHub.

---

**Last Updated:** April 9, 2026  
**Status:** Ready for GitHub Upload
