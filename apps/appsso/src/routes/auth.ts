import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'
import { hashData, verifyTurnstile, sendMail } from '../utils'

type Bindings = { DB_SSO: D1Database; TURNSTILE_SECRET: string; JWT_SECRET: string; TALENT_URL: string; CLIENT_URL: string; }
const auth = new Hono<{ Bindings: Bindings }>()

const SESSION_EXPIRY = 259200 // 3 Hari
const COOKIE_OPTS = { domain: '.orlandmanagement.com', path: '/', httpOnly: true, secure: true, sameSite: 'None' as const }

// SOLUSI: Fungsi pembuat JWT yang memasukkan 'sub' (User ID) dan 'role'
async function generateJWT(env: Bindings, user: any) {
  const payload = { sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + SESSION_EXPIRY }
  // Pastikan JWT_SECRET diset di Cloudflare Dashboard SSO Anda
  return await sign(payload, env.JWT_SECRET || 'orland-rahasia-utama-123') 
}

const getStandardCallbackUrl = (env: Bindings, role: string, token: string) => {
  const baseUrl = role === 'client' ? (env.CLIENT_URL || 'https://client.orlandmanagement.com') : (env.TALENT_URL || 'https://talent.orlandmanagement.com');
  return `${baseUrl}/auth/callback?token=${token}`;
}

auth.post('/login-password', async (c) => {
  const body = await c.req.json()
  const id = (body.identifier || "").trim().toLowerCase()
  const user = await c.env.DB_SSO.prepare("SELECT * FROM users WHERE (email=? OR phone=?) AND status != 'deleted'").bind(id, id).first<any>()
  
  if (!user) return c.json({ status: "error", message: "Kredensial salah." }, 401)
  const hashInput = await hashData(body.password)
  if (user.password_hash !== hashInput) return c.json({ status: "error", message: "Password salah." }, 401)

  const jwtToken = await generateJWT(c.env, user)
  setCookie(c, 'sid', jwtToken, { ...COOKIE_OPTS, maxAge: SESSION_EXPIRY })
  
  return c.json({ status: "ok", token: jwtToken, redirect_url: getStandardCallbackUrl(c.env, user.role, jwtToken) })
})

auth.get('/me', async (c) => {
  const jwtToken = getCookie(c, 'sid')
  if (!jwtToken) return c.json({ status: "error", message: "Tidak ada sesi" }, 401)
  try {
    const payload = await verify(jwtToken, c.env.JWT_SECRET || 'orland-rahasia-utama-123')
    const user = await c.env.DB_SSO.prepare("SELECT id, full_name, email, role FROM users WHERE id=?").bind(payload.sub).first<any>()
    return c.json({ status: "ok", user, token: jwtToken, redirect_url: getStandardCallbackUrl(c.env, user.role, jwtToken) })
  } catch (err) {
    return c.json({ status: "error", message: "Sesi kadaluarsa" }, 401)
  }
})

auth.post('/logout', async (c) => {
  deleteCookie(c, 'sid', COOKIE_OPTS)
  return c.json({ status: "ok", message: "Logout Sukses" })
})


// --- ENDPOINT REGISTRASI BARU ---
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { fullName, email, phone, password, role, turnstile_token } = body;

    // 1. Validasi Keamanan (Captcha)
    const ip = c.req.header('CF-Connecting-IP') || '';
    const isHuman = await verifyTurnstile(turnstile_token, ip, c.env.TURNSTILE_SECRET);
    if (!isHuman) {
      return c.json({ status: "error", message: "Verifikasi keamanan (Captcha) gagal." }, 400);
    }

    // 2. Cek Duplikat Akun (Anti-Crash)
    const idEmail = (email || "").trim().toLowerCase();
    const existing = await c.env.DB_SSO.prepare("SELECT id FROM users WHERE email=? OR phone=?").bind(idEmail, phone).first();
    if (existing) {
      return c.json({ status: "error", message: "Email atau Nomor HP sudah terdaftar." }, 400);
    }

    // 3. Enkripsi Password & Siapkan Token Aktivasi
    const passHash = await hashData(password);
    const newId = crypto.randomUUID(); // Buat ID Unik
    const actToken = crypto.randomUUID();
    const userRole = role ? role.toUpperCase() : 'CLIENT';

    // 4. Simpan ke Database D1
    await c.env.DB_SSO.prepare(
      "INSERT INTO users (id, full_name, email, phone, password_hash, role, status, activation_token) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)"
    ).bind(newId, fullName, idEmail, phone, passHash, userRole, actToken).run();

    // 5. Kirim Email Aktivasi (Menggunakan utils.ts)
    await sendMail(c.env, idEmail, actToken, 'activation');

    return c.json({ status: "ok", message: "Registrasi berhasil, silakan cek email." });

  } catch (err) {
    console.error("Register API Error:", err);
    return c.json({ status: "error", message: "Terjadi kesalahan pada server database." }, 500);
  }
});

export default auth
