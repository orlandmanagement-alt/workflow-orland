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
    SELECT pt.*, t.full_name, t.category, t.base_rate 
    FROM project_talents pt 
    JOIN talents t ON pt.talent_id = t.talent_id 
    WHERE pt.project_id = ?
  `
  const { results } = await c.env.DB_CORE.prepare(query).bind(c.req.param('project_id')).all()
  return c.json({ status: 'ok', data: results || [] })
})

// PUT: Update Status (Support Bulk Offer via Loop atau IN Clause)
router.put('/bookings/:booking_id/status', requireRole(['admin', 'client']), zValidator('json', updateStatusSchema), async (c) => {
  const body = c.req.valid('json')
  const result = await c.env.DB_CORE.prepare('UPDATE project_talents SET status = ? WHERE booking_id = ?')
    .bind(body.status, c.req.param('booking_id')).run()
    
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Booking not found' }, 404)
  if (body.status === "Offered") {
    const bookingData = await c.env.DB_CORE.prepare(
      "SELECT t.full_name, u.email FROM talents t JOIN users u ON t.user_id = u.id WHERE t.talent_id = (SELECT talent_id FROM project_talents WHERE booking_id = ?)"
    ).bind(c.req.param("booking_id")).first<any>();
    if (bookingData?.email) {
      await sendNotification(c.env, {
        to: bookingData.email,
        type: "email",
        message: `Halo ${bookingData.full_name}, Anda mendapatkan tawaran (OFFER) baru dari Orland Management. Silakan cek aplikasi Anda!`
      });
    }
  }
  return c.json({ status: 'ok', message: 'Status updated' })
})

export default router
