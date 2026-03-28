import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { hashData, verifyTurnstile, sendMail } from '../utils'

type Bindings = { DB_SSO: D1Database; TURNSTILE_SECRET: string; RESEND_API_KEY?: string }
const auth = new Hono<{ Bindings: Bindings }>()

const SESSION_EXPIRY = 259200
const COOKIE_OPTS = { domain: '.orlandmanagement.com', path: '/', httpOnly: true, secure: true, sameSite: 'None' as const }

// MODIFIKASI: Menambahkan token ke URL agar ditangkap Appclient
const getPortalUrl = (role: string, token: string) => {
  const baseUrl = role === 'client' ? 'https://client.orlandmanagement.com/dashboard' : 'https://talent.orlandmanagement.com/dashboard';
  return `${baseUrl}?token=${token}&role=${role}`;
}

const getNow = () => Math.floor(Date.now() / 1000)

auth.get('/me', async (c) => {
  const sid = getCookie(c, 'sid')
  if (!sid) return c.json({ status: "error", message: "Tidak ada sesi" }, 401)
  const session = await c.env.DB_SSO.prepare("SELECT * FROM sessions WHERE id=? AND expires_at > ?").bind(sid, getNow()).first<any>()
  if (!session) return c.json({ status: "error", message: "Sesi kadaluarsa" }, 401)
  const user = await c.env.DB_SSO.prepare("SELECT id, full_name, email, role, status FROM users WHERE id=?").bind(session.user_id).first<any>()
  if (!user || user.status === 'deleted') return c.json({ status: "error", message: "Akun tidak ditemukan" }, 404)
  return c.json({ status: "ok", user, redirect_url: getPortalUrl(user.role, sid) })
})

auth.post('/logout', async (c) => {
  const sid = getCookie(c, 'sid')
  if (sid) await c.env.DB_SSO.prepare("DELETE FROM sessions WHERE id=?").bind(sid).run()
  deleteCookie(c, 'sid', COOKIE_OPTS)
  return c.json({ status: "ok", message: "Logout Sukses" })
})

auth.post('/register', async (c) => {
  const body = await c.req.json()
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const isHuman = await verifyTurnstile(body.turnstile_token, ip, c.env.TURNSTILE_SECRET)
  if (!isHuman) return c.json({ status: "error", message: "Verifikasi keamanan gagal." }, 400)
  
  const cleanEmail = (body.email || "").trim().toLowerCase()
  const existingUser = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE (email=? OR phone=?) AND status != 'deleted'").bind(cleanEmail, cleanEmail).first<any>()
  if (existingUser) return c.json({ status: "error", message: "Email sudah terdaftar." }, 400)
  
  const hashedPw = await hashData(body.password)
  const userId = crypto.randomUUID()
  const now = getNow()
  
  await c.env.DB_SSO.prepare("INSERT INTO users (id, full_name, email, phone, role, password_hash, status, created_at) VALUES (?,?,?,?,?,?,'pending',?)")
    .bind(userId, body.fullName, cleanEmail, body.phone, body.role, hashedPw, now).run()
  
  const tokenUUID = crypto.randomUUID().replace(/-/g, '')
  await c.env.DB_SSO.prepare("INSERT INTO otp_requests (id, identifier, code, purpose, expires_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), cleanEmail, tokenUUID, 'activation', now + 86400).run()
  await sendMail(c.env, cleanEmail, tokenUUID, 'activation')
  
  return c.json({ status: "ok", message: "Registrasi Sukses! Cek Email." })
})

auth.post('/verify-activation', async (c) => {
  const body = await c.req.json()
  const now = getNow()
  const tokenRow = await c.env.DB_SSO.prepare("SELECT * FROM otp_requests WHERE code=? AND purpose='activation' AND expires_at > ?").bind(body.token, now).first<any>()
  if (!tokenRow) return c.json({ status: "error", message: "Tautan Aktivasi tidak valid/kadaluarsa." }, 400)
  
  await c.env.DB_SSO.prepare("UPDATE users SET status='active' WHERE email=?").bind(tokenRow.identifier).run()
  await c.env.DB_SSO.prepare("DELETE FROM otp_requests WHERE id=?").bind(tokenRow.id).run()
  
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE email=?").bind(tokenRow.identifier).first<any>()
  const sid = crypto.randomUUID()
  await c.env.DB_SSO.prepare("INSERT INTO sessions (id, user_id, role, created_at, expires_at) VALUES (?,?,?,?,?)").bind(sid, user.id, user.role, now, now + SESSION_EXPIRY).run()
  setCookie(c, 'sid', sid, { ...COOKIE_OPTS, maxAge: SESSION_EXPIRY })
  return c.json({ status: "ok", role: user.role, redirect_url: getPortalUrl(user.role, sid) })
})

auth.post('/login-password', async (c) => {
  const body = await c.req.json()
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const isHuman = await verifyTurnstile(body.turnstile_token, ip, c.env.TURNSTILE_SECRET)
  if (!isHuman) return c.json({ status: "error", message: "Verifikasi keamanan gagal." }, 400)
  
  const id = (body.identifier || "").trim().toLowerCase()
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE (email=? OR phone=?) AND status != 'deleted'").bind(id, id).first<any>()
  const now = getNow()
  
  if (!user) return c.json({ status: "error", message: "Kredensial salah." }, 401)
  if (user.locked_until && user.locked_until > now) return c.json({ status: "error", message: "Akun terkunci. Coba lagi nanti." }, 429)

  const hashInput = await hashData(body.password)
  if (user.password_hash !== hashInput) {
    const fails = (user.fail_count || 0) + 1
    if (fails >= 5) {
      await c.env.DB_SSO.prepare("UPDATE users SET fail_count=?, locked_until=? WHERE id=?").bind(fails, now + 900, user.id).run()
      return c.json({ status: "error", message: "Gagal 5x. Akun dikunci 15 menit." }, 429)
    }
    await c.env.DB_SSO.prepare("UPDATE users SET fail_count=? WHERE id=?").bind(fails, user.id).run()
    return c.json({ status: "error", message: `Password salah. (Sisa percobaan: ${5 - fails})` }, 401)
  }

  if (user.status === 'pending') {
    return c.json({ status: "error", message: "Akun belum aktif! Cek email." }, 403)
  }

  await c.env.DB_SSO.prepare("UPDATE users SET fail_count=0, locked_until=NULL WHERE id=?").bind(user.id).run()
  const sid = crypto.randomUUID()
  await c.env.DB_SSO.prepare("INSERT INTO sessions (id, user_id, role, created_at, expires_at) VALUES (?,?,?,?,?)").bind(sid, user.id, user.role, now, now + SESSION_EXPIRY).run()
  setCookie(c, 'sid', sid, { ...COOKIE_OPTS, maxAge: SESSION_EXPIRY })
  return c.json({ status: "ok", redirect_url: getPortalUrl(user.role, sid) })
})

auth.post('/request-otp', async (c) => {
  const body = await c.req.json()
  const id = (body.identifier || "").trim().toLowerCase()
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE (email=? OR phone=?) AND status != 'deleted'").bind(id, id).first<any>()
  if (!user) return c.json({ status: "error", message: "Akun tidak ditemukan." }, 404)
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const now = getNow()
  
  await c.env.DB_SSO.prepare("DELETE FROM otp_requests WHERE identifier=? AND purpose=?").bind(user.email, body.purpose).run()
  await c.env.DB_SSO.prepare("INSERT INTO otp_requests (id, identifier, code, purpose, expires_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), user.email, otp, body.purpose, now + 180).run()
  await sendMail(c.env, user.email, otp, body.purpose)
  return c.json({ status: "ok", message: "OTP Terkirim." })
})

auth.post('/login-otp', async (c) => handleOtpVerify(c, 'login'))
auth.post('/setup-pin', async (c) => handleOtpVerify(c, 'setup-pin'))

async function handleOtpVerify(c: any, actionType: string) {
  const body = await c.req.json()
  const id = (body.identifier || "").trim().toLowerCase()
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE (email=? OR phone=?) AND status != 'deleted'").bind(id, id).first<any>()
  if (!user) return c.json({ status: "error", message: "Akun tidak ditemukan." }, 404)
  
  const purp = actionType === "login" ? "login" : "setup-pin"
  const now = getNow()
  const otpRow = await c.env.DB_SSO.prepare("SELECT * FROM otp_requests WHERE identifier=? AND code=? AND purpose=? AND expires_at > ?").bind(user.email, body.otp, purp, now).first<any>()
  if (!otpRow) return c.json({ status: "error", message: "OTP salah/expired." }, 400)
  
  await c.env.DB_SSO.prepare("DELETE FROM otp_requests WHERE id=?").bind(otpRow.id).run()
  
  if (actionType === "setup-pin") {
    const hashedPin = await hashData(body.new_pin)
    await c.env.DB_SSO.prepare("UPDATE users SET pin_hash=? WHERE id=?").bind(hashedPin, user.id).run()
  }
  
  const sid = crypto.randomUUID()
  await c.env.DB_SSO.prepare("INSERT INTO sessions (id, user_id, role, created_at, expires_at) VALUES (?,?,?,?,?)").bind(sid, user.id, user.role, now, now + SESSION_EXPIRY).run()
  setCookie(c, 'sid', sid, { ...COOKIE_OPTS, maxAge: SESSION_EXPIRY })
  return c.json({ status: "ok", redirect_url: getPortalUrl(user.role, sid) })
}

auth.post('/check-pin', async (c) => {
  const body = await c.req.json()
  const id = (body.identifier || "").trim().toLowerCase()
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE (email=? OR phone=?) AND status != 'deleted'").bind(id, id).first<any>()
  if (!user) return c.json({ status: "error", message: "Akun tidak ditemukan." }, 404)
  return c.json({ status: "ok", has_pin: !!user.pin_hash, email: user.email })
})

auth.post('/login-pin', async (c) => {
  const body = await c.req.json()
  const id = (body.identifier || "").trim().toLowerCase()
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE (email=? OR phone=?) AND status != 'deleted'").bind(id, id).first<any>()
  if (!user) return c.json({ status: "error", message: "Akun tidak ditemukan." }, 404)
  
  const hashInput = await hashData(body.pin)
  if (user.pin_hash !== hashInput) return c.json({ status: "error", message: "PIN salah." }, 401)
  
  const now = getNow()
  const sid = crypto.randomUUID()
  await c.env.DB_SSO.prepare("INSERT INTO sessions (id, user_id, role, created_at, expires_at) VALUES (?,?,?,?,?)").bind(sid, user.id, user.role, now, now + SESSION_EXPIRY).run()
  setCookie(c, 'sid', sid, { ...COOKIE_OPTS, maxAge: SESSION_EXPIRY })
  return c.json({ status: "ok", redirect_url: getPortalUrl(user.role, sid) })
})

auth.post('/request-reset', async (c) => {
  const body = await c.req.json()
  const id = (body.identifier || "").trim().toLowerCase()
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE (email=? OR phone=?) AND status != 'deleted'").bind(id, id).first<any>()
  if (!user) return c.json({ status: "error", message: "Akun tidak ditemukan." }, 404)
  
  const tokenUUID = crypto.randomUUID().replace(/-/g, '')
  const now = getNow()
  await c.env.DB_SSO.prepare("DELETE FROM otp_requests WHERE identifier=? AND purpose=?").bind(user.email, 'reset').run()
  await c.env.DB_SSO.prepare("INSERT INTO otp_requests (id, identifier, code, purpose, expires_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), user.email, tokenUUID, 'reset', now + 1800).run()
  await sendMail(c.env, user.email, tokenUUID, 'reset')
  return c.json({ status: "ok", message: "Link reset terkirim." })
})

auth.post('/reset-password', async (c) => {
  const body = await c.req.json()
  const now = getNow()
  const tokenRow = await c.env.DB_SSO.prepare("SELECT * FROM otp_requests WHERE code=? AND purpose='reset' AND expires_at > ?").bind(body.token, now).first<any>()
  if (!tokenRow) return c.json({ status: "error", message: "Token tidak valid/kadaluarsa." }, 400)
  
  const hashedPw = await hashData(body.new_password)
  await c.env.DB_SSO.prepare("UPDATE users SET password_hash=? WHERE email=?").bind(hashedPw, tokenRow.identifier).run()
  await c.env.DB_SSO.prepare("DELETE FROM otp_requests WHERE id=?").bind(tokenRow.id).run()
  
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE email=?").bind(tokenRow.identifier).first<any>()
  if (user) await c.env.DB_SSO.prepare("DELETE FROM sessions WHERE user_id=?").bind(user.id).run()
  return c.json({ status: "ok", message: "Password berhasil diubah." })
})

export default auth
