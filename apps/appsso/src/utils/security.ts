// Rate Limiting & Account Lockout Service
// File: apps/appsso/src/utils/security.ts

import { D1Database } from '@cloudflare/workers-types'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 30
const ATTEMPT_WINDOW_MINUTES = 15

/**
 * Check if user is locked out
 */
export async function isAccountLocked(
  db: D1Database,
  userId: string,
  now: number // Parameter now tetap diterima agar kompatibel dengan pemanggilan lama
): Promise<{ locked: boolean; unlocksAt?: number }> {
  // Gunakan fungsi waktu bawaan SQLite untuk pencocokan skema baru
  const lockout = await db
    .prepare(
      `SELECT lockout_id, strftime('%s', unlocks_at) as unlocks_ts FROM account_lockouts 
       WHERE user_id = ? AND unlocks_at > datetime('now') AND is_active = 1 
       ORDER BY unlocks_at DESC LIMIT 1`
    )
    .bind(userId)
    .first<any>()

  if (lockout) {
    return { locked: true, unlocksAt: Number(lockout.unlocks_ts) }
  }

  return { locked: false }
}

/**
 * Record login attempt (success or failure)
 */
export async function recordLoginAttempt(
  db: D1Database,
  identifier: string, // Email atau Phone
  ipAddress: string,
  success: boolean,
  userId?: string
): Promise<void> {
  const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Skema baru menggunakan kolom 'email' untuk identitas dan 'created_at' untuk waktu
  await db
    .prepare(
      `INSERT INTO login_attempts 
       (attempt_id, email, ip_address, success, user_id, method, created_at) 
       VALUES (?, ?, ?, ?, ?, 'password', datetime('now'))`
    )
    .bind(attemptId, identifier, ipAddress, success ? 1 : 0, userId || null)
    .run()
}

/**
 * Check if identifier (email/phone) should be rate limited
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
  // Hitung jumlah kegagalan 15 menit terakhir menggunakan fitur waktu SQLite
  const failedAttempts = await db
    .prepare(
      `SELECT COUNT(*) as count FROM login_attempts 
       WHERE (email = ? OR ip_address = ?) 
       AND created_at > datetime('now', '-${ATTEMPT_WINDOW_MINUTES} minutes') 
       AND success = 0`
    )
    .bind(identifier, ipAddress)
    .first<{ count: number }>()

  const failCount = failedAttempts?.count || 0
  const remaining = Math.max(0, MAX_ATTEMPTS - failCount)

  if (failCount >= MAX_ATTEMPTS) {
    const oldestAttempt = await db
      .prepare(
        `SELECT strftime('%s', created_at) as created_ts FROM login_attempts 
         WHERE (email = ? OR ip_address = ?) 
         AND created_at > datetime('now', '-${ATTEMPT_WINDOW_MINUTES} minutes') 
         AND success = 0 
         ORDER BY created_at ASC LIMIT 1`
      )
      .bind(identifier, ipAddress)
      .first<{ created_ts: number }>()

    const resetAt = oldestAttempt ? Number(oldestAttempt.created_ts) + (ATTEMPT_WINDOW_MINUTES * 60) : now + (ATTEMPT_WINDOW_MINUTES * 60)

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

  // Menggunakan datetime SQLite agar sesuai dengan kolom DATETIME di skema baru
  await db
    .prepare(
      `INSERT INTO account_lockouts (lockout_id, user_id, reason, locked_at, unlocks_at, is_active) 
       VALUES (?, ?, ?, datetime('now'), datetime('now', '+${LOCKOUT_DURATION_MINUTES} minutes'), 1)`
    )
    .bind(lockoutId, userId, reason)
    .run()
}

/**
 * Validate IP & User-Agent for session hijacking detection
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

  if (!session) return { valid: false, reason: 'Session not found' }

  if (toleranceLevel !== 'lenient' && session.ip_address && session.ip_address !== currentIp) {
    if (toleranceLevel === 'strict') {
      return { valid: false, reason: 'IP address mismatch - possible session hijacking' }
    }
    const isSameBlock = isIpInSameBlock(session.ip_address, currentIp, 24)
    if (!isSameBlock) {
      return { valid: false, reason: 'IP address changed significantly' }
    }
  }

  return { valid: true }
}

function isIpInSameBlock(ip1: string, ip2: string, cidr: number = 24): boolean {
  try {
    const parts1 = ip1.split('.').map(Number)
    const parts2 = ip2.split('.').map(Number)
    if (cidr === 24) return parts1[0] === parts2[0] && parts1[1] === parts2[1] && parts1[2] === parts2[2]
    return ip1 === ip2
  } catch {
    return false
  }
}