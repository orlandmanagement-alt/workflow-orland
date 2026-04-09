# Apptalent Profile - Feature Documentation

## Overview
Apptalent profile management dengan dua skenario utama:
1. **Agency Recruitment Flow** - Agency invite talent untuk bergabung di bawah agency
2. **Casting Call Flow** - Casting director mengundang talent/extras untuk live casting

---

## Skenario 1: Agency Recruitment Flow

### User Journey
```
Agency Admin
  ↓
Create Invite Link (dengan ID Agency)
  ↓
Share Link ke Talent
  ↓
Talent klik link → Redirect ke Register Page dengan agency_id pre-filled
  ↓
Talent register: email, password, basic info
  ↓
Akun Talent tersimpan dengan agency_id → Account linked ke Agency
  ↓
Talent masuk ke profile page (under Agency Dashboard)
  ↓
Talent complete profile: photo, bio, experiences, certifications, rates
```

### Database Changes Needed
```sql
-- Link talent ke agency
ALTER TABLE talents ADD COLUMN agency_id TEXT; -- NULLABLE (bisa solo talent)
ALTER TABLE talents ADD COLUMN invited_by_user_id TEXT; -- Track who invited
ALTER TABLE talents ADD COLUMN invited_at DATETIME;

-- Track agency invitations
CREATE TABLE agency_invitations (
  invitation_id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  invite_link_token TEXT UNIQUE NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  max_uses INTEGER DEFAULT -1, -- -1 = unlimited
  current_uses INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' -- active, expired, disabled
);

-- Add agency info if not exists
ALTER TABLE clients ADD COLUMN logo_url TEXT; -- For agency logo
ALTER TABLE clients ADD COLUMN is_agency INTEGER DEFAULT 0;
```

### API Endpoints

#### 1. Generate Invitation Link
```
POST /api/v1/agency/invitations
Headers: Authorization: Bearer [TOKEN]
Body: {
  max_uses: -1,
  expires_in_days: 30
}

Response: {
  status: "ok",
  invitation_link: "https://talent.orlandmanagement.com/register?invite=XYZ123",
  expires_at: "2026-05-09T00:00:00Z",
  max_uses: -1
}
```

#### 2. Register with Invite Link
```
POST /api/v1/auth/register-via-agency
Headers: (optional) X-Invite-Token: XYZ123
Body: {
  email: "talent@example.com",
  phone: "+62812345678",
  full_name: "Dina Talenta",
  password: "SecurePass123!",
  turnstile_token: "..."
}

Response: {
  status: "ok",
  user_id: "USER123",
  talent_id: "TALENT123",
  agency_id: "AGENCY123",
  message: "Akun berhasil dibuat. Selesaikan profil Anda."
}
```

#### 3. Update Talent Profile (Agency Owner)
```
PUT /api/v1/talents/me
Headers: Authorization: Bearer [TOKEN]
Body: {
  full_name: "Dina Talenta",
  category: "Model",
  height: "170cm",
  weight: "52kg",
  birth_date: "1995-06-15",
  gender: "Female",
  headshot: "https://r2.../headshot.jpg",
  showreels: ["https://r2.../reel1.mp4"],
  interests: ["Fashion", "Commercial"],
  skills: ["Runway", "Photography"],
  instagram: "@dinatalenta",
  tiktok: "@dinatalenta",
  union_affiliation: "SAG-AFTRA",
  ...
}

Response: {
  status: "ok",
  data: { ...updated talent profile },
  talent_id: "TALENT123",
  agency_id: "AGENCY123"
}
```

---

## Skenario 2: Casting Call Flow

### User Journey (Full Account)
```
Casting Director
  ↓
Create Live Casting Board dengan project_id
  ↓
Generate Guest Link (untuk extras) & Share
  ↓
Talent klik link → Casting Call page dengan project info
  ↓
Option A: Daftar sebagai Akun Penuh
  → Register → Set Password → Complete Profile
  → Submit Audition
  
Option B: Daftar sebagai Guest (untuk extras)
  → Quick Register (name, email, phone only)
  → No password, no full profile
  → Submit Audition
  → Email dikirim: "Edit Profile" link (bisa daftar akun nanti)
```

### Database Changes
```sql
-- Extend live_casting_boards
ALTER TABLE live_casting_boards ADD COLUMN guest_link_token TEXT UNIQUE;
ALTER TABLE live_casting_boards ADD COLUMN allow_guest_submissions INTEGER DEFAULT 1;
ALTER TABLE live_casting_boards ADD COLUMN guest_questions JSON; -- Custom Q&A for extras

-- Track guest submissions
CREATE TABLE casting_guest_submissions (
  submission_id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  is_account_created INTEGER DEFAULT 0, -- 0=guest, 1=converted to account
  audition_data JSON, -- answers, photos, etc
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  converted_user_id TEXT -- If guest registered account later
);

-- Link guest to eventual talent account
ALTER TABLE talents ADD COLUMN converted_from_submission_id TEXT;
```

### API Endpoints

#### 1. Create Live Casting Board
```
POST /api/v1/projects/{project_id}/casting-board
Headers: Authorization: Bearer [TOKEN]
Body: {
  role_title: "Extras/Warriors",
  allow_guests: true,
  guest_questions: [
    { question: "Tinggi badan Anda?", type: "text" },
    { question: "Pengalaman sebelumnya?", type: "text" },
    { question: "Tersedia berapa hari?", type: "multiple_choice", options: ["1-3", "4-7", "8+"] }
  ],
  expires_at: "2026-05-15T00:00:00Z"
}

Response: {
  status: "ok",
  board_id: "BOARD123",
  guest_link: "https://talent.orlandmanagement.com/casting/XYZ456"
}
```

#### 2. Guest Quick Registration (Casting Call)
```
POST /api/v1/casting/guest-submit
Body: {
  board_id: "BOARD123",
  guest_link_token: "XYZ456",
  full_name: "Dodi Watono",
  email: "dodi@example.com",
  phone: "+62812345678",
  create_account: false, -- Or true for full registration
  answers: {
    "Tinggi badan Anda?": "175cm",
    "Pengalaman sebelumnya?": "Drama lokal 2023"
  }
}

Response: {
  status: "ok",
  submission_id: "SUB123",
  email_sent: "Edit profile link dikirim ke dodi@example.com",
  message: "Terima kasih! Menunggu callback dari casting director."
}
```

#### 3. Convert Guest to Full Account (Email Link)
```
GET /casting/convert?token=CONVERT_TOKEN_XYZ

# After user click link, redirect to:
# /register?conversion_token=CONVERT_TOKEN_XYZ&email=dodi@example.com

POST /api/v1/auth/register-from-casting
Body: {
  conversion_token: "CONVERT_TOKEN_XYZ",
  password: "SecurePass123!",
  turnstile_token: "..."
}

Response: {
  status: "ok",
  user_id: "USER456",
  talent_id: "TALENT456",
  message: "Akun berhasil dibuat dari submission casting Anda"
}
```

#### 4. Get Casting Candidates (Casting Director)
```
GET /api/v1/projects/{project_id}/casting-board/candidates
Headers: Authorization: Bearer [TOKEN]

Response: {
  status: "ok",
  candidates: [
    {
      candidate_id: "CAND123",
      type: "account", // or "guest"
      name: "Dina Talenta",
      email: "dina@example.com",
      phone: "+62812345678",
      submission_data: {
        answers: {...},
        photos: [...],
        video: "..."
      },
      status: "waiting", // waiting, selected, rejected, attended
      submitted_at: "2026-04-15T10:30:00Z"
    },
    {
      candidate_id: "SUB123",
      type: "guest",
      name: "Dodi Watono",
      email: "dodi@example.com",
      phone: "+62812345678",
      submission_data: {...},
      status: "waiting"
    }
  ]
}
```

---

## Frontend - Apptalent Profile Page

### Components to Create

#### 1. Agency Invite Section (for agency members)
```
Card: "Undang Talent Baru"
- Generate Invite Link button
- List active invitations (link, created_at, uses)
- Disable/expire invitation
```

#### 2. Profile Completion Flow
```
Step 1: Basic Info (auto-filled if registered via agency)
- Full Name, Email, Phone, Gender, Birth Date

Step 2: Physical Attributes
- Height, Weight, Eye Color, Hair Color, Body Type, etc.

Step 3: Portfolio
- Headshot (primary photo)
- Side View, Full Height photos
- Showreels (video URLs)
- Audios

Step 4: Professional
- Category/Role (Model, Actor, Dancer, etc.)
- Skills (chips)
- Interests (chips)
- Experiences
- Certifications
- Union Affiliation

Step 5: Social & Rates
- Instagram, TikTok, Twitter
- Rate Card (service + amount)

Step 6: Contact
- Phone (verify OTP)
- Email (verify token)
```

#### 3. Agency Profile Preview
```
Card: "Agensi Saya"
- Agency Logo
- Agency Name
- Agency Contact
- Edit button (for admin only)
```

#### 4. Casting Call Landing Page
```
Desktop View:
- Project Header (Project Name, Production Title)
- Role Info (Role Title, Quantity Needed, Role Description)
- Casting Director Name & Contact
- "Daftar Sekarang" button

Mobile View:
- Same but optimized for mobile submission
```

---

## SaaS Implementation Notes

### Multi-Account Scenarios
1. **Solo Talent** - No agency_id (agency_id = NULL)
2. **Agency Talent** - Has agency_id, under agency dashboard
3. **Guest Submission** - Only email + phone initially
4. **Converted Guest** - Guest upgraded to talent account

### Security Considerations
1. Invitation links should have expiration
2. Guest submissions should verify email via OTP
3. Agency admin can only manage their own talent
4. Casting director limited to their project

### Email Templates Needed
1. `Agency Invitation` - "Join our management"
2. `Registration Confirmation` - Welcome to Orland
3. `Guest Submission Confirmation` - "Thank you for applying"
4. `Guest Convert Link` - "Complete your profile"
5. `Casting Selection` - "You've been selected"

---

## Implementation Priority
1. ⭐⭐⭐ Agency invite flow + Profile update
2. ⭐⭐⭐ Casting guest submission
3. ⭐⭐ Guest-to-account conversion
4. ⭐⭐ Agency logo in profile
5. ⭐ Custom casting questions
