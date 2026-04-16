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

export default router