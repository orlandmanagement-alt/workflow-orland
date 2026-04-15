import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Schema validasi enterprise-ready
const updateTalentSchema = z.object({
  full_name: z.string().optional(),
  location: z.string().optional(),
  gender: z.string().optional(),
  birth_date: z.string().optional(), // dob
  age: z.union([z.string(), z.number()]).optional(),
  height: z.union([z.string(), z.number()]).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
  eye_color: z.string().optional(),
  hair_color: z.string().optional(),
  ethnicity: z.string().optional(),
  headshot: z.string().optional(),
  side_view: z.string().optional(), // side_view_url
  full_height: z.string().optional(),
  additional_photos: z.array(z.string()).optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  twitter: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  phone: z.string().optional()
})

/**
 * [GET] /me - Optimized with Cache-Aside Pattern
 */
router.get('/me', requireRole(['talent']), async (c) => {
  const userId = c.get('userId')
  const cacheKey = `talent:profile:${userId}`

  try {
    // 1. Priority 1: Ambil dari KV (Extremely Fast)
    const cached = await c.env.ORLAND_CACHE.get(cacheKey)
    if (cached) {
      return c.json({ status: 'ok', data: JSON.parse(cached), source: 'cache' })
    }

    // 2. Priority 2: Fallback ke D1 jika cache kosong
    const talent = await c.env.DB_CORE.prepare(`
      SELECT t.fullname, t.phone as wa_phone, p.* FROM talents t 
      LEFT JOIN talent_profiles p ON t.id = p.talent_id 
      WHERE t.id = ?
    `).bind(userId).first<any>()

    if (talent) {
      // Background Task: Isi kembali KV agar request berikutnya cepat
      c.executionCtx.waitUntil(
        c.env.ORLAND_CACHE.put(cacheKey, JSON.stringify(talent), { expirationTtl: 604800 })
      )
      return c.json({ status: 'ok', data: talent, source: 'database' })
    }

    return c.json({ status: 'error', message: 'Profile not found' }, 404)
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

/**
 * [PUT] /me - High Performance Write-Through Strategy
 */
router.put('/me', requireRole(['talent']), zValidator('json', updateTalentSchema), async (c) => {
  const userId = c.get('userId')
  const body = await c.req.valid('json')

  try {
    // Normalisasi data
    const age = body.age ? parseInt(body.age.toString()) : null
    const ht = body.height ? parseInt(body.height.toString()) : null
    const wt = body.weight ? parseFloat(body.weight.toString()) : null
    
    const assetsJson = JSON.stringify({ youtube: [], audio: [] })
    const socialJson = JSON.stringify({
      instagram: body.instagram || '',
      tiktok: body.tiktok || '',
      twitter: body.twitter || ''
    })
    const additionalPhotos = JSON.stringify(body.additional_photos || [])
    const skills = JSON.stringify(body.skills || [])
    const interests = JSON.stringify(body.interests || [])

    // --- TRANSACTIONAL WRITES ---
    
    // 1. Update Tabel Talents (Master)
    await c.env.DB_CORE.prepare('UPDATE talents SET fullname = ?, phone = ? WHERE id = ?')
      .bind(body.full_name || 'Talent', body.phone || null, userId).run()

    // 2. Update/Insert Tabel Profiles
    const profileExist = await c.env.DB_CORE.prepare('SELECT id FROM talent_profiles WHERE talent_id = ?').bind(userId).first()

    if (profileExist) {
      await c.env.DB_CORE.prepare(`
        UPDATE talent_profiles SET 
          gender=?, domicile=?, dob=?, age=?, height_cm=?, weight_kg=?, eye_color=?, hair_color=?, skin_tone=?,
          headshot_url=?, side_view_url=?, full_body_url=?, portfolio_photos=?, 
          assets_json=?, social_media_json=?, interested_in_json=?, skills_json=?, updated_at=CURRENT_TIMESTAMP
        WHERE talent_id=?
      `).bind(
        body.gender || null, body.location || null, body.birth_date || null, age, ht, wt, 
        body.eye_color || null, body.hair_color || null, body.ethnicity || null,
        body.headshot || null, body.side_view || null, body.full_height || null, additionalPhotos,
        assetsJson, socialJson, interests, skills, userId
      ).run()
    } else {
      await c.env.DB_CORE.prepare(`
        INSERT INTO talent_profiles (
          id, talent_id, gender, domicile, dob, age, height_cm, weight_kg, eye_color, hair_color, skin_tone,
          headshot_url, side_view_url, full_body_url, portfolio_photos, assets_json, social_media_json, interested_in_json, skills_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), userId, body.gender || null, body.location || null, body.birth_date || null, age, ht, wt, 
        body.eye_color || null, body.hair_color || null, body.ethnicity || null,
        body.headshot || null, body.side_view || null, body.full_height || null, additionalPhotos, 
        assetsJson, socialJson, interests, skills
      ).run()
    }

    // --- CACHE SYNC ENGINE (ANTI-LAG) ---
    
    // Ambil data terbaru untuk dimasukkan ke KV
    const finalData = await c.env.DB_CORE.prepare(`
      SELECT t.fullname, t.phone as wa_phone, p.* FROM talents t 
      LEFT JOIN talent_profiles p ON t.id = p.talent_id 
      WHERE t.id = ?
    `).bind(userId).first()

    // Jalankan operasi KV secara pararel agar response API tetap cepat
    c.executionCtx.waitUntil(Promise.all([
      // Update Detail Cache (Write-Through)
      c.env.ORLAND_CACHE.put(`talent:profile:${userId}`, JSON.stringify(finalData), { expirationTtl: 604800 }),
      // Invalidate Roster Publik (Biar refresh di halaman depan)
      c.env.ORLAND_CACHE.delete('PUBLIC_TALENT_ROSTER')
    ]))

    return c.json({ status: 'ok', message: 'Success', id: userId })

  } catch (err: any) {
    console.error("Critical Error:", err)
    return c.json({ status: 'error', message: "System failure" }, 500)
  }
})

export default router