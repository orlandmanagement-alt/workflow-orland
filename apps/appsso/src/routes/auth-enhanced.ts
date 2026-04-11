// Enterprise Auth Routes with PBKDF2, Rate Limiting, Brute-Force Protection & Full Features
// File: apps/appsso/src/routes/auth-enhanced.ts

import { Hono, Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { sign } from 'hono/jwt'
import { Buffer } from 'node:buffer'

import {
  hashPasswordPBKDF2,
  verifyPasswordPBKDF2,
  generateUUID,
  generateOTP,
  sha256
} from '../utils/crypto'
import {
  isAccountLocked,
  recordLoginAttempt,
  checkRateLimit,
  lockAccount,
  validateSessionContext,
} from '../utils/security'
import { verifyTurnstile, sendMail } from '../utils'

type Bindings = {
  DB_SSO: D1Database
  TURNSTILE_SECRET: string
  HASH_PEPPER: string
  JWT_SECRET: string
  TALENT_URL?: string
  CLIENT_URL?: string
  ADMIN_URL?: string
  PBKDF2_ITER?: string
  SESSION_TTL_MIN?: string
  COOKIE_DOMAIN?: string
}

const auth = new Hono<{ Bindings: Bindings }>()

const getNow = () => Math.floor(Date.now() / 1000)
const getClientIp = (c: Context): string => c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'

// Helper Dinamis untuk Opsi Cookie
const getCookieOpts = (env: Bindings) => ({
  domain: env.COOKIE_DOMAIN || '.orlandmanagement.com',
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'Lax' as const,
})

// Helper Dinamis untuk Umur Sesi (default 720 menit / 12 jam)
const getSessionExpiry = (env: Bindings) => Number(env.SESSION_TTL_MIN || 720) * 60

// 🔥 PERBAIKAN: Helper Konfigurasi Crypto agar Pepper & Iterasi selalu SAMA di semua rute
const getCryptoConfig = (env: Bindings) => ({
  pepper: env.HASH_PEPPER || 'orland_fallback_pepper_999',
  iter: Number(env.PBKDF2_ITER) || 100000
})

/**
 * ========================================
 * HELPER FUNCTIONS
 * ========================================
 */

async function getPortalUrl(env: Bindings, user: any, sid: string) {
  const safeRole = (user.user_type || 'talent').toLowerCase();
  let baseUrl: string;
  
  if (safeRole === 'super_admin' || safeRole === 'admin') {
    baseUrl = env.ADMIN_URL || 'https://admin.orlandmanagement.com';
  } else if (safeRole === 'client') {
    baseUrl = env.CLIENT_URL || 'https://client.orlandmanagement.com';
  } else {
    baseUrl = env.TALENT_URL || 'https://talent.orlandmanagement.com';
  }
  
  const now = getNow();
  const sessionExp = getSessionExpiry(env);
  const payload = { sub: user.id, role: safeRole, sid: sid, exp: now + sessionExp, iat: now };
  const token = await sign(payload, env.JWT_SECRET || 'orland-rahasia-utama-123');
  
  const params = new URLSearchParams({ 
    token: token, 
    role: safeRole, 
    user_id: user.id, 
    name: `${user.first_name} ${user.last_name || ''}`.trim(), 
    email: user.email 
  });
  
  return `${baseUrl}/auth/callback?${params.toString()}`;
}

async function createSession(c: Context<{ Bindings: Bindings }>, user: any, ipAddress: string, userAgent: string) {
  const now = getNow()
  const sessionId = generateUUID()
  const sessionExp = getSessionExpiry(c.env)
  const expiresAt = now + sessionExp

  await c.env.DB_SSO.prepare(
    `INSERT INTO sessions (session_id, user_id, ip_address, user_agent, expires_at, created_at, is_active)
     VALUES (?, ?, ?, ?, datetime(?, 'unixepoch'), datetime(?, 'unixepoch'), 1)`
  ).bind(sessionId, user.id, ipAddress, userAgent, expiresAt, now).run()

  setCookie(c, 'sid', sessionId, { ...getCookieOpts(c.env), maxAge: sessionExp })
  return { sessionId, expiresAt, redirectUrl: await getPortalUrl(c.env, user, sessionId) }
}

/**
 * ========================================
 * REGISTRATION & ACTIVATION
 * ========================================
 */

auth.post('/register', async (c) => {
  try {
    const body = await c.req.json<any>()
    const ipAddress = getClientIp(c)
    
    const isHuman = await verifyTurnstile(body.turnstile_token, ipAddress, c.env.TURNSTILE_SECRET)
    if (!isHuman) return c.json({ status: 'error', message: 'CAPTCHA verification failed' }, 403)

    if (!body.email || !body.password || !body.role) return c.json({ status: 'error', message: 'Missing required fields' }, 400)
    if (body.password.length < 8) return c.json({ status: 'error', message: 'Password must be at least 8 characters' }, 400)

    const email = body.email.toLowerCase().trim()
    const existing = await c.env.DB_SSO.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<any>()
    if (existing) return c.json({ status: 'error', message: 'Email already registered' }, 409)

    // 🔥 PERBAIKAN: Gunakan Helper Crypto
    const cryptoCfg = getCryptoConfig(c.env);
    const { salt, hash } = await hashPasswordPBKDF2(body.password, cryptoCfg.pepper, cryptoCfg.iter)
    
    const userId = crypto.randomUUID()
    const nameParts = (body.fullName || 'User').split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''
    const phoneVal = body.phone ? body.phone : null;

    await c.env.DB_SSO.prepare(
      `INSERT INTO users (
        id, email, phone, first_name, last_name, user_type, is_active, email_verified,
        password_hash, password_salt
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`
    ).bind(userId, email, phoneVal, firstName, lastName, body.role.toLowerCase(), hash, salt).run()

    const activationToken = crypto.randomUUID().replace(/-/g, '')
    const otpId = crypto.randomUUID()

    await c.env.DB_SSO.prepare(
      `INSERT INTO otp_codes (otp_id, user_id, email, code, method, expires_at)
       VALUES (?, ?, ?, ?, 'email', datetime('now', '+1 day'))`
    ).bind(otpId, userId, email, activationToken).run()

    try { await sendMail(c.env, email, activationToken, 'activation') } catch(e) {}

    return c.json({ status: 'ok', message: 'Registration successful. Check your email.', user_id: userId })
    
  } catch (error: any) {
    console.error("CRASH REPORT:", error);
    return c.json({ status: 'error', message: `Sistem Error: ${error.message}` }, 500)
  }
})

auth.post('/verify-activation', async (c) => {
  const body = await c.req.json<any>()
  const ipAddress = getClientIp(c)
  const userAgent = c.req.header('user-agent') || 'unknown'

  const tokenRow = await c.env.DB_SSO.prepare(
    "SELECT * FROM otp_codes WHERE code = ? AND expires_at > datetime('now')"
  ).bind(body.token).first<any>()

  if (!tokenRow) return c.json({ status: "error", message: "Tautan Aktivasi tidak valid/kadaluarsa." }, 400)
  
  await c.env.DB_SSO.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").bind(tokenRow.user_id).run()
  await c.env.DB_SSO.prepare("DELETE FROM otp_codes WHERE otp_id = ?").bind(tokenRow.otp_id).run()
  
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE id = ?").bind(tokenRow.user_id).first<any>()
  const session = await createSession(c, user, ipAddress, userAgent)
  
  return c.json({ status: "ok", role: user.user_type, redirect_url: session.redirectUrl })
})

/**
 * ========================================
 * LOGIN (PASSWORD, OTP, PIN)
 * ========================================
 */

auth.post('/login-password', async (c) => {
  try {
    const body = await c.req.json<any>()
    const ipAddress = getClientIp(c)
    const userAgent = c.req.header('user-agent') || 'unknown'
    const now = getNow()

    const isHuman = await verifyTurnstile(body.turnstile_token, ipAddress, c.env.TURNSTILE_SECRET)
    if (!isHuman) return c.json({ status: 'error', message: 'CAPTCHA verification failed.' }, 403)

    const identifier = (body.identifier || "").toLowerCase().trim()
    
    const rateLimit = await checkRateLimit(c.env.DB_SSO, identifier, ipAddress, now)
    if (rateLimit.shouldBlock) return c.json({ status: 'error', message: `Terlalu banyak percobaan. Coba lagi nanti.` }, 429)

    const user = await c.env.DB_SSO.prepare('SELECT * FROM users WHERE (email = ? OR phone = ?) AND is_active = 1').bind(identifier, identifier).first<any>()
    if (!user) {
      await recordLoginAttempt(c.env.DB_SSO, identifier, ipAddress, false)
      return c.json({ status: 'error', message: 'Kredensial salah' }, 401)
    }

    const lockStatus = await isAccountLocked(c.env.DB_SSO, user.id, now)
    if (lockStatus.locked) return c.json({ status: 'error', message: `Akun terkunci sementara.` }, 423)

    if (user.email_verified === 0) {
      const activationToken = crypto.randomUUID().replace(/-/g, '')
      const otpId = crypto.randomUUID()

      await c.env.DB_SSO.prepare("DELETE FROM otp_codes WHERE user_id = ? AND method = 'email'").bind(user.id).run()
      await c.env.DB_SSO.prepare(
        `INSERT INTO otp_codes (otp_id, user_id, email, code, method, expires_at)
         VALUES (?, ?, ?, ?, 'email', datetime('now', '+1 day'))`
      ).bind(otpId, user.id, user.email, activationToken).run()

      try { await sendMail(c.env, user.email, activationToken, 'activation') } catch(e) {}

      return c.json({ 
        status: 'error', 
        message: 'Akun belum aktif! Kami telah MENGIRIM ULANG link aktivasi ke email Anda. Silakan cek sekarang.' 
      }, 403)
    }

    // 🔥 PERBAIKAN: Gunakan Helper Crypto
    const cryptoCfg = getCryptoConfig(c.env);
    const passwordValid = await verifyPasswordPBKDF2(body.password, user.password_hash, user.password_salt, cryptoCfg.pepper, cryptoCfg.iter)
    
    if (!passwordValid) {
      await recordLoginAttempt(c.env.DB_SSO, identifier, ipAddress, false, user.id)
      return c.json({ status: 'error', message: 'Kredensial salah' }, 401)
    }

    await recordLoginAttempt(c.env.DB_SSO, identifier, ipAddress, true, user.id)
    await c.env.DB_SSO.prepare("UPDATE users SET last_login = datetime('now'), last_login_ip = ? WHERE id = ?").bind(ipAddress, user.id).run()

    const session = await createSession(c, user, ipAddress, userAgent)
    return c.json({ status: 'ok', redirect_url: session.redirectUrl })
  } catch (error: any) {
    console.error("LOGIN CRASH REPORT:", error);
    return c.json({ status: 'error', message: `Sistem Error: ${error.message}` }, 500)
  }
})

auth.post('/request-otp', async (c) => {
  const body = await c.req.json<any>()
  const id = (body.identifier || "").trim().toLowerCase()
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE (email=? OR phone=?) AND is_active=1").bind(id, id).first<any>()
  
  if (!user) return c.json({ status: "error", message: "Akun tidak ditemukan." }, 404)
  
  const otp = generateOTP()
  const otpId = crypto.randomUUID()
  
  await c.env.DB_SSO.prepare("DELETE FROM otp_codes WHERE user_id=?").bind(user.id).run()
  await c.env.DB_SSO.prepare(
    "INSERT INTO otp_codes (otp_id, user_id, email, code, method, expires_at) VALUES (?,?,?,?,'email', datetime('now', '+3 minutes'))"
  ).bind(otpId, user.id, user.email, otp).run()
  
  try { await sendMail(c.env, user.email, otp, body.purpose || 'login'); } catch (e) {}
  return c.json({ status: "ok", message: "OTP Terkirim." })
})

auth.post('/login-otp', async (c) => handleOtpVerify(c))
auth.post('/setup-pin', async (c) => handleOtpVerify(c, true))

async function handleOtpVerify(c: Context<{ Bindings: Bindings }>, isSetupPin = false) {
  const body = await c.req.json<any>()
  const ipAddress = getClientIp(c)
  const userAgent = c.req.header('user-agent') || 'unknown'
  const id = (body.identifier || "").trim().toLowerCase()

  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE (email=? OR phone=?) AND is_active=1").bind(id, id).first<any>()
  if (!user) return c.json({ status: "error", message: "Akun tidak ditemukan." }, 404)
  
  const otpRow = await c.env.DB_SSO.prepare("SELECT * FROM otp_codes WHERE user_id=? AND code=? AND expires_at > datetime('now')").bind(user.id, body.otp).first<any>()
  if (!otpRow) return c.json({ status: "error", message: "OTP salah/expired." }, 400)
  
  await c.env.DB_SSO.prepare("DELETE FROM otp_codes WHERE otp_id=?").bind(otpRow.otp_id).run()
  
  if (isSetupPin && body.new_pin) {
    const cryptoCfg = getCryptoConfig(c.env);
    const { salt, hash } = await hashPasswordPBKDF2(body.new_pin, cryptoCfg.pepper, cryptoCfg.iter)
    await c.env.DB_SSO.prepare("UPDATE users SET pin_hash=?, pin_salt=? WHERE id=?").bind(hash, salt, user.id).run()
  }
  
  const session = await createSession(c, user, ipAddress, userAgent)
  return c.json({ status: "ok", redirect_url: session.redirectUrl })
}

auth.post('/check-pin', async (c) => {
  const body = await c.req.json<any>()
  const id = (body.identifier || "").trim().toLowerCase()
  const user = await c.env.DB_SSO.prepare("SELECT id, email, pin_hash FROM users WHERE (email=? OR phone=?) AND is_active=1").bind(id, id).first<any>()
  if (!user) return c.json({ status: "error", message: "Akun tidak ditemukan." }, 404)
  return c.json({ status: "ok", has_pin: !!user.pin_hash, email: user.email })
})

auth.post('/login-pin', async (c) => {
  const body = await c.req.json<any>()
  const ipAddress = getClientIp(c)
  const userAgent = c.req.header('user-agent') || 'unknown'
  const id = (body.identifier || "").trim().toLowerCase()
  
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE (email=? OR phone=?) AND is_active=1").bind(id, id).first<any>()
  if (!user || !user.pin_hash) return c.json({ status: "error", message: "Akun/PIN tidak valid." }, 404)
  
  const cryptoCfg = getCryptoConfig(c.env);
  const pinValid = await verifyPasswordPBKDF2(body.pin, user.pin_hash, user.pin_salt, cryptoCfg.pepper, cryptoCfg.iter)
  if (!pinValid) return c.json({ status: "error", message: "PIN salah." }, 401)
  
  const session = await createSession(c, user, ipAddress, userAgent)
  return c.json({ status: "ok", redirect_url: session.redirectUrl })
})

/**
 * ========================================
 * LUPA PASSWORD / RESET
 * ========================================
 */

auth.post('/request-reset', async (c) => {
  const body = await c.req.json<any>()
  const id = (body.identifier || "").trim().toLowerCase()
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE (email=? OR phone=?) AND is_active=1").bind(id, id).first<any>()
  if (!user) return c.json({ status: "error", message: "Akun tidak ditemukan." }, 404)
  
  const rawToken = crypto.randomUUID().replace(/-/g, '')
  const tokenHash = await sha256(rawToken)
  const tokenId = crypto.randomUUID()
  
  await c.env.DB_SSO.prepare("DELETE FROM password_reset_tokens WHERE user_id=?").bind(user.id).run()
  await c.env.DB_SSO.prepare(
    "INSERT INTO password_reset_tokens (token_id, user_id, email, token_hash, expires_at) VALUES (?,?,?,?, datetime('now', '+30 minutes'))"
  ).bind(tokenId, user.id, user.email, tokenHash).run()
  
  try { await sendMail(c.env, user.email, rawToken, 'reset'); } catch (e) {}
  return c.json({ status: "ok", message: "Link reset terkirim." })
})

auth.post('/reset-password', async (c) => {
  const body = await c.req.json<any>()
  const tokenHash = await sha256(body.token)
  
  const tokenRow = await c.env.DB_SSO.prepare(
    "SELECT * FROM password_reset_tokens WHERE token_hash=? AND used=0 AND expires_at > datetime('now')"
  ).bind(tokenHash).first<any>()
  
  if (!tokenRow) return c.json({ status: "error", message: "Token tidak valid/kadaluarsa." }, 400)
  
  const cryptoCfg = getCryptoConfig(c.env);
  const { salt, hash } = await hashPasswordPBKDF2(body.new_password, cryptoCfg.pepper, cryptoCfg.iter)
  
  await c.env.DB_SSO.prepare("UPDATE users SET password_hash=?, password_salt=? WHERE id=?").bind(hash, salt, tokenRow.user_id).run()
  await c.env.DB_SSO.prepare("UPDATE password_reset_tokens SET used=1, used_at=datetime('now') WHERE token_id=?").bind(tokenRow.token_id).run()
  await c.env.DB_SSO.prepare("DELETE FROM sessions WHERE user_id=?").bind(tokenRow.user_id).run()
  
  return c.json({ status: "ok", message: "Password berhasil diubah." })
})

/**
 * ========================================
 * SESSION MANAGEMENT (ME / LOGOUT)
 * ========================================
 */

auth.get('/me', async (c) => {
  const sid = getCookie(c, 'sid')
  if (!sid) return c.json({ status: 'error', message: 'Not authenticated' }, 401)

  const session = await c.env.DB_SSO.prepare("SELECT * FROM sessions WHERE session_id = ? AND expires_at > datetime('now')").bind(sid).first<any>()
  if (!session) return c.json({ status: 'error', message: 'Session expired' }, 401)

  const user = await c.env.DB_SSO.prepare("SELECT id, email, first_name, last_name, user_type as role, is_active FROM users WHERE id = ?").bind(session.user_id).first<any>()
  if (!user || user.is_active === 0) return c.json({ status: 'error', message: 'Account inactive' }, 401)

  return c.json({ status: 'ok', user })
})

auth.post('/logout', async (c) => {
  const sid = getCookie(c, 'sid')
  if (sid) await c.env.DB_SSO.prepare('DELETE FROM sessions WHERE session_id = ?').bind(sid).run()
  
  // 🔥 PERBAIKAN: Menggunakan getCookieOpts() agar tidak Error 500
  deleteCookie(c, 'sid', getCookieOpts(c.env))
  return c.json({ status: 'ok', message: 'Logout successful' })
})

auth.post('/validate-session', async (c) => {
  const body = await c.req.json<any>()
  const token = body.token || getCookie(c, 'sid')
  if (!token) return c.json({ valid: false, message: 'No token provided' })

  const session = await c.env.DB_SSO.prepare("SELECT * FROM sessions WHERE session_id = ? AND expires_at > datetime('now')").bind(token).first<any>()
  if (!session) return c.json({ valid: false, message: 'Session expired' })

  const user = await c.env.DB_SSO.prepare("SELECT id, email, user_type as role, is_active FROM users WHERE id = ?").bind(session.user_id).first<any>()
  if (!user || user.is_active === 0) return c.json({ valid: false, message: 'User invalid' })

  return c.json({ valid: true, user, session: { id: session.session_id, expires_at: session.expires_at } })
})

export default auth