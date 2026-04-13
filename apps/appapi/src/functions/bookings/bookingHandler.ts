import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { updateStatusSchema } from './bookingSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
import { sendNotification } from '../../utils/notifier';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET: Roster Detail (Gabungkan data Talent untuk UI Roster)
router.get('/projects/:project_id/bookings', requireRole(['admin', 'client']), async (c) => {
  const query = `
    SELECT pt.*, t.user_id, t.category, t.base_rate 
    FROM project_talents pt 
    JOIN talents t ON pt.talent_id = t.talent_id 
    WHERE pt.project_id = ?
  `
  const { results: bookings } = await c.env.DB_CORE.prepare(query).bind(c.req.param('project_id')).all<any>()

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

  return c.json({ status: 'ok', data: resultData })
})

// PUT: Update Status (Support Bulk Offer via Loop atau IN Clause)
router.put('/bookings/:booking_id/status', requireRole(['admin', 'client']), zValidator('json', updateStatusSchema), async (c) => {
  const body = c.req.valid('json')
  const result = await c.env.DB_CORE.prepare('UPDATE project_talents SET status = ? WHERE booking_id = ?')
    .bind(body.status, c.req.param('booking_id')).run()
    
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Booking not found' }, 404)
  if (body.status === "Offered") {
    // Prepare core data
    const bookingData = await c.env.DB_CORE.prepare(
      "SELECT user_id FROM talents WHERE talent_id = (SELECT talent_id FROM project_talents WHERE booking_id = ?)"
    ).bind(c.req.param("booking_id")).first<any>();

    // Fetch user details from SSO
    if (bookingData?.user_id) {
      const ssoUser = await c.env.DB_SSO.prepare(
        "SELECT first_name || ' ' || last_name as full_name, email FROM users WHERE id = ?"
      ).bind(bookingData.user_id).first<any>();

      if (ssoUser?.email) {
        await sendNotification(c.env, {
          to: ssoUser.email,
          type: "email",
          message: `Halo ${ssoUser.full_name}, Anda mendapatkan tawaran (OFFER) baru dari Orland Management. Silakan cek aplikasi Anda!`
        });
      }
    }
  }
  return c.json({ status: 'ok', message: 'Status updated' })
})

export default router
