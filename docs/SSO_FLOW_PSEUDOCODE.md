// COMPREHENSIVE SSO FLOW - PSEUDO-CODE REFERENCE
// This file shows the complete flow from login to API request

// ========================================
// PART 1: USER REGISTRATION
// ========================================

/**
 * FLOW: User Registration
 * 
 * Frontend: www.orlandmanagement.com/register
 *   ↓
 * 1. User fills form (email, password, role, CAPTCHA)
 * 2. JavaScript validates client-side
 * 3. Render Turnstile widget → User completes CAPTCHA
 * 4. POST /api/auth/register with Turnstile token
 */

async function registerUser() {
  const formData = {
    email: 'john@example.com',
    fullName: 'John Doe',
    password: 'SecurePassword123!',
    role: 'talent', // or 'client', 'admin'
    turnstile_token: '...' // From Turnstile widget
  }

  const response = await fetch('https://www.orlandmanagement.com/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })

  const result = await response.json()
  // result.status === 'ok' → Email sent with activation link
  // User checks email and clicks activation link
}

/**
BACKEND Processing (auth-enhanced.ts):

1. Validate Turnstile:
   - POST to Cloudflare: { secret, response, remoteip }
   - If fails → Return 403 CAPTCHA verification failed

2. Validate Input:
   - Email format
   - Password >= 8 characters
   - Role in ['talent', 'client', 'admin']

3. Check if email exists:
   - SELECT COUNT(*) FROM users WHERE email = ?
   - If exists → Return 409 Email already registered

4. Hash password with PBKDF2:
   - Generate random 32-byte salt
   - hash = PBKDF2(password + HASH_PEPPER, salt, 100000, SHA256)
   - Store: { password_hash, password_salt }

5. Create user:
   - INSERT INTO users (id, email, password_hash, password_salt, role, status='pending', ...)
   - Generate activation token
   - INSERT INTO otp_requests (code, purpose='activation', expires_at=now+24h)

6. Send email:
   - Use Resend or MailChannels
   - Link: https://www.orlandmanagement.com/?activation_token={token}
   - User clicks link → Frontend calls /verify-activation
*/

// ========================================
// PART 2: USER LOGIN (PASSWORD)
// ========================================

/**
 * FLOW: Password Login
 * 
 * Frontend: www.orlandmanagement.com/login
 *   ↓
 * 1. User enters email + password + solves CAPTCHA
 * 2. POST /api/auth/login-password
 * 3. Backend validates CAPTCHA + rate limit + password
 * 4. On success: Set cookies + redirect to dashboard
 */

async function loginWithPassword() {
  const credentials = {
    identifier: 'john@example.com', // Can be email or phone
    password: 'SecurePassword123!',
    turnstile_token: '...' // From Turnstile widget
  }

  const response = await fetch('https://www.orlandmanagement.com/api/auth/login-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include' // Required for cookies
  })

  const result = await response.json()
  
  if (result.status === 'ok') {
    // Cookies automatically set by backend:
    // - sid: {sessionId} (HttpOnly, Secure, Domain=.orlandmanagement.com)
    // - loginToken: {jwt} (HttpOnly, Secure, Domain=.orlandmanagement.com)
    
    // Redirect to appropriate dashboard
    window.location.href = result.redirect_url // talent/client/admin
  } else if (result.status === 'error') {
    // Possible errors:
    // - "Invalid credentials" (wrong password)
    // - "Too many login attempts. Try again in X minutes." (rate limited)
    // - "Account locked due to multiple failed attempts..." (locked out 30 min)
    // - "CAPTCHA verification failed"
    showError(result.message)
  }
}

/**
BACKEND Processing (auth-enhanced.ts, /login-password):

1. Extract IP + User-Agent:
   - ip = cf-connecting-ip header
   - ua = user-agent header

2. Validate Turnstile (prevents bot attacks):
   - verifyTurnstile(token, ip, TURNSTILE_SECRET)
   - If fails → Return 403

3. Validate input:
   - email/phone + password present
   - password.length >= 8

4. Normalize identifier:
   - identifier = identifier.toLowerCase().trim()

5. Rate limit check (first defense):
   - SELECT COUNT(*) FROM login_attempts 
     WHERE (identifier = ? OR ip = ?) 
     AND attempted_at > now - 15min 
     AND success = 0
   - If count >= 5 → Return 429 "Too many attempts. Retry in X min"
   - Calculate remainingAttempts for UI

6. Fetch user:
   - SELECT * FROM users WHERE (email = ? OR phone = ?)
   - If not found → Record failed attempt → Return 401 "Invalid credentials"

7. Check account lock:
   - SELECT * FROM account_lockouts WHERE user_id = ? AND unlocks_at > now
   - If locked → Return 423 "Account locked for X minutes"

8. Check account status:
   - If status = 'pending' → Return 403 "Not activated"
   - If status = 'deleted' → Return 401 "Invalid credentials" (don't leak)

9. Verify password (PBKDF2):
   - Retrieve: stored_hash, stored_salt from users table
   - is_valid = verifyPasswordPBKDF2(password, stored_hash, stored_salt, PEPPER)
   - If false:
     → Record failed attempt
     → Check if should lock (count >= 5 after this attempt)
     → If yes: INSERT INTO account_lockouts (unlock time = now + 30min)
     → Return 401 "Invalid credentials"

10. Success - create session:
    - Generate sessionId = UUID()
    - INSERT INTO sessions (session_id, user_id, role, ip, ua, expires_at=now+12h)
    - Record success: INSERT INTO login_attempts (user_id, success=true)
    - Generate JWT: sign({ sub: user_id, role, sid: sessionId, exp: now+15min })
    - Set cookies (via Set-Cookie header)
    - Return 200 { status: 'ok', redirect_url, user, token }
*/

// ========================================
// PART 3: ACCESSING SUBDOMAIN DASHBOARD
// ========================================

/**
 * FLOW: Subdomain Access & Role Validation
 * 
 * User redirected to: tunnel@talent.orlandmanagement.com
 * (Browser automatically includes sid + loginToken cookies)
 *   ↓
 * 1. Frontend React app mounts
 * 2. AuthProvider component (authMiddleware.tsx) calls /api/auth/me
 * 3. Backend validates session + returns user info
 * 4. Frontend checks if user.role matches subdomain
 * 5a. If match → Render dashboard
 * 5b. If mismatch → Show 3-sec block screen → Redirect
 */

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Client dashboard - only for role='client' */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="client">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Talent dashboard - only for role='talent' */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="talent">
              <TalentDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

/**
ProtectedRoute Flow:

1. User renders <ProtectedRoute requiredRole="client">
2. AuthProvider useEffect calls checkAuth():
   - fetch(/api/auth/me, { credentials: 'include' })
   - Browser sends: Cookie: sid=...; loginToken=...;
   
3. Backend /api/auth/me processes:
   - Extract sessionId from Cookie
   - SELECT * FROM sessions WHERE session_id = ? AND expires_at > now
   - If not found → Return 401 (no error, triggers redirect)
   - SELECT * FROM users WHERE id = session.user_id
   - Return { status: 'ok', user: { id, email, role } }

4. Frontend compares:
   - currentUser.role vs requiredRole
   - If mismatch:
     → setShowBlockScreen(true)
     → Render AccessDeniedBlock component
     → 3 second countdown
     → onRedirect() → window.location.href = correctUrl
   - If match:
     → Render protected component
     → Set localStorage cache for 1 hour
*/

// ========================================
// PART 4: API CALL WITH AUTHENTICATION
// ========================================

/**
 * FLOW: Business API Request with Session
 * 
 * Frontend: talent.orlandmanagement.com/dashboard
 * User clicks "Fetch my bookings"
 *   ↓
 * fetch('https://api.orlandmanagement.com/api/talent/bookings',
 *   { credentials: 'include' }
 * )
 *   ↓
 * Browser sends: Authorization: Bearer {jwt}
 *   or
 * Cookie: sid={sessionId};
 *   ↓
 * Business API middleware processes request
 */

async function getMyBookings() {
  const response = await fetch('https://api.orlandmanagement.com/api/talent/bookings', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storedToken}` // OR use cookies
    },
    credentials: 'include' // Send cookies
  })

  if (response.status === 401) {
    // Token expired or invalid
    // Trigger logout + redirect to login
    handleLogout()
  } else if (response.status === 403) {
    // Not authorized for this resource
    // Show error
  } else if (response.ok) {
    const data = await response.json()
    setBookings(data)
  }
}

/**
BUSINESS API Middleware (sessionValidation.ts):

1. authMiddleware intercepts request:
   token = extract from Authorization header OR cookies
   if (!token) → Return 401 "No token"

2. Check session cache (5-minute TTL):
   cachedSession = sessionCache.get(token)
   if (cachedSession exists) {
     → Skip step 4
     → Go to step 5
   }

3. Cache miss - validate with SSO:
   POST https://www.orlandmanagement.com/api/auth/validate-session
   body: { token }
   
   SSO responds:
   {
     valid: true,
     user: { id, email, role, status },
     session: { id, expires_at }
   }

4. Cache result (5 min):
   sessionCache.set(token, {
     userId: user.id,
     userEmail: user.email,
     userRole: user.role,
     expiresAt: session.expires_at
   })

5. Validate session not expired:
   now = current timestamp
   if (now > cachedSession.expiresAt) {
     sessionCache.invalidate(token)
     Return 401 "Session expired"
   }

6. Attach user to request context:
   c.user = {
     id: cachedSession.userId,
     email: cachedSession.userEmail,
     role: cachedSession.userRole
   }

7. RBAC check (if required):
   if (requiredRole && !requiredRole.includes(user.role)) {
     Return 403 "Access denied"
   }

8. Proceed to route handler:
   const bookings = await getBookingsByTalentId(c.user.id)
   return c.json({ bookings })
*/

// ========================================
// PART 5: LOGOUT
// ========================================

/**
 * FLOW: Logout
 * 
 * User clicks "Logout" button
 *   ↓
 * 1. Frontend calls LogoutButton component
 * 2. logout() function executes:
 *    - POST /api/auth/logout
 *    - Clear localStorage
 *    - Redirect to main site
 */

async function logout() {
  // Call SSO logout endpoint
  await fetch('https://www.orlandmanagement.com/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  })

  // Clear local cache
  localStorage.removeItem('cachedUser')
  localStorage.removeItem('authTime')

  // Clear API cache (if using Axios)
  queryClient.clear()

  // Redirect to home
  window.location.href = 'https://www.orlandmanagement.com/'
}

/**
BACKEND Processing (auth-enhanced.ts, /logout):

1. Extract session cookie:
   sessionId = getCookie('sid')

2. Delete session from database:
   DELETE FROM sessions WHERE session_id = ?

3. Cache invalidation:
   sessionCache.invalidate(sessionId)

4. Clear cookies (Set-Cookie with Max-Age=0):
   deleteCookie('sid', { Domain: .orlandmanagement.com, ... })
   deleteCookie('loginToken', { Domain: .orlandmanagement.com, ... })

5. Return success:
   { status: 'ok', message: 'Logout successful' }
*/

// ========================================
// PART 6: SECURITY - BRUTE FORCE PROTECTION
// ========================================

/**
 * SCENARIO: Attacker tries to brute force password
 * 
 * Time: 0:00 - User john@example.com
 * Attempt 1: Wrong password → Recorded, remaining: 4
 * Attempt 2: Wrong password → Recorded, remaining: 3
 * Attempt 3: Wrong password → Recorded, remaining: 2
 * Attempt 4: Wrong password → Recorded, remaining: 1
 * Attempt 5: Wrong password → Recorded, remaining: 0
 * 
 * Time: 0:01
 * Attempt 6: Backend checks rate limit
 *   → SELECT COUNT(*) FROM login_attempts
 *     WHERE identifier = 'john@example.com'
 *     AND attempted_at > now - 15min
 *     AND success = 0
 *   → Returns 5
 *   → Compares: 5 >= MAX_ATTEMPTS (5) → YES
 *   → Returns 429 "Too many attempts. Try again in 15 minutes"
 */

// Attacker response:
// Error 429: Retry-After: 854 seconds

/**
 * After 5 failed attempts in 15 minutes:
 * 
 * 1. Account gets locked for 30 min:
 *    INSERT INTO account_lockouts
 *    (user_id, reason, locked_at, unlocks_at)
 *    VALUES (?, 'Brute-force protection', now, now + 30min)
 *
 * 2. Any login attempt during lockout:
 *    → Check account_lockouts table
 *    → If unlocks_at > now → Return 423 "Account locked"
 *
 * 3. After 30 minutes:
 *    → Automatic unlock (query checks expiry)
 *    → User can try again
 *
 * 4. Admin can manually unlock:
 *    DELETE FROM account_lockouts WHERE user_id = ?
 */

// ========================================
// PART 7: CACHING STRATEGY
// ========================================

/**
 * SESSION CACHE IMPACT ON SSO DATABASE
 * 
 * Without cache:
 * - Every API call hits /validate-session endpoint
 * - Endpoint queries DB for sessions + users table
 * - With 1000 requests/sec → 1000 DB queries/sec
 * - Database becomes bottleneck
 *
 * With 5-minute cache:
 * - First request: DB hit
 * - Next 299 requests (5 min): Cache hit (no DB)
 * - 300th request: DB hit (cache expired)
 * - Average: 1 DB hit per 300 requests
 * - Efficiency: 99.67% cache hit rate
 * - Database load: 0.33% of original
 *
 * Cache invalidation:
 * - On logout: sessionCache.invalidate(token)
 * - On admin unlock: sessionCache.invalidate(token)
 * - Automatic: 300 seconds = 5 minutes
 * - Cleanup: Every 10 minutes
 */

// ========================================
// SUMMARY: COMPLETE REQUEST PIPELINE
// ========================================

/*
REQUEST STACK (Talent viewing dashboard):

1. Frontend Call:
   GET /dashboard
   Cookie: sid=abc123; (auto-sent by browser)

2. Frontend Router:
   <ProtectedRoute requiredRole="talent">
   Calls: checkAuth()
   → fetch(/api/auth/me, { credentials: 'include' })

3. SSO Backend (/auth/me):
   - Extract cookie: sid = 'abc123'
   - Query: SELECT * FROM sessions WHERE session_id = ? AND expires_at > now
   - Query: SELECT id, email, role FROM users WHERE id = ?
   - Return: { user: { role: 'talent' } }

4. Frontend Validation:
   - user.role ('talent') === requiredRole ('talent') ✓
   - Render dashboard

5. API Call:
   GET /api/talent/bookings
   Authorization: Bearer {token}

6. API Middleware (authMiddleware):
   - Extract token
   - Check cache: HIT in 5 min cache
   - User attached to context

7. Route Handler:
   - Query bookings for user.id
   - Return JSON response

RESULT: Dashboard loads in ~200ms with <2 DB hits across all layers
*/
