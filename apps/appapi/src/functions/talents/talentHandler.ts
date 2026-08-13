import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
import { deleteFromR2, extractR2Key } from '../../utils/s3'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// PERBAIKAN: Menambahkan SEMUA field media dan social media agar tidak dibuang oleh sistem
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
  facebook: z.string().optional(),
  youtube: z.string().optional(),
  website: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  showreels: z.array(z.string()).optional(),
  audios: z.array(z.string()).optional(),
  phone: z.string().optional(),
  experiences: z.array(z.any()).optional(),
  credits: z.array(z.any()).optional() 
})

/**
 * [GET] /me - Memuat profil & pengalaman (SINKRON SSO)
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
      try {
        const ssoUser = await c.env.DB_SSO.prepare(
          "SELECT first_name || ' ' || COALESCE(last_name, '') as sso_name FROM users WHERE id = ?"
        ).bind(userId).first<any>();
        
        if (ssoUser && ssoUser.sso_name) {
          talent.fullname = ssoUser.sso_name.trim();
          talent.full_name = ssoUser.sso_name.trim(); 
        }
      } catch (e) {}

      const { results: exps } = await c.env.DB_CORE.prepare(
        'SELECT experience_id as id, title, company, year, description as about FROM talent_experiences WHERE talent_id = ?'
      ).bind(userId).all()
      
      talent.experiences = exps || [];

      c.executionCtx.waitUntil(c.env.ORLAND_CACHE.put(cacheKey, JSON.stringify(talent), { expirationTtl: 604800 }))
      return c.json({ status: 'ok', data: talent, source: 'database' })
    }

    return c.json({ status: 'error', message: 'Profile not found' }, 404)
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

/**
 * [PUT] /me - Menyimpan Profil & Pengalaman
 */
router.put('/me', requireRole(['talent']), zValidator('json', updateTalentSchema), async (c) => {
  const userId = c.get('userId')
  const body = await c.req.valid('json')

  try {
    const oldProfile = await c.env.DB_CORE.prepare(`
      SELECT headshot_url, side_view_url, full_body_url, portfolio_photos 
      FROM talent_profiles WHERE talent_id = ?
    `).bind(userId).first<any>()

    const filesToDeleteFromR2: string[] = [];
    if (body.headshot && oldProfile?.headshot_url && oldProfile.headshot_url !== body.headshot) {
      const key = extractR2Key(oldProfile.headshot_url);
      if (key) filesToDeleteFromR2.push(key);
    }
    if (body.side_view && oldProfile?.side_view_url && oldProfile.side_view_url !== body.side_view) {
      const key = extractR2Key(oldProfile.side_view_url);
      if (key) filesToDeleteFromR2.push(key);
    }
    if (body.full_height && oldProfile?.full_body_url && oldProfile.full_body_url !== body.full_height) {
      const key = extractR2Key(oldProfile.full_body_url);
      if (key) filesToDeleteFromR2.push(key);
    }

    if (filesToDeleteFromR2.length > 0) {
      c.executionCtx.waitUntil(Promise.all(filesToDeleteFromR2.map(key => deleteFromR2(c.env, key))))
    }

    const age = body.age ? parseInt(body.age.toString()) : null
    const ht = body.height ? parseInt(body.height.toString()) : null
    const wt = body.weight ? parseFloat(body.weight.toString()) : null
    
    // PERBAIKAN: Mapping semua properti media dan sosial agar masuk ke database
    const assetsJson = JSON.stringify({ youtube: body.showreels || [], audio: body.audios || [] })
    const socialJson = JSON.stringify({ 
      instagram: body.instagram || '', 
      tiktok: body.tiktok || '', 
      twitter: body.twitter || '',
      facebook: body.facebook || '',
      youtube: body.youtube || '',
      website: body.website || ''
    })
    const additionalPhotos = JSON.stringify(body.additional_photos || [])
    const skills = JSON.stringify(body.skills || [])
    const interests = JSON.stringify(body.interests || [])

    await c.env.DB_CORE.prepare('UPDATE talents SET fullname = ?, phone = ? WHERE id = ?')
      .bind(body.full_name || 'Talent', body.phone || null, userId).run()

    if (oldProfile) {
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

    const expsArray = body.credits || body.experiences;
    if (expsArray && Array.isArray(expsArray)) {
      await c.env.DB_CORE.prepare('DELETE FROM talent_experiences WHERE talent_id = ?').bind(userId).run();
      for (const exp of expsArray) {
        if (!exp.title && !exp.company) continue;
        const desc = exp.about || exp.description || '';
        await c.env.DB_CORE.prepare(`
          INSERT INTO talent_experiences (experience_id, talent_id, title, company, year, description)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), userId, exp.title || '', exp.company || '', exp.year || '', desc).run();
      }
    }

    c.executionCtx.waitUntil(Promise.all([
      c.env.ORLAND_CACHE.delete(`talent:profile:${userId}`),
      c.env.ORLAND_CACHE.delete('PUBLIC_TALENT_ROSTER')
    ]))

    return c.json({ status: 'ok', message: 'Success', id: userId })

  } catch (err: any) {
    console.error("Critical Error:", err)
    return c.json({ status: 'error', message: "System failure" }, 500)
  }
})

router.delete('/:id', requireRole(['admin']), async (c) => {
  const id = c.req.param('id');
  try {
    await c.env.DB_CORE.prepare('DELETE FROM talents WHERE id = ?').bind(id).run();
    c.executionCtx.waitUntil(Promise.all([
      c.env.ORLAND_CACHE.delete(`talent:profile:${id}`),
      c.env.ORLAND_CACHE.delete('PUBLIC_TALENT_ROSTER')
    ]));
    return c.json({ status: 'ok', message: 'Deleted' });
  } catch(e:any) { return c.json({status:'error'},500); }
})

export default router