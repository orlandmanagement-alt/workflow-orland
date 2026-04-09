import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Schemas
const createInvitationSchema = z.object({
  max_uses: z.number().int().default(-1),
  expires_in_days: z.number().int().min(1).max(90).default(30),
})

// POST /api/v1/agency/invitations
// Create a new invitation link for recruiting talent
router.post('/invitations', zValidator('json', createInvitationSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  try {
    // Verify user is a client (agency) admin
    const user = await c.env.DB_SSO.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first<any>()
    if (user?.role !== 'admin' && user?.role !== 'super_admin' && user?.role !== 'agency') {
      return c.json({ status: 'error', message: 'Only agency admins can create invitations' }, 403)
    }

    // Get client/agency info
    const agency = await c.env.DB_CORE.prepare(
      'SELECT client_id FROM clients WHERE user_id = ? AND is_agency = 1'
    ).bind(userId).first<any>()

    if (!agency) {
      return c.json({ status: 'error', message: 'You are not an agency admin' }, 403)
    }

    // Generate unique token
    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + body.expires_in_days)

    // Create invitation
    const invitationId = 'INV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    await c.env.DB_CORE.prepare(`
      INSERT INTO agency_invitations 
      (invitation_id, agency_id, invite_link_token, created_by_user_id, expires_at, max_uses, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).bind(
      invitationId,
      agency.client_id,
      token,
      userId,
      expiresAt.toISOString(),
      body.max_uses
    ).run()

    const invitationLink = `${c.env.TALENT_URL || 'https://talent.orlandmanagement.com'}/register?invite=${token}`

    return c.json({
      status: 'ok',
      invitation_id: invitationId,
      invitation_link: invitationLink,
      token,
      expires_at: expiresAt.toISOString(),
      max_uses: body.max_uses,
    })
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Failed to create invitation' }, 500)
  }
})

// GET /api/v1/agency/invitations
// List all active invitations for this agency
router.get('/invitations', async (c) => {
  const userId = c.get('userId')

  try {
    const agency = await c.env.DB_CORE.prepare(
      'SELECT client_id FROM clients WHERE user_id = ? AND is_agency = 1'
    ).bind(userId).first<any>()

    if (!agency) {
      return c.json({ status: 'error', message: 'Not an agency admin' }, 403)
    }

    const invitations = await c.env.DB_CORE.prepare(`
      SELECT 
        invitation_id, invite_link_token, created_at, expires_at, max_uses, current_uses, status
      FROM agency_invitations
      WHERE agency_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(agency.client_id).all<any>()

    return c.json({
      status: 'ok',
      data: invitations.results || [],
    })
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Failed to fetch invitations' }, 500)
  }
})

// DELETE /api/v1/agency/invitations/:invitationId
// Disable an invitation
router.delete('/invitations/:invitationId', async (c) => {
  const userId = c.get('userId')
  const invitationId = c.req.param('invitationId')

  try {
    const agency = await c.env.DB_CORE.prepare(
      'SELECT client_id FROM clients WHERE user_id = ? AND is_agency = 1'
    ).bind(userId).first<any>()

    if (!agency) {
      return c.json({ status: 'error', message: 'Not an agency admin' }, 403)
    }

    // Verify ownership
    const invitation = await c.env.DB_CORE.prepare(
      'SELECT invitation_id FROM agency_invitations WHERE invitation_id = ? AND agency_id = ?'
    ).bind(invitationId, agency.client_id).first<any>()

    if (!invitation) {
      return c.json({ status: 'error', message: 'Invitation not found' }, 404)
    }

    // Update status to disabled
    await c.env.DB_CORE.prepare(
      'UPDATE agency_invitations SET status = ? WHERE invitation_id = ?'
    ).bind('disabled', invitationId).run()

    return c.json({ status: 'ok', message: 'Invitation disabled' })
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Failed to disable invitation' }, 500)
  }
})

// GET /api/v1/agency/info
// Get agency info (for talent profile page)
router.get('/info', async (c) => {
  const userId = c.get('userId')

  try {
    // Get talent's agency
    const talent = await c.env.DB_CORE.prepare(
      'SELECT agency_id FROM talents WHERE user_id = ?'
    ).bind(userId).first<any>()

    if (!talent?.agency_id) {
      return c.json({ status: 'ok', data: null })
    }

    // Get agency details
    const agency = await c.env.DB_CORE.prepare(`
      SELECT 
        c.client_id as agency_id,
        c.company_name as agency_name,
        c.logo_url,
        u.full_name as admin_name,
        u.email as admin_email
      FROM clients c
      JOIN users u ON c.user_id = u.id
      WHERE c.client_id = ? AND c.is_agency = 1
    `).bind(talent.agency_id).first<any>()

    return c.json({
      status: 'ok',
      data: agency,
    })
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Failed to fetch agency info' }, 500)
  }
})

export default router
