import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { notifQuerySchema } from './notificationSchemas'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Auth(All) - Semua role bisa mengakses notifikasinya sendiri
router.get('/', zValidator('query', notifQuerySchema), async (c) => {
  const userId = c.get('userId')
  const { limit, offset } = c.req.valid('query')
  
  const { results } = await c.env.DB_LOGS.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(userId, Math.min(parseInt(limit), 50), parseInt(offset)).all()
    
  // Hitung jumlah notifikasi yang belum dibaca
  const unreadCount = await c.env.DB_LOGS.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
    .bind(userId).first<{count: number}>()
    
  return c.json({ status: 'ok', unread_count: unreadCount?.count || 0, data: results || [] })
})

router.put('/:notif_id/read', async (c) => {
  const userId = c.get('userId')
  const notifId = c.req.param('notif_id')
  
  await c.env.DB_LOGS.prepare('UPDATE notifications SET is_read = 1 WHERE notif_id = ? AND user_id = ?')
    .bind(notifId, userId).run()
    
  return c.json({ status: 'ok', message: 'Notifikasi dibaca' })
})

router.put('/read-all', async (c) => {
  const userId = c.get('userId')
  await c.env.DB_LOGS.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')
    .bind(userId).run()
    
  return c.json({ status: 'ok', message: 'Semua notifikasi dibaca' })
})

export default router
