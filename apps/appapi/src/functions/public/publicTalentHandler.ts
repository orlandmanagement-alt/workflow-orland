import { Hono } from 'hono'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const CACHE_KEY = 'PUBLIC_TALENT_ROSTER';

router.get('/', async (c) => {
  try {
    const cached = await c.env.ORLAND_CACHE.get(CACHE_KEY);
    if (cached) return c.json({ status: 'ok', data: JSON.parse(cached), source: 'kv' });

    const { results: coreTalents } = await c.env.DB_CORE.prepare(`
      SELECT t.id, t.fullname, p.gender, p.height_cm, p.dob, p.domicile, p.headshot_url, p.interested_in_json, p.skills_json 
      FROM talents t
      INNER JOIN talent_profiles p ON t.id = p.talent_id
      WHERE p.headshot_url IS NOT NULL AND p.headshot_url != ''
    `).all<any>();

    // AMBIL NAMA ASLI DARI SSO
    const userIds = (coreTalents || []).map(t => `'${t.id}'`).join(',');
    let ssoUsersMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { results: users } = await c.env.DB_SSO.prepare(`
        SELECT id, first_name || " " || last_name as full_name FROM users WHERE id IN (${userIds})
      `).all<any>();
      ssoUsersMap = (users || []).reduce((acc, user) => ({ ...acc, [user.id]: user.full_name }), {});
    }

    const roster = (coreTalents || []).map(t => {
      let age = null;
      if (t.dob) {
        const diffMs = Date.now() - new Date(t.dob).getTime();
        age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
      }

      let parsedInterests = [];
      let parsedSkills = [];
      try { if (t.interested_in_json) parsedInterests = JSON.parse(t.interested_in_json); } catch(e){}
      try { if (t.skills_json) parsedSkills = JSON.parse(t.skills_json); } catch(e){}

      let category = 'Talent';
      if (parsedInterests.length > 0) category = parsedInterests[0];

      return {
        id: t.id,
        name: ssoUsersMap[t.id] ? ssoUsersMap[t.id].trim() : (t.fullname || 'Unknown'),
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

    roster.sort((a, b) => a.name.localeCompare(b.name));
    c.executionCtx.waitUntil(c.env.ORLAND_CACHE.put(CACHE_KEY, JSON.stringify(roster), { expirationTtl: 3600 }));

    return c.json({ status: 'ok', data: roster, source: 'd1_rebuilt' });
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Gagal memuat direktori talent', detail: err.message }, 500);
  }
});

router.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const talent = await c.env.DB_CORE.prepare(`
      SELECT t.id as talent_id, t.fullname as full_name, t.phone, p.* FROM talents t 
      LEFT JOIN talent_profiles p ON t.id = p.talent_id 
      WHERE t.id = ?
    `).bind(id).first<any>()
    
    if (!talent) return c.json({ status: 'error', message: 'Profil talent tidak ditemukan' }, 404);

    // --- [PERBAIKAN: SINKRON NAMA DARI SSO] ---
    const ssoUser = await c.env.DB_SSO.prepare(
      'SELECT first_name || " " || COALESCE(last_name, "") as sso_name FROM users WHERE id = ?'
    ).bind(id).first<any>();
    
    if (ssoUser && ssoUser.sso_name) {
      talent.full_name = ssoUser.sso_name.trim();
    }

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

    // --- [PERBAIKAN: TARIK PENGALAMAN/EXPERIENCES] ---
    const { results: exps } = await c.env.DB_CORE.prepare('SELECT * FROM talent_experiences WHERE talent_id = ?').bind(id).all()
    talent.experiences = exps || [];

    delete talent.phone;
    delete talent.wa_phone;

    return c.json({ status: 'ok', data: talent })
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Database error', detail: err.message }, 500)
  }
})

export default router