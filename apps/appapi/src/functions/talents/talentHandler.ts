import { Hono } from 'hono'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// MENGAMBIL DATA PROFIL
router.get('/me', async (c) => {
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
        
        return c.json({ status: 'ok', data: talent })
    }
    
    const ssoUser = await c.env.DB_SSO.prepare('SELECT full_name, email, phone FROM users WHERE id = ?').bind(userId).first()
    return c.json({ status: 'ok', data: ssoUser, is_new: true })
  } catch (err: any) {
    console.error("GET /me Error:", err.message)
    return c.json({ status: 'error', message: 'Gagal memuat profil' }, 500)
  }
})

// MENYIMPAN/MEMPERBARUI DATA PROFIL
router.put('/me', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()

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
    const existing = await c.env.DB_CORE.prepare('SELECT talent_id FROM talents WHERE user_id = ?').bind(userId).first()

    if (existing) {
      // Update jika profil sudah ada
      await c.env.DB_CORE.prepare(`
        UPDATE talents SET 
          full_name=?, category=?, height=?, weight=?, birth_date=?, gender=?, 
          headshot=?, side_view=?, full_height=?, 
          showreels=?, audios=?, additional_photos=?,
          interests=?, skills=?, union_affiliation=?, eye_color=?, hair_color=?, hip_size=?, chest_bust=?, body_type=?, specific_characteristics=?, tattoos=?, piercings=?, ethnicity=?, location=?,
          instagram=?, tiktok=?, twitter=?, phone=?, email=? 
        WHERE user_id=?
      `).bind(
        fullName, category, height, weight, birthDate, gender, headshot, sideView, fullHeight, 
        showreels, audios, additionalPhotos, 
        interests, skills, union_affiliation, eye_color, hair_color, hip_size, chest_bust, body_type, specific_characteristics, tattoos, piercings, ethnicity, location,
        instagram, tiktok, twitter, phone, email, userId
      ).run()
    } else {
      // Insert jika profil baru
      const newTalentId = crypto.randomUUID()
      await c.env.DB_CORE.prepare(`
        INSERT INTO talents (
          talent_id, user_id, full_name, category, height, weight, birth_date, gender, 
          headshot, side_view, full_height, showreels, audios, additional_photos, 
          interests, skills, union_affiliation, eye_color, hair_color, hip_size, chest_bust, body_type, specific_characteristics, tattoos, piercings, ethnicity, location,
          instagram, tiktok, twitter, phone, email
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        newTalentId, userId, fullName, category, height, weight, birthDate, gender, 
        headshot, sideView, fullHeight, showreels, audios, additionalPhotos, 
        interests, skills, union_affiliation, eye_color, hair_color, hip_size, chest_bust, body_type, specific_characteristics, tattoos, piercings, ethnicity, location,
        instagram, tiktok, twitter, phone, email
      ).run()
    }
    
    // Ambil ulang data terbaru setelah disimpan
    const updated = await c.env.DB_CORE.prepare('SELECT * FROM talents WHERE user_id = ?').bind(userId).first()
    
    // Parse arrays agar balikan JSON rapi sebagai tipe Array
    if (updated) {
        if (typeof updated.showreels === 'string') updated.showreels = JSON.parse(updated.showreels);
        if (typeof updated.audios === 'string') updated.audios = JSON.parse(updated.audios);
        if (typeof updated.additional_photos === 'string') updated.additional_photos = JSON.parse(updated.additional_photos);
    }
    
    // Invalidate Public KV Cache so the Roster rebuilds correctly
    await c.env.ORLAND_CACHE.delete('PUBLIC_TALENT_ROSTER');
    
    return c.json({ status: 'ok', data: updated })

  } catch (err: any) {
    // Menangkap error spesifik dari D1 (misal: kolom tidak ada di tabel)
    console.error("🔥 ERROR DATABASE (PUT /me):", err.message || err);
    return c.json({ status: 'error', message: err.message || 'Gagal menyimpan ke Database.' }, 500)
  }
})

// --- JANGAN DIHAPUS: Rute untuk Admin jika diperlukan di masa depan ---
router.get('/', async (c) => c.json({ status: 'ok', data: [] }))
router.get('/:id', async (c) => c.json({ status: 'ok', data: null }))

export default router
