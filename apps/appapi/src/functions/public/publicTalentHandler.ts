import { Hono } from 'hono'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const CACHE_KEY = 'PUBLIC_TALENT_ROSTER';

router.get('/', async (c) => {
  try {
    // 1. Try KV Cache first
    const cached = await c.env.ORLAND_CACHE.get(CACHE_KEY);
    if (cached) {
      return c.json({ status: 'ok', data: JSON.parse(cached), source: 'kv' });
    }

    // 2. Fallback to D1 (if cache misses or was invalidated)
    // Only fetch minimal lightweight columns necessary for the widget cards
    const { results } = await c.env.DB_CORE.prepare(`
      SELECT talent_id, full_name, category, gender, height, birth_date, location, headshot, interests, skills 
      FROM talents 
      WHERE headshot IS NOT NULL
      ORDER BY full_name ASC
    `).all<any>();

    // Clean up arrays specifically for the roster
    const roster = (results || []).map(t => {
      // Calculate age from birth_date
      let age = null;
      if (t.birth_date) {
        const diffMs = Date.now() - new Date(t.birth_date).getTime();
        age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
      }

      return {
        id: t.talent_id,
        name: t.full_name,
        category: t.category,
        gender: t.gender,
        height: t.height,
        age: age,
        location: t.location,
        headshot: t.headshot,
        interests: typeof t.interests === 'string' ? JSON.parse(t.interests) : t.interests,
        skills: typeof t.skills === 'string' ? JSON.parse(t.skills) : t.skills
      };
    });

    // Save to KV so next requests are instant
    await c.env.ORLAND_CACHE.put(CACHE_KEY, JSON.stringify(roster));

    return c.json({ status: 'ok', data: roster, source: 'd1_rebuilt' });
  } catch (err: any) {
    console.error("GET /public/talents Error:", err.message);
    return c.json({ status: 'error', message: 'Gagal memuat direktori talent' }, 500);
  }
});

router.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const talent = await c.env.DB_CORE.prepare('SELECT * FROM talents WHERE talent_id = ?').bind(id).first<any>()
    if (!talent) return c.json({ status: 'error', message: 'Profil talent tidak ditemukan' }, 404);

    // Parse array string from D1 JSON logic
    if (typeof talent.showreels === 'string') talent.showreels = JSON.parse(talent.showreels);
    if (typeof talent.audios === 'string') talent.audios = JSON.parse(talent.audios);
    if (typeof talent.additional_photos === 'string') talent.additional_photos = JSON.parse(talent.additional_photos);
    if (typeof talent.interests === 'string') talent.interests = JSON.parse(talent.interests);
    if (typeof talent.skills === 'string') talent.skills = JSON.parse(talent.skills);

    // Fetch credits/experiences explicitly
    const { results: exps } = await c.env.DB_CORE.prepare('SELECT * FROM talent_experiences WHERE talent_id = ?').bind(talent.talent_id).all()
    talent.experiences = exps || [];

    // STRICT PRIVACY: Menghapus data rahasia sebelum di-serve ke public
    delete talent.phone;
    delete talent.email;
    delete talent.user_id;
    // opsional menyembunyikan notes internal jika ada

    return c.json({ status: 'ok', data: talent })
  } catch (err: any) {
    console.error("GET /public/talents/:id Error:", err.message)
    return c.json({ status: 'error', message: 'Database error' }, 500)
  }
})

export default router
