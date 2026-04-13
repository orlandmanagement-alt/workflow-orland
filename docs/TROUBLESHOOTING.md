/**
 * Common Issues & Troubleshooting
 * Solutions for problems encountered during deployment and usage
 */

# Troubleshooting Guide: Mission Implementation

## 🔴 Critical Issues

### 1. Database Migration Fails

**Problem:** Migration SQL throws error when executing

**Root Causes:**
- Database already has tables/columns being created
- SQL syntax error
- Database permission issues
- Foreign key constraint violations

**Solutions:**

```bash
# Check what tables exist
wrangler d1 execute orland-core --command "SELECT name FROM sqlite_master WHERE type='TABLE';"

# If tables already exist, skip migration or drop them
wrangler d1 execute orland-core --command "DROP TABLE IF EXISTS agencies;"

# Test just the schema part
wrangler d1 execute orland-core --command "ALTER TABLE users ADD COLUMN account_tier TEXT DEFAULT 'free';"

# If foreign key issues, check constraints
wrangler d1 execute orland-core --command "PRAGMA foreign_key_list(talents);"

# Use safer migration syntax
-- Instead of: CREATE TABLE agencies ...
-- Use: CREATE TABLE IF NOT EXISTS agencies ...
```

### 2. API Routes Not Registering

**Problem:** Endpoints return 404 Not Found

**Root Causes:**
- Routes not registered in main index.ts
- Route path mismatch
- Middleware blocking requests

**Solutions:**

```typescript
// main index.ts - verify routes are registered:
import publicTalentsRoute from './routes/publicTalentsRoute';
import agencyRoute from './routes/agencyRoute';

app.route('/api/v1', publicTalentsRoute);  // ✅ Required
app.route('/api/v1', agencyRoute);        // ✅ Required

// Check route definitions
// publicTalentsRoute.ts should have:
// - app.get('/public/talents/:id', ...)
// - app.get('/public/agency/:id/roster', ...)

// Test with full path
curl https://api.yourdomain.com/api/v1/public/talents/test
```

### 3. Authentication Headers Not Working

**Problem:** Requests fail with "Unauthorized" even with headers

**Root Causes:**
- Headers not being sent correctly
- Middleware not extracting headers
- Header names case-sensitive in some systems

**Solutions:**

```bash
# Test headers explicitly
curl -X GET https://api.yourdomain.com/api/v1/public/talents/test \
  -H "x-user-id: test-123" \
  -H "x-user-tier: premium" \
  -H "x-user-role: client" \
  -H "Authorization: Bearer token" \
  -v  # verbose to see all headers

# Check header case sensitivity
# Hono should normalize, but verify in middleware:
const userId = c.req.header('x-user-id');
// or
const userId = c.req.header('X-User-Id');
```

### 4. Image Compression Not Working

**Problem:** Images not compressing or staying large

**Root Causes:**
- Canvas API not available
- Browser doesn't support File API
- Quality parameter too high
- Original image too large

**Solutions:**

```typescript
// Test compression locally
import { compressImageForCredit } from '@/lib/imageCompressor';

const file = /* your file object */;
try {
  const result = await compressImageForCredit(file);
  console.log(`Original: ${file.size}, Compressed: ${result.sizeKB}KB`);
} catch (error) {
  console.error('Compression error:', error);
  // Check browser console for Canvas errors
}

// Force aggressive compression
const result = await compressImageForCredit(file, {
  quality: 0.3,
  maxWidth: 300,
  maxHeight: 300,
  format: 'webp'
});

// If still > 100KB, file might be problematic
// Check original file format and size
```

---

## 🟡 Medium Priority Issues

### 5. CSV Import Validation Errors

**Problem:** "Missing required columns" error on valid CSV

**Root Causes:**
- Column names don't match exactly
- Extra whitespace in headers
- Case sensitivity mismatch

**Solutions:**

```bash
# For talents CSV, headers must be EXACTLY:
name,gender,height,bio

# NOT: Name, Gender, Height, Bio (case matters!)
# NOT: name , gender , height , bio (whitespace!)

# Verify CSV structure
cat talents.csv | head -1
# Output should be exactly: name,gender,height,bio

# Download template from component
# Use that as reference
```

### 6. CORS Errors on File Upload

**Problem:** Browser blocks upload with CORS error

**Root Causes:**
- Presigned URL from different origin
- CORS headers not configured on R2
- Browser origin not in whitelist

**Solutions:**

```bash
# Check CORS settings in Cloudflare
wrangler r2 bucket update orland-media --acl private

# Configure CORS in wrangler.toml:
[env.production]
r2_buckets = [
  { binding = "MEDIA", bucket_name = "orland-media", jurisdiction = "eu" }
]

# Test CORS headers
curl -i https://your-presigned-url.example.com
# Should show Access-Control-Allow-Origin header

# In code, use correct origin
const uploadResponse = await fetch(presignedUrl, {
  method: 'PUT',
  body: blob,
  headers: {
    'Content-Type': 'image/jpeg',
    // Don't set origin header - browser does this
  }
});
```

### 7. Media Reorder Not Persisting

**Problem:** Drag-and-drop works but changes don't save

**Root Causes:**
- PUT endpoint not called
- Database update fails silently
- sort_order column missing

**Solutions:**

```typescript
// Verify column exists
wrangler d1 execute orland-core --command "PRAGMA table_info(media);"
// Should show: sort_order INTEGER

// Test PUT endpoint
curl -X PUT https://api.yourdomain.com/api/v1/media/reorder \
  -H "Content-Type: application/json" \
  -H "x-user-id: test" \
  -d '{
    "items": [
      {"id": "media-1", "sort_order": 0},
      {"id": "media-2", "sort_order": 1}
    ]
  }' -v

// Check for 200 response
// Verify database update
wrangler d1 execute orland-core --command "SELECT id, sort_order FROM media ORDER BY sort_order;"
```

### 8. Bulk Import Size Limits

**Problem:** Import fails with "too many items" error

**Root Causes:**
- CSV exceeds 100 rows
- Each row is too large
- Batch timeout

**Solutions:**

```bash
# Check CSV row count
wc -l talents.csv
# Subtract 1 for header row
# Must be ≤ 100

# Split large CSV
split -l 100 large.csv chunk_

# Verify file size
ls -lh talents.csv
# Should be < 10MB

# Test with smaller import first
head -10 talents.csv > test.csv
# Import test.csv to verify format works
```

---

## 🟢 Minor Issues

### 9. Frontend Component Not Displaying

**Problem:** Component shows blank or doesn't load

**Root Causes:**
- Component not imported
- Environment variables wrong
- API endpoint misconfigured
- CSS not loaded

**Solutions:**

```tsx
// Verify import
import MultiDropzone from '@/components/shared/MultiDropzone';

// Check for errors in console
console.error('MultiDropzone:', multiDropzoneError);

// Verify endpoint environment variable
console.log('API Base:', import.meta.env.VITE_API_BASE_URL);

// Manually test component
<MultiDropzone
  onImagesReady={console.log}
  presignedUrlEndpoint="https://api.yourdomain.com/api/v1/media/upload-url"
/>
```

### 10. YouTube Video Import Not Extracting IDs

**Problem:** YouTube URLs not recognized

**Root Causes:**
- URL format not in supported list
- Special characters in URL
- Playlist URL instead of video URL

**Solutions:**

```bash
# Supported formats:
https://youtube.com/watch?v=dQw4w9WgXcQ     ✅
https://youtu.be/dQw4w9WgXcQ                 ✅
dQw4w9WgXcQ                                  ✅ (direct ID)

# NOT supported:
https://youtube.com/playlist?list=...        ❌
https://youtube.com/channel/...              ❌

# Test extraction locally
const id = extractYouTubeId('https://youtu.be/dQw4w9WgXcQ');
console.log(id); // Should be: dQw4w9WgXcQ
```

### 11. Premium Tier Masking Not Working

**Problem:** Email/phone visible for free talent to non-premium user

**Root Causes:**
- Authentication headers not sent
- Masking logic not applied
- Frontend trying to handle masking

**Solutions:**

```typescript
// Verify headers always sent
const headers = {
  'x-user-tier': localStorage.getItem('userTier') || 'free',
  'x-user-role': localStorage.getItem('userRole') || 'client',
};

fetch('/api/v1/public/talents/123', { headers });

// Masking MUST happen in backend
// Frontend should NEVER receive unmasked data for free talents

// Test in backend
const masked = maskEmail('user@example.com');
console.log(masked); // Should be: us****@example.com

// Verify in API response
curl https://api.yourdomain.com/api/v1/public/talents/test \
  -H "x-user-tier: free" \
  -H "x-user-role: client" | jq .email
# Should be masked
```

### 12. Presigned URL Expiration

**Problem:** Upload URL returns 403 Forbidden

**Root Causes:**
- URL expired (default: 1 hour)
- Wrong bucket/object path
- Credentials rotated

**Solutions:**

```bash
# Generate presigned URL with longer expiration
# In backend, adjust expiration time:

const url = await generatePresignedUrl({
  bucket: 'orland-media',
  object: 'credit-photo.jpg',
  expiresIn: 3600 * 24 // 24 hours instead of 1
});

# Test URL validity before upload
# Don't reuse old URLs
# Generate fresh URL for each upload

# Verify bucket credentials
wrangler r2 bucket info orland-media
```

---

## 🔧 Testing & Validation

### Quick Validation Script

```bash
#!/bin/bash

echo "Validating Mission Implementation..."

# 1. Database
echo "✓ Checking database..."
wrangler d1 execute orland-core --command "SELECT COUNT(*) FROM agencies;" || echo "❌ agencies table missing"

# 2. API Health
echo "✓ Checking API..."
curl -s https://api.yourdomain.com/health | grep ok || echo "❌ API not responding"

# 3. Frontend
echo "✓ Checking frontend..."
curl -s https://apptalent.yourdomain.com | grep "<!DOCTYPE" || echo "❌ Frontend not responding"

# 4. Endpoints
echo "✓ Checking endpoints..."
curl -s -X GET https://api.yourdomain.com/api/v1/public/agency/test/roster \
  -H "x-user-tier: free" | grep -q agencyId && echo "✓ Agency roster works"

echo "Done!"
```

### Manual Test Checklist

```
Database:
  ☐ users table has account_tier column
  ☐ users table has role column
  ☐ talents table has agency_id column
  ☐ credits table has image_url column
  ☐ media table has sort_order column
  ☐ agencies table exists
  ☐ agency_talents table exists

Backend:
  ☐ GET /public/talents/:id returns data
  ☐ Email masked for free talents
  ☐ Email unmasked for premium users
  ☐ GET /public/agency/:id/roster works
  ☐ POST /agency/talents/bulk accepts CSV data
  ☐ PUT /media/reorder updates sort_order
  
Frontend:
  ☐ MultiDropzone loads
  ☐ CSVImport loads
  ☐ AgencyRoster loads
  ☐ Image compression works
  ☐ CSV template downloads
  
Security:
  ☐ Requests without auth fail
  ☐ CORS headers present
  ☐ Sensitive data never exposed
```

---

## 📞 Getting Help

1. **Check this guide** - 90% of issues documented
2. **Review error logs:**
   ```bash
   wrangler tail --follow  # See live logs
   wrangler d1 logs        # Database logs
   ```
3. **Test in isolation:**
   ```bash
   # Test just the database
   # Test just the API
   # Test just the component
   ```
4. **Ask for help:**
   - Include error messages
   - Provide browser console details
   - Share network request/response
   - Describe steps to reproduce

---

**Last Updated:** April 9, 2026  
**Status:** Comprehensive Troubleshooting Guide
