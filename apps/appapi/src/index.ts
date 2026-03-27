import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { verify } from 'hono/jwt'

import talentRouter from './functions/talents/talentHandler'
// ... (Import router lainnya dipertahankan di file asli, script ini menyuntikkan middleware-nya saja) ...

export type Bindings = { DB_CORE: D1Database; DB_SSO: D1Database; JWT_SECRET: string; }
export type Variables = { userId: string; userRole: string }

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('*', cors({ 
  origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization']
}))

// MIDDLEWARE AUTHENTICATION (PURE JWT - TANPA QUERY DATABASE)
app.use('/api/v1/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return await next() // Bebaskan Preflight
  if (c.req.path.startsWith('/api/v1/verify/') || c.req.path.startsWith('/api/v1/public/')) return await next()
  
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ status: "error", message: "Unauthorized: Token JWT tidak ditemukan" }, 401)
  }
  
  try {
    const jwtToken = authHeader.split(' ')[1]
    
    // VERIFIKASI JWT STATeless (Sangat Cepat)
    const payload = await verify(jwtToken, c.env.JWT_SECRET || 'orland-secret-key')
    
    // Inject data KTP ke semua request selanjutnya
    c.set('userId', payload.sub as string)
    c.set('userRole', payload.role as string)
    
    await next()
  } catch (err) { 
    return c.json({ status: "error", message: "Unauthorized: JWT Tidak Valid atau Expired" }, 401) 
  }
})

app.get('/health', (c) => c.json({ status: 'Online' }))
app.route('/api/v1/talents', talentRouter)
// ... Router lainnya terhubung otomatis ...

export default app
