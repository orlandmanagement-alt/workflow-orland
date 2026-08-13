import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createExpSchema, updateExpSchema } from './talentSchemas'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.get('/:talent_id/experiences', async (c) => {
  const { results } = await c.env.DB_CORE.prepare('SELECT * FROM talent_experiences WHERE talent_id = ?').bind(c.req.param('talent_id')).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.post('/:talent_id/experiences', zValidator('json', createExpSchema), async (c) => {
  const body = c.req.valid('json')
  const expId = crypto.randomUUID()
  await c.env.DB_CORE.prepare('INSERT INTO talent_experiences (exp_id, talent_id, title, year, month, company, description) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(expId, c.req.param('talent_id'), body.title, body.year, body.month || null, body.company || null, body.description || null).run()
  return c.json({ status: 'ok', id: expId }, 201)
})

router.put('/experiences/:exp_id', zValidator('json', updateExpSchema), async (c) => {
  const body = c.req.valid('json')
  const expId = c.req.param('exp_id')
  const result = await c.env.DB_CORE.prepare('UPDATE talent_experiences SET title = ?, year = ?, month = ?, company = ?, description = ? WHERE exp_id = ?')
    .bind(body.title, body.year, body.month || null, body.company || null, body.description || null, expId).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', data: { exp_id: expId, ...body } })
})

router.delete('/experiences/:exp_id', async (c) => {
  const result = await c.env.DB_CORE.prepare('DELETE FROM talent_experiences WHERE exp_id = ?').bind(c.req.param('exp_id')).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', message: 'Dihapus' })
})
export default router
