import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createRateCardSchema } from './talentSchemas'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.get('/:talent_id/rate-cards', async (c) => {
  const { results } = await c.env.DB_CORE.prepare('SELECT * FROM talent_rate_cards WHERE talent_id = ?').bind(c.req.param('talent_id')).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.post('/:talent_id/rate-cards', zValidator('json', createRateCardSchema), async (c) => {
  const body = c.req.valid('json')
  const rateId = crypto.randomUUID()
  try {
    await c.env.DB_CORE.prepare('INSERT INTO talent_rate_cards (rate_id, talent_id, service_name, amount) VALUES (?, ?, ?, ?)')
      .bind(rateId, c.req.param('talent_id'), body.service_name, body.amount).run()
    return c.json({ status: 'ok', id: rateId }, 201)
  } catch (e) {
    return c.json({ status: 'error', message: 'Service name duplicate or error' }, 400)
  }
})
export default router
