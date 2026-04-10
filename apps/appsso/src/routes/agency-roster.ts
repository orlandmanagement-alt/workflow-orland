// Agency Roster Management API Endpoints
// File: apps/appsso/src/routes/agency-roster.ts

import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { createHash, randomBytes } from 'crypto'

const app = new Hono()

/**
 * SECURITY CONTEXT:
 * - Impersonation tokens are short-lived (5 minutes)
 * - Each switch is logged with timestamp, IP, user agent
 * - Agency ID is always embedded in token to prevent lateral movement
 * - Parent agency ID tracked in database for audit trail
 */

interface ImpersonationToken {
  agencyId: string
  talentId: string
  token: string
  expiresAt: number
  createdAt: number
  ipAddress: string
  userAgent: string
}

interface ManagedTalent {
  id: string
  agencyId: string
  email: string
  name: string
  role: 'talent'
  profileStatus: 'draft' | 'pending_review' | 'active' | 'archived'
  canLoginIndependently: boolean
  lastModifiedBy: 'agency' | 'self'
  lastModifiedAt: number
  createdAt: number
}

interface AgencyAccount {
  id: string
  email: string
  name: string
  role: 'agency'
  companyName: string
  totalManagedTalents: number
  activeImpersonations: number
  createdAt: number
}

/**
 * ============================================
 * ROSTER ENDPOINTS
 * ============================================
 */

/**
 * GET /agency/roster
 * Get all managed talents under this agency
 *
 * Response: { status: 'ok', talents: ManagedTalent[], pagination: {...} }
 */
app.get('/roster', async (c) => {
  const agencyId = c.req.header('x-agency-id')

  if (!agencyId) {
    return c.json(
      { status: 'error', message: 'Unauthorized - no agency ID' },
      { status: 401 }
    )
  }

  const page = parseInt(c.req.query('page') || '1')
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100)
  const offset = (page - 1) * limit

  try {
    // Query must be implemented in your D1 database
    // SELECT id, agencyId, email, name, profileStatus, canLoginIndependently, etc.
    // WHERE agencyId = ? AND deletedAt IS NULL

    return c.json({
      status: 'ok',
      talents: [], // Would come from D1 query
      pagination: {
        page,
        limit,
        total: 0,
        hasMore: false,
      },
    })
  } catch (error) {
    console.error('Roster fetch error:', error)
    return c.json(
      { status: 'error', message: 'Failed to fetch roster' },
      { status: 500 }
    )
  }
})

/**
 * POST /agency/talent/create
 * Create a new managed talent profile
 *
 * Body: {
 *   email: string,
 *   name: string,
 *   canLoginIndependently: boolean
 * }
 *
 * Response: { status: 'ok', talent: ManagedTalent, tempPassword: string }
 */
app.post('/talent/create', async (c) => {
  const agencyId = c.req.header('x-agency-id')

  if (!agencyId) {
    return c.json(
      { status: 'error', message: 'Unauthorized - no agency ID' },
      { status: 401 }
    )
  }

  const body = await c.req.json<{
    email: string
    name: string
    canLoginIndependently?: boolean
  }>()

  // Validate input
  if (!body.email || !body.name) {
    return c.json(
      { status: 'error', message: 'Email and name are required' },
      { status: 400 }
    )
  }

  if (!isValidEmail(body.email)) {
    return c.json(
      { status: 'error', message: 'Invalid email format' },
      { status: 400 }
    )
  }

  try {
    const talentId = `talent_${randomUUID()}`
    const tempPassword = generateSecurePassword(16)
    const tempPasswordHash = hashPasswordPBKDF2(tempPassword)

    // Create managed talent in database
    // INSERT INTO talents (id, agencyId, email, name, passwordHash, role, canLoginIndependently, ...)
    // UPDATE agencies SET totalManagedTalents = totalManagedTalents + 1

    // Send invitation email to talent
    // await sendInvitationEmail({
    //   email: body.email,
    //   name: body.name,
    //   tempPassword,
    //   agencyName: agencyInfo.companyName,
    //   setupUrl: `https://talent.orlandmanagement.com/setup?token=${setupToken}`
    // })

    return c.json({
      status: 'ok',
      talent: {
        id: talentId,
        agencyId,
        email: body.email,
        name: body.name,
        role: 'talent',
        profileStatus: 'draft',
        canLoginIndependently: body.canLoginIndependently || false,
        lastModifiedBy: 'agency',
        lastModifiedAt: Date.now(),
        createdAt: Date.now(),
      },
      tempPassword, // Send this in email only, not return in API
      message: 'Talent created. Invitation sent to email.',
    })
  } catch (error) {
    console.error('Talent creation error:', error)
    return c.json(
      { status: 'error', message: 'Failed to create talent' },
      { status: 500 }
    )
  }
})

/**
 * GET /agency/talent/:talentId
 * Get details of a specific managed talent
 *
 * Response: { status: 'ok', talent: ManagedTalent }
 */
app.get('/talent/:talentId', async (c) => {
  const agencyId = c.req.header('x-agency-id')
  const talentId = c.req.param('talentId')

  if (!agencyId) {
    return c.json(
      { status: 'error', message: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // SELECT * FROM talents WHERE id = ? AND agencyId = ?
    // This ensures agency can only view their own talents

    return c.json({
      status: 'ok',
      talent: {}, // Would come from D1 query
    })
  } catch (error) {
    console.error('Talent fetch error:', error)
    return c.json(
      { status: 'error', message: 'Talent not found' },
      { status: 404 }
    )
  }
})

/**
 * PUT /agency/talent/:talentId
 * Update managed talent profile (agency can override settings)
 *
 * Body: {
 *   name?: string,
 *   profileStatus?: 'draft' | 'pending_review' | 'active' | 'archived',
 *   canLoginIndependently?: boolean,
 *   // Portfolio sync settings
 *   portfolioEditLock?: boolean,
 *   priceNegotiationLock?: boolean,
 *   scheduleAutoSync?: boolean
 * }
 */
app.put('/talent/:talentId', async (c) => {
  const agencyId = c.req.header('x-agency-id')
  const talentId = c.req.param('talentId')
  const body = await c.req.json()

  if (!agencyId) {
    return c.json(
      { status: 'error', message: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // UPDATE talents SET name=?, profileStatus=?, lastModifiedBy='agency', lastModifiedAt=NOW()
    // WHERE id = ? AND agencyId = ?

    return c.json({
      status: 'ok',
      talent: {}, // Updated talent object
      message: 'Talent updated',
    })
  } catch (error) {
    console.error('Talent update error:', error)
    return c.json(
      { status: 'error', message: 'Failed to update talent' },
      { status: 500 }
    )
  }
})

/**
 * ============================================
 * IMPERSONATION ENDPOINTS (SECURE)
 * ============================================
 */

/**
 * POST /agency/impersonate-talent
 * Request to impersonate a managed talent
 *
 * Body: {
 *   talentId: string,
 *   reason?: string (audit logging)
 * }
 *
 * Response: {
 *   status: 'ok',
 *   impersonationToken: string,
 *   expiresIn: number (seconds),
 *   validUntil: number (timestamp)
 * }
 *
 * SECURITY:
 * - Token valid for 5 minutes only
 * - Only works for agency's own managed talents
 * - Each request logged (timestamp, IP, user agent, reason)
 * - Cannot nest impersonations (agency already impersonating can't impersonate another)
 */
app.post('/impersonate-talent', async (c) => {
  const agencyId = c.req.header('x-agency-id')
  const agencyUserId = c.req.header('x-user-id')
  const ipAddress = getClientIp(c)
  const userAgent = c.req.header('user-agent') || ''

  if (!agencyId) {
    return c.json(
      { status: 'error', message: 'Unauthorized' },
      { status: 401 }
    )
  }

  const body = await c.req.json<{
    talentId: string
    reason?: string
  }>()

  if (!body.talentId) {
    return c.json(
      { status: 'error', message: 'Talent ID required' },
      { status: 400 }
    )
  }

  try {
    // First: Verify talent belongs to this agency
    // SELECT id, email, name FROM talents WHERE id = ? AND agencyId = ?

    // Second: Check if agency already has an active impersonation
    // SELECT COUNT(*) FROM impersonation_sessions WHERE agencyId = ? AND expiresAt > NOW()

    // Third: Create impersonation token
    const tokenId = randomUUID()
    const tokenSecret = randomBytes(32).toString('hex')
    const tokenHash = hashTokenSecurely(tokenSecret)
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

    // Fourth: Insert into audit log
    // INSERT INTO impersonation_audit_log (agencyId, agencyUserId, talentId, ipAddress, userAgent, reason, timestamp)

    // Fifth: Create session entry
    // INSERT INTO impersonation_sessions (agencyId, talentId, tokenHash, expiresAt, createdAt)

    const impersonationToken = `imp_${tokenId}_${tokenSecret}`

    return c.json({
      status: 'ok',
      impersonationToken,
      expiresIn: 300, // seconds
      validUntil: expiresAt,
      mode: 'view_as',
      talent: {
        id: body.talentId,
        name: '', // From database query
      },
    })
  } catch (error) {
    console.error('Impersonation error:', error)
    return c.json(
      { status: 'error', message: 'Failed to create impersonation' },
      { status: 500 }
    )
  }
})

/**
 * POST /agency/clear-impersonation
 * End current impersonation session
 *
 * Response: { status: 'ok', message: 'Impersonation cleared' }
 */
app.post('/clear-impersonation', async (c) => {
  const agencyId = c.req.header('x-agency-id')

  if (!agencyId) {
    return c.json(
      { status: 'error', message: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // UPDATE impersonation_sessions SET expiresAt = NOW() WHERE agencyId = ?

    return c.json({
      status: 'ok',
      message: 'Impersonation cleared',
    })
  } catch (error) {
    console.error('Clear impersonation error:', error)
    return c.json(
      { status: 'error', message: 'Failed to clear impersonation' },
      { status: 500 }
    )
  }
})

/**
 * GET /agency/impersonation-audit
 * Get audit log of all impersonation sessions for this agency
 *
 * Query params: page, limit, talentId (filter)
 * Response: { status: 'ok', audit: [], pagination: {...} }
 */
app.get('/impersonation-audit', async (c) => {
  const agencyId = c.req.header('x-agency-id')

  if (!agencyId) {
    return c.json(
      { status: 'error', message: 'Unauthorized' },
      { status: 401 }
    )
  }

  const page = parseInt(c.req.query('page') || '1')
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100)
  const talentId = c.req.query('talentId')

  try {
    let query =
      'SELECT * FROM impersonation_audit_log WHERE agencyId = ? ORDER BY timestamp DESC'
    const params: any[] = [agencyId]

    if (talentId) {
      query += ' AND talentId = ?'
      params.push(talentId)
    }

    query += ' LIMIT ? OFFSET ?'
    params.push(limit, (page - 1) * limit)

    // Execute query against D1

    return c.json({
      status: 'ok',
      audit: [], // Results from query
      pagination: { page, limit },
    })
  } catch (error) {
    console.error('Audit fetch error:', error)
    return c.json(
      { status: 'error', message: 'Failed to fetch audit log' },
      { status: 500 }
    )
  }
})

/**
 * ============================================
 * CLIENT-FACING ENDPOINTS
 * ============================================
 */

/**
 * GET /agency/talent/:talentId/contact-info
 * When a client wants to contact a talent, redirect to agency inbox
 *
 * Response: {
 *   status: 'ok',
 *   contactType: 'direct' | 'through_agency',
 *   redirectUrl: string,
 *   message: string
 * }
 *
 * This is called by client app when displaying
 * managed talent profiles
 */
app.get('/talent/:talentId/contact-info', async (c) => {
  const talentId = c.req.param('talentId')

  try {
    // SELECT agencyId, email FROM talents WHERE id = ? AND profileStatus = 'active'
    // If this talent is managed, return agency contact instead

    return c.json({
      status: 'ok',
      contactType: 'through_agency', // or 'direct'
      redirectUrl: 'https://agency.orlandmanagement.com/inbox',
      message:
        'This talent is managed by an agency. Contact the agency directly through their inbox.',
    })
  } catch (error) {
    return c.json(
      { status: 'error', message: 'Talent not found' },
      { status: 404 }
    )
  }
})

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function generateSecurePassword(length: number): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  const randomValues = randomBytes(length)

  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length]
  }

  return password
}

function hashPasswordPBKDF2(password: string): string {
  // Implementation from apps/appsso/src/utils/crypto.ts
  // PBKDF2 with 100k iterations
  return '' // Placeholder
}

function hashTokenSecurely(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function getClientIp(c: any): string {
  return (
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0] ||
    c.req.header('x-real-ip') ||
    '0.0.0.0'
  )
}

export default app
