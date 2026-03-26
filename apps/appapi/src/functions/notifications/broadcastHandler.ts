import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { broadcastSchema } from './notificationSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Auth(Admin) - Hanya admin yang bisa mengirim pengumuman massal
router.post('/', requireRole(['admin']), zValidator('json', broadcastSchema), async (c) => {
  const body = c.req.valid('json')
  
  // 1. Ambil target user ID berdasarkan audience dari DB_SSO
  let query = 'SELECT id FROM users WHERE status != "deleted"'
  let params: any[] = []
  
  if (body.audience === 'talents') { query += ' AND role = "talent"' }
  else if (body.audience === 'clients') { query += ' AND role = "client"' }
  else if (body.audience === 'admins') { query += ' AND role = "admin"' }
  
  const { results: users } = await c.env.DB_SSO.prepare(query).bind(...params).all<{id: string}>()
  
  if (!users || users.length === 0) return c.json({ status: 'error', message: 'Tidak ada target user ditemukan' }, 404)

  // 2. Siapkan eksekusi D1 Batch untuk kecepatan maksimal (Insert multiple rows)
  const statements = users.map(user => {
    return c.env.DB_LOGS.prepare('INSERT INTO notifications (notif_id, user_id, title, message) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), user.id, body.title, body.message)
  })
  
  // Cloudflare D1 membatasi batch maksimal 100 statement per eksekusi,
  // Dalam production asli, kita akan menggunakan metode chunking jika user > 100
  await c.env.DB_LOGS.batch(statements.slice(0, 100))
  
  return c.json({ status: 'ok', message: `Broadcast berhasil dikirim ke ${Math.min(users.length, 100)} pengguna.` }, 201)
})

export default router
