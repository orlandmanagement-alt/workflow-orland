import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { projectQuerySchema, createProjectSchema, updateProjectSchema } from './projectSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET: Mendukung Dashboard & Kanban
router.get('/', requireRole(['admin', 'client']), zValidator('query', projectQuerySchema), async (c) => {
  const { limit, offset, status } = c.req.valid('query')
  let query = 'SELECT * FROM projects WHERE 1=1'
  let params: any[] = []
  if (status) { query += ' AND status = ?'; params.push(status) }
  query += ' ORDER BY project_id DESC LIMIT ? OFFSET ?'
  params.push(Math.min(parseInt(limit || '10'), 100), parseInt(offset || '0'))
  
  const { results } = await c.env.DB_CORE.prepare(query).bind(...params).all()
  return c.json({ status: 'ok', data: results || [] })
})

// POST: Mendukung "Quick Create Project"
router.post('/', requireRole(['admin', 'client']), zValidator('json', createProjectSchema), async (c) => {
  const body = c.req.valid('json')
  const projectId = `PRJ-${Date.now()}`
  await c.env.DB_CORE.prepare(
    'INSERT INTO projects (project_id, client_id, title, status, budget_total) VALUES (?, ?, ?, ?, ?)'
  ).bind(projectId, body.client_id, body.status || 'Draft', body.title, body.budget_total || 0).run()
  
  return c.json({ status: 'ok', id: projectId }, 201)
})

// PUT: Mendukung Moodboard & Update Detail
router.put('/:project_id', requireRole(['admin', 'client']), zValidator('json', updateProjectSchema), async (c) => {
  const body = c.req.valid('json')
  const id = c.req.param('project_id')
  
  // Mapping field dinamis agar tidak error jika salah satu kosong
  const result = await c.env.DB_CORE.prepare(
    'UPDATE projects SET title = COALESCE(?, title), status = COALESCE(?, status), moodboards = COALESCE(?, moodboards), budget_total = COALESCE(?, budget_total) WHERE project_id = ?'
  ).bind(body.title, body.status, body.moodboards ? JSON.stringify(body.moodboards) : null, body.budget_total, id).run()
  
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Project not found' }, 404)
  return c.json({ status: 'ok', message: 'Project updated' })
})

export default router
