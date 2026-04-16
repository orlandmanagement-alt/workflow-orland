import { Hono } from 'hono'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const CACHE_KEY = 'PUBLIC_PROJECT_ROSTER';

router.get('/', async (c) => {
  try {
    // 1. Cek KV Cache (Sangat cepat, 0ms)
    const cached = await c.env.ORLAND_CACHE.get(CACHE_KEY);
    if (cached) {
      return c.json({ status: 'ok', data: JSON.parse(cached), source: 'kv' });
    }

    // 2. Ambil data proyek yang sedang Open dari DB
    const query = `
      SELECT p.project_id as id, p.title, p.status, p.budget_total, p.casting_form_fields,
             c.company_name as client
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.client_id
      WHERE LOWER(p.status) = 'open' OR LOWER(p.status) = 'published'
      ORDER BY p.created_at DESC
      LIMIT 50
    `;
    const { results: projects } = await c.env.DB_CORE.prepare(query).all<any>();

    // 3. Ambil data Peran (Roles) untuk proyek-proyek tersebut
    const projectIds = (projects || []).map(p => `'${p.id}'`).join(',');
    let rolesMap: Record<string, any[]> = {};
    
    if (projectIds.length > 0) {
      const { results: roles } = await c.env.DB_CORE.prepare(`
        SELECT project_id, role_name as name, quantity_needed, budget_per_talent
        FROM project_roles 
        WHERE project_id IN (${projectIds})
      `).all<any>();

      (roles || []).forEach(r => {
        if (!rolesMap[r.project_id]) rolesMap[r.project_id] = [];
        rolesMap[r.project_id].push({
          name: r.name,
          gender: 'Any', // Jika Anda menambahkan kolom gender di DB nanti, bisa diganti ke r.gender
          age: 'Any', 
          height: 'Any'
        });
      });
    }

    // 4. Format data agar sesuai dengan HTML Frontend (jobs.html)
    const formattedJobs = (projects || []).map(p => {
      let extraData: any = {};
      try {
        if (p.casting_form_fields) extraData = JSON.parse(p.casting_form_fields);
      } catch(e) {}

      return {
        id: p.id,
        title: p.title || 'Untitled Project',
        category: extraData.company_category || extraData.category || 'Commercial',
        client: p.client || 'Verified Client',
        location: extraData.location || 'Remote / TBA',
        date: extraData.shoot_date || 'TBA',
        budget: p.budget_total ? `Rp ${p.budget_total.toLocaleString('id-ID')}` : 'Negotiable',
        roles: rolesMap[p.id] || []
      };
    });

    // 5. Simpan ke KV Cache selama 1 Jam
    c.executionCtx.waitUntil(
      c.env.ORLAND_CACHE.put(CACHE_KEY, JSON.stringify(formattedJobs), { expirationTtl: 3600 })
    );

    return c.json({ status: 'ok', data: formattedJobs, source: 'database' });
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Gagal memuat lowongan', detail: err.message }, 500);
  }
});

export default router;