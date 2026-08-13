// API Middleware for Business API (Token Validation + Caching)
// File: apps/appapi/src/middleware/sessionValidation.ts

import { Context, Next } from 'hono'

interface AuthContext {
  user?: {
    id: string
    email: string
    role: 'talent' | 'client' | 'agency' | 'admin' | 'super_admin'
  }
  sessionId?: string
  isValid?: boolean
}

interface CachedSession {
  userId: string
  userEmail: string
  userRole: string
  expiresAt: number
  validatedAt: number
}

/**
 * In-Memory Cache for Sessions
 * WARNING: In production, use Redis instead of in-memory cache
 */
class SessionCache {
  private cache: Map<string, CachedSession> = new Map()
  private maxAge = 300 // 5 minutes cache validity
  private cleanupInterval: NodeJS.Timer | null = null

  constructor() {
    // Clean up expired entries every 10 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 600000)
  }

  get(sessionId: string): CachedSession | null {
    const entry = this.cache.get(sessionId)
    if (!entry) return null

    // Check if cache entry is still valid
    const now = Date.now() / 1000
    if (now - entry.validatedAt > this.maxAge) {
      this.cache.delete(sessionId)
      return null
    }

    return entry
  }

  set(sessionId: string, data: Omit<CachedSession, 'validatedAt'>): void {
    this.cache.set(sessionId, {
      ...data,
      validatedAt: Date.now() / 1000,
    })
  }

  invalidate(sessionId: string): void {
    this.cache.delete(sessionId)
  }

  cleanup(): void {
    const now = Date.now() / 1000
    for (const [sessionId, entry] of this.cache.entries()) {
      if (now - entry.validatedAt > this.maxAge) {
        this.cache.delete(sessionId)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

// Global session cache instance
export const sessionCache = new SessionCache()

/**
 * Extract JWT Token from Authorization header or Cookie
 */
function extractToken(c: Context): string | null {
  // Try Authorization header first
  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Try cookies
  const cookies = c.req.header('Cookie')
  if (cookies) {
    const match = cookies.match(/(?:^|;\s*)sid=([^;]+)/)
    if (match) return match[1]
  }

  return null
}

/**
 * Validate JWT Token (Basic validation without signing verification)
 * In production, verify signature using JWT_SECRET
 */
function validateJWT(token: string): { valid: boolean; payload?: any } {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false }
    }

    // Decode payload (no signature verification in this simple version)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    )

    const now = Math.floor(Date.now() / 1000)

    // Check expiration
    if (payload.exp && payload.exp < now) {
      return { valid: false }
    }

    return { valid: true, payload }
  } catch (err) {
    return { valid: false }
  }
}

/**
 * Helper: Fetch and validate session from SSO service
 * This is called when cache miss occurs
 */
async function validateSessionWithSSO(
  c: Context,
  token: string,
  ssoServiceUrl: string
): Promise<CachedSession | null> {
  try {
    const response = await fetch(`${ssoServiceUrl}/validate-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (!data.valid || !data.user) {
      return null
    }

    return {
      userId: data.user.id,
      userEmail: data.user.email,
      userRole: data.user.role,
      expiresAt: data.session.expires_at,
      validatedAt: Math.floor(Date.now() / 1000),
    }
  } catch (error) {
    console.error('SSO validation error:', error)
    return null
  }
}

/**
 * Main Auth Middleware
 * Usage: app.use('/api/*', authMiddleware)
 */
export async function authMiddleware(c: Context, next: Next) {
  const token = extractToken(c)

  if (!token) {
    return c.json(
      { status: 'error', message: 'No authentication token provided' },
      { status: 401 }
    )
  }

  // Step 1: Check cache first (fast path)
  let cachedSession = sessionCache.get(token)

  if (!cachedSession) {
    // Step 2: Cache miss - validate with SSO service
    const ssoUrl = (c.env as any)?.SSO_SERVICE_URL || 'https://www.orlandmanagement.com/api/auth'
    cachedSession = await validateSessionWithSSO(c, token, ssoUrl)

    if (!cachedSession) {
      return c.json(
        { status: 'error', message: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Cache the validated session
    sessionCache.set(token, {
      userId: cachedSession.userId,
      userEmail: cachedSession.userEmail,
      userRole: cachedSession.userRole,
      expiresAt: cachedSession.expiresAt,
    })
  } else {
    // Step 3: Check if session is still globally valid (on SSO side)
    const now = Math.floor(Date.now() / 1000)
    if (cachedSession.expiresAt < now) {
      sessionCache.invalidate(token)
      return c.json(
        { status: 'error', message: 'Session expired' },
        { status: 401 }
      )
    }
  }

  // Step 4: Attach user to context
  ;(c as any).user = {
    id: cachedSession.userId,
    email: cachedSession.userEmail,
    role: cachedSession.userRole,
  }
  ;(c as any).sessionId = token

  // Proceed to next middleware/handler
  return next()
}

/**
 * Role-Based Access Control Middleware
 * Usage: app.use('/api/admin/*', rbacMiddleware(['admin', 'super_admin']))
 */
export function rbacMiddleware(allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = (c as any).user

    if (!user) {
      return c.json(
        { status: 'error', message: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          status: 'error',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        },
        { status: 403 }
      )
    }

    return next()
  }
}

/**
 * Session Hijacking Detection Middleware (Optional)
 * Validates IP address consistency
 */
export function antiHijackMiddleware(c: Context, next: Next) {
  const clientIp =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for') ||
    'unknown'

  // Store current IP in context for later comparison
  ;(c as any).clientIp = clientIp

  // In a real scenario, you could compare this with the IP stored in the session
  // and invalidate if there's a drastic change
  // For now, just pass it through

  return next()
}

/**
 * Rate Limiting Middleware
 * Prevents abuse of API endpoints
 */
export function rateLimitMiddleware(maxRequests: number = 100, windowSeconds: number = 60) {
  const requests = new Map<string, number[]>()

  return (c: Context, next: Next) => {
    const user = (c as any).user
    if (!user) return next()

    const key = user.id
    const now = Date.now()
    const window = now - windowSeconds * 1000

    // Get request timestamps for this user
    let timestamps = requests.get(key) || []
    timestamps = timestamps.filter(t => t > window)

    if (timestamps.length >= maxRequests) {
      return c.json(
        { status: 'error', message: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    timestamps.push(now)
    requests.set(key, timestamps)

    return next()
  }
}

/**
 * Error Handling Middleware
 */
export function errorHandlingMiddleware(c: Context, next: Next) {
  try {
    return next()
  } catch (error) {
    console.error('API Error:', error)
    return c.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Usage Example in Hono API:
 * 
 * import { Hono } from 'hono'
 * import {
 *   authMiddleware,
 *   rbacMiddleware,
 *   antiHijackMiddleware,
 *   rateLimitMiddleware,
 *   errorHandlingMiddleware,
 * } from './middleware/sessionValidation'
 * 
 * const app = new Hono()
 * 
 * // Apply globally
 * app.use('/api/*', errorHandlingMiddleware)
 * app.use('/api/*', antiHijackMiddleware)
 * app.use('/api/*', authMiddleware)
 * app.use('/api/*', rateLimitMiddleware(100, 60))
 * 
 * // Public route
 * app.get('/health', (c) => c.json({ status: 'ok' }))
 * 
 * // Protected route (any authenticated user)
 * app.get('/api/profile', (c) => {
 *   const user = (c as any).user
 *   return c.json({ user })
 * })
 * 
 * // Admin-only route
 * app.use('/api/admin/*', rbacMiddleware(['admin', 'super_admin']))
 * app.get('/api/admin/users', (c) => {
 *   return c.json({ users: [...] })
 * })
 * 
 * // Talent-only route
 * app.use('/api/talent/*', rbacMiddleware(['talent']))
 * app.get('/api/talent/earnings', (c) => {
 *   const user = (c as any).user
 *   return c.json({ earnings: [...] })
 * })
 */
