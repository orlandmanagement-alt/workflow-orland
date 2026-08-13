import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { rundownSchema, songSchema, riderSchema } from './toolSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// --- WEDDING ORGANIZER (WO) TOOLS ---
router.post('/events/:project_id/rundowns', requireRole(['admin', 'client']), zValidator('json', rundownSchema), async (c) => {
  const body = c.req.valid('json')
  const rundownId = crypto.randomUUID()
  await c.env.DB_CORE.prepare('INSERT INTO wo_rundowns (rundown_id, project_id, timeline) VALUES (?, ?, ?)')
    .bind(rundownId, c.req.param('project_id'), JSON.stringify(body.timeline)).run()
  return c.json({ status: 'ok', id: rundownId }, 201)
})

router.put('/events/:project_id/rundowns/sync', requireRole(['admin', 'client']), zValidator('json', rundownSchema), async (c) => {
  const body = c.req.valid('json')
  const result = await c.env.DB_CORE.prepare('UPDATE wo_rundowns SET timeline = ? WHERE project_id = ?')
    .bind(JSON.stringify(body.timeline), c.req.param('project_id')).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Rundown not found' }, 404)
  // TODO: Trigger Push Notif/SSE ke aplikasi MC
  return c.json({ status: 'ok', message: 'Rundown synchronized' })
})

router.post('/events/:project_id/song-lists', requireRole(['admin', 'client']), zValidator('json', songSchema), async (c) => {
  const body = c.req.valid('json')
  const listId = crypto.randomUUID()
  await c.env.DB_CORE.prepare('INSERT INTO wo_song_lists (list_id, project_id, must_play, do_not_play) VALUES (?, ?, ?, ?)')
    .bind(listId, c.req.param('project_id'), JSON.stringify(body.must_play), JSON.stringify(body.do_not_play)).run()
  return c.json({ status: 'ok', id: listId }, 201)
})

// --- EVENT ORGANIZER (EO) TOOLS ---
router.post('/events/:booking_id/riders/technical', requireRole(['talent']), zValidator('json', riderSchema), async (c) => {
  const body = c.req.valid('json')
  const riderId = crypto.randomUUID()
  // Asumsi parameter diubah ke booking_id (spesifik untuk talent) sesuai skema tabel
  await c.env.DB_CORE.prepare('INSERT INTO eo_technical_riders (rider_id, booking_id, requirements, is_approved) VALUES (?, ?, ?, 0)')
    .bind(riderId, c.req.param('booking_id'), JSON.stringify(body.requirements)).run()
  return c.json({ status: 'ok', id: riderId }, 201)
})

router.post('/events/:booking_id/riders/hospitality', requireRole(['talent']), zValidator('json', riderSchema), async (c) => {
  const body = c.req.valid('json')
  const riderId = crypto.randomUUID()
  await c.env.DB_CORE.prepare('INSERT INTO eo_hospitality_riders (rider_id, booking_id, requirements, is_approved) VALUES (?, ?, ?, 0)')
    .bind(riderId, c.req.param('booking_id'), JSON.stringify(body.requirements)).run()
  return c.json({ status: 'ok', id: riderId }, 201)
})

export default router
