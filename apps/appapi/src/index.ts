import { Hono } from 'hono'
import { verify } from 'hono/jwt'

// 1. Deklarasi Bindings (Environment/Database)
type Bindings = {
  DB_CORE: D1Database
  CACHE_KV: KVNamespace
  JWT_SECRET: string
}

// 2. Deklarasi Variables (Data yang dilempar antar middleware)
type Variables = {
  userId: string
  userRole: string
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Endpoint Publik (Tidak perlu login, misal untuk health check)
app.get('/', (c) => c.json({ service: 'API Core', status: 'online' }))
app.get('/health', (c) => c.json({ db: 'connected', kv: 'ready' }))

// ==========================================
// 3. MIDDLEWARE OTENTIKASI JWT
// ==========================================
// Middleware ini akan melindungi semua rute yang berawalan /api/*
app.use('/api/*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  // Cek apakah header Authorization ada dan berformat "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ 
      success: false, 
      error: 'Akses ditolak. Token tidak ditemukan (Unauthorized).' 
    }, 401)
  }

  const token = authHeader.split(' ')[1]

  try {
    // Verifikasi token menggunakan secret yang sama dengan appsso
    const payload = await verify(token, c.env.JWT_SECRET)
    
    // Simpan data dari token ke dalam Context Hono (Aman & Type-Safe)
    c.set('userId', payload.sub as string)
    c.set('userRole', payload.role as string)
    
    // Lanjut ke endpoint tujuan
    await next()
  } catch (err) {
    // Jika token kadaluarsa atau dimanipulasi
    return c.json({ 
      success: false, 
      error: 'Token tidak valid atau sudah kadaluarsa.' 
    }, 401)
  }
})

// ==========================================
// 4. PROTECTED ENDPOINTS (Butuh Login)
// ==========================================

// Endpoint profil (Bisa diakses talent maupun client)
app.get('/api/profile/me', async (c) => {
  // Mengambil data yang disuntikkan oleh middleware tadi
  const userId = c.get('userId')
  const userRole = c.get('userRole')

  // TODO: Query ke DB_CORE berdasarkan userId untuk ambil profil lengkap
  // const profile = await c.env.DB_CORE.prepare('SELECT * FROM talents WHERE user_id = ?').bind(userId).first()

  return c.json({
    success: true,
    message: "Data profil berhasil diambil",
    source: "MOCK_DATA",
    data: {
      userId,
      role: userRole,
      status: "Verified"
    }
  })
})

// Endpoint khusus Admin (Contoh Role-Based Access Control / RBAC)
app.get('/api/admin/dashboard', async (c) => {
  const userRole = c.get('userRole')

  if (userRole !== 'admin') {
    return c.json({ 
      success: false, 
      error: 'Akses ditolak. Endpoint ini hanya untuk Admin.' 
    }, 403) // 403 Forbidden
  }

  return c.json({
    success: true,
    data: { activeProjects: 12, newTalents: 5 }
  })
})

export default app
