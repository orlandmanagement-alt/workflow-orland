# Talent Agency Profile System - Two Scenarios

## Overview
Sistem registrasi talent dengan 2 skenario berbeda:
1. **Agency Bulk Import** - Agency mengirim link untuk talent update data
2. **Casting Call/Live Board** - Casting director urgent recruitment

---

## Scenario 1: Agency Bulk Import (Talent untuk Agency)

### Flow
```
Agency Dashboard
    ↓
Generate Link (with agency_id)
    ↓
Send to Talents (email/whatsapp)
    ↓
Talent Register → Auto linked to Agency
    ↓
Talent Profile Under Agency
```

### Implementation

#### 1. Generate Agency Registration Link
**Endpoint:** `POST /api/v1/agency/:agency_id/generate-invite-link`

```typescript
interface GenerateInviteLinkRequest {
  emails: string[];
  phone?: string[];
  validity_days?: number; // default 30 hari
}

interface InviteLinkResponse {
  links: {
    email: string;
    link: string;
    expires_at: string;
  }[];
}
```

**Response:**
```json
{
  "status": "ok",
  "links": [
    {
      "email": "talent@example.com",
      "link": "https://talent.orlandmanagement.com/register?agency_id=AGN123&token=INV_xxx",
      "expires_at": "2026-05-09"
    }
  ]
}
```

#### 2. Register via Agency Link
**Endpoint:** `POST /api/auth/register-for-agency`

```typescript
interface RegisterForAgencyRequest {
  agency_id: string;
  token: string;
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  turnstile_token: string;
}

interface RegisterForAgencyResponse {
  status: "ok" | "error";
  user_id?: string;
  message: string;
  redirect_url?: string; // → talent portal
}
```

**Database Impact:**
```sql
-- users table
INSERT INTO users (
  id, email, phone, full_name, password_hash, role, status, agency_id, created_at
) VALUES (?, ?, ?, ?, ?, 'talent', 'active', ?, NOW())

-- talents table (auto-create)
INSERT INTO talents (
  user_id, agency_id, full_name, status, created_at
) VALUES (?, ?, ?, 'pending_profile', NOW())
```

#### 3. Talent Detail dengan Agency Logo

**Database Schema:**
```sql
ALTER TABLE talents ADD COLUMN agency_logo_url TEXT;
ALTER TABLE agencies ADD COLUMN logo_url TEXT;
ALTER TABLE agencies ADD COLUMN logo_s3_key TEXT;
```

**Endpoint:** `GET /api/v1/talents/:talent_id/profile`

```json
{
  "status": "ok",
  "data": {
    "talent_id": "TAL_xxx",
    "full_name": "John Doe",
    "category": "Actor",
    "status": "active",
    "agency": {
      "agency_id": "AGN_123",
      "agency_name": "Premium Talent Agency",
      "logo_url": "https://cdn.orlandmanagement.com/agencies/AGN_123/logo.png",
      "contact_email": "contact@agency.com",
      "website": "https://agency.com"
    },
    "photos": {
      "headshot": "url",
      "side_view": "url"
    },
    "stats": {
      "bookings": 5,
      "rating": 4.8,
      "completion_rate": 95
    }
  }
}
```

---

## Scenario 2: Casting Call / Live Board

### Flow A: Full Registration (Guest → Account)
```
Casting Link
    ↓
Guest Form (nama, email, hp, attachment)
    ↓
Question: "Daftar akun atau tetap guest?"
    ↓
  ├─ YES (Daftar akun)
  │   ├─ Set password
  │   ├─ Email verification
  │   └─ Auto-linked to Project
  │
  └─ NO (Guest only)
      ├─ Send email with edit link
      ├─ Can register anytime later
      └─ Store as guest_cast
```

### Flow B: Quick Guest Registration

**Endpoint:** `POST /api/casting/quick-register-guest`

```typescript
interface QuickGuestRequest {
  project_id: string;
  full_name: string;
  email: string;
  phone: string;
  role_preference?: 'figurant' | 'extras' | 'warga_desa' | 'prajurit' | 'all';
  attachments?: { type: 'photo' | 'video'; url: string }[];
  answers?: { question_id: string; answer: string }[]; // Custom casting questions
  register_as_account?: boolean;
}

interface QuickGuestResponse {
  status: "ok";
  cast_id: string;
  mode: "guest" | "account";
  message: string;
  actions?: {
    set_password_url?: string; // if account
    edit_profile_url?: string; // always
  };
}
```

**Database Tables:**
```sql
-- New table: casting_guest_cast
CREATE TABLE casting_guest_cast (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role_preference TEXT,
  answers JSON,
  attachments JSON,
  converted_to_user_id TEXT, -- if later daftar akun
  created_at TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(project_id),
  FOREIGN KEY (converted_to_user_id) REFERENCES users(id)
);

-- Extend projects table
ALTER TABLE projects ADD COLUMN casting_link_token TEXT;
ALTER TABLE projects ADD COLUMN casting_form_fields JSON;
ALTER TABLE projects ADD COLUMN is_casting_open BOOLEAN DEFAULT FALSE;
```

#### 2. Casting Director Custom Questions

**Endpoint:** `POST /api/v1/projects/:project_id/casting-form`

```typescript
interface CastingFormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'file';
  required: boolean;
  options?: string[];
}

interface SetCastingFormRequest {
  fields: CastingFormField[];
  is_open: boolean;
}
```

Example:
```json
{
  "fields": [
    {
      "id": "q1",
      "label": "Apakah kamu sudah pernah main film?",
      "type": "select",
      "options": ["Pernah", "Belum", "Sering"],
      "required": true
    },
    {
      "id": "q2",
      "label": "Upload foto selfie",
      "type": "file",
      "required": true
    },
    {
      "id": "q3",
      "label": "Tinggi badan?",
      "type": "text",
      "required": false
    }
  ],
  "is_open": true
}
```

#### 3. Guest Convert to Account

**Endpoint:** `POST /api/casting/guest-convert-account`

```typescript
interface ConvertGuestRequest {
  cast_id: string;
  password: string;
  confirm_password: string;
}

interface ConvertGuestResponse {
  status: "ok";
  user_id: string;
  message: "Akun berhasil dibuat, silakan login";
}
```

**Logic:**
```sql
-- Create user from guest_cast
INSERT INTO users (
  id, email, phone, full_name, password_hash, role, status
) VALUES (?, ?, ?, ?, ?, 'talent', 'active')

-- Create talent profile from guest_cast data
INSERT INTO talents (
  user_id, full_name, status, casting_answers
) VALUES (?, ?, 'pending_profile', ?)

-- UPDATE link
UPDATE casting_guest_cast 
SET converted_to_user_id = ? 
WHERE id = ?
```

---

## SaaS Model Recommendation

### Pricing Tiers

#### 1. **Free Tier**
- Guest casting participation (no limit)
- Profile edit via email link (no login)
- Can register as account anytime

#### 2. **Agency Pro** ($99-299/month)
- Generate unlimited invite links
- Bulk import talent
- Talent management dashboard
- Agency branding (logo, website)
- Priority support

#### 3. **Casting Director Pro** ($199-399/month)
- Create unlimited casting calls
- Custom form fields
- Guest + account registration
- Talent filtering & selection
- Payment processing for call-backs

#### 4. **Talent Premium** ($9-19/month)
- Complete profile visibility
- Show in casting calls
- Job notifications
- Contract storage

---

## Implementation Priority

### Phase 1 (Week 1-2): Agency Link Invite
- [ ] Generate invite link endpoint
- [ ] Register for agency flow
- [ ] Agency logo on profile

### Phase 2 (Week 3): Casting Call - Guest Only
- [ ] Quick guest registration form
- [ ] Email link for profile edit
- [ ] Custom casting questions

### Phase 3 (Week 4): Guest to Account Conversion
- [ ] Convert guest endpoint
- [ ] Auto-link to casting project
- [ ] Email confirmation flow

---

## Database Design Summary

```
users
├── agency_id (nullable) → agencies
├── role (talent | client | admin | agency)
└── status

talents
├── user_id (unique) → users
├── agency_id → agencies
├── casting_answers (JSON)
└── attachments (JSON)

agencies
├── logo_url
├── website
└── contact_info

projects
├── casting_link_token
├── casting_form_fields (JSON)
├── is_casting_open
└── created_by_id → users (casting_director)

casting_guest_cast
├── project_id → projects
├── full_name, email, phone
├── role_preference
├── answers (JSON)
├── attachments (JSON)
└── converted_to_user_id → users (if daftar)
```

---

## API Security

- ✅ Casting phone link public (no login needed)
- ✅ Agency invite link token-protected (single use)
- ✅ File upload limit 10MB per file
- ✅ TurnStile verification on guest registration
- ✅ Rate limit: 10 reqs/min per IP (casting)
- ✅ Email verification before account active

