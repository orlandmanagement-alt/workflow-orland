import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { projectQuerySchema, createProjectSchema, updateProjectSchema } from './projectSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const getClientIdByUser = async (c: any, userId: string): Promise<string | null> => {
  const row = await c.env.DB_CORE.prepare('SELECT client_id FROM clients WHERE user_id = ?').bind(userId).first() as any
  return row?.client_id || null
}

const getProjectOwnedBy = async (c: any, projectId: string, role: string | undefined, userId: string | undefined) => {
  if (!role || !userId) return null
  
  if (role === 'admin' || role === 'superadmin') {
    return c.env.DB_CORE.prepare('SELECT * FROM projects WHERE project_id = ?').bind(projectId).first() as any
  }

  const clientId = await getClientIdByUser(c, userId)
  if (!clientId) return null

  return c.env.DB_CORE.prepare('SELECT * FROM projects WHERE project_id = ? AND client_id = ?').bind(projectId, clientId).first() as any
}

// GET: Mendukung Dashboard & Kanban
router.get('/', requireRole(['admin', 'client']), zValidator('query', projectQuerySchema), async (c) => {
  const { limit, offset, status, category } = c.req.valid('query')
  const userRole = c.get('userRole') as string | undefined
  const userId = c.get('userId') as string | undefined

  let query = 'SELECT * FROM projects WHERE 1=1'
  let params: any[] = []

  if (userRole && userRole !== 'admin' && userRole !== 'superadmin') {
    const clientId = userId ? await getClientIdByUser(c, userId) : null
    if (!clientId) return c.json({ status: 'ok', data: [] })
    query += ' AND client_id = ?'
    params.push(clientId)
  }

  if (status) { query += ' AND status = ?'; params.push(status) }
  if (category) { query += ' AND json_extract(casting_form_fields, "$.company_category") = ?'; params.push(category) }
  query += ' ORDER BY project_id DESC LIMIT ? OFFSET ?'
  params.push(Math.min(parseInt(limit || '10'), 100), parseInt(offset || '0'))
  
  const { results } = await c.env.DB_CORE.prepare(query).bind(...params).all()
  return c.json({ status: 'ok', data: results || [] })
})

// GET: Alias untuk frontend lama -> /projects/me
router.get('/me', requireRole(['admin', 'client']), zValidator('query', projectQuerySchema), async (c) => {
  const { limit, offset, status } = c.req.valid('query')
  const userRole = c.get('userRole') as string | undefined
  const userId = c.get('userId') as string | undefined

  let query = 'SELECT * FROM projects WHERE 1=1'
  const params: any[] = []

  if (userRole && userRole !== 'admin' && userRole !== 'superadmin') {
    const clientId = userId ? await getClientIdByUser(c, userId) : null
    if (!clientId) return c.json({ status: 'ok', data: [] })
    query += ' AND client_id = ?'
    params.push(clientId)
  }

  if (status) {
    query += ' AND LOWER(status) = LOWER(?)'
    params.push(status)
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(Math.min(parseInt(limit || '100'), 100), parseInt(offset || '0'))

  const rows = await c.env.DB_CORE.prepare(query).bind(...params).all<any>()
  return c.json({ status: 'ok', data: rows.results || [] })
})


// GET: Detail project + roles (DENGAN KV CACHE)
router.get('/:project_id', requireRole(['admin', 'client']), async (c) => {
  const projectId = c.req.param('project_id') || ''
  const userRole = c.get('userRole') as string | undefined
  const userId = c.get('userId') as string | undefined

  const cacheKey = `project:detail:${projectId}`;

  try {
    // 1. CEK CACHE
    const cached = await c.env.ORLAND_CACHE.get(cacheKey);
    if (cached) {
      return c.json({ status: 'ok', data: JSON.parse(cached), source: 'cache' });
    }

    // 2. QUERY KE D1
    const project = await getProjectOwnedBy(c as any, projectId, userRole as any, userId as any)
    if (!project) return c.json({ status: 'error', message: 'Project not found' }, 404)

    const roles = await c.env.DB_CORE.prepare(
      'SELECT role_id as id, role_name, quantity_needed, budget_per_talent FROM project_roles WHERE project_id = ? ORDER BY role_name ASC'
    ).bind(projectId).all<any>()

    const talents = await c.env.DB_CORE.prepare(
      'SELECT booking_id, talent_id, status FROM project_talents WHERE project_id = ? ORDER BY booking_id DESC LIMIT 200'
    ).bind(projectId).all<any>()

    const finalData = {
      ...project,
      roles: roles.results || [],
      talents: talents.results || [],
    };

    // 3. SIMPAN CACHE
    c.executionCtx.waitUntil(
      c.env.ORLAND_CACHE.put(cacheKey, JSON.stringify(finalData), { expirationTtl: 3600 })
    );

    return c.json({ status: 'ok', data: finalData, source: 'database' })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

// PUT: Mendukung Moodboard & Update Detail (DENGAN INVALIDATE CACHE)
router.put('/:project_id', requireRole(['admin', 'client']), zValidator('json', updateProjectSchema), async (c) => {
  const body = c.req.valid('json')
  const id = c.req.param('project_id')
  const userRole = c.get('userRole') as string | undefined
  const userId = c.get('userId') as string | undefined

  if (!userRole || !userId) return c.json({ status: 'error', message: 'Unauthorized' }, 401)

  const project = await getProjectOwnedBy(c, id, userRole, userId)
  if (!project) return c.json({ status: 'error', message: 'Project not found' }, 404)
  
  const result = await c.env.DB_CORE.prepare(
    'UPDATE projects SET title = COALESCE(?, title), description = COALESCE(?, description), status = COALESCE(?, status), moodboards = COALESCE(?, moodboards), budget_total = COALESCE(?, budget_total), casting_form_fields = COALESCE(?, casting_form_fields), is_casting_open = COALESCE(?, is_casting_open), updated_at = ? WHERE project_id = ?'
  ).bind(
    body.title ?? null,
    body.description ?? null,
    body.status ?? null,
    body.moodboards ? JSON.stringify(body.moodboards) : null,
    body.budget_total ?? null,
    body.category_specific_data ? JSON.stringify(body.category_specific_data) : null,
    typeof body.is_casting_open === 'boolean' ? (body.is_casting_open ? 1 : 0) : null,
    new Date().toISOString(),
    id,
  ).run()
  
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Project not found' }, 404)
  
  // HAPUS CACHE AGAR TER-REFRESH
  c.executionCtx.waitUntil(
    c.env.ORLAND_CACHE.delete(`project:detail:${id}`)
  );

  return c.json({ status: 'ok', message: 'Project updated and cache cleared' })
})

// POST: Mendukung "Quick Create Project"
router.post('/', requireRole(['admin', 'client']), zValidator('json', createProjectSchema), async (c) => {
  const body = c.req.valid('json')
  const userId = c.get('userId') as string | undefined
  const userRole = c.get('userRole') as string | undefined

  if (!userRole || !userId) return c.json({ status: 'error', message: 'Unauthorized' }, 401)

  const clientId = body.client_id
    ? body.client_id
    : await getClientIdByUser(c, userId)

  if (!clientId) {
    return c.json({ status: 'error', message: 'Client profile not found' }, 400)
  }

  if (body.client_id && userRole !== 'admin' && userRole !== 'superadmin') {
    return c.json({ status: 'error', message: 'Forbidden' }, 403)
  }

  const projectId = `PRJ-${Date.now()}`
  const now = new Date().toISOString()

  await c.env.DB_CORE.prepare(
    'INSERT INTO projects (project_id, client_id, title, description, status, budget_total, casting_form_fields, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    projectId,
    clientId,
    body.title,
    body.description || '',
    body.status || 'Draft',
    body.budget_total || 0,
    JSON.stringify(body.category_specific_data || {}),
    now,
    now,
  ).run()

  if (Array.isArray(body.roles) && body.roles.length > 0) {
    for (const role of body.roles.slice(0, 100)) {
      const roleId = generateId('ROLE')
      await c.env.DB_CORE.prepare(
        'INSERT INTO project_roles (role_id, project_id, role_name, quantity_needed, budget_per_talent) VALUES (?, ?, ?, ?, ?)'
      ).bind(
        roleId,
        projectId,
        role.role_name,
        role.quantity_needed ?? role.quantity ?? 1,
        role.budget_per_talent ?? role.budget ?? 0,
      ).run()
    }
  }
  
  return c.json({ status: 'ok', id: projectId, data: { project_id: projectId } }, 201)
})

// PUT: Mendukung Moodboard & Update Detail
router.put('/:project_id', requireRole(['admin', 'client']), zValidator('json', updateProjectSchema), async (c) => {
  const body = c.req.valid('json')
  const id = c.req.param('project_id')
  const userRole = c.get('userRole') as string | undefined
  const userId = c.get('userId') as string | undefined

  if (!userRole || !userId) return c.json({ status: 'error', message: 'Unauthorized' }, 401)

  const project = await getProjectOwnedBy(c, id, userRole, userId)
  if (!project) return c.json({ status: 'error', message: 'Project not found' }, 404)
  
  // Mapping field dinamis agar tidak error jika salah satu kosong
  const result = await c.env.DB_CORE.prepare(
    'UPDATE projects SET title = COALESCE(?, title), description = COALESCE(?, description), status = COALESCE(?, status), moodboards = COALESCE(?, moodboards), budget_total = COALESCE(?, budget_total), casting_form_fields = COALESCE(?, casting_form_fields), is_casting_open = COALESCE(?, is_casting_open), updated_at = ? WHERE project_id = ?'
  ).bind(
    body.title ?? null,
    body.description ?? null,
    body.status ?? null,
    body.moodboards ? JSON.stringify(body.moodboards) : null,
    body.budget_total ?? null,
    body.category_specific_data ? JSON.stringify(body.category_specific_data) : null,
    typeof body.is_casting_open === 'boolean' ? (body.is_casting_open ? 1 : 0) : null,
    new Date().toISOString(),
    id,
  ).run()
  
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Project not found' }, 404)
  return c.json({ status: 'ok', message: 'Project updated' })
})

// PATCH: Alias kompatibilitas frontend
router.patch('/:project_id', requireRole(['admin', 'client']), zValidator('json', updateProjectSchema), async (c) => {
  const body = c.req.valid('json')
  const id = c.req.param('project_id')
  const userRole = c.get('userRole') as string | undefined
  const userId = c.get('userId') as string | undefined

  if (!userRole || !userId) return c.json({ status: 'error', message: 'Unauthorized' }, 401)

  const project = await getProjectOwnedBy(c, id, userRole, userId)
  if (!project) return c.json({ status: 'error', message: 'Project not found' }, 404)

  await c.env.DB_CORE.prepare(
    'UPDATE projects SET title = COALESCE(?, title), description = COALESCE(?, description), status = COALESCE(?, status), moodboards = COALESCE(?, moodboards), budget_total = COALESCE(?, budget_total), casting_form_fields = COALESCE(?, casting_form_fields), is_casting_open = COALESCE(?, is_casting_open), updated_at = ? WHERE project_id = ?'
  ).bind(
    body.title ?? null,
    body.description ?? null,
    body.status ?? null,
    body.moodboards ? JSON.stringify(body.moodboards) : null,
    body.budget_total ?? null,
    body.category_specific_data ? JSON.stringify(body.category_specific_data) : null,
    typeof body.is_casting_open === 'boolean' ? (body.is_casting_open ? 1 : 0) : null,
    new Date().toISOString(),
    id,
  ).run()

  return c.json({ status: 'ok', message: 'Project updated' })
})

router.post('/:project_id/copy-roles', requireRole(['admin', 'client']), async (c) => {
  const targetProjectId = c.req.param('project_id') || ''
  const userRole = c.get('userRole') as string | undefined
  const userId = c.get('userId') as string | undefined

  const { source_project_id } = await c.req.json<{ source_project_id: string }>().catch(() => ({ source_project_id: '' }))

  if (!source_project_id) return c.json({ status: 'error', message: 'source_project_id is required' }, 400)

  const [source, target] = await Promise.all([
    getProjectOwnedBy(c as any, source_project_id, userRole as any, userId as any),
    getProjectOwnedBy(c as any, targetProjectId, userRole as any, userId as any),
  ])

  if (!source || !target) return c.json({ status: 'error', message: 'Project not found' }, 404)

  const roles = await c.env.DB_CORE.prepare(
    'SELECT role_name, quantity_needed, budget_per_talent FROM project_roles WHERE project_id = ?'
  ).bind(source_project_id).all<any>()

  for (const role of roles.results || []) {
    await c.env.DB_CORE.prepare(
      'INSERT INTO project_roles (role_id, project_id, role_name, quantity_needed, budget_per_talent) VALUES (?, ?, ?, ?, ?)'
    ).bind(generateId('ROLE'), targetProjectId, role.role_name, role.quantity_needed || 1, role.budget_per_talent || 0).run()
  }

  return c.json({ status: 'ok', copied_roles: (roles.results || []).length })
})

router.post('/:project_id/copy-tools', requireRole(['admin', 'client']), async (c) => {
  const targetProjectId = c.req.param('project_id') || ''
  const userRole = c.get('userRole') as string | undefined
  const userId = c.get('userId') as string | undefined

  const { source_project_id } = await c.req.json<{ source_project_id: string }>().catch(() => ({ source_project_id: '' }))

  if (!source_project_id) return c.json({ status: 'error', message: 'source_project_id is required' }, 400)

  const [source, target] = await Promise.all([
    getProjectOwnedBy(c as any, source_project_id, userRole as any, userId as any),
    getProjectOwnedBy(c as any, targetProjectId, userRole as any, userId as any),
  ])
  if (!source || !target) return c.json({ status: 'error', message: 'Project not found' }, 404)

  let copied = 0

  try {
    const rundowns = await c.env.DB_CORE.prepare('SELECT timeline FROM wo_rundowns WHERE project_id = ?').bind(source_project_id).all<any>()
    for (const row of rundowns.results || []) {
      await c.env.DB_CORE.prepare('INSERT INTO wo_rundowns (rundown_id, project_id, timeline) VALUES (?, ?, ?)')
        .bind(generateId('RUNDOWN'), targetProjectId, row.timeline).run()
      copied++
    }
  } catch {}

  try {
    const songLists = await c.env.DB_CORE.prepare('SELECT must_play, do_not_play FROM wo_song_lists WHERE project_id = ?').bind(source_project_id).all<any>()
    for (const row of songLists.results || []) {
      await c.env.DB_CORE.prepare('INSERT INTO wo_song_lists (list_id, project_id, must_play, do_not_play) VALUES (?, ?, ?, ?)')
        .bind(generateId('SONG'), targetProjectId, row.must_play, row.do_not_play).run()
      copied++
    }
  } catch {}

  return c.json({ status: 'ok', copied_tools: copied })
})

router.post('/:project_id/copy', requireRole(['admin', 'client']), async (c) => {
  const sourceProjectId = c.req.param('project_id') || ''
  const userRole = c.get('userRole') as string | undefined
  const userId = c.get('userId') as string | undefined

  const body = await c.req.json<{ include_roles?: boolean; include_tools?: boolean; title_suffix?: string }>().catch(() => ({}))

  const source = await getProjectOwnedBy(c as any, sourceProjectId, userRole as any, userId as any)
  if (!source) return c.json({ status: 'error', message: 'Project not found' }, 404)

  const newProjectId = generateId('PRJ')
  const now = new Date().toISOString()
  const titleSuffix = (body as any)?.title_suffix || ' (Copy)'

  await c.env.DB_CORE.prepare(
    'INSERT INTO projects (project_id, client_id, title, description, status, moodboards, budget_total, casting_form_fields, is_casting_open, casting_deadline, banner_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    newProjectId,
    source.client_id,
    `${source.title || 'Untitled'}${titleSuffix}`,
    source.description || '',
    'Draft',
    source.moodboards || '[]',
    source.budget_total || 0,
    source.casting_form_fields || '{}',
    0,
    source.casting_deadline || null,
    source.banner_url || null,
    now,
    now,
  ).run()

  if ((body as any)?.include_roles !== false) {
    const roles = await c.env.DB_CORE.prepare(
      'SELECT role_name, quantity_needed, budget_per_talent FROM project_roles WHERE project_id = ?'
    ).bind(sourceProjectId).all<any>()

    for (const role of roles.results || []) {
      await c.env.DB_CORE.prepare(
        'INSERT INTO project_roles (role_id, project_id, role_name, quantity_needed, budget_per_talent) VALUES (?, ?, ?, ?, ?)'
      ).bind(generateId('ROLE'), newProjectId, role.role_name, role.quantity_needed || 1, role.budget_per_talent || 0).run()
    }
  }

  if ((body as any)?.include_tools) {
    try {
      const rundowns = await c.env.DB_CORE.prepare('SELECT timeline FROM wo_rundowns WHERE project_id = ?').bind(sourceProjectId).all<any>()
      for (const row of rundowns.results || []) {
        await c.env.DB_CORE.prepare('INSERT INTO wo_rundowns (rundown_id, project_id, timeline) VALUES (?, ?, ?)')
          .bind(generateId('RUNDOWN'), newProjectId, row.timeline).run()
      }
    } catch {}

    try {
      const songLists = await c.env.DB_CORE.prepare('SELECT must_play, do_not_play FROM wo_song_lists WHERE project_id = ?').bind(sourceProjectId).all<any>()
      for (const row of songLists.results || []) {
        await c.env.DB_CORE.prepare('INSERT INTO wo_song_lists (list_id, project_id, must_play, do_not_play) VALUES (?, ?, ?, ?)')
          .bind(generateId('SONG'), newProjectId, row.must_play, row.do_not_play).run()
      }
    } catch {}
  }

  return c.json({ status: 'ok', data: { source_project_id: sourceProjectId, project_id: newProjectId } }, 201)
})

router.get('/:project_id/talents/filter', requireRole(['admin', 'client']), async (c) => {
  const projectId = c.req.param('project_id') || ''
  const userRole = c.get('userRole') as string | undefined
  const userId = c.get('userId') as string | undefined

  const project = await getProjectOwnedBy(c as any, projectId, userRole as any, userId as any)
  if (!project) return c.json({ status: 'error', message: 'Project not found' }, 404)

  const category = c.req.query('category')
  const gender = c.req.query('gender')
  const location = c.req.query('location')
  const search = c.req.query('q')
  const minRate = Number(c.req.query('min_rate') || 0)
  const maxRate = Number(c.req.query('max_rate') || 999999999)
  const limit = Math.min(Number(c.req.query('limit') || 50), 200)

  let query = `
    SELECT t.talent_id, t.full_name, t.category, t.gender, t.location, t.base_rate,
           CASE WHEN pt.talent_id IS NOT NULL THEN 1 ELSE 0 END as already_in_project
    FROM talents t
    LEFT JOIN project_talents pt ON pt.project_id = ? AND pt.talent_id = t.talent_id
    WHERE t.is_active = 1 AND t.base_rate BETWEEN ? AND ?
  `
  const params: any[] = [projectId, minRate, maxRate]

  if (category) { query += ' AND LOWER(t.category) = LOWER(?)'; params.push(category) }
  if (gender) { query += ' AND LOWER(t.gender) = LOWER(?)'; params.push(gender) }
  if (location) { query += ' AND LOWER(t.location) LIKE LOWER(?)'; params.push(`%${location}%`) }
  if (search) {
    query += ' AND (LOWER(t.full_name) LIKE LOWER(?) OR LOWER(t.category) LIKE LOWER(?))'
    params.push(`%${search}%`, `%${search}%`)
  }

  query += ' ORDER BY already_in_project ASC, t.base_rate ASC, t.full_name ASC LIMIT ?'
  params.push(limit)

  const rows = await c.env.DB_CORE.prepare(query).bind(...params).all<any>()
  return c.json({ status: 'ok', data: rows.results || [] })
})

export default router
