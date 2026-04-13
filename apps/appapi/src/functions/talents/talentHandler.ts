import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const updateTalentSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  category: z.string().max(50).optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  height: z.union([z.string(), z.number()]).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  headshot: z.string().optional(),
  side_view: z.string().optional(),
  sideView: z.string().optional(),
  full_height: z.string().optional(),
  fullHeight: z.string().optional(),
  showreels: z.array(z.string()).optional(),
  audios: z.array(z.string()).optional(),
  additional_photos: z.array(z.string()).optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  twitter: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  union_affiliation: z.string().optional(),
  eye_color: z.string().optional(),
  hair_color: z.string().optional(),
  hip_size: z.string().optional(),
  chest_bust: z.string().optional(),
  body_type: z.string().optional(),
  specific_characteristics: z.string().optional(),
  tattoos: z.string().optional(),
  piercings: z.string().optional(),
  ethnicity: z.string().optional(),
  location: z.string().optional(),
})

// MENGAMBIL DATA PROFIL - Auth: Talent Only
router.get('/me', requireRole(['talent']), async (c) => {
  const userId = c.get('userId')
  try {
    const talent = await c.env.DB_CORE.prepare('SELECT * FROM talents WHERE user_id = ?').bind(userId).first()
    if (talent) {
        if (typeof talent.showreels === 'string') talent.showreels = JSON.parse(talent.showreels);
        if (typeof talent.audios === 'string') talent.audios = JSON.parse(talent.audios);
        if (typeof talent.additional_photos === 'string') talent.additional_photos = JSON.parse(talent.additional_photos);
        if (typeof talent.interests === 'string') talent.interests = JSON.parse(talent.interests);
        if (typeof talent.skills === 'string') talent.skills = JSON.parse(talent.skills);
        
        // Also fetch experiences and attach to profile explicitly for easy UI binding
        const { results: exps } = await c.env.DB_CORE.prepare('SELECT * FROM talent_experiences WHERE talent_id = ?').bind(talent.talent_id).all()
        talent.experiences = exps || [];
        
        // Fetch User Info from SSO to merge missing email and phone
        const ssoUser = await c.env.DB_SSO.prepare('SELECT first_name || " " || last_name as full_name, email, phone FROM users WHERE id = ?').bind(userId).first()
        if (ssoUser) {
            talent.full_name = ssoUser.full_name;
            talent.email = ssoUser.email;
            talent.phone = ssoUser.phone;
        }
        
        return c.json({ status: 'ok', data: talent })
    }
    
    const ssoUser = await c.env.DB_SSO.prepare('SELECT first_name || " " || last_name as full_name, email, phone FROM users WHERE id = ?').bind(userId).first()
    return c.json({ status: 'ok', data: ssoUser, is_new: true })
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Gagal memuat profil' }, 500)
  }
})

// MENYIMPAN/MEMPERBARUI DATA PROFIL - Auth: Talent Only
router.put('/me', requireRole(['talent']), zValidator('json', updateTalentSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  // PERBAIKAN: Mengubah nilai "undefined" menjadi "null" agar Database D1 tidak crash!
  const fullName = body.full_name || null;
  const category = body.category || null;
  const height = body.height || null;
  const weight = body.weight || null;
  const birthDate = body.birth_date || null;
  const gender = body.gender || null;
  
  // SUPPORT AVATAR / MEDIA PORTFOLIO URLS
  const headshot = body.headshot || null;
  const sideView = body.side_view || body.sideView || null;
  const fullHeight = body.full_height || body.fullHeight || null;
  
  // SUPPORT ARRAYS (Multi-URLs & Chips)
  const showreels = Array.isArray(body.showreels) ? JSON.stringify(body.showreels) : '[]';
  const audios = Array.isArray(body.audios) ? JSON.stringify(body.audios) : '[]';
  const additionalPhotos = Array.isArray(body.additional_photos) ? JSON.stringify(body.additional_photos) : '[]';
  
  const interests = Array.isArray(body.interests) ? JSON.stringify(body.interests) : '[]';
  const skills = Array.isArray(body.skills) ? JSON.stringify(body.skills) : '[]';
  
  // OPTIONAL SOCIAL & CONTACTS (jika ditarik dari tab profile)
  const instagram = body.instagram || null;
  const tiktok = body.tiktok || null;
  const twitter = body.twitter || null;
  const phone = body.phone || null;
  const email = body.email || null;
  
  // ADDITIONAL PERSONAL & APPEARANCE
  const union_affiliation = body.union_affiliation || null;
  const eye_color = body.eye_color || null;
  const hair_color = body.hair_color || null;
  const hip_size = body.hip_size || null;
  const chest_bust = body.chest_bust || null;
  const body_type = body.body_type || null;
  const specific_characteristics = body.specific_characteristics || null;
  const tattoos = body.tattoos || null;
  const piercings = body.piercings || null;
  const ethnicity = body.ethnicity || null;
  const location = body.location || null;

  try {
    // 1. UPDATE DB_SSO FOR CROSS-DB FIELDS
    if (fullName || phone) {
      const nameParts = (fullName || '').split(' ');
      const firstName = nameParts[0] || null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

      let ssoUpdateSql = 'UPDATE users SET ';
      const ssoValues: any[] = [];
      
      if (fullName) {
        ssoUpdateSql += 'first_name = ?, last_name = ?';
        ssoValues.push(firstName, lastName);
      }
      
      if (phone) {
        if (ssoValues.length > 0) ssoUpdateSql += ', ';
        ssoUpdateSql += 'phone = ?';
        ssoValues.push(phone);
      }
      
      ssoUpdateSql += ' WHERE id = ?';
      ssoValues.push(userId);
      
      if (ssoValues.length > 1) { // Lebih dari 1 artinya ada update + userId
        await c.env.DB_SSO.prepare(ssoUpdateSql).bind(...ssoValues).run();
      }
    }

    const existing = await c.env.DB_CORE.prepare('SELECT talent_id FROM talents WHERE user_id = ?').bind(userId).first()

    if (existing) {
      // Update jika profil sudah ada
      await c.env.DB_CORE.prepare(`
        UPDATE talents SET 
          category=?, height=?, weight=?, birth_date=?, gender=?, 
          headshot=?, side_view=?, full_height=?, 
          showreels=?, audios=?, additional_photos=?,
          interests=?, skills=?, union_affiliation=?, eye_color=?, hair_color=?, hip_size=?, chest_bust=?, body_type=?, specific_characteristics=?, tattoos=?, piercings=?, ethnicity=?, location=?,
          instagram=?, tiktok=?, twitter=? 
        WHERE user_id=?
      `).bind(
        category, height, weight, birthDate, gender, headshot, sideView, fullHeight, 
        showreels, audios, additionalPhotos, 
        interests, skills, union_affiliation, eye_color, hair_color, hip_size, chest_bust, body_type, specific_characteristics, tattoos, piercings, ethnicity, location,
        instagram, tiktok, twitter, userId
      ).run()
    } else {
      // Insert jika profil baru
      const newTalentId = crypto.randomUUID()
      await c.env.DB_CORE.prepare(`
        INSERT INTO talents (
          talent_id, user_id, category, height, weight, birth_date, gender, 
          headshot, side_view, full_height, showreels, audios, additional_photos, 
          interests, skills, union_affiliation, eye_color, hair_color, hip_size, chest_bust, body_type, specific_characteristics, tattoos, piercings, ethnicity, location,
          instagram, tiktok, twitter
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        newTalentId, userId, category, height, weight, birthDate, gender, 
        headshot, sideView, fullHeight, showreels, audios, additionalPhotos, 
        interests, skills, union_affiliation, eye_color, hair_color, hip_size, chest_bust, body_type, specific_characteristics, tattoos, piercings, ethnicity, location,
        instagram, tiktok, twitter
      ).run()
    }
    
    // Ambil ulang data terbaru setelah disimpan
    const updated = await c.env.DB_CORE.prepare('SELECT * FROM talents WHERE user_id = ?').bind(userId).first()
    
    if (updated) {
        // Ambil data profile dari SSO yang dipisahkan
        const ssoUser = await c.env.DB_SSO.prepare('SELECT first_name || " " || last_name as full_name, email, phone FROM users WHERE id = ?').bind(userId).first()
        if (ssoUser) {
            updated.full_name = ssoUser.full_name;
            updated.email = ssoUser.email;
            updated.phone = ssoUser.phone;
        }
        
        if (typeof updated.showreels === 'string') updated.showreels = JSON.parse(updated.showreels);
        if (typeof updated.audios === 'string') updated.audios = JSON.parse(updated.audios);
        if (typeof updated.additional_photos === 'string') updated.additional_photos = JSON.parse(updated.additional_photos);
    }
    
    // Invalidate Public KV Cache so the Roster rebuilds correctly
    await c.env.ORLAND_CACHE.delete('PUBLIC_TALENT_ROSTER');
    
    return c.json({ status: 'ok', data: updated })

  } catch (err: any) {
    return c.json({ status: 'error', message: 'Gagal menyimpan ke Database.' }, 500)
  }
})

// --- JANGAN DIHAPUS: Rute untuk Admin jika diperlukan di masa depan ---
router.get('/', async (c) => c.json({ status: 'ok', data: [] }))
router.get('/:id', async (c) => c.json({ status: 'ok', data: null }))

export default router
