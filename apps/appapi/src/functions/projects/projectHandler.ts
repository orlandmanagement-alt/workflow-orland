import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { projectQuerySchema, createProjectSchema, updateProjectSchema } from './projectSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.get('/', requireRole(['admin', 'client']), zValidator('query', projectQuerySchema), async (c) => {
  const { limit, offset, status } = c.req.valid('query')
  let query = 'SELECT * FROM projects WHERE 1=1'
  let params: any[] = []
  if (status) { query += ' AND status = ?'; params.push(status) }
  query += ' LIMIT ? OFFSET ?'; params.push(Math.min(parseInt(limit), 100), parseInt(offset))
  const { results } = await c.env.DB_CORE.prepare(query).bind(...params).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.post('/', requireRole(['admin', 'client']), zValidator('json', createProjectSchema), async (c) => {
  const body = c.req.valid('json')
  const projectId = crypto.randomUUID()
  await c.env.DB_CORE.prepare('INSERT INTO projects (project_id, client_id, title, status) VALUES (?, ?, ?, ?)').bind(projectId, body.client_id, body.title, body.status).run()
  return c.json({ status: 'ok', id: projectId }, 201)
})

router.put('/:project_id', requireRole(['admin', 'client']), zValidator('json', updateProjectSchema), async (c) => {
  const body = c.req.valid('json')
  const id = c.req.param('project_id')
  const result = await c.env.DB_CORE.prepare('UPDATE projects SET title = ?, status = ? WHERE project_id = ?').bind(body.title, body.status, id).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', message: 'Updated' })
})
export default router
