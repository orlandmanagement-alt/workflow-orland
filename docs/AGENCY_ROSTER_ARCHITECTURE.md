
# Enterprise Agency Roster & Managed Talent Architecture

**Version**: 2.0 | **Date**: April 2026 | **Status**: Production Ready

---

## 1. OVERVIEW

The Agency Roster system enables talent agencies to:

1. **Create managed talent profiles** - Register talents under agency without requiring individual email signup
2. **Control talent access** - Toggle independent login, lock portfolio/pricing, enforce auto-sync
3. **Impersonate talents securely** - "View as" mode to configure profiles without password sharing
4. **Route client communications** - Force all inquiries through agency inbox
5. **Audit all actions** - Complete trail of who accessed what and when

### Key Actors

- **Agency**: Talent management company (user role: `agency`)
- **Managed Talent**: Talent registered by agency (user role: `talent`, `managedBy` = agency ID)
- **Independent Talent**: Talent with own account (user role: `talent`, `managedBy` = null)
- **Client**: Booking platform user (user role: `client`)

---

## 2. SUBDOMAIN & ROLE ARCHITECTURE

### Complete Domain Mapping

```
www.orlandmanagement.com
├── SSO Service (Authentication hub)
└── Client Portal

talent.orlandmanagement.com
├── Role: talent, independent_talent
├── Access: Talent dashboard, portfolio, availability
└── Blocks: client.*, admin.*, agency.*

client.orlandmanagement.com
├── Role: client
├── Access: Browsing talents, booking, escrow, invoicing
└── Blocks: talent.*, admin.*, agency.*

admin.orlandmanagement.com
├── Role: admin, super_admin
├── Access: Platform management, analytics, disputes
└── Blocks: talent.*, client.*, agency.*

agency.orlandmanagement.com ⭐ NEW
├── Role: agency
├── Access: Roster management, impersonation, inbox
└── Blocks: talent.*, client.*, admin.*
```

### Access Denial Rules

**Role-Based Redirection Blocks:**

| Current Role | Tries to Access | Display Screen | Redirects To |
|---|---|---|---|
| Talent | `client.` | "Akses Ditolak: Anda adalah akun Talent. Mengalihkan ke Talent Dashboard..." | `talent.orlandmanagement.com` |
| Talent | `admin.` | "Akses Ditolak: Anda adalah akun Talent. Mengalihkan ke Talent Dashboard..." | `talent.orlandmanagement.com` |
| Talent | `agency.` | "Akses Ditolak: Anda adalah akun Talent. Mengalihkan ke Talent Dashboard..." | `talent.orlandmanagement.com` |
| Client | `talent.` | "Akses Ditolak: Anda adalah akun Client. Mengalihkan ke Client Portal..." | `client.orlandmanagement.com` |
| Client | `admin.` | "Akses Ditolak: Anda adalah akun Client. Mengalihkan ke Client Portal..." | `client.orlandmanagement.com` |
| Client | `agency.` | "Akses Ditolak: Anda adalah akun Client. Mengalihkan ke Client Portal..." | `client.orlandmanagement.com` |
| **Agency** | **`talent.`** | **"Akses Ditolak: Anda adalah akun Agency. Mengalihkan ke Roster Dashboard..."** | **`agency.orlandmanagement.com`** |
| **Agency** | **`client.`** | **"Akses Ditolak: Anda adalah akun Agency. Mengalihkan ke Roster Dashboard..."** | **`agency.orlandmanagement.com`** |
| **Agency** | **`admin.`** | **"Akses Ditolak: Anda adalah akun Agency. Mengalihkan ke Roster Dashboard..."** | **`agency.orlandmanagement.com`** |
| Admin | `talent.` | "Akses Ditolak: Anda adalah akun Administrator. Mengalihkan ke Admin Dashboard..." | `admin.orlandmanagement.com` |
| Admin | `client.` | "Akses Ditolak: Anda akun Administrator. Mengalihkan ke Admin Dashboard..." | `admin.orlandmanagement.com` |

---

## 3. SECURE IMPERSONATION FEATURE

### Why Impersonation?

**Problem**: Agencies need to set up talent profiles without:
- Telling talents their temporary passwords
- Requiring talents to complete setup flows
- Creating timezone/communication delays
- Managing multiple temporary credentials

**Solution**: Secure "View As" mode that's:
- Time-limited (5 minutes)
- Audit-logged (every action)
- Agency-ID bound (cannot escalate permissions)
- Single-use token (read-only on client side)

### Token Architecture

```
Impersonation Token Format:
┌─────────────────────────────────────────────────────┐
│ imp_[UUID]_[RANDOM_SECRET]                          │
│                                                     │
│ Example: imp_550e8400-e29b-41d4-a716-446655440000  │
│          _9f8c4e3b2a1d5f7e6g9h0i1j2k3l4m5n6o7p8q │
└─────────────────────────────────────────────────────┘

Database Storage:
┌──────────────────────────────────────────────────────┐
│ impersonation_sessions table:                        │
│                                                      │
│ id: imp_550e8400-...                                │
│ agencyId: agency_123                                │
│ talentId: talent_456                                │
│ tokenHash: SHA256(secret) - 64 hex chars            │
│ expiresAt: 1712856300000 (5 min TTL)               │
│ createdAt: 1712856000000                            │
│ status: 'active' | 'expired' | 'revoked'           │
└──────────────────────────────────────────────────────┘

Hash-only Storage:
- Never store full token in DB
- Compare new token's hash with stored hash
- Prevents database breach exposing tokens
- Even with DB dump, tokens cannot be reconstructed
```

### Impersonation Flow

```
1. REQUEST IMPERSONATION
┌─────────────────────────────────────────────────┐
│ POST /api/agency/impersonate-talent             │
│ Headers: x-agency-id, x-user-id                 │
│ Body: { talentId: "talent_123", reason?: "..." }│
└─────────────────────────────────────────────────┘
         ↓
2. VALIDATION CHECKS
┌─────────────────────────────────────────────────┐
│ ✓ Agency exists and is active                   │
│ ✓ Talent belongs to this agency                 │
│ ✓ Agency doesn't already have active impersonation
│ ✓ Rate limit: max 10 switches per 15 min       │
│ ✓ IP + User-Agent captured                      │
└─────────────────────────────────────────────────┘
         ↓
3. CREATE TOKEN
┌─────────────────────────────────────────────────┐
│ tokenSecret = randomBytes(32).toString('hex')   │
│ tokenHash = SHA256(tokenSecret)                 │
│ impersonationToken = `imp_${uuid}_${secret}`    │
│ expiresAt = now + 5 minutes                     │
└─────────────────────────────────────────────────┘
         ↓
4. STORE IN DATABASE
┌─────────────────────────────────────────────────┐
│ INSERT INTO impersonation_sessions:             │
│ - tokenHash (NOT full token)                    │
│ - agencyId, talentId                            │
│ - expiresAt, createdAt                          │
│ - status = 'active'                             │
│                                                 │
│ INSERT INTO impersonation_audit_log:            │
│ - agencyId, agencyUserId, talentId              │
│ - ipAddress, userAgent, reason                  │
│ - action = 'impersonate_start'                  │
└─────────────────────────────────────────────────┘
         ↓
5. RETURN TOKEN (ONE TIME ONLY)
┌─────────────────────────────────────────────────┐
│ Response:                                       │
│ {                                               │
│   status: 'ok',                                 │
│   impersonationToken: 'imp_...._....',          │
│   expiresIn: 300,                               │
│   talent: {...}                                 │
│ }                                               │
└─────────────────────────────────────────────────┘
         ↓
6. CLIENT STORES TOKEN
┌─────────────────────────────────────────────────┐
│ localStorage.setItem('impersonationToken', token)
│                                                 │
│ Header: x-impersonation-token                   │
│ All subsequent requests include token header    │
└─────────────────────────────────────────────────┘
         ↓
7. BACKEND VALIDATES TOKEN
┌─────────────────────────────────────────────────┐
│ For each request with impersonation token:      │
│                                                 │
│ 1. Parse token: imp_[uuid]_[secret]             │
│ 2. Hash secret: SHA256                          │
│ 3. Lookup in DB by hash                         │
│ 4. Check expiry time                            │
│ 5. Verify status = 'active'                     │
│ 6. Check agencyId matches                       │
│ 7. Attach to request context                    │
└─────────────────────────────────────────────────┘
         ↓
8. DATA FILTERING
┌─────────────────────────────────────────────────┐
│ All queries filtered by:                        │
│ - talentId (only impersonated talent visible)   │
│ - agencyId (prevent lateral movement)           │
│                                                 │
│ Mutations include:                              │
│ - agencyId (owner preservation)                 │
│ - lastModifiedBy = 'agency_impersonating'       │
│ - lastModifiedByUserId = agencyUserId           │
└─────────────────────────────────────────────────┘
         ↓
9. AUTO-EXPIRY (5 MINUTES)
┌─────────────────────────────────────────────────┐
│ Token expires automatically                     │
│ Client receives 401 Unauthorized                │
│ Must request new token to continue              │
│                                                 │
│ INSERT INTO impersonation_audit_log:            │
│ - action = 'impersonate_end'                    │
│ - timestamp                                     │
└─────────────────────────────────────────────────┘
```

### Security Layers

```
Layer 1: AUTHENTICATION
├─ Agency must be logged in (JWT token valid)
├─ Session must not be expired
└─ IP/User-Agent must match original login

Layer 2: AUTHORIZATION
├─ Talent must belong to requesting agency
├─ Talent must not be already impersonated by another agency
├─ Agency must not exceed impersonation limit (10/15min)
└─ Talent must have canLoginIndependently or be unlocked

Layer 3: TOKEN SECURITY
├─ Token contains random 256-bit secret
├─ Only SHA256 hash stored in database
├─ Token cannot be reconstructed from hash
├─ Single token per agency at a time
└─ Unique per (agencyId, talentId) pair

Layer 4: TIME LIMITING
├─ Token valid for 5 minutes only
├─ Database cleanup every 5 minutes
├─ Expired tokens return 401 Unauthorized
└─ Rate limit: 10 switches per 15 minutes

Layer 5: AUDIT TRAIL
├─ Log timestamp (ms precision)
├─ Log IP address + User-Agent
├─ Log reason field (optional explanation)
├─ Log all mutations: who, what, when
└─ Queryable audit log per agency
```

### Mutation Constraints Under Impersonation

```
ALLOWED (Agency can modify):
✓ Portfolio items (if portfolioEditLock = false)
✓ Profile information (name, bio, location)
✓ Availability calendar (if scheduleAutoSync = false)
✓ Media uploads (portfolio images, videos)
✓ Settings (notification preferences)

RESTRICTED (Agency cannot modify):
✗ Email address (owner-only)
✗ Password (owner-only)
✗ Login credentials
✗ Agency assignment (already locked)
✗ Commission/payment splits (financial, read-only)

PORTFOLIO LOCKS (Agency can enforce):
When portfolioEditLock = true:
✗ Talent cannot edit portfolio via talent.orlandmanagement.com
✗ Talent sees "Portfolio locked by agency"
✓ Agency can still edit via impersonation

When priceNegotiationLock = true:
✗ Talent cannot accept rate below minimum
✗ Talent cannot negotiate rates with clients
✓ Agency quotes supersede normal pricing

When scheduleAutoSync = true:
✗ Talent calendar changes auto-sync to agency
✓ Agency calendar updates override talent choices
```

---

## 4. MANAGED TALENT LIFECYCLE

### Profile Creation

```
STEP 1: Agency Creates Talent Profile
┌─────────────────────────────────────────────────┐
│ POST /api/agency/talent/create                  │
│ Body: {                                         │
│   email: "talent@example.com",                  │
│   name: "Budi Santoso",                         │
│   canLoginIndependently: true/false              │
│ }                                               │
└─────────────────────────────────────────────────┘
         ↓
STEP 2: System Generates Credentials
┌─────────────────────────────────────────────────┐
│ tempPassword = generateSecurePassword(16)       │
│ passwordHash = PBKDF2(tempPassword)             │
│ setupToken = sign({talentId, expiresAt})        │
└─────────────────────────────────────────────────┘
         ↓
STEP 3: Send Invitation Email
┌─────────────────────────────────────────────────┐
│ To: talent@example.com                          │
│                                                 │
│ Subject: Budi Santoso, Anda terdaftar di        │
│          <AgencyName> di Orland Platform        │
│                                                 │
│ Body:                                           │
│ Selamat datang di Orland Platform melalui       │
│ representasi <AgencyName>!                      │
│                                                 │
│ Your temporary account:                         │
│ Email: talent@example.com                       │
│ Temp Password: [16-char complex password]       │
│                                                 │
│ Setup your profile:                             │
│ [Link to talent.orlandmanagement.com/setup]     │
│                                                 │
│ Questions? Contact: support@...                 │
└─────────────────────────────────────────────────┘
         ↓
STEP 4: Profile Status
┌─────────────────────────────────────────────────┐
│ status: 'draft' → 'pending_review' → 'active'   │
│                                                 │
│ - draft: Just created, not yet visible          │
│ - pending_review: Agency/admin reviewing       │
│ - active: Published on platform                │
│ - archived: Soft-deleted, hidden from clients   │
└─────────────────────────────────────────────────┘
```

### Independent Login Setup

```
Talent Receives Invitation Email:
  1. Clicks setup link
  2. Enters new password (replacing temp)
  3. Completes profile information
  4. Now can login to talent.orlandmanagement.com

canLoginIndependently = true:
  ✓ Talent can login on their own
  ✓ Talent sees portfolio management UI
  ✓ Talent can respond to direct inquiries
  ✗ But: If portfolioEditLock=true, cannot edit
  ✗ And: If priceNegotiationLock=true, cannot set rates

canLoginIndependently = false:
  ✗ Talent cannot login
  ✗ Talent only sees "Locked to agency" message
  ✓ Agency manages talent completely via impersonation
```

---

## 5. CLIENT COMMUNICATION ROUTING

### Inquiry Routing Logic

```
Client browses talent profile → wants to inquire

CLIENT SIDE:
  1. Display "Contact Talent" button
  2. Click triggers: GET /api/client/talent/:talentId/contact-options

SERVER CHECKS:
  SELECT managedBy FROM managed_talents WHERE id = ?
  
  IF managedBy IS NULL:
    → Direct talent (return talent's inbox URL)
    
  ELSE IF managedBy IS NOT NULL:
    → Managed talent (return agency's inbox URL)

RESPONSE EXAMPLE:
  Managed Talent:
  {
    contactType: 'through_agency',
    contactInfo: {
      name: 'PT Bintang Talent Management',
      inboxUrl: 'https://client-portal.orlandmanagement.com/agency/agency_123/contact',
      message: 'This talent is managed by PT Bintang. Contact them directly.'
    }
  }
  
  Independent Talent:
  {
    contactType: 'direct',
    contactInfo: {
      name: 'Budi Santoso',
      email: 'budi@example.com',
      inboxUrl: 'https://client-portal.orlandmanagement.com/talent/talent_456/contact',
      message: 'Contact this talent directly'
    }
  }

CLIENT DISPLAYS DIFFERENT CTA:
  Direct: "Message Budi" → Opens talent's inbox
  Managed: "Contact Agency" → Opens agency's inbox
```

### Agency Inbox Features

```
1. LIST ALL INQUIRIES
   - Inquiries for all managed talents
   - Status: new, replied, negotiating, declined, accepted
   - Filtered by talent or ALL
   - Sortable by: date, client tier, project budget

2. REPLY TO INQUIRY
   - Type response in agency voice
   - Propose rates, availability, terms
   - Automatically signed with agency name
   - Client sees: "Reply from [Agency Name] on behalf of [Talent]"

3. FORWARD TO TALENT (if canLoginIndependently)
   - Agency delegates to talent with message
   - Talent gets separate notification
   - Talent can reply independently
   - Agency maintains visibility

4. ARCHIVE / MARK COMPLETE
   - Organizes inbox
   - Tracks conversion rates
   - Analytics for agency performance

5. AUDIT TRAIL
   - Who replied, when, what they said
   - IP address all interactions
   - Export for compliance
```

---

## 6. DATABASE SCHEMA

### Created in Migration 028

```sql
agencies table:
  id (primary key)
  email (unique, searchable)
  name, companyName, companyRegistration
  totalManagedTalents, totalVerifiedTalents
  status (active, suspended, archived)
  kycStatus (pending, verified, rejected)
  createdAt, lastModifiedAt

managed_talents table:
  id (primary key)
  agencyId (foreign key → agencies)
  email, name, passwordHash
  canLoginIndependently, profileStatus
  portfolioEditLock, priceNegotiationLock
  lastModifiedBy ('agency' or 'self')
  createdAt, deletedAt (soft delete)

impersonation_sessions table:
  id (primary key)
  agencyId, talentId (foreign keys)
  tokenHash (SHA256 of secret, NOT full token)
  createdAt, expiresAt
  status (active, expired, revoked)

impersonation_audit_log table:
  id (primary key)
  agencyId, agencyUserId, talentId
  ipAddress, userAgent, action, reason
  timestamp (ms precision)

agency_portfolio_sync table:
  id
  agencyId, talentId (unique pair)
  syncPortfolioItems, syncRates, syncAvailability
  overridePrice, overridePriceValue
  autoApproveClientRequests

talent_agency_relationships table:
  id
  managedTalentId, agencyId (unique pair)
  relationshipType (managed, represented, associated)
  agencyCommissionPercent, talentEarningsPercent
  startDate, endDate
```

---

## 7. ENVIRONMENT VARIABLES UPDATE

```bash
# Agency Configuration (.env.production)

# ============================================
# AGENCY FEATURE CONFIGURATION
# ============================================

# Impersonation Settings
IMPERSONATION_TOKEN_TTL=300                # 5 minutes in seconds
IMPERSONATION_MAX_PER_15MIN=10              # Max switches per 15 min
IMPERSONATION_SESSION_TTL=300000            # 5 minutes in ms

# Rate Limiting
AGENCY_ROSTER_QUERIES_PER_MIN=60            # API rate limit
IMPERSONATION_REQUESTS_PER_MIN=30           # Impersonation requests

# Portfolio Locks (defaults)
PORTFOLIO_EDIT_LOCK_DEFAULT=false           # Agency can override
PRICE_NEGOTIATION_LOCK_DEFAULT=false        # Agency can override
SCHEDULE_AUTO_SYNC_DEFAULT=true             # Sync by default

# Independent Login
INDEPENDENT_LOGIN_ENABLED=true              # Allow talent self-login
FORCE_AGENCY_MANAGEMENT=false               # Force agency-only access

# Audit & Compliance
IMPERSONATION_AUDIT_ENABLED=true            # Log all impersonation
AUDIT_LOG_RETENTION_DAYS=90                 # Keep 90 days of logs
AUDIT_LOG_ENCRYPTION=true                   # Encrypt sensitive data

# Email Configuration
AGENCY_INVITATION_EMAIL_TEMPLATE="agency_talent_invite"
AGENCY_SUPPORT_EMAIL="agencies@orlandmanagement.com"
AGENCY_ONBOARDING_URL="https://agency.orlandmanagement.com/onboarding"

# Monitoring & Alerts
IMPERSONATION_ANOMALY_DETECTION=true        # Flag unusual behavior
ANOMALY_THRESHOLD_ATTEMPTS_PER_HOUR=20      # Alert if > 20 switches/hour
ALERT_ON_FIRST_IMPERSONATION=false          # New agency using feature

# Commission & Payments
DEFAULT_AGENCY_COMMISSION_PERCENT=15        # Agency takes 15%
TALENT_PAYOUT_PERCENT=85                    # Talent gets 85%
```

---

## 8. IMPLEMENTATION CHECKLIST

### Phase 1: Backend Setup (Week 1)

- [ ] Create migration 028_DB_CORE_agency_roster.sql
- [ ] Run migration on production D1
- [ ] Create agency account (test company)
- [ ] Create authentication for agencies in auth-enhanced.ts
- [ ] Create agency roster endpoints (GET /roster, POST /talent/create)
- [ ] Create impersonation endpoints (POST /impersonate-talent, POST /clear-impersonation)
- [ ] Add rate limiting middleware
- [ ] Add audit logging
- [ ] Add tests: 20 test cases for impersonation
- [ ] Deploy to production

### Phase 2: Frontend Setup (Week 2)

- [ ] Create appagency React app
  - [ ] Auth middleware extended version
  - [ ] Roster dashboard component
  - [ ] Talent profile card component
  - [ ] Impersonation header (shows "viewing as" status)
  - [ ] Portfolio lock indicators
  - [ ] Add agency navbar (4 tabs: Roster, Inbox, Analytics, Settings)

- [ ] Update appclient
  - [ ] Modify talent profile page to show agency info
  - [ ] "Contact Agency" button replaces direct messaging
  - [ ] Agency inbox routing

- [ ] Update apptalent
  - [ ] Show "managed by agency" status
  - [ ] Disable portfolio edit if portfolioEditLock=true
  - [ ] Disable pricing if priceNegotiationLock=true

### Phase 3: Testing (Week 3)

- [ ] Test Scenario 1: Create managed talent
   - [ ] Invitation email sent
   - [ ] Talent can setup own password
   - [ ] Talent can login to talent.orlandmanagement.com

- [ ] Test Scenario 2: Impersonation
   - [ ] Agency requests impersonation
   - [ ] Token created and stored hashed
   - [ ] Agency can modify talent portfolio
   - [ ] Token expires after 5 min
   - [ ] Token cannot be reused

- [ ] Test Scenario 3: Portfolio Locks
   - [ ] Agency sets portfolioEditLock=true
   - [ ] Talent cannot edit portfolio
   - [ ] Agency can edit via impersonation
   - [ ] Agency can toggle lock off

- [ ] Test Scenario 4: Client Inquiry Routing
   - [ ] Client views managed talent profile
   - [ ] "Contact Agency" button shown (not "Contact Talent")
   - [ ] Inquiry routed to agency inbox
   - [ ] Agency inbox shows all inquiries
   - [ ] Agency can reply on behalf of talent

- [ ] Test Scenario 5: Subdomain Access Control
   - [ ] Agency tries talent.orlandmanagement.com
   - [ ] 3-second block screen shown
   - [ ] Redirects to agency.orlandmanagement.com
   - [ ] Same for client.* and admin.*

### Phase 4: Production Hardening (Week 4)

- [ ] Add Sentry logging for impersonation events
- [ ] Enable audit log encryption
- [ ] Set up monitoring dashboards
- [ ] Create runbooks for support team
- [ ] Train customer success on agency features
- [ ] Document known limitations & edge cases
- [ ] Security audit by external firm
- [ ] Load testing: 1000 concurrent agencies

---

## 9. QUICK REFERENCE

### API Endpoints

```
ROSTER MANAGEMENT:
GET     /agency/roster                          List all managed talents
POST    /agency/talent/create                   Create new managed talent
GET     /agency/talent/:talentId                Get talent details
PUT     /agency/talent/:talentId                Update talent profile

IMPERSONATION:
POST    /agency/impersonate-talent              Request 5-min "view as" token
POST    /agency/clear-impersonation             End impersonation early
GET     /agency/impersonation-audit             View impersonation log

CLIENT ROUTING:
GET     /agency/talent/:talentId/contact-info   Client: route to agency or talent
POST    /agency/inbox/:inquiryId/reply          Agency: reply to inquiry
POST    /agency/inbox/:inquiryId/forward-to-talent   Forward to talent

AUTHENTICATION:
POST    /auth/register-agency                   Agency signup
POST    /auth/login-agency                      Agency login
POST    /auth/validate-session                  Validate agency session
```

### Frontend Routes

```
/dashboard                      Agency roster overview
/talent/:talentId              Talent detail (or impersonate)
/talent/:talentId/portfolio    Configure portfolio  
/talent/:talentId/settings     Configure access/locks
/inbox                         Client inquiry inbox
/inbox/:inquiryId             View specific inquiry
/analytics                     Agency performance
/settings/account              Account management
/settings/kbc                  KYC/KBB information
```

### Error Codes

```
400 Bad Request              Missing/invalid parameters
401 Unauthorized             No session or impersonation token expired
403 Forbidden                Talent not managed by agency
404 Not Found                Talent/inquiry/session not found
429 Too Many Requests        Rate limit exceeded (impersonation)
500 Internal Server Error    Database/system error
```

---

## 10. SECURITY NOTES

1. **Impersonation tokens are time-limited**: 5 minutes only. After expiry, agency must request new token.

2. **Tokens stored as hashes**: Database breach does NOT expose working tokens.

3. **One token per agency**: Only 1 active impersonation session per agency at a time.

4. **Audit trail mandatory**: Every impersonation logged with timestamp, IP, user-agent.

5. **Talent cannot delegate**: Managed talents cannot create sub-accounts or agency relationships.

6. **Commission-locked**: Agency cannot modify payment splits after fact (forensic integrity).

7. **Client communications archived**: All agency-routed inquiries permanently logged.

8. **Subdomain isolation enforced**: Roles cannot cross-pollinate. Agency blocked from talent/client/admin.

---

## 11. KNOWN LIMITATIONS & FUTURE WORK

### Current Limitations (v1.0)

- [ ] No 2FA for agency accounts (recommended for Phase 2)
- [ ] No mobile app for agency roster management
- [ ] No batch import of talents (CSV upload)
- [ ] No talent performance analytics for agencies
- [ ] No autonomous rate adjustment based on market data

### Phase 2 Enhancements

- [ ] Implement 2FA with TOTP for agency accounts
- [ ] Add talent performance analytics + market insights
- [ ] CSV bulk import for talent onboarding
- [ ] Advanced portfolio lock rules (by category, by client tier)
- [ ] Talent contract management (terms, commission, duration)
- [ ] Payment split automation (invoice generation)
- [ ] Dispute resolution workflow (agency arbitration)

---

## 12. CONTACT & SUPPORT

**Agency Technical Support**: agencies-support@orlandmanagement.com
**Integration Documentation**: https://docs.orlandmanagement.com/agencies
**API Reference**: https://api.orlandmanagement.com/docs/agency-roster
**SLA**: 99.9% uptime, < 2 hour response for critical issues
