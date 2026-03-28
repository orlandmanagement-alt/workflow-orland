import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { threadQuerySchema, sendMessageSchema } from './messageSchemas'
import { Bindings, Variables } from '../../index'
import { sanitizeMessage } from '../../utils/wordFilter';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET: Mengambil riwayat percakapan dari thread tertentu
router.get('/', zValidator('query', threadQuerySchema), async (c) => {
  const { thread_id, limit, offset } = c.req.valid('query')
  // TODO: Verifikasi apakah user saat ini memiliki akses ke thread_id ini (misal cek relasi project_id)
  
  const { results } = await c.env.DB_LOGS.prepare('SELECT * FROM messages WHERE thread_id = ? ORDER BY sent_at DESC LIMIT ? OFFSET ?')
    .bind(thread_id, Math.min(parseInt(limit), 50), parseInt(offset)).all()
    
  return c.json({ status: 'ok', data: results || [] })
})

// POST: Mengirim pesan ke thread tertentu
router.post('/:thread_id/send', zValidator('json', sendMessageSchema), async (c) => {
  const body = c.req.valid('json')
  const threadId = c.req.param('thread_id')
  const senderId = c.get('userId')
  const messageId = crypto.randomUUID()
  
  // TODO: Sama seperti GET, pastikan sender_id diizinkan mengirim ke thread_id ini
  await c.env.DB_LOGS.prepare('INSERT INTO messages (message_id, thread_id, sender_id, body) VALUES (?, ?, ?, ?)')
    .bind(messageId, threadId, senderId, body.body).run()
    
  return c.json({ status: 'ok', id: messageId }, 201)
})

export default router
