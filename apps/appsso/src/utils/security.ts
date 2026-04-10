// Rate Limiting & Account Lockout Service
// File: apps/appsso/src/utils/security.ts

import { sha256 } from './crypto'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 1800 // 30 minutes in seconds
const ATTEMPT_WINDOW = 900 // 15 minutes in seconds

interface LoginAttempt {
  attempt_id: string
  email?: string
  phone?: string
  ip_address: string
  attempted_at: number
  success: boolean
}

interface AccountLockout {
  lockout_id: string
  user_id: string
  reason: string
  locked_at: number
  unlocks_at: number
}

/**
 * Check if user is locked out
 * @param db D1Database instance
 * @param userId User ID
 * @param now Current timestamp
 */
export async function isAccountLocked(
  db: D1Database,
  userId: string,
  now: number
): Promise<{ locked: boolean; unlocksAt?: number }> {
  const lockout = await db
    .prepare(
      `SELECT lockout_id, unlocks_at FROM account_lockouts 
       WHERE user_id = ? AND unlocks_at > ? 
       ORDER BY unlocks_at DESC LIMIT 1`
    )
    .bind(userId, now)
    .first<any>()

  if (lockout) {
    return { locked: true, unlocksAt: lockout.unlocks_at }
  }

  return { locked: false }
}

/**
 * Record login attempt (success or failure)
 * @param db D1Database instance
 * @param email User email or phone
 * @param ipAddress IP address
 * @param success Whether login was successful
 * @param userId User ID (if successful)
 */
export async function recordLoginAttempt(
  db: D1Database,
  identifier: string, // email or phone
  ipAddress: string,
  success: boolean,
  userId?: string
): Promise<void> {
  const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = Math.floor(Date.now() / 1000)

  await db
    .prepare(
      `INSERT INTO login_attempts 
       (attempt_id, identifier, ip_address, attempted_at, success, user_id) 
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(attemptId, identifier, ipAddress, now, success ? 1 : 0, userId || null)
    .run()
}

/**
 * Check if identifier (email/phone) should be rate limited
 * Returns: { shouldBlock: boolean, remainingAttempts: number, resetAt?: number }
 */
export async function checkRateLimit(
  db: D1Database,
  identifier: string,
  ipAddress: string,
  now: number
): Promise<{
  shouldBlock: boolean
  remainingAttempts: number
  resetAt?: number
}> {
  const windowStart = now - ATTEMPT_WINDOW

  // Get failed attempts in the last 15 minutes for this identifier
  const failedAttempts = await db
    .prepare(
      `SELECT COUNT(*) as count FROM login_attempts 
       WHERE (identifier = ? OR ip_address = ?) 
       AND attempted_at > ? 
       AND success = 0`
    )
    .bind(identifier, ipAddress, windowStart)
    .first<{ count: number }>()

  const failCount = failedAttempts?.count || 0
  const remaining = Math.max(0, MAX_ATTEMPTS - failCount)

  if (failCount >= MAX_ATTEMPTS) {
    // Get the oldest attempt timestamp to calculate reset time
    const oldestAttempt = await db
      .prepare(
        `SELECT attempted_at FROM login_attempts 
         WHERE (identifier = ? OR ip_address = ?) 
         AND attempted_at > ? 
         AND success = 0 
         ORDER BY attempted_at ASC LIMIT 1`
      )
      .bind(identifier, ipAddress, windowStart)
      .first<{ attempted_at: number }>()

    const resetAt = oldestAttempt ? oldestAttempt.attempted_at + ATTEMPT_WINDOW : now + ATTEMPT_WINDOW

    return {
      shouldBlock: true,
      remainingAttempts: 0,
      resetAt: resetAt,
    }
  }

  return {
    shouldBlock: false,
    remainingAttempts: remaining,
  }
}

/**
 * Lock user account after exceeding max attempts
 */
export async function lockAccount(
  db: D1Database,
  userId: string,
  now: number,
  reason: string = 'Too many failed login attempts'
): Promise<void> {
  const lockoutId = `lockout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const unlocksAt = now + LOCKOUT_DURATION

  await db
    .prepare(
      `INSERT INTO account_lockouts (lockout_id, user_id, reason, locked_at, unlocks_at) 
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(lockoutId, userId, reason, now, unlocksAt)
    .run()
}

/**
 * Unlock account (reset lockout)
 */
export async function unlockAccount(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare(`DELETE FROM account_lockouts WHERE user_id = ?`)
    .bind(userId)
    .run()
}

/**
 * Reset failed attempts for a user (after successful login)
 */
export async function resetFailedAttempts(
  db: D1Database,
  identifier: string,
  ipAddress: string
): Promise<void> {
  // This is typically handled by the login endpoint after successful auth
  // But you could implement a cleanup here if needed
}

/**
 * Validate IP & User-Agent for session hijacking detection
 * Returns: { valid: boolean, reason?: string }
 */
export async function validateSessionContext(
  db: D1Database,
  sessionId: string,
  currentIp: string,
  currentUserAgent: string,
  toleranceLevel: 'strict' | 'moderate' | 'lenient' = 'strict'
): Promise<{ valid: boolean; reason?: string }> {
  const session = await db
    .prepare(`SELECT ip_address, user_agent FROM sessions WHERE session_id = ?`)
    .bind(sessionId)
    .first<any>()

  if (!session) {
    return { valid: false, reason: 'Session not found' }
  }

  // IP validation (strict: exact match, moderate: same ISP block, lenient: ignore)
  if (toleranceLevel !== 'lenient' && session.ip_address && session.ip_address !== currentIp) {
    if (toleranceLevel === 'strict') {
      return { valid: false, reason: 'IP address mismatch - possible session hijacking' }
    }
    // For moderate: check if IPs are in same /24 block
    const isSameBlock = isIpInSameBlock(session.ip_address, currentIp, 24)
    if (!isSameBlock) {
      return { valid: false, reason: 'IP address changed significantly' }
    }
  }

  // User-Agent validation (browser/device fingerprint)
  if (session.user_agent && session.user_agent !== currentUserAgent) {
    if (toleranceLevel === 'strict') {
      return { valid: false, reason: 'User-Agent mismatch - possible session hijacking' }
    }
    // For moderate/lenient: log but allow (UX improvement for device changes)
  }

  return { valid: true }
}

/**
 * Check if two IPs are in the same /24 CIDR block
 */
function isIpInSameBlock(ip1: string, ip2: string, cidr: number = 24): boolean {
  try {
    const parts1 = ip1.split('.').map(Number)
    const parts2 = ip2.split('.').map(Number)

    if (cidr === 24) {
      return parts1[0] === parts2[0] && parts1[1] === parts2[1] && parts1[2] === parts2[2]
    }

    // Implement for other CIDR values if needed
    return ip1 === ip2
  } catch {
    return false
  }
}

/**
 * Clean up expired login attempts and lockouts
 * Call this periodically (e.g., via cron or cleanup job)
 */
export async function cleanupExpiredRecords(db: D1Database, now: number): Promise<void> {
  // Delete login attempts older than 30 days
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60

  await db
    .prepare(`DELETE FROM login_attempts WHERE attempted_at < ?`)
    .bind(thirtyDaysAgo)
    .run()

  // Delete expired lockouts
  await db
    .prepare(`DELETE FROM account_lockouts WHERE unlocks_at < ?`)
    .bind(now)
    .run()
}
