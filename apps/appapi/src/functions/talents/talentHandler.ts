import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Schema validasi yang diperbarui
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
  interests: z.array(z.string()).optional()
})

/**
 * [GET] Ambil Profil Saya
 */
router.get('/me', requireRole(['talent']), async (c) => {
  const userId = c.get('userId')
  const cacheKey = `talent:profile:${userId}`

  try {
    // 1. Cek KV Cache
    const cachedData = await c.env.ORLAND_CACHE.get(cacheKey)
    if (cachedData) {
      return c.json({ status: 'ok', data: JSON.parse(cachedData), source: 'cache' })
    }

    // 2. Ambil dari DB jika tidak ada di cache
    const talent = await c.env.DB_CORE.prepare(`
      SELECT t.*, p.* FROM talents t 
      LEFT JOIN talent_profiles p ON t.id = p.talent_id 
      WHERE t.id = ?
    `).bind(userId).first()

    if (!talent) return c.json({ status: 'error', message: 'User not found' }, 404)

    // 3. Simpan ke cache (TTL 7 hari)
    await c.env.ORLAND_CACHE.put(cacheKey, JSON.stringify(talent), { expirationTtl: 604800 })

    return c.json({ status: 'ok', data: talent, source: 'database' })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

/**
 * [PUT] Update Profil
 */
router.put('/me', requireRole(['talent']), zValidator('json', updateTalentSchema), async (c) => {
  const userId = c.get('userId')
  const body = await c.req.valid('json')

  try {
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

    // Update Full Name di tabel utama
    if (body.full_name) {
      await c.env.DB_CORE.prepare('UPDATE talents SET fullname = ? WHERE id = ?')
        .bind(body.full_name, userId)
        .run()
    }

    const profileExist = await c.env.DB_CORE.prepare('SELECT id FROM talent_profiles WHERE talent_id = ?')
      .bind(userId)
      .first()

    if (profileExist) {
      // UPDATE - Menyertakan DOB dan Side View
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
      // INSERT - Menyertakan DOB dan Side View
      const newProfId = crypto.randomUUID()
      await c.env.DB_CORE.prepare(`
        INSERT INTO talent_profiles (
          id, talent_id, gender, domicile, dob, age, height_cm, weight_kg, eye_color, hair_color, skin_tone,
          headshot_url, side_view_url, full_body_url, portfolio_photos, assets_json, social_media_json, interested_in_json, skills_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        newProfId, userId, body.gender || null, body.location || null, body.birth_date || null, age, ht, wt, 
        body.eye_color || null, body.hair_color || null, body.ethnicity || null,
        body.headshot || null, body.side_view || null, body.full_height || null, additionalPhotos, 
        assetsJson, socialJson, interests, skills
      ).run()
    }

    // --- SINKRONISASI KV ---
    // 1. Hapus cache roster publik agar ter-refresh
    await c.env.ORLAND_CACHE.delete('PUBLIC_TALENT_ROSTER')
    // 2. Hapus cache profile pribadi agar data terbaru diambil di request berikutnya
    await c.env.ORLAND_CACHE.delete(`talent:profile:${userId}`)

    return c.json({ status: 'ok', message: 'Profile updated and cache cleared' })

  } catch (err: any) {
    console.error(err)
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

export default router