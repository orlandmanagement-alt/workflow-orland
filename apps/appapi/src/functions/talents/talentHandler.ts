import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const updateTalentSchema = z.object({
  full_name: z.string().optional(),
  category: z.string().optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  height: z.union([z.string(), z.number()]).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  headshot: z.string().optional(),
  side_view: z.string().optional(),
  full_height: z.string().optional(),
  showreels: z.array(z.string()).optional(),
  audios: z.array(z.string()).optional(),
  additional_photos: z.array(z.string()).optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  twitter: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  eye_color: z.string().optional(),
  hair_color: z.string().optional(),
  ethnicity: z.string().optional(),
  location: z.string().optional(),
})

// MENGAMBIL DATA PROFIL
router.get('/me', requireRole(['talent']), async (c) => {
  const userId = c.get('userId')
  try {
    // Join tabel talents dan talent_profiles
    const talent = await c.env.DB_CORE.prepare(`
      SELECT t.fullname as full_name, t.phone, p.* FROM talents t 
      LEFT JOIN talent_profiles p ON t.id = p.talent_id 
      WHERE t.id = ?
    `).bind(userId).first<any>()

    if (talent) {
        if (typeof talent.assets_json === 'string') {
            const assets = JSON.parse(talent.assets_json);
            talent.showreels = assets.youtube || [];
            talent.audios = assets.audio || [];
        }
        if (typeof talent.portfolio_photos === 'string') talent.additional_photos = JSON.parse(talent.portfolio_photos);
        if (typeof talent.interested_in_json === 'string') talent.interests = JSON.parse(talent.interested_in_json);
        if (typeof talent.skills_json === 'string') talent.skills = JSON.parse(talent.skills_json);
        if (typeof talent.social_media_json === 'string') {
            const soc = JSON.parse(talent.social_media_json);
            talent.instagram = soc.instagram || "";
            talent.tiktok = soc.tiktok || "";
            talent.facebook = soc.facebook || "";
            talent.twitter = soc.twitter || "";
            talent.website = soc.website || "";
            talent.youtube = soc.youtube || "";
        }
        
        // Ambil data email dari SSO (karena tidak ada di DB_CORE)
        const ssoUser = await c.env.DB_SSO.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first()
        if (ssoUser) talent.email = ssoUser.email;
        
        return c.json({ status: 'ok', data: talent })
    }
    
    // Jika profil kosong, ambil dari SSO
    const ssoUser = await c.env.DB_SSO.prepare('SELECT first_name || " " || last_name as full_name, email, phone FROM users WHERE id = ?').bind(userId).first()
    return c.json({ status: 'ok', data: ssoUser, is_new: true })
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Gagal memuat profil' }, 500)
  }
})

// MENYIMPAN DATA PROFIL (FIXED)
router.put('/me', requireRole(['talent']), zValidator('json', updateTalentSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  try {
    // 1. UPDATE DB_SSO (Hanya jika perlu)
    if (body.full_name || body.phone) {
      const nameParts = (body.full_name || '').split(' ');
      const firstName = nameParts[0] || null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
      await c.env.DB_SSO.prepare('UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?')
           .bind(firstName, lastName, body.phone || null, userId).run();
    }

    // 2. SIMPAN KE TABEL `talents`
    const talentExist = await c.env.DB_CORE.prepare('SELECT id FROM talents WHERE id = ?').bind(userId).first();
    if (!talentExist) {
        await c.env.DB_CORE.prepare(`INSERT INTO talents (id, fullname, username, phone) VALUES (?, ?, ?, ?)`)
             .bind(userId, body.full_name || 'Talent', userId, body.phone || null).run();
    } else {
        await c.env.DB_CORE.prepare(`UPDATE talents SET fullname = ?, phone = ? WHERE id = ?`)
             .bind(body.full_name || 'Talent', body.phone || null, userId).run();
    }

    // 3. SIMPAN KE TABEL `talent_profiles`
    const profileExist = await c.env.DB_CORE.prepare('SELECT id FROM talent_profiles WHERE talent_id = ?').bind(userId).first();
    
    const assetsJson = JSON.stringify({ youtube: body.showreels || [], audio: body.audios || [] });
    const socialJson = JSON.stringify({ instagram: body.instagram, tiktok: body.tiktok, twitter: body.twitter, facebook: body.facebook, youtube: body.youtube, website: body.website });
    const additionalPhotos = JSON.stringify(body.additional_photos || []);
    const interests = JSON.stringify(body.interests || []);
    const skills = JSON.stringify(body.skills || []);

    const ht = parseInt(body.height as string) || null;
    const wt = parseFloat(body.weight as string) || null;
    // Hitung umur dari DOB
    const age = body.birth_date ? new Date().getFullYear() - new Date(body.birth_date).getFullYear() : null;

    // Bagian query UPDATE di dalam router.put('/me')
if (profileExist) {
    await c.env.DB_CORE.prepare(`
      UPDATE talent_profiles SET 
        gender=?, domicile=?, age=?, height_cm=?, weight_kg=?, eye_color=?, hair_color=?, skin_tone=?,
        headshot_url=?, full_body_url=?, portfolio_photos=?, 
        assets_json=?, social_media_json=?, interested_in_json=?, skills_json=?, updated_at=CURRENT_TIMESTAMP
      WHERE talent_id=?
    `).bind(
      body.gender || null, body.location || null, age, ht, wt, body.eye_color || null, body.hair_color || null, body.ethnicity || null,
      body.headshot || null, body.full_height || null, additionalPhotos,
      assetsJson, socialJson, interests, skills, userId
    ).run();
} // Bagian query INSERT di dalam router.put('/me')
} else {
    const newProfId = crypto.randomUUID();
    await c.env.DB_CORE.prepare(`
      INSERT INTO talent_profiles (
        id, talent_id, gender, domicile, age, height_cm, weight_kg, eye_color, hair_color, skin_tone,
        headshot_url, full_body_url, portfolio_photos, assets_json, social_media_json, interested_in_json, skills_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      newProfId, userId, body.gender || null, body.location || null, age, ht, wt, body.eye_color || null, body.hair_color || null, body.ethnicity || null,
      body.headshot || null, body.full_height || null, additionalPhotos, assetsJson, socialJson, interests, skills
    ).run();
}

    await c.env.ORLAND_CACHE.delete('PUBLIC_TALENT_ROSTER');
    return c.json({ status: 'ok', message: 'Profile updated successfully' })

  } catch (err: any) {
    console.error(err);
    return c.json({ status: 'error', message: err.message || 'Gagal menyimpan ke Database' }, 500)
  }
})

export default router