import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { liveBoardSchema, guestJoinSchema } from './castingSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 1. Membuat Papan Casting Darurat
router.post('/projects/:project_id/live-boards', requireRole(['admin', 'client']), zValidator('json', liveBoardSchema), async (c) => {
  const body = c.req.valid('json')
  const boardId = crypto.randomUUID()
  await c.env.DB_CORE.prepare('INSERT INTO live_casting_boards (board_id, project_id, role_title, expires_at) VALUES (?, ?, ?, ?)')
    .bind(boardId, c.req.param('project_id'), body.role_title, body.expires_at).run()
  return c.json({ status: 'ok', id: boardId }, 201)
})

// 2. Generate Link Publik
router.post('/live-boards/:board_id/links', requireRole(['admin', 'client']), async (c) => {
  const boardId = c.req.param('board_id')
  // Validasi board masih aktif
  const board = await c.env.DB_CORE.prepare("SELECT * FROM live_casting_boards WHERE board_id = ? AND status = 'Active'").bind(boardId).first()
  if (!board) return c.json({ status: 'error', message: 'Board tidak ditemukan atau sudah ditutup' }, 404)
  
  const publicUrl = `https://talent.orlandmanagement.com/live-casting/${boardId}`
  return c.json({ status: 'ok', link_url: publicUrl }, 201)
})

// 3. Guest Join (Orang Awam mendaftar cepat) -> ENDPOINT PUBLIK (Dikecualikan dari JWT di index.ts)
router.post('/public/live-boards/:board_id/join', zValidator('json', guestJoinSchema), async (c) => {
  const body = c.req.valid('json')
  const boardId = c.req.param('board_id')
  const candidateId = crypto.randomUUID()
  
  // TODO: Terapkan Rate Limiting ketat berdasarkan IP di sini
  await c.env.DB_CORE.prepare('INSERT INTO live_board_candidates (candidate_id, board_id, guest_name, guest_phone, status) VALUES (?, ?, ?, ?, "Waiting")')
    .bind(candidateId, boardId, body.guest_name, body.guest_phone).run()
    
  return c.json({ status: 'ok', id: candidateId }, 201)
})

// 4. Sutradara Memilih Kandidat (Approve)
router.put('/live-boards/candidates/:candidate_id/approve', requireRole(['admin', 'client']), async (c) => {
  const candidateId = c.req.param('candidate_id')
  
  // Ambil data kandidat
  const candidate = await c.env.DB_CORE.prepare('SELECT * FROM live_board_candidates WHERE candidate_id = ?').bind(candidateId).first<any>()
  if (!candidate) return c.json({ status: 'error', message: 'Kandidat tidak ditemukan' }, 404)
  if (candidate.status === 'Approved') return c.json({ status: 'error', message: 'Kandidat sudah disetujui sebelumnya' }, 400)
  
  // Ambil project_id dari board
  const board = await c.env.DB_CORE.prepare('SELECT project_id FROM live_casting_boards WHERE board_id = ?').bind(candidate.board_id).first<any>()
  
  // D1 Batch: Ubah status kandidat & Masukkan ke project_talents (Booking resmi)
  const statements = [
    c.env.DB_CORE.prepare("UPDATE live_board_candidates SET status = 'Approved' WHERE candidate_id = ?").bind(candidateId)
  ]
  
  // Jika dia talent resmi, masukkan ke project_talents. Jika guest, simpan sementara.
  if (candidate.talent_id) {
    const bookingId = crypto.randomUUID()
    statements.push(c.env.DB_CORE.prepare("INSERT INTO project_talents (booking_id, project_id, talent_id, status) VALUES (?, ?, ?, 'Shortlisted')").bind(bookingId, board.project_id, candidate.talent_id))
  }
  
  await c.env.DB_CORE.batch(statements)
  return c.json({ status: 'ok', message: 'Kandidat disetujui' })
})

export default router
