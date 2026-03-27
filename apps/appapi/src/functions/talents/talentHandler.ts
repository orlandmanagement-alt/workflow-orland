import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { talentQuerySchema, createTalentSchema, updateTalentSchema } from './talentSchemas'
import { Bindings, Variables } from '../../index'
import { requireRole } from '../../middleware/authRole'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// --- 1. ENDPOINT KHUSUS TALENT (/me) ---
// Hanya role 'talent' (dan superadmin) yang diizinkan mengakses rute ini
router.get('/me', requireRole(['talent', 'superadmin']), async (c) => {
  const userId = c.get('userId')
  
  const talent = await c.env.DB_CORE.prepare('SELECT * FROM talents WHERE user_id = ?').bind(userId).first()
  if (talent) return c.json({ status: 'ok', data: talent })
  
  const ssoUser = await c.env.DB_SSO.prepare('SELECT full_name, email, phone FROM users WHERE id = ?').bind(userId).first()
  return c.json({ status: 'ok', data: ssoUser, is_new: true })
})

router.put('/me', requireRole(['talent', 'superadmin']), async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  
  const existing = await c.env.DB_CORE.prepare('SELECT talent_id FROM talents WHERE user_id = ?').bind(userId).first()

  try {
    if (existing) {
      await c.env.DB_CORE.prepare(`UPDATE talents SET full_name=?, category=?, height=?, weight=?, birth_date=?, gender=?, profile_picture=? WHERE user_id=?`).bind(body.full_name, body.category, body.height, body.weight, body.birth_date, body.gender, body.profile_picture, userId).run()
    } else {
      const newTalentId = crypto.randomUUID()
      await c.env.DB_CORE.prepare(`INSERT INTO talents (talent_id, user_id, full_name, category, height, weight, birth_date, gender, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(newTalentId, userId, body.full_name, body.category, body.height, body.weight, body.birth_date, body.gender, body.profile_picture).run()
    }
    const updated = await c.env.DB_CORE.prepare('SELECT * FROM talents WHERE user_id = ?').bind(userId).first()
    return c.json({ status: 'ok', data: updated })
  } catch (err) {
    return c.json({ status: 'error', message: 'Gagal menyimpan profil.' }, 500)
  }
})

// --- 2. ENDPOINT ADMIN ---
router.get('/', requireRole(['admin', 'superadmin']), zValidator('query', talentQuerySchema), async (c) => {
  const { limit, offset, category } = c.req.valid('query')
  const l = Math.min(parseInt(limit || '10'), 100)
  const o = parseInt(offset || '0')
  
  let query = 'SELECT * FROM talents WHERE is_active = 1'
  let params: any[] = []
  
  if (category) { query += ' AND category = ?'; params.push(category) }
  query += ' LIMIT ? OFFSET ?'; params.push(l, o)
  
  const { results } = await c.env.DB_CORE.prepare(query).bind(...params).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.get('/:talent_id', async (c) => {
  if (c.req.param('talent_id') === 'me') return c.json({ status: 'error', message: 'Invalid ID' }, 400)
  
  const id = c.req.param('talent_id')
  const talent = await c.env.DB_CORE.prepare('SELECT * FROM talents WHERE talent_id = ?').bind(id).first()
  if (!talent) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', data: talent })
})

// Gunakan requireRole untuk mengamankan data
router.post('/', requireRole(['admin', 'superadmin']), zValidator('json', createTalentSchema), async (c) => {
  const body = c.req.valid('json')
  const talentId = crypto.randomUUID()
  const userId = c.get('userId') 
  
  try {
    await c.env.DB_CORE.prepare('INSERT INTO talents (talent_id, user_id, full_name, category, base_rate) VALUES (?, ?, ?, ?, ?)').bind(talentId, userId, body.full_name, body.category, body.base_rate).run()
    return c.json({ status: 'ok', id: talentId }, 201)
  } catch (e: any) {
    return c.json({ status: 'error', message: 'Database error' }, 500)
  }
})

router.put('/:talent_id', requireRole(['admin', 'superadmin']), zValidator('json', updateTalentSchema), async (c) => {
  if (c.req.param('talent_id') === 'me') return c.json({ status: 'error', message: 'Invalid ID' }, 400)
  const id = c.req.param('talent_id')
  const body = c.req.valid('json')
  
  const result = await c.env.DB_CORE.prepare('UPDATE talents SET full_name = ?, category = ?, base_rate = ? WHERE talent_id = ?').bind(body.full_name, body.category, body.base_rate, id).run()
    
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', data: { talent_id: id, ...body } })
})

router.delete('/:talent_id', requireRole(['admin', 'superadmin']), async (c) => {
  const id = c.req.param('talent_id')
  const result = await c.env.DB_CORE.prepare('UPDATE talents SET is_active = 0 WHERE talent_id = ?').bind(id).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', message: 'Talent dinonaktifkan' })
})

export default router
