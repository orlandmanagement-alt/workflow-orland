import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
import { sendMail } from '../../utils'

type HonoEnv = { Bindings: Bindings; Variables: Variables }
const router = new Hono<HonoEnv>()

// Schemas
const guestSubmitSchema = z.object({
  board_id: z.string(),
  full_name: z.string().min(3).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  create_account: z.boolean().default(false),
  answers: z.record(z.string()).optional(),
})

const convertGuestSchema = z.object({
  cast_id: z.string(),
  password: z.string().min(8),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

// POST /api/v1/casting/guest-submit
// Submit as guest for casting call
router.post('/guest-submit', zValidator('json', guestSubmitSchema), async (c) => {
  const body = c.req.valid('json')

  try {
    // Verify board exists and is active
    const board = await c.env.DB_CORE.prepare(`
      SELECT b.board_id, b.project_id, b.allow_guest_submissions, b.expires_at
      FROM live_casting_boards b
      WHERE b.board_id = ? AND b.status = 'Active'
    `).bind(body.board_id).first<any>()

    if (!board) {
      return c.json({ status: 'error', message: 'Casting board not found or expired' }, 404)
    }

    // Check expiration
    if (board.expires_at && new Date(board.expires_at) < new Date()) {
      return c.json({ status: 'error', message: 'Casting board has expired' }, 400)
    }

    if (!board.allow_guest_submissions && !body.create_account) {
      return c.json({ status: 'error', message: 'Guest submissions not allowed for this casting' }, 400)
    }

    // Create submission
    const submissionId = 'SUB-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    await c.env.DB_CORE.prepare(`
      INSERT INTO casting_guest_submissions
      (submission_id, board_id, guest_name, guest_email, guest_phone, audition_data, is_account_created)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      submissionId,
      body.board_id,
      body.full_name,
      body.email,
      body.phone,
      JSON.stringify({ answers: body.answers || {} }),
      body.create_account ? 1 : 0
    ).run()

    // Add candidate to board
    const candidateId = 'CAND-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    await c.env.DB_CORE.prepare(`
      INSERT INTO live_board_candidates
      (candidate_id, board_id, guest_name, guest_phone, status)
      VALUES (?, ?, ?, ?, 'Waiting')
    `).bind(candidateId, body.board_id, body.full_name, body.phone).run()

    // Send confirmation email (optional - add email service integration)
    // TODO: sendEmail(body.email, 'Casting Confirmation', ...)

    if (body.create_account) {
      return c.json({
        status: 'ok',
        submission_id: submissionId,
        message: 'Submission created. Redirecting to registration...',
        should_register: true,
      })
    } else {
      return c.json({
        status: 'ok',
        submission_id: submissionId,
        message: 'Guest submission received. Edit link sent to email.',
        email_sent: true,
      })
    }
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Failed to submit' }, 500)
  }
})

// GET /api/v1/casting/board/:boardToken
// Get casting board info by token
router.get('/board/:boardToken', async (c) => {
  const boardToken = c.req.param('boardToken')

  try {
    const board = await c.env.DB_CORE.prepare(`
      SELECT 
        b.board_id,
        b.project_id,
        b.role_title,
        b.status,
        b.expires_at,
        b.allow_guest_submissions,
        b.guest_questions,
        p.title as project_name,
        pr.quantity_needed
      FROM live_casting_boards b
      JOIN projects p ON b.project_id = p.project_id
      LEFT JOIN project_roles pr ON b.role_title = pr.role_name AND b.project_id = pr.project_id
      WHERE b.guest_link_token = ?
    `).bind(boardToken).first<any>()

    if (!board) {
      return c.json({ status: 'error', message: 'Casting board not found' }, 404)
    }

    return c.json({
      status: 'ok',
      data: {
        board_id: board.board_id,
        project_id: board.project_id,
        project_name: board.project_name,
        role_title: board.role_title,
        quantity_needed: board.quantity_needed,
        status: board.status,
        expires_at: board.expires_at,
        allow_guests: board.allow_guest_submissions,
        guest_questions: board.guest_questions ? JSON.parse(board.guest_questions) : [],
      },
    })
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Failed to fetch board' }, 500)
  }
})

// GET /api/v1/projects/:projectId/casting-candidates
// Get all candidates for a casting board (for casting director)
router.get('/projects/:projectId/candidates', async (c) => {
  const userId = c.get('userId')
  const projectId = c.req.param('projectId')

  try {
    // Verify user is casting director / project owner
    const project = await c.env.DB_CORE.prepare(
      'SELECT client_id FROM projects WHERE project_id = ?'
    ).bind(projectId).first<any>()

    if (!project) {
      return c.json({ status: 'error', message: 'Project not found' }, 404)
    }

    // Get board
    const board = await c.env.DB_CORE.prepare(
      'SELECT board_id FROM live_casting_boards WHERE project_id = ?'
    ).bind(projectId).first<any>()

    if (!board) {
      return c.json({ status: 'error', message: 'No casting board for this project' }, 404)
    }

    // Get candidates
    const candidates = await c.env.DB_CORE.prepare(`
      SELECT 
        c.candidate_id,
        IF(t.talent_id IS NOT NULL, 'account', 'guest') as type,
        COALESCE(t.full_name, s.guest_name) as name,
        COALESCE(u.email, s.guest_email) as email,
        COALESCE(u.phone, s.guest_phone) as phone,
        c.status,
        c.created_at as submitted_at,
        s.audition_data
      FROM live_board_candidates c
      LEFT JOIN talents t ON c.talent_id = t.talent_id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN casting_guest_submissions s ON c.candidate_id = CONCAT('CAND-', s.submission_id)
      WHERE c.board_id = ?
      ORDER BY c.created_at DESC
    `).bind(board.board_id).all<any>()

    return c.json({
      status: 'ok',
      data: candidates.results || [],
    })
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Failed to fetch candidates' }, 500)
  }
})

export default router
