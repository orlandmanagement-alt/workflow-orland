# Orland Management - Enterprise SSO Architecture
**Enterprise-Grade Single Sign-On with RBAC & Anti-Brute-Force**

---

## 1. INFRASTRUCTURE & DOMAIN MAPPING

```
┌─────────────────────────────────────────────────────────────────┐
│                    CROSS-DOMAIN SSO FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User Login → www.orlandmanagement.com (Form)                   │
│         ↓                                                         │
│  SSO Backend (Hono + D1_SSO) validates & creates session        │
│         ↓                                                         │
│  Set-Cookie: sid, loginToken                                    │
│   - Domain: .orlandmanagement.com                                │
│   - Path: /                                                      │
│   - HttpOnly, Secure, SameSite=Lax                              │
│         ↓                                                         │
│  Frontend redirects to:                                          │
│   - talent.orlandmanagement.com (Role=Talent)                   │
│   - client.orlandmanagement.com (Role=Client)                   │
│   - admin.orlandmanagement.com (Role=Admin)                     │
│         ↓                                                         │
│  Each Frontend calls /api/auth/me (SSO Service)                 │
│         ↓                                                         │
│  If role mismatch → Show 3-sec block + redirect                 │
│  If valid → Load dashboard                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. SECURITY LAYERS

### Layer 1: Input Validation & CAPTCHA
- Turnstile CAPTCHA before DB lookup
- Email/Phone format validation
- Password strength (min 8 chars)

### Layer 2: Brute-Force Detection
- Track login attempts per IP + Email
- Max 5 attempts per 15 minutes
- Lock account for 30 minutes if exceeded

### Layer 3: Cryptography
- PBKDF2-SHA256 with 100,000 iterations
- Per-user salt (32 bytes)
- Global HASH_PEPPER from ENV

### Layer 4: Session Management
- Opaque session token (UUID)
- IP + User-Agent validation
- Cross-domain cookies
- 12-hour TTL

### Layer 5: Token Security
- JWT with HS256
- Short-lived (15 min) + Refresh token strategy
- Optional Redis caching for reduced DB hits

---

## 3. COOKIE CONFIGURATION (CRITICAL)

```
Set-Cookie: sid={opaque_token}; 
  Domain=.orlandmanagement.com;
  Path=/;
  HttpOnly;
  Secure;
  SameSite=Lax;
  Max-Age=43200 (12 hours)

Set-Cookie: loginToken={jwt};
  Domain=.orlandmanagement.com;
  Path=/;
  HTTPOnly;
  Secure;
  SameSite=Lax;
  Max-Age=900 (15 minutes)
```

---

## 4. ROLE-BASED ACCESS CONTROL (RBAC) - FRONTEND ENFORCEMENT

```
Talent Role (talent.orlandmanagement.com):
- ✓ View own profile, bookings, earnings
- ✗ DENY access to client.* or admin.*

Client Role (client.orlandmanagement.com):
- ✓ View campaigns, budgets, talent roster
- ✗ DENY access to talent.* or admin.*

Admin Role (admin.orlandmanagement.com):
- ✓ Full system access
- ✓ Can view all subdomains (optional feature)
- ✗ Usually restricted to admin subdomain only

Super Admin: Can impersonate any role
```

---

## 5. DATABASE SCHEMA REVIEW

### Core Tables:
- `users`: user credentials, role, status
- `sessions`: active sessions with IP/User-Agent
- `login_attempts`: track failed attempts
- `account_lockouts`: lockout records
- `otp_requests`: OTP codes (expires after 3 min)
- `password_reset_tokens`: reset tokens (expires after 30 min)

---

## 6. API ENDPOINTS

### SSO Service (`/api/auth/*`)
- `POST /register` - Register new account
- `POST /login-password` - Password login (with Turnstile)
- `POST /login-otp` - OTP login
- `POST /login-pin` - PIN login
- `POST /login-social` - Social login (Google/Facebook)
- `POST /request-otp` - Request OTP code
- `POST /request-reset` - Request password reset
- `POST /reset-password` - Reset password
- `POST /verify-activation` - Activate new account
- `GET /me` - Get current session user
- `POST /logout` - Logout (delete session)
- `POST /check-pin` - Check if PIN is set
- `POST /setup-pin` - Setup PIN security
- `POST /validate-session` - Validate existing session (for API middleware)

---

## 7. FRONTEND MIDDLEWARE FLOW

```
User navigates to talent.orlandmanagement.com
  ↓
Frontend Router intercepted (Next.js/React Router)
  ↓
Check localStorage for cached role OR call /api/auth/me
  ↓
Role Mismatch? (User is Client, but on talent subdomain)
  ├─ YES → Show BlockScreen (3-sec countdown + message)
  │         Then redirect to correct subdomain
  └─ NO → Load dashboard

Logout trigger:
  1. Clear localStorage
  2. Clear cookies (Max-Age=0)
  3. Call /api/auth/logout
  4. Redirect to www.orlandmanagement.com
```

---

## 8. HASHING ALGORITHM DETAILS

```
PBKDF2-SHA256:
- Algorithm: PBKDF2 with SHA-256
- Iterations: 100,000
- Salt: 32 random bytes per user
- Key Length: 32 bytes
- PEPPER: Global from ENV (e.g., ABCD1234...)

Process:
1. Input: password + HASH_PEPPER
2. Generate random salt (32 bytes)
3. hash = PBKDF2(password+PEPPER, salt, 100000 iterations, SHA256)
4. Store: {salt:hash} in database

Verification:
1. Retrieve stored salt
2. Recompute hash using same salt
3. Compare with stored hash (constant-time comparison)
```

---

## 9. ENVIRONMENT VARIABLES CHECKLIST

```
SSO Service (.env.production):
- DB_SSO: D1 database binding
- HASH_PEPPER: "your-global-pepper-string-123"
- PBKDF2_ITER: 100000
- JWT_SECRET: "your-jwt-secret-key"
- JWT_EXPIRY: 900 (seconds = 15 min)
- SESSION_TTL: 43200 (seconds = 12 hours)
- TURNSTILE_SECRET: "your-cloudflare-turnstile-secret"
- COOKIE_DOMAIN: ".orlandmanagement.com"
- TALENT_URL: "https://talent.orlandmanagement.com"
- CLIENT_URL: "https://client.orlandmanagement.com"
- ADMIN_URL: "https://admin.orlandmanagement.com"
- RESEND_API_KEY: "your-resend-email-api-key"
- SSO_SERVICE_URL: "https://www.orlandmanagement.com/api/auth"
- REDIS_URL: "redis://..." (optional, for caching)
```

---

## 10. TESTING & SECURITY CHECKLIST

- [ ] Test rate limiting (attempt 6 logins, should be blocked)
- [ ] Test IP validation (change IP mid-session, should invalidate)
- [ ] Test User-Agent validation (change browser, validate)
- [ ] Test role-based redirect (Client user tries admin page)
- [ ] Test cookie expiry (wait 12 hours, session should expire)
- [ ] Test account lockout (remain locked for 30 min)
- [ ] Test OTP expiry (wait 4 min, OTP should expire)
- [ ] Test password reset token expiry (wait 31 min)
- [ ] Test PBKDF2 password verification with 100k iterations
- [ ] Test TURNSTILE challenge validation
- [ ] Test logout clears all cookies
- [ ] Test social login flow (if implemented)

