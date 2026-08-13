import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { disputeSchema } from './systemSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.post('/report', zValidator('json', disputeSchema), async (c) => {
  const body = c.req.valid('json')
  const ticketId = crypto.randomUUID()
  const reporterId = c.get('userId')
  
  await c.env.DB_CORE.prepare('INSERT INTO dispute_tickets (ticket_id, reporter_user_id, project_id, issue) VALUES (?, ?, ?, ?)')
    .bind(ticketId, reporterId, body.project_id || null, body.issue).run()
  return c.json({ status: 'ok', id: ticketId }, 201)
})

router.get('/tickets', requireRole(['admin', 'superadmin']), async (c) => {
  const { results } = await c.env.DB_CORE.prepare('SELECT * FROM dispute_tickets ORDER BY ticket_id DESC').all()
  return c.json({ status: 'ok', data: results || [] })
})

export default router
