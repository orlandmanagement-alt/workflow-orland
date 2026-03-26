import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { clientQuerySchema, updateClientSchema } from './clientSchemas'
import { requireRole, requireOwnerOrAdmin } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.get('/', requireRole(['admin']), zValidator('query', clientQuerySchema), async (c) => {
  const { limit, offset, type } = c.req.valid('query')
  let query = 'SELECT * FROM clients WHERE is_active = 1'
  let params: any[] = []
  if (type) { query += ' AND client_type = ?'; params.push(type) }
  query += ' LIMIT ? OFFSET ?'; params.push(Math.min(parseInt(limit), 100), parseInt(offset))
  const { results } = await c.env.DB_CORE.prepare(query).bind(...params).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.get('/:client_id', requireRole(['admin', 'client']), requireOwnerOrAdmin('client_id'), async (c) => {
  const client = await c.env.DB_CORE.prepare('SELECT * FROM clients WHERE client_id = ?').bind(c.req.param('client_id')).first()
  if (!client) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', data: client })
})

router.put('/:client_id', requireRole(['admin', 'client']), requireOwnerOrAdmin('client_id'), zValidator('json', updateClientSchema), async (c) => {
  const body = c.req.valid('json')
  const id = c.req.param('client_id')
  const result = await c.env.DB_CORE.prepare('UPDATE clients SET company_name = ?, client_type = ? WHERE client_id = ?').bind(body.company_name, body.client_type, id).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', data: { client_id: id, ...body } })
})
export default router
