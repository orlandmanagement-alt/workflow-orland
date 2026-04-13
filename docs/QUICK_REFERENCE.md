# Quick Reference Guide

## 📚 All Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| **MISSION_README.md** | Full API reference and integration guide | Developers |
| **MISSION_IMPLEMENTATION.md** | Technical implementation details | Engineers |
| **DEPLOYMENT_GUIDE.md** | Step-by-step deployment instructions | DevOps/Ops |
| **TROUBLESHOOTING.md** | Common issues and solutions | Support/Developers |
| **MISSION_DEPENDENCIES.json** | Required npm packages | All |
| **task-mission.md** | Task completion status | Project Managers |

---

## 🗂️ Code Files Location

### Backend (Hono.js)
```
apps/appapi/src/
├── utils/maskingUtils.ts          ← Data masking logic
├── middleware/authMiddleware.ts    ← Authentication
├── routes/publicTalentsRoute.ts    ← Public API endpoints
└── routes/agencyRoute.ts           ← Agency & bulk operations

apps/appapi/migrations/
├── 021_DB_CORE_premium_tiers_agency.sql
└── 022_DB_CORE_bulk_operations_sorting.sql
```

### Frontend (React)
```
apps/apptalent/src/
├── lib/imageCompressor.ts         ← Image compression
├── components/shared/
│   ├── MultiDropzone.tsx          ← Multi-image upload
│   └── CSVImport.tsx              ← CSV bulk import
├── components/agency/
│   └── AgencyRoster.tsx           ← Agency roster display
└── examples/IntegrationExamples.tsx ← Usage examples
```

---

## 🎯 Key Features at a Glance

| Feature | Status | Files |
|---------|--------|-------|
| Premium Tiers | ✅ Ready | maskingUtils.ts |
| Agency Role | ✅ Ready | agencyRoute.ts |
| Data Masking | ✅ Ready | maskingUtils.ts |
| Image Compression | ✅ Ready | imageCompressor.ts |
| Multi-Image Upload | ✅ Ready | MultiDropzone.tsx |
| CSV Import | ✅ Ready | CSVImport.tsx |
| Agency Roster | ✅ Ready | AgencyRoster.tsx |
| Batch Casting Apply | ✅ Ready | agencyRoute.ts |
| Media Sorting | ✅ Ready | agencyRoute.ts |
| YouTube Import | ✅ Ready | agencyRoute.ts |

---

## ⚡ Quick Commands

### Install Dependencies
```bash
npm install papaparse @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react
```

### Deploy
```bash
# Run deployment script
bash scripts/deploy.sh staging

# Or manual steps:
wrangler d1 execute orland-core < migrations/021.sql
wrangler d1 execute orland-core < migrations/022.sql
cd apps/appapi && npm run build && wrangler deploy
cd ../apptalent && npm run build && wrangler pages deploy dist/
```

### Test
```bash
npm test -- --run
```

### View Logs
```bash
wrangler tail --follow
```

---

## 🔑 Authentication Headers

```bash
-H "x-user-id: user-uuid"
-H "x-user-tier: free|premium"
-H "x-user-role: admin|agency|talent|client"
```

Or use JWT:
```bash
-H "Authorization: Bearer <token>"
```

---

## 📡 API Endpoints Overview

### Public (No Auth)
```
GET  /api/v1/public/talents/:id
GET  /api/v1/public/agency/:id/roster
```

### Protected (Auth Required)
```
POST /api/v1/agency/projects/:id/apply          [100 talents max]
POST /api/v1/agency/talents/bulk                [100 rows max]
PUT  /api/v1/media/reorder                      [unlimited items]
POST /api/v1/talents/me/credits/bulk            [100 rows max]
POST /api/v1/assets/youtube/bulk                [50 videos max]
```

---

## 🛠️ Useful Tools & Commands

### Database Management
```bash
# List databases
wrangler d1 list

# Execute query
wrangler d1 execute DB_NAME --command "SELECT * FROM users LIMIT 10;"

# Export database
wrangler d1 export DB_NAME > backup.sql

# Restore from backup
wrangler d1 restore DB_NAME backup-name
```

### Frontend Development
```bash
# Start dev server
cd apps/apptalent && npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Backend Development
```bash
# Start local server
cd apps/appapi && npm run dev

# Deploy to staging
wrangler deploy --env staging

# View logs
wrangler tail --env staging --format pretty
```

---

## 📊 Data Model Summary

### Users Table
```sql
id, email, password_hash, account_tier (free/premium), role (admin/agency/talent/client)
```

### Talents Table
```sql
id, user_id, name, gender, height, bio, agency_id, account_tier
```

### Media Table
```sql
id, talent_id, url, sort_order, view_count
```

### Agencies Table
```sql
id, user_id, agency_name, description, created_at
```

### Credits Table
```sql
id, talent_id, title, company, date, description, image_url
```

---

## 🔒 Security Checklist

- [ ] All sensitive data masked in backend
- [ ] Authentication headers required on protected routes
- [ ] CORS origins whitelisted
- [ ] Rate limiting on bulk endpoints (100 items max)
- [ ] File upload validation (type, size)
- [ ] Presigned URLs with expiration
- [ ] Environment secrets not in code
- [ ] Database backups enabled
- [ ] Error messages don't leak data
- [ ] Monitoring and alerting configured

---

## 🚀 Deployment Checklist

- [ ] Database migrations tested locally
- [ ] Environment variables configured
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] All tests passing
- [ ] API endpoints verified
- [ ] Frontend components load
- [ ] Security headers present
- [ ] Monitoring configured
- [ ] Team notified

---

## 📞 Common Operations

### Add New User with Premium Tier
```sql
INSERT INTO users (id, email, account_tier, role) 
VALUES ('uuid-123', 'user@example.com', 'premium', 'client');
```

### Assign Talent to Agency
```sql
UPDATE talents SET agency_id = 'agency-123' WHERE id = 'talent-456';
```

### Query Talents by Agency
```sql
SELECT * FROM talents WHERE agency_id = 'agency-123' ORDER BY created_at DESC;
```

### Get All Free Talents
```sql
SELECT * FROM talents WHERE account_tier = 'free' LIMIT 100;
```

### Check Media Sort Order
```sql
SELECT id, title, sort_order FROM media WHERE talent_id = 'talent-123' ORDER BY sort_order ASC;
```

---

## 🎓 Learning Resources

### For Backend Developers
1. Read `MISSION_IMPLEMENTATION.md`
2. Review `maskingUtils.ts` for security patterns
3. Study `agencyRoute.ts` for API patterns
4. Check `authMiddleware.ts` for auth flow

### For Frontend Developers
1. Read `MISSION_README.md`
2. Review `IntegrationExamples.tsx` for usage
3. Study components in `components/` folder
4. Check `imageCompressor.ts` for compression logic

### For DevOps/Ops
1. Read `DEPLOYMENT_GUIDE.md`
2. Review `scripts/deploy.sh`
3. Check `TROUBLESHOOTING.md`
4. Monitor `DEPLOYMENT_GUIDE.md` Phase 8

---

## 🐛 Quick Debugging Tips

### "Unauthorized" Error
```bash
→ Check if auth headers are being sent
→ Verify x-user-id, x-user-tier, x-user-role
→ Check localStorage for values
```

### "Forbidden" Error
```bash
→ Check user role (agency vs client)
→ Verify requireAgencyOrAdmin middleware
→ Check x-user-role header value
```

### Empty Response
```bash
→ Verify database query is correct
→ Check if data exists in database
→ Look for errors in server logs: wrangler tail
```

### CORS Errors
```bash
→ Check allowed origins in CORS config
→ Verify requests from correct domain
→ Check browser Network tab for headers
```

### Image Not Compressing
```bash
→ Check browser console for Canvas errors
→ Verify file size < 5MB before compression
→ Check file format (JPEG, PNG, WebP supported)
```

---

## 📈 Monitoring Key Metrics

```bash
# API Response Time
wrangler analytics engine

# Error Rate
wrangler tail --status=error

# Database Performance
wrangler d1 execute DB_NAME --command "EXPLAIN QUERY PLAN ..."

# Worker CPU Time
Check Cloudflare Analytics Dashboard
```

---

## 💬 Asking for Help

Include details:
1. **Error message** - exact text
2. **Environment** - staging/production
3. **Reproduction steps** - what causes it
4. **Browser/logs** - console errors
5. **What you tried** - solutions attempted

Example:
```
Error: "Failed to upload image"
Environment: production (apptalent.yourdomain.com)
Steps: 1) Select image, 2) Drag to dropzone, 3) Click upload
Browser: Chrome, Network tab shows 415 error
Tried: Different image format (JPEG), cleared cache
```

---

## 🎉 Success Indicators

✅ Users can upload multiple images with compression  
✅ CSV import accepts 100+ rows  
✅ Data masked correctly for free users  
✅ Batch apply works with 100 talents  
✅ Agency roster displays all talents  
✅ Media reorders persist in database  
✅ YouTube videos import with view counts  
✅ No security warnings in production  
✅ API response times < 500ms  
✅ Error rate < 0.1%  

---

**For detailed information, see the corresponding documentation files.**

**Last Updated:** April 9, 2026  
**Version:** 1.0.0
