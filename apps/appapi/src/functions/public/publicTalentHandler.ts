import { Hono } from 'hono'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const CACHE_KEY = 'PUBLIC_TALENT_ROSTER';

// --- GET ALL TALENTS (ROSTER) ---
router.get('/', async (c) => {
  try {
    const cached = await c.env.ORLAND_CACHE.get(CACHE_KEY);
    if (cached) return c.json({ status: 'ok', data: JSON.parse(cached), source: 'kv' });

    // Ambil data dasar dari profile saja untuk menghindari join yang berat/error
    const { results: profiles } = await c.env.DB_CORE.prepare(`
      SELECT talent_id as id, gender, height_cm, dob, domicile, headshot_url, interested_in_json 
      FROM talent_profiles
      WHERE headshot_url IS NOT NULL AND headshot_url != ''
    `).all<any>();

    const userIds = (profiles || []).map(p => `'${p.id}'`).join(',');
    let ssoNamesMap: Record<string, string> = {};
    
    if (userIds.length > 0) {
      // Worker diizinkan akses DB_SSO secara internal untuk mengambil Nama
      const { results: users } = await c.env.DB_SSO.prepare(`
        SELECT id, first_name || ' ' || COALESCE(last_name, '') as full_name FROM users WHERE id IN (${userIds})
      `).all<any>();
      ssoNamesMap = (users || []).reduce((acc, user) => ({ ...acc, [user.id]: user.full_name }), {});
    }

    const roster = (profiles || []).map(p => {
      let age = null;
      if (p.dob) {
        const diffMs = Date.now() - new Date(p.dob).getTime();
        age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
      }

      return {
        id: p.id,
        name: ssoNamesMap[p.id] || 'Unknown Talent',
        gender: p.gender,
        height: p.height_cm,
        age: age,
        location: p.domicile,
        headshot: p.headshot_url,
        category: p.interested_in_json ? JSON.parse(p.interested_in_json)[0] : 'Talent'
      };
    });

    c.executionCtx.waitUntil(c.env.ORLAND_CACHE.put(CACHE_KEY, JSON.stringify(roster), { expirationTtl: 3600 }));
    return c.json({ status: 'ok', data: roster });
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500);
  }
});

// --- GET DETAIL BY ID (Anti-Error 404) ---
router.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    // 1. Ambil data dari profile (sumber utama data fisik)
    const profile = await c.env.DB_CORE.prepare(`
      SELECT * FROM talent_profiles WHERE talent_id = ?
    `).bind(id).first<any>();
    
    if (!profile) return c.json({ status: 'error', message: 'Profil tidak ditemukan' }, 404);

    // 2. Ambil Nama secara aman dari DB_SSO
    const ssoUser = await c.env.DB_SSO.prepare(
      "SELECT first_name || ' ' || COALESCE(last_name, '') as sso_name FROM users WHERE id = ?"
    ).bind(id).first<any>();

    // Gabungkan data
    const talentData = {
      ...profile,
      fullname: ssoUser?.sso_name || "Unknown Talent",
      talent_id: profile.talent_id // Samakan key dengan kebutuhan frontend
    };

    // 3. Parsing JSON Fields
    const jsonFields = ['assets_json', 'portfolio_photos', 'interested_in_json', 'skills_json', 'social_media_json'];
    jsonFields.forEach(field => {
      if (typeof talentData[field] === 'string') {
        try { talentData[field.replace('_json', '').replace('portfolio_photos', 'additional_photos')] = JSON.parse(talentData[field]); } catch(e){}
      }
    });

    // 4. Ambil Pengalaman
    const { results: exps } = await c.env.DB_CORE.prepare('SELECT * FROM talent_experiences WHERE talent_id = ?').bind(id).all();
    talentData.experiences = exps || [];

    // PRIVASI: Jangan kirim phone/email SSO ke halaman publik
    delete talentData.phone;
    delete talentData.wa_phone;

    return c.json({ status: 'ok', data: talentData });
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Database Error', detail: err.message }, 500);
  }
});

export default router;