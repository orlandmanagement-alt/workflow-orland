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
  
  // NOTE: filtering by full_name is partially supported now by finding matching users in DB_SSO first
  let userIdsFilter: string[] | null = null;
  if (body.keyword) {
    const { results: matchedUsers } = await c.env.DB_SSO.prepare(
      "SELECT id FROM users WHERE (first_name || ' ' || last_name) LIKE ? OR first_name LIKE ? OR last_name LIKE ?"
    ).bind(`%${body.keyword}%`, `%${body.keyword}%`, `%${body.keyword}%`).all<any>();
    
    userIdsFilter = (matchedUsers || []).map(u => u.id);
    
    if (userIdsFilter.length === 0) {
      return c.json({ status: 'ok', data: [] })
    }
    
    query += ` AND user_id IN (${userIdsFilter.map(() => '?').join(',')})`;
    params.push(...userIdsFilter);
  }
  
  query += ' LIMIT ? OFFSET ?'
  params.push(body.limit, body.offset)
  
  // 3. Eksekusi ke D1
  const { results: rawResults } = await c.env.DB_CORE.prepare(query).bind(...params).all<any>()

  let ssoUsersMap: Record<string, string> = {};
  if (rawResults && rawResults.length > 0) {
    const userIds = rawResults.map(r => `'${r.user_id}'`).join(',');
    const { results: users } = await c.env.DB_SSO.prepare(
      `SELECT id, first_name || ' ' || last_name as full_name FROM users WHERE id IN (${userIds})`
    ).all<any>();
    ssoUsersMap = (users || []).reduce((acc, user) => ({ ...acc, [user.id]: user.full_name }), {});
  }

  const results = (rawResults || []).map(r => ({
    ...r,
    full_name: ssoUsersMap[r.user_id] || 'Unknown Talent'
  }));
  
  // 4. Simpan ke Cache selama 1 Jam (3600 detik) untuk pencarian yang identik
  await c.env.ORLAND_CACHE.put(cacheKey, JSON.stringify(results || []), { expirationTtl: 3600 })
  
  return c.json({ status: 'ok', source: 'db', data: results || [] })
})

export default router
