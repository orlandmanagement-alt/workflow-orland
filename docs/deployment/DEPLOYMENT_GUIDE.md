# Deployment Guide: Mission Implementation

Complete step-by-step guide to deploy the Premium Tiers, Agency Role, and Bulk Operations features to production.

---

## 📋 Pre-Deployment Checklist

- [ ] All code reviewed and tested
- [ ] Database backups configured
- [ ] Environment variables prepared
- [ ] Dependencies installed locally
- [ ] Tests passing (100%)
- [ ] Build successful with no warnings
- [ ] CORS origins configured
- [ ] R2 bucket setup complete
- [ ] API keys obtained (YouTube, Sentry, etc.)
- [ ] Team notified of deployment window

---

## ⚙️ Phase 1: Environment Setup

### 1.1 Configure Environment Variables

**Backend (.env)**
```bash
# Copy template
cp apps/appapi/.env.example apps/appapi/.env

# Edit with production values
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
DATABASE_URL=your_d1_database_url
R2_BUCKET_NAME=orland-media
R2_ACCESS_KEY=your_key
R2_SECRET_KEY=your_secret
YOUTUBE_API_KEY=your_key
JWT_SECRET=generate_secure_random_string
```

**Frontend (.env.production)**
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_R2_UPLOAD_URL=https://api.yourdomain.com/api/v1/media/upload-url
```

### 1.2 Verify Cloudflare Setup

```bash
# Install Wrangler CLI
npm install -g @cloudflare/wrangler

# Login to Cloudflare
wrangler login

# Verify access
wrangler d1 list
```

### 1.3 Create D1 Database (if not exists)

```bash
# Create new D1 database
wrangler d1 create orland-core

# Or use existing
DATABASE_ID=your_existing_database_id
```

---

## 📊 Phase 2: Database Migrations

### 2.1 Backup Current Database

```bash
# Export current database
wrangler d1 export orland-core > backup-$(date +%Y%m%d-%H%M%S).sql

# Save backup securely
# Recommended: Commit to git with encryption or upload to secure storage
```

### 2.2 Run Migration 1: Premium Tiers & Agency

```bash
# Execute migration
wrangler d1 execute orland-core < apps/appapi/migrations/021_DB_CORE_premium_tiers_agency.sql

# Verify tables created
wrangler d1 execute orland-core --command "SELECT name FROM sqlite_master WHERE type='TABLE' ORDER BY name;"

# Expected tables:
# - users (updated)
# - talents (updated)
# - credits (updated)
# - agencies (new)
# - agency_talents (new)
```

### 2.3 Run Migration 2: Bulk Operations & Sorting

```bash
# Execute migration
wrangler d1 execute orland-core < apps/appapi/migrations/022_DB_CORE_bulk_operations_sorting.sql

# Verify columns
wrangler d1 execute orland-core --command "PRAGMA table_info(users);"
wrangler d1 execute orland-core --command "PRAGMA table_info(media);"

# Expected new columns:
# - users.role, users.account_tier
# - media.sort_order, media.view_count
# - assets.sort_order, assets.view_count
```

### 2.4 Verify Migration Results

```bash
# Check for errors
wrangler d1 execute orland-core --command "SELECT * FROM sqlite_master WHERE type='table';"

# Count new records
wrangler d1 execute orland-core --command "SELECT COUNT(*) FROM agencies;"
wrangler d1 execute orland-core --command "SELECT COUNT(*) FROM agency_talents;"

# Sample query
wrangler d1 execute orland-core --command "SELECT * FROM agencies LIMIT 10;"
```

---

## 🏗️ Phase 3: Build & Test

### 3.1 Install Dependencies

```bash
# Backend
cd apps/appapi
npm install

# Frontend
cd ../apptalent
npm install

cd ../../
```

### 3.2 Run Tests Locally

```bash
# Backend tests
cd apps/appapi
npm test -- --run

# Frontend tests
cd ../apptalent
npm test -- --run

# E2E tests (if available)
npm run test:e2e
```

### 3.3 Build Applications

```bash
# Backend
cd apps/appapi
npm run build

# Frontend
cd ../apptalent
npm run build

# Verify no errors
ls -la dist/
```

---

## 🚀 Phase 4: Deploy Backend (Cloudflare Workers)

### 4.1 Deploy API

```bash
cd apps/appapi

# Preview deployment first (optional)
wrangler deploy --dry-run

# Deploy to production
wrangler deploy

# Verify deployment
curl https://api.yourdomain.com/health
```

### 4.2 Configure Environment Variables in Cloudflare

```bash
# Set secrets in Cloudflare
wrangler secret put JWT_SECRET
# Enter your JWT secret when prompted

wrangler secret put YOUTUBE_API_KEY
# Enter YouTube API key

# Verify secrets
wrangler secret list
```

### 4.3 Test API Endpoints

```bash
# Health check
curl https://api.yourdomain.com/health
# Expected: {"status":"ok","timestamp":"2026-04-09T..."}

# Public talents endpoint
curl https://api.yourdomain.com/api/v1/public/talents/test-id \
  -H "x-user-tier: free" \
  -H "x-user-role: client"

# Agency roster endpoint
curl https://api.yourdomain.com/api/v1/public/agency/test-agency/roster
```

---

## 🎨 Phase 5: Deploy Frontend (Cloudflare Pages)

### 5.1 Build for Production

```bash
cd apps/apptalent

# Build with production settings
npm run build

# Verify build
ls -la dist/
# Should contain: index.html, assets/, etc.
```

### 5.2 Deploy to Cloudflare Pages

```bash
# Option A: Using Wrangler
wrangler pages deploy dist/ --project-name apptalent

# Option B: Using Git integration
# Push to GitHub/GitLab and Pages will auto-deploy
git add .
git commit -m "feat: deploy mission implementation"
git push origin main

# Option C: Using Dashboard
# Upload dist/ folder in Cloudflare Pages UI
```

### 5.3 Configure Pages Settings

In Cloudflare Dashboard > Pages > apptalent > Settings:

```
Build Settings:
  Build command: npm run build
  Build output directory: dist
  Root directory: apps/apptalent

Environment Variables:
  VITE_API_BASE_URL: https://api.yourdomain.com/api/v1
  VITE_R2_UPLOAD_URL: https://api.yourdomain.com/api/v1/media/upload-url

Custom Domain:
  apptalent.yourdomain.com
```

### 5.4 Test Frontend

```bash
# Visit in browser
https://apptalent.yourdomain.com

# Check console for errors
# Verify components load:
#   - MultiDropzone
#   - CSVImport
#   - AgencyRoster
```

---

## ✅ Phase 6: Verification & Smoke Tests

### 6.1 Public API Tests

```bash
# Test public talent profile (with masking)
curl -X GET https://api.yourdomain.com/api/v1/public/talents/talent-123 \
  -H "x-user-tier: free" \
  -H "x-user-role: client" | jq .

# Expected: email and phone masked for free talent

# Test with premium tier
curl -X GET https://api.yourdomain.com/api/v1/public/talents/talent-123 \
  -H "x-user-tier: premium" \
  -H "x-user-role: client" | jq .

# Expected: full unmasked contacts
```

### 6.2 Agency Roster Test

```bash
curl -X GET https://api.yourdomain.com/api/v1/public/agency/agency-123/roster \
  -H "x-user-tier: free" \
  -H "x-user-role: client" | jq .

# Expected: talents array with agency contact info
```

### 6.3 Protected Endpoints Test

```bash
# Test without auth (should fail)
curl -X POST https://api.yourdomain.com/api/v1/agency/talents/bulk \
  -H "Content-Type: application/json" \
  -d '{"talents": []}' | jq .

# Expected: 401 Unauthorized or 400 (missing headers)

# Test with auth
curl -X POST https://api.yourdomain.com/api/v1/agency/talents/bulk \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -H "x-user-tier: premium" \
  -H "x-user-role: agency" \
  -d '{
    "talents": [
      {"name": "John Doe", "gender": "Male", "height": "180", "bio": "Actor"}
    ]
  }' | jq .

# Expected: 201 success
```

### 6.4 Frontend Component Tests

1. **Visit MultiDropzone**
   - Start upload
   - Drop files on dropzone
   - Verify compression message
   - Check file sizes < 100KB
   - Test image preview

2. **Visit CSVImport**
   - Download template
   - Upload valid CSV
   - Verify data preview
   - Test import

3. **Visit AgencyRoster**
   - Load roster for test agency
   - Verify talent grid
   - Test contact buttons
   - Check WhatsApp integration

---

## 🔒 Phase 7: Security Verification

### 7.1 CORS Configuration

```bash
# Test CORS headers
curl -i -X OPTIONS https://api.yourdomain.com/api/v1/talents \
  -H "Origin: https://apptalent.yourdomain.com"

# Expected: Access-Control-Allow-Origin header present
```

### 7.2 Authentication Headers

```bash
# Verify headers required
curl -X GET https://api.yourdomain.com/api/v1/agency/talents/bulk \
  -H "Content-Type: application/json"

# Should fail without auth headers
```

### 7.3 Rate Limiting

```bash
# Test batch limits
curl -X POST https://api.yourdomain.com/api/v1/agency/talents/bulk \
  -H "x-user-id: test" \
  -H "x-user-role: agency" \
  -d '{
    "talents": [/* 101 items */]
  }'

# Expected: 400 error about limit
```

---

## 📊 Phase 8: Monitoring & Logging

### 8.1 Configure Error Logging

```bash
# Set up Sentry (optional)
# In apps/appapi/src/index.ts:
import * as Sentry from "@sentry/cloudflare-workers";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENVIRONMENT,
});
```

### 8.2 Check Cloudflare Analytics

1. Go to Cloudflare Dashboard
2. Select apptalent site
3. View Analytics Engine
4. Monitor:
   - Request counts
   - Error rates
   - Response times
   - Cache hit ratios

### 8.3 Database Monitoring

```bash
# Monitor D1 query stats
wrangler d1 info orland-core

# Check recent errors
wrangler d1 execute orland-core --command "SELECT * FROM logs LIMIT 100;"
```

---

## 📝 Phase 9: Documentation & Communication

### 9.1 Update Documentation

- [ ] Update README with new features
- [ ] Document new API endpoints
- [ ] Update deployment runbook
- [ ] Document rollback procedures
- [ ] Create user guides for new features

### 9.2 Notify Stakeholders

Email/Slack message:

```
Subject: Mission Implementation Deployed ✅

Features deployed:
- Premium Tiers (Free/Premium accounts with feature gating)
- Agency Role (B2B management of talents)
- Bulk Operations (CSV import, batch apply)
- Media Sorting (Drag-and-drop reordering)

Timeline: [Date and time]
Status: Completed successfully
Impact: All users can now access new features

Documentation:
- MISSION_README.md
- MISSION_IMPLEMENTATION.md
- API Reference: https://api.yourdomain.com/docs

Support:
- Report issues: [link to issue tracker]
- Ask questions: [slack channel]
```

---

## 🔄 Rollback Procedures

### If Deployment Fails

```bash
# 1. Identify the issue
tail -f wrangler_logs.txt

# 2. Rollback code
wrangler rollback

# 3. Rollback database (if needed)
wrangler d1 restore orland-core backup-20260409-120000

# 4. Verify rollback
curl https://api.yourdomain.com/health

# 5. Investigate issue
# - Check build logs
# - Review migration SQL
# - Check environment variables
```

### Partial Rollback (Backend Only)

```bash
# If backend deploy failed but DB is OK:
cd apps/appapi
git checkout main  # or specific commit
npm run build
wrangler deploy
```

### Partial Rollback (Frontend Only)

```bash
# If frontend deploy failed:
cd apps/apptalent
git checkout main
npm run build
wrangler pages deploy dist/
```

---

## ✨ Post-Deployment

### Phase 10: Feature Testing

- [ ] Users can upload multiple images with compression
- [ ] CSV import works for talents and credits
- [ ] Agency roster displays correctly
- [ ] Data masking works (free vs premium)
- [ ] Batch apply sends multiple talents
- [ ] Media reorders with drag-and-drop
- [ ] YouTube import extracts video IDs

### Phase 11: Performance Optimization

```bash
# Analyze bundle sizes
cd apps/apptalent
npm run build:analyze

# Check database query performance
wrangler d1 execute orland-core --command "EXPLAIN QUERY PLAN SELECT * FROM talents WHERE agency_id = ?"
```

### Phase 12: Usage Analytics

Track:
- User adoption of new features
- Error rates
- API response times
- Image compression success rate
- CSV import completion rates

---

## 🎯 Success Criteria

✅ All deployments complete without errors
✅ All API endpoints responding correctly
✅ Database migrations applied successfully
✅ No increase in error rates
✅ Response times acceptable (< 500ms)
✅ All tests passing
✅ Security headers present
✅ Features working in production
✅ Documentation updated
✅ Team notified

---

## 📞 Troubleshooting

### Issue: Database migration fails

```bash
# Check migration SQL for errors
wrangler d1 execute orland-core < migrations/021.sql

# View detailed error
wrangler d1 execute orland-core --command ".schema"

# Rollback and fix
wrangler d1 restore orland-core backup-name
```

### Issue: API returning 502 Bad Gateway

```bash
# Check Cloudflare Workers status
wrangler tail --follow

# Issues:
# - Missing environment variables
# - Syntax errors in code
# - Database connection issues
```

### Issue: Frontend component not loading

```bash
# Check browser console
# Issues:
# - Build output missing
# - API endpoint misconfigured
# - CORS headers missing
```

### Issue: Image compression failing

```bash
# Test locally
npm run test -- compressor.test.ts

# Check file sizes
# Verify Canvas API support in browser
```

---

## 📈 Deployment Dashboard

Create a deployment status dashboard showing:

```
┌─────────────────────────────────────┐
│ DEPLOYMENT STATUS - April 9, 2026   │
├─────────────────────────────────────┤
│ Database Migrations: ✅ Complete    │
│ Backend Deploy:      ✅ Live        │
│ Frontend Deploy:     ✅ Live        │
│ Tests:              ✅ Passing      │
│ Monitoring:         ✅ Active       │
├─────────────────────────────────────┤
│ API Response Time:   245ms (avg)    │
│ Error Rate:          0.02%          │
│ Active Users:        1,234          │
│ Feature Adoption:    42%            │
└─────────────────────────────────────┘
```

---

**Deployment Complete!** 🎉

All systems operational. Monitor logs and dashboards for issues.

---

**Last Updated:** April 9, 2026  
**Status:** Ready for Deployment  
**Version:** 1.0.0
