import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { searchFilterSchema } from './searchSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Pencarian Filter Cepat (Dengan KV Caching berdasarkan parameter)
router.post('/talents', requireRole(['admin', 'client']), zValidator('json', searchFilterSchema), async (c) => {
  const body = c.req.valid('json')
  
  // 1. Buat Cache Key yang unik berdasarkan parameter pencarian
  // Contoh key: search:talents:actor:1000000:5000000:john
  const cacheKey = `search:talents:${body.category || 'all'}:${body.min_rate || 0}:${body.max_rate || 'max'}:${body.keyword || 'none'}:${body.limit}:${body.offset}`
  
  const cachedData = await c.env.ORLAND_CACHE.get(cacheKey, 'json')
  if (cachedData) return c.json({ status: 'ok', source: 'cache', data: cachedData })
  
  // 2. Bangun Query SQL Dinamis
  let query = 'SELECT * FROM talents WHERE is_active = 1'
  let params: any[] = []
  
  if (body.category) {
    query += ' AND category = ?'
    params.push(body.category)
  }
  
  if (body.min_rate !== undefined && body.max_rate !== undefined) {
    query += ' AND base_rate BETWEEN ? AND ?'
    params.push(body.min_rate, body.max_rate)
  } else if (body.min_rate !== undefined) {
    query += ' AND base_rate >= ?'
    params.push(body.min_rate)
  } else if (body.max_rate !== undefined) {
    query += ' AND base_rate <= ?'
    params.push(body.max_rate)
  }
  
  if (body.keyword) {
    query += ' AND full_name LIKE ?'
    params.push(`%${body.keyword}%`)
  }
  
  query += ' LIMIT ? OFFSET ?'
  params.push(body.limit, body.offset)
  
  // 3. Eksekusi ke D1
  const { results } = await c.env.DB_CORE.prepare(query).bind(...params).all()
  
  // 4. Simpan ke Cache selama 1 Jam (3600 detik) untuk pencarian yang identik
  await c.env.ORLAND_CACHE.put(cacheKey, JSON.stringify(results || []), { expirationTtl: 3600 })
  
  return c.json({ status: 'ok', source: 'db', data: results || [] })
})

export default router
