import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { dateQuerySchema, attendancePayloadSchema } from './scheduleSchemas'
import { requireRole, requireOwnerOrAdmin } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// --- SCHEDULES ---
router.get('/talents/:talent_id/schedules', requireRole(['admin', 'talent']), requireOwnerOrAdmin('talent_id'), async (c) => {
  const { results } = await c.env.DB_CORE.prepare('SELECT * FROM talent_schedules WHERE talent_id = ? ORDER BY start_time ASC').bind(c.req.param('talent_id')).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.get('/schedules/availability', requireRole(['admin', 'client']), zValidator('query', dateQuerySchema), async (c) => {
  const { date } = c.req.valid('query')
  // Mencari jadwal yang bertabrakan pada tanggal tertentu (Asumsi SQLite DATE function)
  const { results } = await c.env.DB_CORE.prepare("SELECT * FROM talent_schedules WHERE date(start_time) = ?").bind(date).all()
  return c.json({ status: 'ok', data: results || [] })
})

// --- ATTENDANCE & QR ---
router.post('/schedules/:schedule_id/qr-code', requireRole(['admin', 'talent']), async (c) => {
  const scheduleId = c.req.param('schedule_id')
  const qrId = crypto.randomUUID()
  // Generate random hash yang aman untuk QR
  const qrHash = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('')
  
  // Set expired 12 jam dari sekarang
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  
  await c.env.DB_CORE.prepare('INSERT INTO schedule_qrs (qr_id, schedule_id, qr_hash, expires_at) VALUES (?, ?, ?, ?)')
    .bind(qrId, scheduleId, qrHash, expiresAt).run()
    
  return c.json({ status: 'ok', qr_hash: qrHash, url: `https://api.orlandmanagement.com/api/v1/schedules/${scheduleId}/attend?hash=${qrHash}` }, 201)
})

router.post('/schedules/:schedule_id/attend', requireRole(['talent']), zValidator('json', attendancePayloadSchema), async (c) => {
  const body = c.req.valid('json')
  const scheduleId = c.req.param('schedule_id')
  const talentId = c.get('userId')
  
  // 1. Cek validitas jadwal
  const schedule = await c.env.DB_CORE.prepare('SELECT * FROM talent_schedules WHERE schedule_id = ? AND talent_id = ?').bind(scheduleId, talentId).first()
  if (!schedule) return c.json({ status: 'error', message: 'Jadwal tidak valid atau Anda bukan pemilik jadwal ini' }, 403)
  
  // 2. Mencegah Double Check-in (Hanya DB_LOGS)
  const existing = await c.env.DB_LOGS.prepare('SELECT attendance_id FROM talent_attendances WHERE schedule_id = ? AND talent_id = ?').bind(scheduleId, talentId).first()
  if (existing) return c.json({ status: 'error', message: 'Anda sudah melakukan absensi untuk jadwal ini' }, 400)

  const attendanceId = crypto.randomUUID()
  await c.env.DB_LOGS.prepare('INSERT INTO talent_attendances (attendance_id, schedule_id, talent_id, lat, lng) VALUES (?, ?, ?, ?, ?)')
    .bind(attendanceId, scheduleId, talentId, body.lat, body.lng).run()
    
  return c.json({ status: 'ok', message: 'Absensi berhasil dicatat' }, 201)
})

router.get('/schedules/:schedule_id/attendances', requireRole(['admin', 'client']), async (c) => {
  const { results } = await c.env.DB_LOGS.prepare('SELECT * FROM talent_attendances WHERE schedule_id = ? ORDER BY check_in_time DESC').bind(c.req.param('schedule_id')).all()
  return c.json({ status: 'ok', data: results || [] })
})

export default router
