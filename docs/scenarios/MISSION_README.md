# Mission Implementation Guide: Premium Tiers, Agency Roles & Bulk Operations

## 📋 Overview

This guide documents the complete implementation of Mission 1 and Mission 2 for the Orland Management SaaS platform, including:
- **Premium Tiers** (Free/Premium talent and client accounts)
- **Agency Role** (B2B user management of multiple talents)
- **Secure Feature Gating** (Backend data masking based on user tier)
- **Bulk Operations** (CSV import, batch applications, media management)

## 📁 Files Created

### Database Migrations (Cloudflare D1)
```
apps/appapi/migrations/
  ├── 021_DB_CORE_premium_tiers_agency.sql
  │   ├── ALTER users: Add account_tier (free|premium)
  │   ├── ALTER talents: Add agency_id FK
  │   ├── ALTER credits: Add image_url
  │   ├── CREATE agencies table
  │   ├── CREATE agency_talents junction table
  │   └── CREATE performance indexes
  │
  └── 022_DB_CORE_bulk_operations_sorting.sql
      ├── ALTER users: Add role (admin|agency|talent|client)
      ├── ALTER media: Add sort_order, view_count
      ├── ALTER assets: Add sort_order, view_count
      └── CREATE sorting indexes
```

### Backend Resources (Hono.js)
```
apps/appapi/src/
  ├── utils/
  │   └── maskingUtils.ts (Email/phone masking logic)
  │
  ├── middleware/
  │   └── authMiddleware.ts (requirePremium, requireAgencyOrAdmin, etc.)
  │
  └── routes/
      ├── publicTalentsRoute.ts (GET /public/talents/:id, GET /public/agency/:id/roster)
      └── agencyRoute.ts (Bulk operations, batch apply, media reorder)
```

### Frontend Components (React/Vite)
```
apps/apptalent/src/
  ├── lib/
  │   └── imageCompressor.ts (Compress images to <100KB)
  │
  └── components/
      ├── shared/
      │   ├── MultiDropzone.tsx (Drag-drop multi-image upload)
      │   └── CSVImport.tsx (Bulk CSV import for talents/credits)
      │
      └── agency/
          └── AgencyRoster.tsx (Display agency's talent roster)
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install papaparse @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react --save
```

Or install in each app:
```bash
cd apps/apptalent && npm install papaparse @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react
cd apps/appapi && npm install hono
```

### 2. Run Database Migrations
Execute migrations in **Cloudflare D1** (in order):
```sql
-- Migration 021: Premium Tiers & Agency
-- (See: apps/appapi/migrations/021_DB_CORE_premium_tiers_agency.sql)

-- Migration 022: Bulk Operations & Sorting
-- (See: apps/appapi/migrations/022_DB_CORE_bulk_operations_sorting.sql)
```

### 3. Register Backend Routes
In your main `index.ts` (Hono app):
```typescript
import publicTalentsRoute from './routes/publicTalentsRoute';
import agencyRoute from './routes/agencyRoute';

// Register routes
app.route('/', publicTalentsRoute);
app.route('/', agencyRoute);
```

### 4. Import Frontend Components
```typescript
import MultiDropzone from '@/components/shared/MultiDropzone';
import CSVImport from '@/components/shared/CSVImport';
import AgencyRoster from '@/components/agency/AgencyRoster';
import { compressImageForCredit } from '@/lib/imageCompressor';
```

## 🔐 Security Implementation

### Backend Data Masking
Sensitive contact information is **masked on the server**, not the frontend:

```typescript
// Example: maskEmail("user@example.com") → "us****@example.com"
// Example: maskPhone("08123456789") → "08****6789"
```

**Rules:**
- **Free Talent + Non-Premium Requester**: Email, phone, and social links are masked
- **Premium Talent OR Premium Requester**: All data is unmasked
- **Contact Redirect**: Agency-managed talents redirect to agency contact info

### Authentication Headers
All API requests must include:
```typescript
{
  'x-user-id': 'user-uuid',
  'x-user-tier': 'free' | 'premium',
  'x-user-role': 'admin' | 'agency' | 'talent' | 'client'
}
```

Or use JWT:
```typescript
{
  'Authorization': 'Bearer <jwt-token>'
}
```

### Middleware Protection
```typescript
// Protect premium endpoints
app.post('/tool/advanced-search', requirePremium, handler);

// Protect agency endpoints
app.post('/agency/talents/bulk', requireAgencyOrAdmin, handler);

// Protect talent endpoints
app.post('/talents/me/credits', requireTalent, handler);
```

## 📊 API Reference

### Public Endpoints (No Auth Required)

#### GET /api/v1/public/talents/:id
Fetch public profile with smart data masking
```typescript
// Request
GET /api/v1/public/talents/talent-123
Headers:
  x-user-tier: free
  x-user-role: client

// Response (Masked)
{
  id: "talent-123",
  name: "John Doe",
  email: "jo****@gmail.com",      // Masked
  phone: "08****6789",             // Masked
  instagram: null,                 // Hidden
  media: [/* 3 photos max */],     // Limited
  accountTier: "free"
}
```

#### GET /api/v1/public/agency/:id/roster
Fetch all talents managed by an agency
```typescript
// Request
GET /api/v1/public/agency/agency-123/roster

// Response
{
  agencyId: "agency-123",
  agencyName: "Elite Talent Agency",
  talentCount: 25,
  talents: [
    {
      id: "talent-1",
      name: "Jane Smith",
      profileImage: "...",
      accountTier: "premium",
      media: [/* 5 photos */],
      contactEmail: "agency@example.com",  // Agency contact
      contactPhone: "+1-555-0100",
      whatsappUrl: "https://wa.me/..."
    },
    ...
  ]
}
```

### Protected Endpoints (Authentication Required)

#### POST /api/v1/agency/projects/:id/apply
Batch apply multiple talents to a casting project
```typescript
// Request
POST /api/v1/agency/projects/cast-123/apply
{
  talentIds: ["talent-1", "talent-2", "talent-3"]
}

// Response
{
  success: true,
  message: "Applied 3 talents to project",
  appliedCount: 3
}

// Limits
- Max 100 talents per request
- Requires: agency or admin role
```

#### POST /api/v1/agency/talents/bulk
Bulk create talents from CSV data
```typescript
// Request
POST /api/v1/agency/talents/bulk
{
  talents: [
    { name: "John Doe", gender: "Male", height: "180", bio: "..." },
    { name: "Jane Smith", gender: "Female", height: "165", bio: "..." }
  ]
}

// Response
{
  success: true,
  message: "Successfully imported 2 talents",
  importedCount: 2
}

// Limits
- Max 100 talents per request
- Required fields: name, gender, height
- Requires: agency or admin role
```

#### PUT /api/v1/media/reorder
Reorder media using drag-and-drop
```typescript
// Request
PUT /api/v1/media/reorder
{
  items: [
    { id: "media-1", sort_order: 0 },
    { id: "media-2", sort_order: 1 },
    { id: "media-3", sort_order: 2 }
  ]
}

// Response
{
  success: true,
  message: "Media reordered successfully",
  reorderedCount: 3
}
```

#### POST /api/v1/talents/me/credits/bulk
Bulk import credits/experience
```typescript
// Request
POST /api/v1/talents/me/credits/bulk
{
  credits: [
    { title: "Commercial", company: "Nike", date: "2023-01", description: "TV Ad" },
    { title: "Brand Deal", company: "Coca Cola", date: "2023-02", description: "Social" }
  ]
}

// Response
{
  success: true,
  message: "Successfully imported 2 credits",
  importedCount: 2
}

// Limits
- Max 100 credits per request
- Required fields: title, company, date
```

#### POST /api/v1/assets/youtube/bulk
Bulk import YouTube videos
```typescript
// Request
POST /api/v1/assets/youtube/bulk
{
  urls: [
    "https://youtube.com/watch?v=abc123",
    "https://youtu.be/def456",
    "ghi789"  // Direct video ID also works
  ]
}

// Response
{
  success: true,
  message: "Successfully imported 3 videos",
  importedCount: 3
}

// Limits
- Max 50 videos per request
- Supports: youtube.com, youtu.be, and direct video IDs
```

## 🎨 Frontend Components

### MultiDropzone
Drag-and-drop multi-image upload with automatic compression and reordering
```tsx
<MultiDropzone
  onImagesReady={(images) => console.log(images)}
  onUploadComplete={(urls) => console.log(urls)}
  maxFiles={50}
  presignedUrlEndpoint="/api/v1/media/upload-url"
/>
```

**Features:**
- Automatic compression to <100KB
- Drag-to-reorder support
- Concurrent image processing
- Progress tracking
- Size validation

### CSVImport
CSV file parser for bulk operations
```tsx
<CSVImport
  mode="talents"  // or "credits"
  endpoint="/api/v1/agency/talents/bulk"
  onImportComplete={(count) => console.log(`Imported ${count} items`)}
/>
```

**Features:**
- Template download
- CSV validation
- Data preview (first 5 rows)
- Error handling
- Column mapping

### AgencyRoster
Display all talents managed by an agency
```tsx
<AgencyRoster
  agencyId="agency-123"
  showContactInfo={true}
/>
```

**Features:**
- Grid layout with profile images
- Premium tier badges
- Contact info with smart masking
- WhatsApp integration
- Agency contact redirect

## 🔧 Image Compression

### Usage
```typescript
import { compressImageForCredit, compressMultipleImages } from '@/lib/imageCompressor';

// Single image
const result = await compressImageForCredit(file, {
  quality: 0.6,
  maxWidth: 400,
  maxHeight: 400,
  format: 'jpeg'
});

console.log(`Compressed from ${file.size} to ${result.sizeKB}KB`);

// Multiple images (concurrent)
const results = await compressMultipleImages(files);
```

### Compression Strategy
1. Initial compression with quality 0.6
2. If > 100KB, reduce quality by 30% and retry
3. Continues until < 100KB or quality reaches 0.3
4. Returns blob, size, dimensions, and MIME type

## 📋 CSV Import Templates

### Talents CSV
```csv
name,gender,height,bio
John Doe,Male,180,Professional actor and voice artist
Jane Smith,Female,165,Model with international experience
```

### Credits CSV
```csv
title,company,date,description
Commercial Shoot,Nike,2023-01,30 second TV commercial
Brand Ambassador,Coca Cola,2023-02,Social media campaign
```

## ✅ Testing Checklist

- [ ] Database migrations execute without errors
- [ ] Public profile endpoint masks data for free talents
- [ ] Premium requesters see unmasked data
- [ ] Agency roster shows agency contact info
- [ ] MultiDropzone compresses images to <100KB
- [ ] CSV import validates columns and data
- [ ] Batch apply accepts up to 100 talents
- [ ] Media reorder updates sort_order
- [ ] YouTube import extracts video IDs
- [ ] Authentication headers required
- [ ] Unauthorized requests return 403
- [ ] Validation errors return 400

## 🐛 Troubleshooting

### Images not compressing
- Check browser console for canvas errors
- Verify file size < 5MB before compression
- Ensure image format is JPEG, PNG, or WebP

### CSV import fails
- Verify column headers match required fields
- Check for special characters in CSV
- Ensure max 100 rows per import

### API requests return 401
- Check authentication headers
- Verify user ID is correct
- Check if JWT token is expired

### Presigned URL fails
- Verify R2 bucket configuration
- Check CORS settings
- Ensure endpoint returns valid URL

## 📚 Documentation Files

- `MISSION_IMPLEMENTATION.md` - Complete implementation summary
- `README.md` - This file
- `MISSION_DEPENDENCIES.json` - Required npm dependencies

## 🎯 Next Steps

1. Run database migrations
2. Install npm dependencies
3. Register backend routes
4. Configure authentication headers
5. Import frontend components
6. Test with sample data
7. Deploy to production

---

**Last Updated:** April 9, 2026  
**Status:** ✅ Complete Implementation  
**Version:** 1.0.0
