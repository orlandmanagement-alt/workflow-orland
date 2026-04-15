import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
import { deleteFromR2, extractR2Key } from '../../utils/s3' // <--- IMPORT HELPER S3 DI SINI

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Schema validasi
const updateTalentSchema = z.object({
  full_name: z.string().optional(),
  location: z.string().optional(),
  gender: z.string().optional(),
  birth_date: z.string().optional(),
  age: z.union([z.string(), z.number()]).optional(),
  height: z.union([z.string(), z.number()]).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
  eye_color: z.string().optional(),
  hair_color: z.string().optional(),
  ethnicity: z.string().optional(),
  headshot: z.string().optional(),
  side_view: z.string().optional(),
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
 * [GET] /me - Optimized Cache-Aside Pattern
 */
router.get('/me', requireRole(['talent']), async (c) => {
  const userId = c.get('userId')
  const cacheKey = `talent:profile:${userId}`

  try {
    const cached = await c.env.ORLAND_CACHE.get(cacheKey)
    if (cached) {
      return c.json({ status: 'ok', data: JSON.parse(cached), source: 'cache' })
    }

    const talent = await c.env.DB_CORE.prepare(`
      SELECT t.fullname, t.phone as wa_phone, p.* FROM talents t 
      LEFT JOIN talent_profiles p ON t.id = p.talent_id 
      WHERE t.id = ?
    `).bind(userId).first<any>()

    if (talent) {
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
 * [PUT] /me - Write-Through Cache + R2 Trash Cleaner
 */
router.put('/me', requireRole(['talent']), zValidator('json', updateTalentSchema), async (c) => {
  const userId = c.get('userId')
  const body = await c.req.valid('json')

  try {
    // 1. AMBIL PROFIL LAMA UNTUK CEK URL FOTO YANG DIGANTI
    const oldProfile = await c.env.DB_CORE.prepare(`
      SELECT headshot_url, side_view_url, full_body_url 
      FROM talent_profiles WHERE talent_id = ?
    `).bind(userId).first<any>()

    // 2. KUMPULKAN FILE LAMA YANG HARUS DIHAPUS DARI R2
    const filesToDeleteFromR2: string[] = [];
    
    // Jika user mengirim URL headshot baru dan berbeda dengan yang lama
    if (body.headshot && oldProfile?.headshot_url && oldProfile.headshot_url !== body.headshot) {
      const key = extractR2Key(oldProfile.headshot_url);
      if (key) filesToDeleteFromR2.push(key);
    }
    // Lakukan hal yang sama untuk side_view dan full_height
    if (body.side_view && oldProfile?.side_view_url && oldProfile.side_view_url !== body.side_view) {
      const key = extractR2Key(oldProfile.side_view_url);
      if (key) filesToDeleteFromR2.push(key);
    }
    if (body.full_height && oldProfile?.full_body_url && oldProfile.full_body_url !== body.full_height) {
      const key = extractR2Key(oldProfile.full_body_url);
      if (key) filesToDeleteFromR2.push(key);
    }

    // Eksekusi penghapusan R2 di Background (Tidak membuat user menunggu loading lama)
    if (filesToDeleteFromR2.length > 0) {
      c.executionCtx.waitUntil(
        Promise.all(filesToDeleteFromR2.map(key => deleteFromR2(c.env, key)))
      )
    }

    // 3. PROSES UPDATE DATA KE DB D1 (Sama seperti sebelumnya)
    const age = body.age ? parseInt(body.age.toString()) : null
    const ht = body.height ? parseInt(body.height.toString()) : null
    const wt = body.weight ? parseFloat(body.weight.toString()) : null
    
    const assetsJson = JSON.stringify({ youtube: [], audio: [] })
    const socialJson = JSON.stringify({ instagram: body.instagram || '', tiktok: body.tiktok || '', twitter: body.twitter || '' })
    const additionalPhotos = JSON.stringify(body.additional_photos || [])
    const skills = JSON.stringify(body.skills || [])
    const interests = JSON.stringify(body.interests || [])

    await c.env.DB_CORE.prepare('UPDATE talents SET fullname = ?, phone = ? WHERE id = ?')
      .bind(body.full_name || 'Talent', body.phone || null, userId).run()

    if (oldProfile) {
      // UPDATE
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
      // INSERT
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

    // 4. SINKRONISASI KV CACHE
    const finalData = await c.env.DB_CORE.prepare(`
      SELECT t.fullname, t.phone as wa_phone, p.* FROM talents t 
      LEFT JOIN talent_profiles p ON t.id = p.talent_id 
      WHERE t.id = ?
    `).bind(userId).first()

    c.executionCtx.waitUntil(Promise.all([
      c.env.ORLAND_CACHE.put(`talent:profile:${userId}`, JSON.stringify(finalData), { expirationTtl: 604800 }),
      c.env.ORLAND_CACHE.delete('PUBLIC_TALENT_ROSTER')
    ]))

    return c.json({ status: 'ok', message: 'Success', id: userId })

  } catch (err: any) {
    console.error("Critical Error:", err)
    return c.json({ status: 'error', message: "System failure" }, 500)
  }
})

/**
 * [DELETE] /:id - Hapus User, Hapus Semua Foto R2, dan Bersihkan Cache
 */
router.delete('/:id', requireRole(['admin']), async (c) => {
  const id = c.req.param('id')
  
  try {
    // 1. Ambil URL semua media user sebelum record dihapus
    const profile = await c.env.DB_CORE.prepare(
      'SELECT headshot_url, side_view_url, full_body_url, portfolio_photos FROM talent_profiles WHERE talent_id = ?'
    ).bind(id).first<any>()

    if (profile) {
      // Kumpulkan semua keys (Termasuk array portfolio_photos jika ada)
      const keysToDelete: string[] = [
        extractR2Key(profile.headshot_url),
        extractR2Key(profile.side_view_url),
        extractR2Key(profile.full_body_url)
      ].filter(Boolean) as string[];

      // Tambahkan foto portfolio jika ada isinya
      if (profile.portfolio_photos && profile.portfolio_photos !== '[]') {
        try {
          const portfolioArr = JSON.parse(profile.portfolio_photos);
          portfolioArr.forEach((url: string) => {
            const k = extractR2Key(url);
            if (k) keysToDelete.push(k);
          });
        } catch (e) {} // Abaikan jika JSON parse gagal
      }

      // 2. Eksekusi hapus di R2 (Background)
      if (keysToDelete.length > 0) {
        c.executionCtx.waitUntil(
          Promise.all(keysToDelete.map(key => deleteFromR2(c.env, key)))
        )
      }
    }

    // 3. Hapus Data Utama di D1 (Cascade delete akan otomatis hapus profile)
    await c.env.DB_CORE.prepare('DELETE FROM talents WHERE id = ?').bind(id).run()

    // 4. Bersihkan KV Cache
    c.executionCtx.waitUntil(Promise.all([
      c.env.ORLAND_CACHE.delete(`talent:profile:${id}`),
      c.env.ORLAND_CACHE.delete('PUBLIC_TALENT_ROSTER')
    ]))

    return c.json({ status: 'ok', message: 'User, Media, and Cache permanently deleted' })

  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

export default router