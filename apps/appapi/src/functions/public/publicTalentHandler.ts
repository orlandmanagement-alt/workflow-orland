import { Hono } from 'hono'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const CACHE_KEY = 'PUBLIC_TALENT_ROSTER';

router.get('/', async (c) => {
  try {
    // 1. Cek KV Cache
    const cached = await c.env.ORLAND_CACHE.get(CACHE_KEY);
    if (cached) {
      return c.json({ status: 'ok', data: JSON.parse(cached), source: 'kv' });
    }

    // 2. Query ke D1 (Menggunakan JOIN yang benar sesuai struktur database Anda)
    const { results: coreTalents } = await c.env.DB_CORE.prepare(`
      SELECT 
        t.id, 
        t.fullname, 
        p.gender, 
        p.height_cm, 
        p.dob, 
        p.domicile, 
        p.headshot_url, 
        p.interested_in_json, 
        p.skills_json 
      FROM talents t
      INNER JOIN talent_profiles p ON t.id = p.talent_id
      WHERE p.headshot_url IS NOT NULL AND p.headshot_url != ''
    `).all<any>();

    // 3. Format Data untuk Roster
    const roster = (coreTalents || []).map(t => {
      // Hitung Umur dari dob (Date of Birth)
      let age = null;
      if (t.dob) {
        const diffMs = Date.now() - new Date(t.dob).getTime();
        age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
      }

      // Parsing JSON dengan aman
      let parsedInterests = [];
      let parsedSkills = [];
      try { if (t.interested_in_json) parsedInterests = JSON.parse(t.interested_in_json); } catch(e){}
      try { if (t.skills_json) parsedSkills = JSON.parse(t.skills_json); } catch(e){}

      // Ambil Kategori Utama (Gunakan interest pertama jika ada)
      let category = 'Talent';
      if (parsedInterests.length > 0) category = parsedInterests[0];

      return {
        id: t.id,
        name: t.fullname || 'Unknown',
        category: category,
        gender: t.gender,
        height: t.height_cm,
        age: age,
        location: t.domicile,
        headshot: t.headshot_url,
        interests: parsedInterests,
        skills: parsedSkills
      };
    });

    // Urutkan berdasarkan nama
    roster.sort((a, b) => a.name.localeCompare(b.name));

    // 4. Simpan ke KV Cache (Tidak usah await agar API langsung merespon)
    c.executionCtx.waitUntil(
      c.env.ORLAND_CACHE.put(CACHE_KEY, JSON.stringify(roster), { expirationTtl: 3600 })
    );

    return c.json({ status: 'ok', data: roster, source: 'd1_rebuilt' });
  } catch (err: any) {
    console.error("Public Roster Error:", err);
    return c.json({ status: 'error', message: 'Gagal memuat direktori talent', detail: err.message }, 500);
  }
});

router.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    // Memperbaiki query detail agar konsisten menggunakan JOIN
    const talent = await c.env.DB_CORE.prepare(`
      SELECT t.fullname as full_name, t.phone, p.* FROM talents t 
      LEFT JOIN talent_profiles p ON t.id = p.talent_id 
      WHERE t.id = ?
    `).bind(id).first<any>()
    
    if (!talent) return c.json({ status: 'error', message: 'Profil talent tidak ditemukan' }, 404);

    // Parse array string from D1 JSON logic
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
        talent.twitter = soc.twitter || "";
    }

    // STRICT PRIVACY: Menghapus data rahasia sebelum di-serve ke public
    delete talent.phone;
    delete talent.wa_phone;

    return c.json({ status: 'ok', data: talent })
  } catch (err: any) {
    console.error("Detail Error:", err);
    return c.json({ status: 'error', message: 'Database error', detail: err.message }, 500)
  }
})

export default router