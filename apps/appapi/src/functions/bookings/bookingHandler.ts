import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { updateStatusSchema } from './bookingSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
import { sendNotification } from '../../utils/notifier';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET: Roster Detail (Dengan Cache-Aside KV)
router.get('/projects/:project_id/bookings', requireRole(['admin', 'client']), async (c) => {
  const projectId = c.req.param('project_id');
  const cacheKey = `project:bookings:${projectId}`;

  try {
    // 1. CEK KV CACHE DULU (Bypass D1)
    const cached = await c.env.ORLAND_CACHE.get(cacheKey);
    if (cached) {
      return c.json({ status: 'ok', data: JSON.parse(cached), source: 'cache' });
    }

    // 2. JIKA CACHE KOSONG, AMBIL DARI D1
    const query = `
      SELECT pt.*, t.user_id, t.category, t.base_rate 
      FROM project_talents pt 
      JOIN talents t ON pt.talent_id = t.talent_id 
      WHERE pt.project_id = ?
    `
    const { results: bookings } = await c.env.DB_CORE.prepare(query).bind(projectId).all<any>()

    // Fetch names from DB_SSO
    let ssoUsersMap: Record<string, string> = {};
    if (bookings.length > 0) {
      const userIds = bookings.map(b => `'${b.user_id}'`).join(',');
      const { results: users } = await c.env.DB_SSO.prepare(
        `SELECT id, first_name || ' ' || last_name as full_name FROM users WHERE id IN (${userIds})`
      ).all<any>();
      ssoUsersMap = (users || []).reduce((acc, user) => ({ ...acc, [user.id]: user.full_name }), {});
    }

    const resultData = bookings.map(b => {
      const { user_id, ...rest } = b;
      return {
        ...rest,
        full_name: ssoUsersMap[b.user_id] || 'Unknown Talent'
      };
    });

    // 3. SIMPAN KE KV CACHE (Simpan selama 1 jam)
    c.executionCtx.waitUntil(
      c.env.ORLAND_CACHE.put(cacheKey, JSON.stringify(resultData), { expirationTtl: 3600 })
    );

    return c.json({ status: 'ok', data: resultData, source: 'database' })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

// PUT: Update Status & Hapus Cache
router.put('/bookings/:booking_id/status', requireRole(['admin', 'client']), zValidator('json', updateStatusSchema), async (c) => {
  const body = c.req.valid('json')
  const bookingId = c.req.param('booking_id')

  try {
    // Ambil project_id dulu untuk menghapus cache yang tepat nanti
    const bookingInfo = await c.env.DB_CORE.prepare('SELECT project_id, talent_id FROM project_talents WHERE booking_id = ?').bind(bookingId).first<any>();
    
    if (!bookingInfo) return c.json({ status: 'error', message: 'Booking not found' }, 404);

    const result = await c.env.DB_CORE.prepare('UPDATE project_talents SET status = ? WHERE booking_id = ?')
      .bind(body.status, bookingId).run()
      
    // HAPUS CACHE DI BACKGROUND AGAR RESPON API CEPAT
    c.executionCtx.waitUntil(Promise.all([
      c.env.ORLAND_CACHE.delete(`project:bookings:${bookingInfo.project_id}`),
      c.env.ORLAND_CACHE.delete(`project:detail:${bookingInfo.project_id}`)
    ]));

    if (body.status === "Offered") {
      const bookingData = await c.env.DB_CORE.prepare(
        "SELECT user_id FROM talents WHERE talent_id = ?"
      ).bind(bookingInfo.talent_id).first<any>();

      if (bookingData?.user_id) {
        const ssoUser = await c.env.DB_SSO.prepare(
          "SELECT first_name || ' ' || last_name as full_name, email FROM users WHERE id = ?"
        ).bind(bookingData.user_id).first<any>();

        if (ssoUser?.email) {
          c.executionCtx.waitUntil(
            sendNotification(c.env, {
              to: ssoUser.email,
              type: "email",
              message: `Halo ${ssoUser.full_name}, Anda mendapatkan tawaran (OFFER) baru dari Orland Management. Silakan cek aplikasi Anda!`
            })
          );
        }
      }
    }
    return c.json({ status: 'ok', message: 'Status updated and cache cleared' })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

/**
 * [POST] /api/v1/bookings/apply
 * Talent melamar ke sebuah Project
 */
router.post('/bookings/apply', requireRole(['talent', 'agency', 'admin']), async (c) => {
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  
  try {
    const body = await c.req.json();
    const { project_id, proposed_rate } = body;

    if (!project_id) return c.json({ status: 'error', message: 'Project ID wajib diisi' }, 400);

    // 1. Cari Talent ID milik user yang sedang login
    let talentId = null;
    let agencyId = null;

    if (userRole === 'talent') {
        const talent = await c.env.DB_CORE.prepare('SELECT id, agency_id FROM talents WHERE user_id = ?').bind(userId).first<any>();
        if (!talent) return c.json({ status: 'error', message: 'Profil Talent belum lengkap' }, 400);
        talentId = talent.id;
        agencyId = talent.agency_id;
    } else if (userRole === 'agency') {
        // Jika agency yang apply, dia harus mengirim talent_id di body
        talentId = body.talent_id;
        if (!talentId) return c.json({ status: 'error', message: 'Pilih talent yang ingin diajukan' }, 400);
        
        const agency = await c.env.DB_CORE.prepare('SELECT client_id FROM clients WHERE user_id = ? AND is_agency = 1').bind(userId).first<any>();
        if (!agency) return c.json({ status: 'error', message: 'Agensi tidak valid' }, 403);
        agencyId = agency.client_id;

        // Validasi kepemilikan talent oleh agensi
        const ownsTalent = await c.env.DB_CORE.prepare('SELECT 1 FROM agency_talents WHERE agency_id = ? AND talent_id = ?').bind(agencyId, talentId).first();
        if (!ownsTalent) return c.json({ status: 'error', message: 'Talent bukan downline Anda' }, 403);
    }

    // 2. Cek apakah Project tersebut eksis dan masih Open
    const project = await c.env.DB_CORE.prepare('SELECT status FROM projects WHERE project_id = ?').bind(project_id).first<any>();
    if (!project) return c.json({ status: 'error', message: 'Project tidak ditemukan' }, 404);
    if (project.status.toLowerCase() !== 'open' && project.status.toLowerCase() !== 'published') {
        return c.json({ status: 'error', message: 'Pendaftaran untuk project ini sudah ditutup' }, 400);
    }

    // 3. Masukkan ke tabel pelamar (project_talents)
    const bookingId = `BK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    await c.env.DB_CORE.prepare(`
      INSERT INTO project_talents (booking_id, project_id, talent_id, agency_id, proposed_rate, status)
      VALUES (?, ?, ?, ?, ?, 'applied')
    `).bind(bookingId, project_id, talentId, agencyId, proposed_rate || 0).run();

    // 4. INVALIDATE CACHE: Bersihkan cache detail project agar Klien langsung melihat ada pelamar baru
    c.executionCtx.waitUntil(Promise.all([
      c.env.ORLAND_CACHE.delete(`project:bookings:${project_id}`),
      c.env.ORLAND_CACHE.delete(`project:detail:${project_id}`)
    ]));

    return c.json({ status: 'ok', message: 'Berhasil melamar pekerjaan!' });

  } catch (err: any) {
    // Tangkap error jika terjadi duplikasi (Talent melamar 2x di project yang sama)
    if (err.message.includes('UNIQUE constraint failed')) {
        return c.json({ status: 'error', message: 'Anda sudah melamar pekerjaan ini sebelumnya.' }, 400);
    }
    return c.json({ status: 'error', message: err.message }, 500);
  }
});

/**
 * [GET] /api/v1/bookings/my-applications
 * Talent melihat daftar project yang sudah mereka lamar
 */
router.get('/bookings/my-applications', requireRole(['talent']), async (c) => {
  const userId = c.get('userId');
  try {
    const talent = await c.env.DB_CORE.prepare('SELECT id FROM talents WHERE user_id = ?').bind(userId).first<any>();
    if (!talent) return c.json({ status: 'ok', data: [] });

    const applications = await c.env.DB_CORE.prepare(`
      SELECT pt.booking_id, pt.status as application_status, pt.created_at, 
             p.project_id, p.title as project_title, p.status as project_status, p.casting_form_fields,
             c.company_name as client_name
      FROM project_talents pt
      JOIN projects p ON pt.project_id = p.project_id
      LEFT JOIN clients c ON p.client_id = c.client_id
      WHERE pt.talent_id = ?
      ORDER BY pt.created_at DESC
    `).bind(talent.id).all();

    // Format output agar mudah dibaca Frontend
    const formattedData = (applications.results || []).map((app: any) => {
      let extras = {};
      try { if (app.casting_form_fields) extras = JSON.parse(app.casting_form_fields); } catch(e) {}
      
      return {
        booking_id: app.booking_id,
        project_id: app.project_id,
        project_title: app.project_title,
        project_status: app.project_status,
        client: app.client_name || 'Verified Client',
        location: extras.location || 'Remote',
        date: extras.shoot_date || 'TBA',
        application_status: app.application_status,
        applied_at: app.created_at
      };
    });

    return c.json({ status: 'ok', data: formattedData });
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500);
  }
});

export default router