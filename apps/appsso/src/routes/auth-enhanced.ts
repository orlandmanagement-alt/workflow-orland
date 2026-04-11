// Enhanced Auth Routes with PBKDF2, Rate Limiting & Brute-Force Protection
// File: apps/appsso/src/routes/auth-enhanced.ts

import { Hono, Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

import {
  hashPasswordPBKDF2,
  verifyPasswordPBKDF2,
  generateUUID,
  generateOTP,
  generatePIN,
} from '../utils/crypto'
import {
  isAccountLocked,
  recordLoginAttempt,
  checkRateLimit,
  lockAccount,
  unlockAccount,
  validateSessionContext,
} from '../utils/security'
import { verifyTurnstile, sendMail } from '../utils'

type Bindings = {
  DB_SSO: D1Database
  TURNSTILE_SECRET: string
  HASH_PEPPER: string
  JWT_SECRET: string
  PBKDF2_ITER?: number
  SESSION_TTL?: number
  RESEND_API_KEY?: string
  TALENT_URL?: string
  CLIENT_URL?: string
  ADMIN_URL?: string
  REDIS_URL?: string
}

const COOKIE_OPTS = {
  domain: '.orlandmanagement.com',
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'Lax' as const,
}

const SESSION_EXPIRY = 43200 // 12 hours
const JWT_EXPIRY = 900 // 15 minutes

const getNow = () => Math.floor(Date.now() / 1000)
const getClientIp = (c: Context): string => c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'

const auth = new Hono<{ Bindings: Bindings }>()

/**
 * Helper: Get current user from session
 */
async function getCurrentUser(c: Context<{ Bindings: Bindings }>) {
  const sid = getCookie(c, 'sid')
  if (!sid) return null

  const session = await c.env.DB_SSO.prepare(
    'SELECT * FROM sessions WHERE session_id = ? AND expires_at > ? LIMIT 1'
  )
    .bind(sid, getNow())
    .first<any>()

  if (!session) return null

  const user = await c.env.DB_SSO.prepare(
    'SELECT id, email, full_name, role, status FROM users WHERE id = ?'
  )
    .bind(session.user_id)
    .first<any>()

  return { user, session }
}

/**
 * Helper: Create session and set cookies
 */
async function createSession(
  c: Context<{ Bindings: Bindings }>,
  userId: string,
  role: string,
  ipAddress: string,
  userAgent: string
) {
  const now = getNow()
  const sessionId = generateUUID()
  const expiresAt = now + SESSION_EXPIRY

  // Insert session into database
  await c.env.DB_SSO.prepare(
    `INSERT INTO sessions (session_id, user_id, role, ip_address, user_agent, created_at, expires_at, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
  )
    .bind(sessionId, userId, role, ipAddress, userAgent, now, expiresAt)
    .run()

  // Create JWT token
  const payload = {
    sub: userId,
    role: role,
    sid: sessionId,
    exp: now + JWT_EXPIRY,
    iat: now,
  }

  const jwt = await signJWT(payload, c.env.JWT_SECRET)

  // Set cookies
  setCookie(c, 'sid', sessionId, { ...COOKIE_OPTS, maxAge: SESSION_EXPIRY })
  setCookie(c, 'loginToken', jwt, { ...COOKIE_OPTS, maxAge: JWT_EXPIRY })

  return { sessionId, jwt, expiresAt }
}

/**
 * Simple JWT signing (in production, use a proper JWT library)
 */
async function signJWT(payload: Record<string, any>, secret: string): Promise<string> {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')

  const encoder = new TextEncoder()
  const signatureData = encoder.encode(`${header}.${body}${secret}`)
  const sig = await crypto.subtle.digest('SHA-256', signatureData)
  const signature = Buffer.from(sig).toString('base64url')

  return `${header}.${body}.${signature}`
}

/**
 * ========================================
 * AUTHENTICATION ENDPOINTS
 * ========================================
 */

/**
 * POST /api/auth/register
 * Register new user account
 */
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json<any>()
    const ipAddress = getClientIp(c)
    const userAgent = c.req.header('user-agent') || 'unknown'
    const now = getNow()

    // Validate Turnstile
    const isHuman = await verifyTurnstile(body.turnstile_token, ipAddress, c.env.TURNSTILE_SECRET)
    if (!isHuman) {
      return c.json(
        { status: 'error', message: 'CAPTCHA verification failed' },
        { status: 403 }
      )
    }

    // Validate input
    if (!body.email || !body.password || !body.role) {
      return c.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (body.password.length < 8) {
      return c.json(
        { status: 'error', message: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const email = body.email.toLowerCase().trim()

    // Check if user already exists
    const existing = await c.env.DB_SSO.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first<any>()

    if (existing) {
      return c.json(
        { status: 'error', message: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password with PBKDF2
    const { salt, hash } = await hashPasswordPBKDF2(body.password, c.env.HASH_PEPPER)

    // Create user
    const userId = generateUUID()
    const activationToken = generateOTP()

    await c.env.DB_SSO.prepare(
      `INSERT INTO users (
        id, email, full_name, role, status,
        password_hash, password_salt,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)`
    )
      .bind(userId, email, body.fullName || 'User', body.role, hash, salt, now, now)
      .run()

    // Create activation token
    const tokenId = generateUUID()
    await c.env.DB_SSO.prepare(
      `INSERT INTO otp_requests (id, identifier, code, purpose, expires_at)
       VALUES (?, ?, ?, 'activation', ?)`
    )
      .bind(tokenId, email, activationToken, now + 86400) // 24 hours
      .run()

    // Send activation email
    await sendMail(c.env, email, activationToken, 'activation')

    return c.json({
      status: 'ok',
      message: 'Registration successful. Check your email for activation link.',
      user_id: userId,
    })
  } catch (error) {
    console.error('Register error:', error)
    return c.json(
      { status: 'error', message: 'Registration failed' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/auth/login-password
 * Login with email/phone + password
 * Implements: Rate limiting, Brute-force protection, PBKDF2 verification
 */
auth.post('/login-password', async (c) => {
  try {
    const body = await c.req.json<any>()
    const ipAddress = getClientIp(c)
    const userAgent = c.req.header('user-agent') || 'unknown'
    const now = getNow()

    // Step 1: Validate Turnstile (prevents automated attacks)
    const isHuman = await verifyTurnstile(body.turnstile_token, ipAddress, c.env.TURNSTILE_SECRET)
    if (!isHuman) {
      return c.json(
        { status: 'error', message: 'CAPTCHA verification failed. Please try again.' },
        { status: 403 }
      )
    }

    // Step 2: Validate input
    if (!body.identifier || !body.password) {
      return c.json(
        { status: 'error', message: 'Email/Phone and password required' },
        { status: 400 }
      )
    }

    const identifier = body.identifier.toLowerCase().trim()

    // Step 3: Rate limit check (prevent brute force)
    const rateLimit = await checkRateLimit(c.env.DB_SSO, identifier, ipAddress, now)
    if (rateLimit.shouldBlock) {
      const remainingTime = Math.ceil((rateLimit.resetAt! - now) / 60)
      return c.json(
        {
          status: 'error',
          message: `Too many login attempts. Try again in ${remainingTime} minutes.`,
          retry_after: remainingTime * 60,
        },
        { status: 429 }
      )
    }

    // Step 4: Fetch user
    const user = await c.env.DB_SSO.prepare(
      'SELECT * FROM users WHERE (email = ? OR phone = ?) AND status != "deleted"'
    )
      .bind(identifier, identifier)
      .first<any>()

    if (!user) {
      // Record failed attempt
      await recordLoginAttempt(c.env.DB_SSO, identifier, ipAddress, false)

      // Generic error message (don't reveal if user exists)
      return c.json(
        { status: 'error', message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Step 5: Check if account is locked
    const lockStatus = await isAccountLocked(c.env.DB_SSO, user.id, now)
    if (lockStatus.locked) {
      const remainingTime = Math.ceil((lockStatus.unlocksAt! - now) / 60)
      return c.json(
        {
          status: 'error',
          message: `Account locked due to multiple failed login attempts. Try again in ${remainingTime} minutes.`,
          retry_after: remainingTime * 60,
        },
        { status: 423 }
      )
    }

    // Step 6: Check if account is pending activation
    if (user.status === 'pending') {
      return c.json(
        { status: 'error', message: 'Account not activated. Check your email for activation link.' },
        { status: 403 }
      )
    }

    // Step 7: Verify password (PBKDF2)
    const passwordValid = await verifyPasswordPBKDF2(
      body.password,
      user.password_hash,
      user.password_salt,
      c.env.HASH_PEPPER
    )

    if (!passwordValid) {
      // Record failed attempt
      await recordLoginAttempt(c.env.DB_SSO, identifier, ipAddress, false, user.id)

      // Check if should lock account now
      const updatedRateLimit = await checkRateLimit(c.env.DB_SSO, identifier, ipAddress, now)
      if (updatedRateLimit.shouldBlock) {
        // Lock account
        await lockAccount(c.env.DB_SSO, user.id, now, 'Brute-force protection: too many failed login attempts')
      }

      return c.json(
        { status: 'error', message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Step 8: Password valid - create session
    await recordLoginAttempt(c.env.DB_SSO, identifier, ipAddress, true, user.id)

    // Reset failed attempts counter
    await c.env.DB_SSO.prepare(
      'UPDATE users SET last_login = ?, last_login_ip = ? WHERE id = ?'
    )
      .bind(now, ipAddress, user.id)
      .run()

    const { sessionId, jwt } = await createSession(c, user.id, user.role, ipAddress, userAgent)

    // Determine redirect URL based on role
    const roleUrl = {
      talent: c.env.TALENT_URL,
      client: c.env.CLIENT_URL,
      admin: c.env.ADMIN_URL,
      super_admin: c.env.ADMIN_URL,
    }[user.role] || c.env.TALENT_URL

    return c.json({
      status: 'ok',
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
      },
      session_id: sessionId,
      token: jwt,
      redirect_url: roleUrl,
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json(
      { status: 'error', message: 'Login failed' },
      { status: 500 }
    )
  }
})

/**
 * GET /api/auth/me
 * Get current logged-in user (with session validation)
 */
auth.get('/me', async (c) => {
  try {
    const currentUser = await getCurrentUser(c)
    if (!currentUser) {
      return c.json(
        { status: 'error', message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const ipAddress = getClientIp(c)
    const userAgent = c.req.header('user-agent') || 'unknown'

    // Validate session context (IP + User-Agent)
    const validation = await validateSessionContext(
      c.env.DB_SSO,
      currentUser.session.session_id,
      ipAddress,
      userAgent,
      'moderate' // Use moderate tolerance for UX
    )

    if (!validation.valid) {
      // Invalidate session
      deleteCookie(c, 'sid', COOKIE_OPTS)
      deleteCookie(c, 'loginToken', COOKIE_OPTS)

      return c.json(
        { status: 'error', message: validation.reason || 'Session invalid' },
        { status: 401 }
      )
    }

    return c.json({
      status: 'ok',
      user: currentUser.user,
    })
  } catch (error) {
    console.error('Get me error:', error)
    return c.json(
      { status: 'error', message: 'Failed to fetch user' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/auth/logout
 * Logout and invalidate session
 */
auth.post('/logout', async (c) => {
  const sid = getCookie(c, 'sid')

  if (sid) {
    // Delete session from DB
    await c.env.DB_SSO.prepare('DELETE FROM sessions WHERE session_id = ?')
      .bind(sid)
      .run()
  }

  // Clear cookies
  deleteCookie(c, 'sid', COOKIE_OPTS)
  deleteCookie(c, 'loginToken', COOKIE_OPTS)

  return c.json({
    status: 'ok',
    message: 'Logout successful',
  })
})

/**
 * POST /api/auth/validate-session
 * Validate session without requiring authentication
 * Used by Business API middleware to check tokens
 */
auth.post('/validate-session', async (c) => {
  try {
    const body = await c.req.json<any>()
    const token = body.token || getCookie(c, 'sid')

    if (!token) {
      return c.json({ valid: false, message: 'No token provided' })
    }

    const session = await c.env.DB_SSO.prepare(
      'SELECT * FROM sessions WHERE session_id = ? AND expires_at > ?'
    )
      .bind(token, getNow())
      .first<any>()

    if (!session) {
      return c.json({ valid: false, message: 'Session expired or invalid' })
    }

    const user = await c.env.DB_SSO.prepare(
      'SELECT id, email, role, status FROM users WHERE id = ?'
    )
      .bind(session.user_id)
      .first<any>()

    if (!user || user.status === 'deleted') {
      return c.json({ valid: false, message: 'User not found' })
    }

    return c.json({
      valid: true,
      user: user,
      session: {
        id: session.session_id,
        expires_at: session.expires_at,
      },
    })
  } catch (error) {
    return c.json({ valid: false, message: 'Validation error' })
  }
})

export default auth
