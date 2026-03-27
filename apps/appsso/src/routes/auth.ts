import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'
import { hashData, verifyTurnstile, sendMail } from '../utils'

type Bindings = { DB_SSO: D1Database; TURNSTILE_SECRET: string; JWT_SECRET: string; TALENT_URL: string; CLIENT_URL: string; }
const auth = new Hono<{ Bindings: Bindings }>()

const SESSION_EXPIRY = 259200 // 3 Hari
const COOKIE_OPTS = { domain: '.orlandmanagement.com', path: '/', httpOnly: true, secure: true, sameSite: 'None' as const }

// FUNGSI PEMBUAT JWT
async function generateJWT(env: Bindings, user: any) {
  const payload = {
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_EXPIRY
  }
  // JWT_SECRET HARUS diset di wrangler.toml atau .dev.vars milik appsso!
  return await sign(payload, env.JWT_SECRET || 'orland-secret-key') 
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

  // Buat JWT Token
  const jwtToken = await generateJWT(c.env, user)
  
  // Set JWT di Cookie untuk fallback SSO internal
  setCookie(c, 'sid', jwtToken, { ...COOKIE_OPTS, maxAge: SESSION_EXPIRY })
  
  // Kirim JWT Token ke Frontend
  return c.json({ 
    status: "ok", 
    token: jwtToken, 
    redirect_url: getStandardCallbackUrl(c.env, user.role, jwtToken) 
  })
})

auth.get('/me', async (c) => {
  const jwtToken = getCookie(c, 'sid')
  if (!jwtToken) return c.json({ status: "error", message: "Tidak ada sesi" }, 401)
  
  try {
    const payload = await verify(jwtToken, c.env.JWT_SECRET || 'orland-secret-key')
    const user = await c.env.DB_SSO.prepare("SELECT id, full_name, email, role FROM users WHERE id=?").bind(payload.sub).first<any>()
    return c.json({ 
      status: "ok", user, token: jwtToken, 
      redirect_url: getStandardCallbackUrl(c.env, user.role, jwtToken) 
    })
  } catch (err) {
    return c.json({ status: "error", message: "Sesi kadaluarsa" }, 401)
  }
})

auth.post('/logout', async (c) => {
  deleteCookie(c, 'sid', COOKIE_OPTS)
  return c.json({ status: "ok", message: "Logout Sukses" })
})

export default auth
