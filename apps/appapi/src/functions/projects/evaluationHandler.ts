import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { evalSchema } from '../system/systemSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.post('/:project_id/post-mortems', requireRole(['admin', 'client']), zValidator('json', evalSchema), async (c) => {
  const body = c.req.valid('json')
  const evalId = crypto.randomUUID()
  
  try {
    await c.env.DB_CORE.prepare('INSERT INTO project_evaluations (eval_id, project_id, feedback, rating) VALUES (?, ?, ?, ?)')
      .bind(evalId, c.req.param('project_id'), body.feedback, body.rating).run()
    return c.json({ status: 'ok', id: evalId }, 201)
  } catch (e) {
    return c.json({ status: 'error', message: 'Evaluasi untuk project ini sudah ada' }, 400)
  }
})

export default router
