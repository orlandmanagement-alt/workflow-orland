import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createCatSchema, createSkillSchema } from './masterSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const CACHE_TTL = 86400 // 1 Hari (Dalam detik)

// --- CATEGORIES ---
router.get('/categories', async (c) => {
  // 1. Cek KV Cache terlebih dahulu (Sangat Cepat!)
  const cachedData = await c.env.ORLAND_CACHE.get('master:categories', 'json')
  if (cachedData) return c.json({ status: 'ok', source: 'cache', data: cachedData })
  
  // 2. Jika Cache kosong, ambil dari D1
  const { results } = await c.env.DB_CORE.prepare('SELECT * FROM master_categories ORDER BY category_name ASC').all()
  
  // 3. Simpan ke KV Cache untuk request selanjutnya
  await c.env.ORLAND_CACHE.put('master:categories', JSON.stringify(results || []), { expirationTtl: CACHE_TTL })
  return c.json({ status: 'ok', source: 'db', data: results || [] })
})

router.post('/categories', requireRole(['admin']), zValidator('json', createCatSchema), async (c) => {
  const body = c.req.valid('json')
  const catId = crypto.randomUUID()
  
  try {
    await c.env.DB_CORE.prepare('INSERT INTO master_categories (category_id, category_name) VALUES (?, ?)')
      .bind(catId, body.category_name).run()
      
    // Wajib Hapus Cache agar data baru segera muncul di frontend!
    await c.env.ORLAND_CACHE.delete('master:categories')
    return c.json({ status: 'ok', id: catId }, 201)
  } catch (e) {
    return c.json({ status: 'error', message: 'Kategori sudah ada' }, 400)
  }
})

// --- SKILLS ---
router.get('/skills', async (c) => {
  const cachedData = await c.env.ORLAND_CACHE.get('master:skills', 'json')
  if (cachedData) return c.json({ status: 'ok', source: 'cache', data: cachedData })
  
  const { results } = await c.env.DB_CORE.prepare('SELECT * FROM master_skills ORDER BY skill_name ASC').all()
  await c.env.ORLAND_CACHE.put('master:skills', JSON.stringify(results || []), { expirationTtl: CACHE_TTL })
  return c.json({ status: 'ok', source: 'db', data: results || [] })
})

router.post('/skills', requireRole(['admin']), zValidator('json', createSkillSchema), async (c) => {
  const body = c.req.valid('json')
  const skillId = crypto.randomUUID()
  
  try {
    await c.env.DB_CORE.prepare('INSERT INTO master_skills (skill_id, skill_name) VALUES (?, ?)')
      .bind(skillId, body.skill_name).run()
      
    await c.env.ORLAND_CACHE.delete('master:skills')
    return c.json({ status: 'ok', id: skillId }, 201)
  } catch (e) {
    return c.json({ status: 'error', message: 'Keahlian sudah ada' }, 400)
  }
})

export default router
