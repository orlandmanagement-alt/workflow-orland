import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { talentQuerySchema, createTalentSchema, updateTalentSchema } from './talentSchemas'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.get('/', zValidator('query', talentQuerySchema), async (c) => {
  const { limit, offset, category } = c.req.valid('query')
  const l = Math.min(parseInt(limit), 100)
  const o = parseInt(offset)
  
  let query = 'SELECT * FROM talents WHERE is_active = 1'
  let params: any[] = []
  
  if (category) { query += ' AND category = ?'; params.push(category) }
  query += ' LIMIT ? OFFSET ?'; params.push(l, o)
  
  const { results } = await c.env.DB_CORE.prepare(query).bind(...params).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.get('/:talent_id', async (c) => {
  const id = c.req.param('talent_id')
  const talent = await c.env.DB_CORE.prepare('SELECT * FROM talents WHERE talent_id = ?').bind(id).first()
  if (!talent) return c.json({ status: 'error', message: 'Not found' }, 404)
  // TODO: Fetch relation talent_media jika diperlukan
  return c.json({ status: 'ok', data: talent })
})

router.post('/', zValidator('json', createTalentSchema), async (c) => {
  const userRole = c.get('userRole')
  if (userRole !== 'admin') return c.json({ status: 'error', message: 'Forbidden' }, 403)
  
  const body = c.req.valid('json')
  const talentId = crypto.randomUUID()
  const userId = c.get('userId') // Asumsi ID terikat dengan akun pembuat untuk simulasi
  
  try {
    await c.env.DB_CORE.prepare('INSERT INTO talents (talent_id, user_id, full_name, category, base_rate) VALUES (?, ?, ?, ?, ?)')
      .bind(talentId, userId, body.full_name, body.category, body.base_rate).run()
    return c.json({ status: 'ok', id: talentId }, 201)
  } catch (e: any) {
    if (e.message.includes('UNIQUE')) return c.json({ status: 'error', message: 'User ID sudah terdaftar sebagai talent' }, 400)
    return c.json({ status: 'error', message: 'Database error' }, 500)
  }
})

router.put('/:talent_id', zValidator('json', updateTalentSchema), async (c) => {
  const id = c.req.param('talent_id')
  const body = c.req.valid('json')
  
  // TODO: Verifikasi Must be Resource Owner or Admin
  const result = await c.env.DB_CORE.prepare('UPDATE talents SET full_name = ?, category = ?, base_rate = ? WHERE talent_id = ?')
    .bind(body.full_name, body.category, body.base_rate, id).run()
    
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', data: { talent_id: id, ...body } })
})

router.delete('/:talent_id', async (c) => {
  if (c.get('userRole') !== 'admin') return c.json({ status: 'error', message: 'Forbidden' }, 403)
  const id = c.req.param('talent_id')
  const result = await c.env.DB_CORE.prepare('UPDATE talents SET is_active = 0 WHERE talent_id = ?').bind(id).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', message: 'Talent dinonaktifkan' })
})
export default router
