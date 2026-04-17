// Enterprise Auth Routes with PBKDF2, Rate Limiting, Brute-Force Protection & Full Features
// File: apps/appsso/src/routes/auth-enhanced.ts

import { Hono, Context } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { sign } from 'hono/jwt'
import { Buffer } from 'node:buffer'
import { validateEmail, verifyTurnstile, sendMail } from '../utils'
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

type Bindings = {
  DB_SSO: D1Database
  TURNSTILE_SECRET: string
  HASH_PEPPER: string
  JWT_SECRET: string
  TALENT_URL?: string
  CLIENT_URL?: string
  ADMIN_URL?: string
  AGENCY_URL?: string
  PBKDF2_ITER?: string
  SESSION_TTL_MIN?: string
  COOKIE_DOMAIN?: string
}

const auth = new Hono<{ Bindings: Bindings }>()

// ========================================
// KONFIGURASI CORS (TAMBAHKAN BLOK INI)
// ========================================
auth.use('*', cors({
  origin: [
    'https://www.orlandmanagement.com', 
    'https://sso.orlandmanagement.com',
    'http://localhost:8787' // (Opsional) untuk testing lokal
  ],
  allowHeaders: ['Content-Type', 'Authorization', 'x-client-id', 'x-agency-id'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
  credentials: true,
  maxAge: 86400,
}))
// ========================================

const getNow = () => Math.floor(Date.now() / 1000)
const getClientIp = (c: Context): string => c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'

/**
 * HELPER: Konfigurasi Cookie Standar Enterprise
 */
const getCookieOpts = (env: Bindings) => ({
  domain: env.COOKIE_DOMAIN || '.orlandmanagement.com',
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'None' as const, 
})

const getSessionExpiry = (env: Bindings) => Number(env.SESSION_TTL_MIN || 720) * 60

const getCryptoConfig = (env: Bindings) => ({
  pepper: env.HASH_PEPPER || 'orland_fallback_pepper_999',
  iter: Number(env.PBKDF2_ITER) || 100000
})

/**
 * HELPER: URL Dashboard Berdasarkan Peran (Role)
 */
async function getPortalUrl(env: Bindings, user: any, sid: string) {
  const safeRole = (user.user_type || 'talent').toLowerCase(); 
  let baseUrl: string;
  
  if (safeRole === 'admin' || safeRole === 'super_admin') {
    baseUrl = env.ADMIN_URL || 'https://www.orlandmanagement.com/p/admin-dashboard.html';
  } else if (safeRole === 'agency') {
    baseUrl = env.AGENCY_URL || 'https://www.orlandmanagement.com/p/agency-dashboard.html';
  } else if (safeRole === 'client') {
    baseUrl = env.CLIENT_URL || 'https://www.orlandmanagement.com/p/client-dashboard.html';
  } else {
    baseUrl = env.TALENT_URL || 'https://www.orlandmanagement.com/p/profile.html';
  }
  
  const now = getNow();
  const sessionExp = getSessionExpiry(env);
  const payload = { sub: user.id, role: safeRole, sid: sid, exp: now + sessionExp, iat: now };
  const token = await sign(payload, env.JWT_SECRET);
  
  const params = new URLSearchParams({ 
    token: token, 
    role: safeRole, 
    user_id: user.id, 
    name: `${user.first_name} ${user.last_name || ''}`.trim(), 
    email: user.email,
    phone: user.phone || ''
  });
  
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${params.toString()}`;
}

/**
 * HELPER: Membuat Sesi Baru di Database
 */
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
 * 1. PENDAFTARAN & AKTIVASI
 * ========================================
 */
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json<any>()
    const email = body.email.toLowerCase().trim()
    
    if (!validateEmail(email)) {
      return c.json({ status: 'error', message: 'Masukkan alamat email yang valid (Contoh: nama@gmail.com)' }, 400);
    }

    if (!body.password || !body.role) return c.json({ status: 'error', message: 'Data pendaftaran tidak lengkap.' }, 400)

    const existing = await c.env.DB_SSO.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<any>()
    if (existing) return c.json({ status: 'error', message: 'Email sudah terdaftar. Silakan masuk.' }, 409)

    const cryptoCfg = getCryptoConfig(c.env);
    const { salt, hash } = await hashPasswordPBKDF2(body.password, cryptoCfg.pepper, cryptoCfg.iter)
    
    const userId = crypto.randomUUID()
    const nameParts = (body.fullName || 'User').split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''
    
    // PERBAIKAN: Tangkap tipe klien jika ada (PH, TVC, KOL, dll)
    const clientType = body.client_type || null;

    // SIMPAN USER DENGAN STATUS BELUM AKTIF
    await c.env.DB_SSO.prepare(
      `INSERT INTO users (
        id, email, first_name, last_name, phone, user_type, client_type, is_active, email_verified,
        password_hash, password_salt, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, datetime('now'))`
    ).bind(
      userId, email, firstName, lastName, body.phone || null, body.role.toLowerCase(), clientType, hash, salt
    ).run()

    // TRIGGER EMAIL AKTIVASI
    const activationToken = crypto.randomUUID().replace(/-/g, '')
    await c.env.DB_SSO.prepare(
      `INSERT INTO otp_codes (otp_id, user_id, email, code, method, expires_at)
       VALUES (?, ?, ?, ?, 'email', datetime('now', '+1 day'))`
    ).bind(crypto.randomUUID(), userId, email, activationToken).run()

    try { 
      await sendMail(c.env, email, activationToken, 'activation'); 
    } catch(e) {
      console.error("Email API Error:", e);
    }

    return c.json({ status: 'ok', message: 'Registrasi Berhasil! Silakan cek email (Inbox/Spam) untuk mengaktifkan akun Anda.' })
    
  } catch (error: any) {
    return c.json({ status: 'error', message: `Kesalahan Sistem: ${error.message}` }, 500)
  }
})

auth.post('/verify-activation', async (c) => {
  const body = await c.req.json<any>()
  const ipAddress = getClientIp(c)
  const userAgent = c.req.header('user-agent') || 'unknown'

  const tokenRow = await c.env.DB_SSO.prepare(
    "SELECT * FROM otp_codes WHERE code = ? AND expires_at > datetime('now')"
  ).bind(body.token).first<any>()

  if (!tokenRow) return c.json({ status: "error", message: "Tautan aktivasi tidak valid atau sudah kadaluarsa." }, 400)
  
  await c.env.DB_SSO.prepare("UPDATE users SET email_verified = 1, email_verified_at = datetime('now') WHERE id = ?").bind(tokenRow.user_id).run()
  await c.env.DB_SSO.prepare("DELETE FROM otp_codes WHERE otp_id = ?").bind(tokenRow.otp_id).run()
  
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE id = ?").bind(tokenRow.user_id).first<any>()
  const session = await createSession(c, user, ipAddress, userAgent)
  
  return c.json({ status: "ok", role: user.user_type, redirect_url: session.redirectUrl })
})

/**
 * ========================================
 * 2. PROSES MASUK (LOGIN)
 * ========================================
 */
auth.post('/login-password', async (c) => {
  try {
    const body = await c.req.json<any>()
    const ipAddress = getClientIp(c)
    const userAgent = c.req.header('user-agent') || 'unknown'
    const now = getNow()

    const identifier = (body.identifier || "").toLowerCase().trim()
    const rateLimit = await checkRateLimit(c.env.DB_SSO, identifier, ipAddress, now)
    if (rateLimit.shouldBlock) return c.json({ status: 'error', message: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' }, 429)

    const user = await c.env.DB_SSO.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').bind(identifier).first<any>()
    
    if (!user) {
      await recordLoginAttempt(c.env.DB_SSO, identifier, ipAddress, false)
      return c.json({ status: 'error', message: 'Email atau Kata Sandi salah.' }, 401)
    }

    if (user.email_verified === 0) {
      const activationToken = crypto.randomUUID().replace(/-/g, '')
      await c.env.DB_SSO.prepare("DELETE FROM otp_codes WHERE user_id = ? AND method = 'email'").bind(user.id).run()
      await c.env.DB_SSO.prepare(
        `INSERT INTO otp_codes (otp_id, user_id, email, code, method, expires_at)
         VALUES (?, ?, ?, ?, 'email', datetime('now', '+1 day'))`
      ).bind(crypto.randomUUID(), user.id, user.email, activationToken).run()

      try { await sendMail(c.env, user.email, activationToken, 'activation'); } catch(e) {}

      return c.json({ 
        status: 'error', 
        message: 'Akun Anda belum aktif! Kami telah MENGIRIM ULANG tautan aktivasi ke email Anda.' 
      }, 403)
    }

    const cryptoCfg = getCryptoConfig(c.env);
    const passwordValid = await verifyPasswordPBKDF2(body.password, user.password_hash, user.password_salt, cryptoCfg.pepper, cryptoCfg.iter)
    
    if (!passwordValid) {
      await recordLoginAttempt(c.env.DB_SSO, identifier, ipAddress, false, user.id)
      return c.json({ status: 'error', message: 'Email atau Kata Sandi salah.' }, 401)
    }

    await recordLoginAttempt(c.env.DB_SSO, identifier, ipAddress, true, user.id)
    await c.env.DB_SSO.prepare("UPDATE users SET last_login = datetime('now'), last_login_ip = ? WHERE id = ?").bind(ipAddress, user.id).run()

    const session = await createSession(c, user, ipAddress, userAgent)
    return c.json({ status: 'ok', redirect_url: session.redirectUrl })
  } catch (error: any) {
    return c.json({ status: 'error', message: 'Terjadi kesalahan sistem saat masuk.' }, 500)
  }
})

auth.post('/request-otp', async (c) => {
  const body = await c.req.json<any>()
  const id = (body.identifier || "").trim().toLowerCase()

  if (!validateEmail(id)) return c.json({ status: "error", message: "Masukkan alamat email lengkap." }, 400)

  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1").bind(id).first<any>()
  if (!user) return c.json({ status: "error", message: "Akun tidak ditemukan." }, 404)
  
  if (user.email_verified === 0) {
    return c.json({ status: "error", message: "Akun belum aktif! Silakan cek Inbox/Spam email Anda." }, 403)
  }

  const otp = generateOTP()
  await c.env.DB_SSO.prepare("DELETE FROM otp_codes WHERE user_id = ?").bind(user.id).run()
  await c.env.DB_SSO.prepare(
    "INSERT INTO otp_codes (otp_id, user_id, email, code, method, expires_at) VALUES (?, ?, ?, ?, 'email', datetime('now', '+5 minutes'))"
  ).bind(crypto.randomUUID(), user.id, user.email, otp).run()
  
  try { await sendMail(c.env, user.email, otp, 'login'); } catch (e) {}
  return c.json({ status: "ok", message: "Kode OTP telah dikirim ke email Anda." })
})

auth.post('/login-otp', async (c) => {
  const body = await c.req.json<any>()
  const ipAddress = getClientIp(c)
  const userAgent = c.req.header('user-agent') || 'unknown'
  const id = (body.identifier || "").trim().toLowerCase()

  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1").bind(id).first<any>()
  if (!user) return c.json({ status: "error", message: "Akun tidak ditemukan." }, 404)
  
  const otpRow = await c.env.DB_SSO.prepare("SELECT * FROM otp_codes WHERE user_id = ? AND code = ? AND expires_at > datetime('now')").bind(user.id, body.otp).first<any>()
  if (!otpRow) return c.json({ status: "error", message: "Kode OTP salah atau sudah kadaluarsa." }, 400)
  
  await c.env.DB_SSO.prepare("DELETE FROM otp_codes WHERE otp_id = ?").bind(otpRow.otp_id).run()
  const session = await createSession(c, user, ipAddress, userAgent)
  return c.json({ status: "ok", redirect_url: session.redirectUrl })
})

/**
 * ========================================
 * 3. MANAJEMEN SESI (SILENT AUTH)
 * ========================================
 */
auth.get('/me', async (c) => {
  const sid = getCookie(c, 'sid')
  if (!sid) return c.json({ status: 'error', message: 'Sesi tidak ditemukan.' }, 401)

  const session = await c.env.DB_SSO.prepare(
    "SELECT * FROM sessions WHERE session_id = ? AND expires_at > datetime('now') AND is_active = 1"
  ).bind(sid).first<any>()
  
  if (!session) return c.json({ status: 'error', message: 'Sesi telah kadaluarsa.' }, 401)

  const user = await c.env.DB_SSO.prepare(
    "SELECT id, email, phone, first_name, last_name, user_type, is_active FROM users WHERE id = ?"
  ).bind(session.user_id).first<any>() 
  
  if (!user || user.is_active === 0) return c.json({ status: 'error', message: 'Akun dinonaktifkan.' }, 401)

  const portalUrl = await getPortalUrl(c.env, user, sid)
  return c.json({ status: 'ok', user, redirect_url: portalUrl })
})

auth.post('/logout', async (c) => {
  const sid = getCookie(c, 'sid')
  if (sid) {
    await c.env.DB_SSO.prepare('UPDATE sessions SET is_active = 0 WHERE session_id = ?').bind(sid).run()
  }
  deleteCookie(c, 'sid', getCookieOpts(c.env))
  return c.json({ status: 'ok', message: 'Anda telah keluar dengan aman.' })
})

/**
 * ========================================
 * 4. UPDATE DATA PROFIL SSO (NAMA & KONTAK)
 * ========================================
 */
auth.put('/update-sso', async (c) => {
  try {
    let userId = null;
    const sid = getCookie(c, 'sid');
    
    if (sid) {
      const session = await c.env.DB_SSO.prepare("SELECT user_id FROM sessions WHERE session_id = ? AND is_active = 1").bind(sid).first<any>();
      if (session) userId = session.user_id;
    }
    
    if (!userId) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
           const payloadStr = atob(token.split('.')[1]);
           const payload = JSON.parse(payloadStr);
           userId = payload.sub;
        } catch(e) {}
      }
    }

    if (!userId) return c.json({ status: 'error', message: 'Sesi tidak valid atau telah berakhir.' }, 401);

    const body = await c.req.json<any>();

    if (body.email) {
       const user = await c.env.DB_SSO.prepare("SELECT email FROM users WHERE id = ?").bind(userId).first<any>();
       if (user && user.email !== body.email) {
           const otp = generateOTP();
           await c.env.DB_SSO.prepare("DELETE FROM otp_codes WHERE user_id = ? AND method = 'email'").bind(userId).run();
           await c.env.DB_SSO.prepare(
             "INSERT INTO otp_codes (otp_id, user_id, email, code, method, expires_at) VALUES (?, ?, ?, ?, 'email', datetime('now', '+5 minutes'))"
           ).bind(crypto.randomUUID(), userId, user.email, otp).run();
           
           try { await sendMail(c.env, user.email, otp, 'login'); } catch (e) {}
           return c.json({ status: 'requires_verification' });
       }
    }

    await c.env.DB_SSO.prepare(`
      UPDATE users SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
        body.first_name || null, 
        body.last_name || null, 
        body.phone || null, 
        userId
    ).run();

    return c.json({ status: 'ok', message: 'Data SSO berhasil diperbarui' });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

/**
 * ========================================
 * 5. ENDPOINT KEAMANAN & PENGATURAN AKUN
 * ========================================
 */

// Helper untuk mengambil userId dari Token Bearer yang dikirim oleh sso-settings.html
async function getUserIdFromBearer(c: Context) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const payloadStr = atob(token.split('.')[1]);
    const payload = JSON.parse(payloadStr);
    return payload.sub; // user ID
  } catch(e) { return null; }
}

// A. Verifikasi OTP untuk Perubahan Email
auth.post('/verify-email-change', async (c) => {
  try {
    const userId = await getUserIdFromBearer(c);
    if (!userId) return c.json({ status: 'error', message: 'Sesi tidak valid.' }, 401);

    const body = await c.req.json<any>();
    
    // Cek OTP yang valid
    const otpRow = await c.env.DB_SSO.prepare(
      "SELECT * FROM otp_codes WHERE user_id = ? AND code = ? AND method = 'email' AND expires_at > datetime('now')"
    ).bind(userId, body.otp).first<any>();

    if (!otpRow) return c.json({ status: 'error', message: 'OTP salah atau sudah kedaluwarsa.' }, 400);

    // Update Email
    await c.env.DB_SSO.prepare("UPDATE users SET email = ? WHERE id = ?").bind(body.new_email, userId).run();
    await c.env.DB_SSO.prepare("DELETE FROM otp_codes WHERE otp_id = ?").bind(otpRow.otp_id).run();

    return c.json({ status: 'ok', message: 'Email berhasil diubah.' });
  } catch (error: any) { return c.json({ status: 'error', message: error.message }, 500); }
});

// B. Ganti Password Saat Sedang Login
auth.post('/change-password', async (c) => {
  try {
    const userId = await getUserIdFromBearer(c);
    if (!userId) return c.json({ status: 'error', message: 'Sesi tidak valid.' }, 401);

    const body = await c.req.json<any>();
    const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<any>();

    const cryptoCfg = getCryptoConfig(c.env);
    
    // Verifikasi Password Lama
    const oldValid = await verifyPasswordPBKDF2(body.old_password, user.password_hash, user.password_salt, cryptoCfg.pepper, cryptoCfg.iter);
    if (!oldValid) return c.json({ status: 'error', message: 'Kata sandi saat ini salah.' }, 400);

    // Hash Password Baru
    const { salt, hash } = await hashPasswordPBKDF2(body.new_password, cryptoCfg.pepper, cryptoCfg.iter);

    // Update ke Database
    await c.env.DB_SSO.prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?").bind(hash, salt, userId).run();

    return c.json({ status: 'ok', message: 'Kata sandi berhasil diperbarui.' });
  } catch (error: any) { return c.json({ status: 'error', message: error.message }, 500); }
});

// C. Atur/Ubah PIN Login 6 Digit
auth.post('/setup-pin-logged-in', async (c) => {
  try {
    const userId = await getUserIdFromBearer(c);
    if (!userId) return c.json({ status: 'error', message: 'Sesi tidak valid.' }, 401);

    const body = await c.req.json<any>();
    if (!body.pin || body.pin.length !== 6) return c.json({ status: 'error', message: 'PIN harus 6 digit.' }, 400);

    const cryptoCfg = getCryptoConfig(c.env);
    
    // Hash PIN (menggunakan algoritma yang sama dengan password untuk keamanan)
    const { salt, hash } = await hashPasswordPBKDF2(body.pin, cryptoCfg.pepper, cryptoCfg.iter);

    await c.env.DB_SSO.prepare("UPDATE users SET pin_hash = ?, pin_salt = ?, pin_required = 1 WHERE id = ?").bind(hash, salt, userId).run();

    return c.json({ status: 'ok', message: 'PIN berhasil disetel.' });
  } catch (error: any) { return c.json({ status: 'error', message: error.message }, 500); }
});

export default auth