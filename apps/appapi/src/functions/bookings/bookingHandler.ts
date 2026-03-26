import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createBookingSchema, updateStatusSchema, uploadMediaSchema, reviewPayloadSchema } from './bookingSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.get('/projects/:project_id/bookings', requireRole(['admin', 'client']), async (c) => {
  const { results } = await c.env.DB_CORE.prepare('SELECT * FROM project_talents WHERE project_id = ?').bind(c.req.param('project_id')).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.post('/projects/:project_id/bookings', requireRole(['admin', 'client']), zValidator('json', createBookingSchema), async (c) => {
  const body = c.req.valid('json')
  const bookingId = crypto.randomUUID()
  // Asumsi: Kita simpan fee di kolom lain nanti jika tabelnya di-alter, saat ini insert basic
  await c.env.DB_CORE.prepare("INSERT INTO project_talents (booking_id, project_id, talent_id, status) VALUES (?, ?, ?, 'Shortlisted')")
    .bind(bookingId, c.req.param('project_id'), body.talent_id).run()
  return c.json({ status: 'ok', id: bookingId }, 201)
})

router.put('/bookings/:booking_id/status', requireRole(['admin', 'client']), zValidator('json', updateStatusSchema), async (c) => {
  const body = c.req.valid('json')
  const result = await c.env.DB_CORE.prepare('UPDATE project_talents SET status = ? WHERE booking_id = ?').bind(body.status, c.req.param('booking_id')).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', message: 'Status updated' })
})

router.post('/bookings/:booking_id/selftapes', requireRole(['talent']), zValidator('json', uploadMediaSchema), async (c) => {
  const body = c.req.valid('json')
  const mediaId = crypto.randomUUID()
  await c.env.DB_CORE.prepare('INSERT INTO audition_medias (media_id, booking_id, file_url) VALUES (?, ?, ?)')
    .bind(mediaId, c.req.param('booking_id'), body.file_url).run()
  return c.json({ status: 'ok', id: mediaId }, 201)
})

router.put('/bookings/:booking_id/reviews', requireRole(['admin', 'client']), zValidator('json', reviewPayloadSchema), async (c) => {
  const body = c.req.valid('json')
  const result = await c.env.DB_CORE.prepare('UPDATE project_talents SET review_rating = ?, review_notes = ? WHERE booking_id = ?')
    .bind(body.rating, body.feedback, c.req.param('booking_id')).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', message: 'Review submitted' })
})
export default router
