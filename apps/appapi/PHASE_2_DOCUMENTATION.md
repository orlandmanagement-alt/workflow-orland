# Phase 2 Scale-Up: Complete Implementation Guide

**Mission 4 - Phase 2: Fintech, AI, Analytics & Calendar**

## Overview

Phase 2 Scale-Up expands the Orland Management platform with enterprise features:

1. **Fintech & E-Signatures** - Digital contract management with dual-signature requirements and escrow payment flows
2. **AI Smart Matching** - Natural language talent search using Cloudflare Workers AI
3. **Analytics & Gamification** - Profile view tracking, ranking tiers, and talent leaderboards
4. **White-Labeling** - Custom branding for agencies with domain customization and watermarks
5. **Calendar & Availability** - Talent availability management for bookings

## Database Schema

### New Tables (migrations 023-024)

#### contracts & invoices (`023_DB_CORE_phase2_contracts_eSignature.sql`)
```sql
contracts {
  id: string (PK)
  job_id: string (FK projects)
  talent_id: string (FK talents)
  agency_id: string (FK agencies)
  client_id: string (FK clients)
  status: enum('draft', 'pending_signature', 'signed', 'completed', 'cancelled')
  fee: decimal(12,2) -- Base contract fee
  signature_talent: text -- Base64 image + timestamp
  signature_client: text -- Base64 image + timestamp
  created_at: datetime
  updated_at: datetime
  signed_at: datetime (nullable)
}

invoices {
  id: string (PK)
  contract_id: string (FK contracts)
  amount: decimal(12,2)
  status: enum('pending', 'paid', 'escrow_released')
  payment_url: text
  payment_method: string (xendit, midtrans, bank_transfer)
  paid_at: datetime (nullable)
  created_at: datetime
  updated_at: datetime
}

profile_views {
  id: string (PK)
  talent_id: string (FK talents)
  viewer_id: string (FK users, nullable)
  ip_address: string (nullable)
  user_agent: string
  viewed_at: datetime
}
```

**Indexes:** contract status/client/talent, invoice contract_id/status, views talent_id/date

#### availability & analytics (`024_DB_CORE_phase2_availability_analytics.sql`)
```sql
availability {
  id: string (PK)
  talent_id: string (FK talents)
  start_date: date
  end_date: date
  status: enum('available', 'booked', 'unavailable')
  reason: text (nullable) -- e.g., "On project", "Vacation"
  created_at: datetime
  updated_at: datetime
}

talent_analytics {
  id: string (PK)
  talent_id: string (FK talents, UNIQUE)
  views_7d: integer
  views_30d: integer
  views_all_time: integer
  rank_tier: enum('emerging', 'top_25', 'top_10', 'top_5', 'top_1')
  score: decimal(10,2)
  last_updated: datetime
}
```

**Indexes:** availability talent_id/dates, analytics talent_id/score/tier

#### Extended Tables

**agencies** table:
- Added `custom_domain`: string (unique)
- Added `watermark_url`: text
- Added `primary_color`: string (hex, default #3b82f6)
- Added `secondary_color`: string (hex, default #1e40af)
- Added `logo_url`: text
- Added `white_label_enabled`: boolean

## API Reference

### 1. Fintech & Contracts (`fintechHandler.ts`)

#### Create Contract with Escrow
```
POST /api/v1/contracts/generate
Authorization: Required (client or agency_admin)
Content-Type: application/json

Request:
{
  "job_id": "job_123",
  "talent_id": "talent_456",
  "fee": 5000000.00,
  "invoice_due_date": "2026-03-31"
}

Response 201:
{
  "status": "success",
  "data": {
    "contract_id": "contract_789",
    "invoice_id": "invoice_101",
    "contract_status": "draft",
    "invoice_status": "pending",
    "escrow_amount": 2500000.00,  // 50% held in escrow
    "payment_url": "https://xendit.co/...",
    "signature_links": {
      "for_talent": "/contracts/contract_789/sign?token=...",
      "for_client": "/contracts/contract_789/sign?token=..."
    }
  }
}
```

#### Get Contract Details
```
GET /api/v1/contracts/:id
Authorization: Required

Response 200:
{
  "status": "success",
  "data": {
    "id": "contract_789",
    "job_id": "job_123",
    "status": "pending_signature",
    "fee": 5000000.00,
    "signatures": {
      "talent_signed": false,
      "client_signed": false
    },
    "created_at": "2026-01-15T10:00:00Z",
    "signed_at": null
  }
}
```

#### Sign Contract (talent or client)
```
POST /api/v1/contracts/:id/sign
Authorization: Required
Content-Type: application/json

Request:
{
  "signature_data": "data:image/png;base64,...",  // Canvas signature
  "signer_type": "talent" | "client"
}

Response 200:
{
  "status": "success",
  "message": "Signature added",
  "data": {
    "contract_id": "contract_789",
    "signature_added_for": "talent",
    "both_signed": false,  // true only when both talent AND client signed
    "next_action": "Waiting for client signature"
  }
}
```

#### Get Invoice & Payment Split
```
GET /api/v1/invoices/:id
Authorization: Required

Response 200:
{
  "status": "success",
  "data": {
    "invoice_id": "invoice_101",
    "contract_id": "contract_789",
    "amount": 5000000.00,
    "status": "escrow_released",  // or pending, paid
    "revenue_split": {
      "talent": 4000000.00,    // 80%
      "agency": 500000.00,     // 10%
      "platform": 500000.00    // 10%
    },
    "escrow_status": "RELEASED",
    "next_action": "Ready for transfer"
  }
}
```

#### Process Payment
```
POST /api/v1/invoices/:id/payment
Authorization: Required
Content-Type: application/json

Request:
{
  "payment_method": "bank_transfer"
}

Response 200:
{
  "status": "success",
  "message": "Payment processed",
  "data": {
    "invoice_id": "invoice_101",
    "status": "paid",
    "paid_at": "2026-01-20T14:30:00Z",
    "confirmation_id": "TRANSFER_20260120_001"
  }
}
```

#### Get Escrow Dashboard (Client)
```
GET /api/v1/dashboard/escrow
Authorization: Required (client)

Response 200:
{
  "status": "success",
  "data": {
    "total_escrow_held": 12500000.00,
    "contracts": [
      {
        "contract_id": "contract_789",
        "talent_name": "Anya Geraldine",
        "project_name": "TikTok Campaign Q1",
        "escrow_amount": 2500000.00,
        "status": "waiting_signatures",
        "signatures_needed": ["client"]
      }
    ],
    "ready_to_release": 5000000.00
  }
}
```

### 2. AI Smart Matching (`aiMatchHandler.ts`)

#### Smart Match - Parse Natural Language
```
POST /api/v1/ai/match
Authorization: Required (premium client tier)
Content-Type: application/json

Request:
{
  "prompt": "Looking for a beautiful Indonesian woman aged 20-28 for a beauty campaign. Must speak English. Dancer preferred."
}

Response 200:
{
  "status": "success",
  "extracted_criteria": {
    "gender": "female",
    "ethnicity": "Indonesian",
    "age_range": [20, 28],
    "language": "English",
    "category": "dancer",
    "other_requirements": ["beauty campaign"]
  },
  "matching_talents": [
    {
      "id": "talent_001",
      "name": "Putri Kusuma",
      "age": 24,
      "category": "dancer",
      "match_score": 95,
      "is_premium_unmasked": true
    }
  ],
  "results_count": 5
}
```

#### Batch Matching (Admin/Agency)
```
POST /api/v1/ai/match/batch
Authorization: Required
Content-Type: application/json

Request:
{
  "prompts": [
    "Korean actress, 25-30, Korean language",
    "Male model, 28-35, gym enthusiast",
    "Makeup artist, any age, must have portfolio"
  ]
}

Response 200:
{
  "status": "success",
  "results": [
    {
      "prompt": "Korean actress, 25-30, Korean language",
      "matches": 8,
      "sample_talents": [...]
    }
  ]
}
```

#### AI Suggestions (Viewing History)
```
GET /api/v1/ai/match/suggestions
Authorization: Required (client)

Response 200:
{
  "status": "success",
  "suggestions": {
    "based_on_views": {
      "patterns": ["Female, 20-30, category:model"],
      "suggested_talents": [...]
    },
    "trending_now": [...]
  }
}
```

### 3. Analytics & Profile Views

#### Get Talent Analytics
```
GET /api/v1/talents/:id/analytics
Authorization: Not required (public)

Response 200:
{
  "status": "success",
  "data": {
    "views_7d": 156,
    "views_30d": 428,
    "views_all_time": 2841,
    "rank_tier": "top_5",
    "score": 945.23,
    "percentile": 92,
    "insights": {
      "trend_7d": "trending_up",
      "avg_daily_views": 22
    }
  }
}
```

#### Talent's Own Analytics Dashboard
```
GET /api/v1/dashboard/talent/analytics
Authorization: Required (talent)

Response 200:
{
  "status": "success",
  "data": {
    "talentName": "Anya Geraldine",
    "overview": {
      "views_7d": 156,
      "views_30d": 428,
      "rank_tier": "top_5",
      "score": 945.23
    },
    "dailyBreakdown": [
      { "date": "2026-01-20", "views": 28 },
      { "date": "2026-01-19", "views": 31 }
    ],
    "stats": {
      "avgViewsPerDay": 22,
      "growthRate": "37%"
    }
  }
}
```

#### Rankings & Leaderboard
```
GET /api/v1/rankings?period=7d&category=model&limit=20
Authorization: Not required (public)

Response 200:
{
  "status": "success",
  "data": {
    "period": "7d",
    "category": "model",
    "rankings": [
      {
        "rank": 1,
        "talent_id": "talent_001",
        "name": "Anya Geraldine",
        "category": "model",
        "profile_picture_url": "...",
        "views_7d": 312,
        "rank_tier": "top_1",
        "score": 1205.34
      }
    ]
  }
}
```

### 4. White-Labeling

#### Get Agency White-Label Settings
```
GET /api/v1/agencies/me/whitelabel
Authorization: Required (agency_admin)

Response 200:
{
  "status": "success",
  "data": {
    "id": "agency_001",
    "name": "Prestige Talent",
    "custom_domain": "talents.prestige-group.com",
    "primary_color": "#e74c3c",
    "secondary_color": "#c0392b",
    "logo_url": "https://r2.orland.com/prestige-logo.png",
    "watermark_url": "https://r2.orland.com/watermarks/agency_001/watermark_xyz.png",
    "white_label_enabled": true
  }
}
```

#### Update White-Label Settings
```
PATCH /api/v1/agencies/me/whitelabel
Authorization: Required (agency_admin)
Content-Type: application/json

Request:
{
  "custom_domain": "models.prestige-group.com",
  "primary_color": "#2ecc71",
  "secondary_color": "#27ae60",
  "white_label_enabled": true
}

Response 200:
{
  "status": "success",
  "message": "White-label settings updated",
  "data": { ... }
}
```

#### Upload Watermark
```
POST /api/v1/agencies/me/watermark/upload
Authorization: Required (agency_admin)
Content-Type: multipart/form-data

Form Data:
{
  "file": <PNG/JPEG/GIF/WebP image, max 5MB>
}

Response 200:
{
  "status": "success",
  "data": {
    "url": "https://r2.orland.com/watermarks/agency_001/watermark_123456.png",
    "filename": "watermarks/agency_001/watermark_123456.png"
  }
}
```

#### Get White-Label Config by Domain (Public)
```
GET /api/v1/whitelabel/config/talents.prestige-group.com
Authorization: Not required

Response 200:
{
  "status": "success",
  "data": {
    "brandName": "Prestige Talent",
    "primaryColor": "#e74c3c",
    "secondaryColor": "#c0392b",
    "logoUrl": "...",
    "watermarkUrl": "..."
  }
}
```

### 5. Calendar & Availability

#### Get Talent's Availability
```
GET /api/v1/talents/me/availability
Authorization: Required (talent)

Response 200:
{
  "status": "success",
  "data": {
    "talent_id": "talent_001",
    "availability": [
      {
        "id": "avail_001",
        "start_date": "2026-02-01",
        "end_date": "2026-02-15",
        "status": "booked",
        "reason": "Netflix Project (exclusive)"
      }
    ]
  }
}
```

#### Add Availability Block
```
POST /api/v1/talents/me/availability
Authorization: Required (talent)
Content-Type: application/json

Request:
{
  "start_date": "2026-02-20",
  "end_date": "2026-03-05",
  "status": "unavailable",
  "reason": "Personal matter - no bookings"
}

Response 201:
{
  "status": "success",
  "message": "Availability added",
  "data": {
    "id": "avail_002",
    "start_date": "2026-02-20",
    "end_date": "2026-03-05",
    "status": "unavailable"
  }
}
```

#### Update Availability
```
PATCH /api/v1/talents/me/availability/:id
Authorization: Required (talent owner)
Content-Type: application/json

Request:
{
  "status": "available",
  "reason": null
}

Response 200: { ... }
```

#### Delete Availability Block
```
DELETE /api/v1/talents/me/availability/:id
Authorization: Required (talent owner)

Response 200:
{
  "status": "success",
  "message": "Availability removed"
}
```

#### Get Public Availability Summary
```
GET /api/v1/public/talents/:id/availability
Authorization: Not required

Response 200:
{
  "status": "success",
  "data": {
    "talent_name": "Anya Geraldine",
    "current_status": "booked",
    "upcoming_blocks": [
      {
        "start_date": "2026-02-01",
        "end_date": "2026-02-15",
        "status": "booked"
      }
    ],
    "summary": {
      "booked_dates": 1,
      "unavailable_dates": 0
    }
  }
}
```

## Revenue Split Model

### Payment Flow Diagram

```
Client pays invoice → Platform holds 50% escrow
                  ↓
             Both sign contract
                  ↓
          Platform releases escrow 100%
                  ↓
         Payment distributed:
    - Talent:   80% of total fee
    - Agency:   10% of total fee
    - Platform: 10% of total fee (as platform fee)

Example: IDR 5,000,000 contract
- Talent receives:   IDR 4,000,000
- Agency receives:   IDR 500,000
- Platform retains:  IDR 500,000
```

## Authentication & Authorization

### Role-Based Access Control

| Feature | Talent | Client | Agency | Admin |
|---------|--------|--------|--------|-------|
| Contract signing | ✓ | ✓ | - | ✓ |
| Create invoices | - | ✓ | - | ✓ |
| AI matching | - | ✓* | ✓* | ✓ |
| View own analytics | ✓ | - | - | ✓ |
| View profile | - | ✓ | ✓ | ✓ |
| Set availability | ✓ | - | - | - |
| White-label config | - | - | ✓ | ✓ |

*Premium tier only

### Auth Middleware
All endpoints (except `/public/*`) require valid `sid` cookie with:
- Non-deleted user status
- Current session validity
- Active subscription (for premium features)

## Database Triggers & Automation

### Auto-generated on Contract Creation
```
- Invoice created automatically (100% of contract fee)
- Profile created for tracking
- Notification sent to both parties
```

### On Contract Signature
```
- If both signed: Status → "signed", Escrow fully released
- Notification queue updated
- Payment processing initiated
```

### Daily Analytics Calculation
```
- Runs at midnight UTC
- Updates views_7d, views_30d
- Recalculates rank_tier based on score
- Updates lastUpdated timestamp
```

## Cloudflare D1 Configuration

Ensure `wrangler.toml` has:

```toml
[[d1_databases]]
binding = "DB_CORE"
database_name = "orland-core"

[[d1_databases]]
binding = "DB_LOGS"
database_name = "orland-logs"

[[d1_databases]]
binding = "DB_SSO"
database_name = "orland-sso"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "orland-files"

[[env.production.d1_databases]]
binding = "CF_AI_GATEWAY"
id = "..." # Cloudflare Workers AI binding
```

## Error Handling

### Common Error Responses

```json
{
  "status": "error",
  "message": "User error description",
  "code": "DOMAIN_ERROR_CODE"
}
```

| Code | Status | Meaning |
|------|--------|---------|
| UNKNOWN_CONTRACT | 404 | Contract ID not found |
| SIGNATURE_EXISTS | 409 | Already signed by this party |
| NOT_AUTHORIZED | 403 | No permission for this action |
| INVALID_DOMAIN | 400 | Custom domain format invalid |
| FILE_TOO_LARGE | 413 | Upload exceeds 5MB |
| INSUFFICIENT_TIER | 403 | Premium feature access denied |

## Caching Strategy

| Resource | TTL | Invalidation |
|----------|-----|--------------|
| Rankings | 1 hour | Manual on analytics update |
| Talent profile | 30 min | On profile edit |
| Agency branding | 1 day | On settings change |
| Public media | 1 year | On new version |

## Monitoring & Logging

### Key Metrics to Track

```
- Contract creation rate
- Signature completion rate (%)
- Payment processing time (avg)
- AI match accuracy (high/medium/low)
- Talent view trends
- Rankings tier distribution
```

### Logs Written to DB_LOGS

```
- profile_views: Every talent profile view
- contract_signatures: Every signature event
- payment_events: All transaction activity
- ai_match_queries: For training & optimization
```

## Deployment Checklist

- [ ] All migrations run on Cloudflare D1
- [ ] R2 bucket configured for watermark storage
- [ ] Cloudflare Workers AI enabled in wrangler
- [ ] CORS settings align with domain list
- [ ] Email notifications for contract events configured
- [ ] Cron job for analytics calculation set up
- [ ] Escrow verification with payment provider
- [ ] Test contract flow end-to-end
- [ ] Verify signature capture works on mobile
- [ ] Domain verification for white-label domains
- [ ] R2 public URL configured
- [ ] All route handlers imported in index.ts

## Next Steps

1. Create frontend React components for all UIs
2. Set up Cloudflare Workers for background jobs
3. Configure email/SMS notifications
4. Test complete payment flow with test accounts
5. Performance testing on high-volume analytics queries
6. Security audit of signature capture and escrow logic

---

*Phase 2 Scale-Up Implementation - January 2026*
