// Client Inbox API Middleware - Managed Talent Routing
// File: apps/appapi/src/routes/client-managed-talent-inbox.ts

import { Hono } from 'hono'

const app = new Hono()

/**
 * FEATURE: When clients interact with managed talents, communications
 * are routed to the managing agency's inbox instead of direct talent contact
 */

/**
 * GET /client/talent/:talentId/contact-options
 *
 * Before client initiates a booking/inquiry with a talent,
 * check if talent is managed. If yes, route to agency.
 *
 * Response: {
 *   status: 'ok',
 *   contactType: 'direct' | 'through_agency',
 *   contactInfo: {
 *     name: string,
 *     email?: string,
 *     inboxUrl: string,
 *     message: string
 *   }
 * }
 */
app.get('/talent/:talentId/contact-options', async (c) => {
  const talentId = c.req.param('talentId')
  const clientId = c.req.header('x-client-id')

  if (!clientId) {
    return c.json(
      { status: 'error', message: 'Client ID required' },
      { status: 401 }
    )
  }

  try {
    // Query managed_talents table
    // SELECT managedBy FROM managed_talents WHERE id = ?

    const isManagedTalent = false // Mock
    const agencyInfo = null // Mock

    if (isManagedTalent && agencyInfo) {
      return c.json({
        status: 'ok',
        contactType: 'through_agency',
        contactInfo: {
          name: agencyInfo.companyName,
          inboxUrl: `https://client-portal.orlandmanagement.com/agency/${agencyInfo.id}/contact`,
          message: `This talent is managed by ${agencyInfo.companyName}. Your inquiries will be sent to their agency inbox for faster response.`,
        },
      })
    }

    return c.json({
      status: 'ok',
      contactType: 'direct',
      contactInfo: {
        name: '', // Talent name from DB
        email: '', // Talent email from DB
        inboxUrl: `https://client-portal.orlandmanagement.com/talent/${talentId}/contact`,
        message: 'Contact this talent directly',
      },
    })
  } catch (error) {
    console.error('Contact options error:', error)
    return c.json(
      { status: 'error', message: 'Failed to fetch contact options' },
      { status: 500 }
    )
  }
})

/**
 * POST /client/talent/:talentId/send-inquiry
 * Route inquiry to correct inbox (agency or talent)
 *
 * Body: {
 *   message: string,
 *   projectDetails: { budget: number, duration: string, ... },
 *   clientInfo?: { name, email, phone }
 * }
 */
app.post('/talent/:talentId/send-inquiry', async (c) => {
  const talentId = c.req.param('talentId')
  const clientId = c.req.header('x-client-id')
  const body = await c.req.json<{
    message: string
    projectDetails: Record<string, any>
    clientInfo?: Record<string, any>
  }>()

  if (!clientId) {
    return c.json(
      { status: 'error', message: 'Client ID required' },
      { status: 401 }
    )
  }

  try {
    // Check if talent is managed
    // SELECT agencyId FROM managed_talents WHERE id = ?

    const isManagedTalent = false // Mock
    const agencyId = null // Mock

    const inboxEntry = {
      id: `inbox_${Date.now()}`,
      senderType: 'client',
      senderId: clientId,
      recipientType: isManagedTalent ? 'agency' : 'talent',
      recipientId: isManagedTalent ? agencyId : talentId,
      talentId: talentId,
      subject: `New Inquiry: ${body.projectDetails?.title || 'Project'}`,
      message: body.message,
      projectDetails: body.projectDetails,
      clientInfo: body.clientInfo,
      status: 'new',
      createdAt: Date.now(),
    }

    // INSERT INTO client_inquiries (...)

    return c.json({
      status: 'ok',
      message: isManagedTalent
        ? 'Inquiry sent to agency inbox'
        : 'Inquiry sent to talent',
      inboxId: inboxEntry.id,
    })
  } catch (error) {
    console.error('Send inquiry error:', error)
    return c.json(
      { status: 'error', message: 'Failed to send inquiry' },
      { status: 500 }
    )
  }
})

/**
 * GET /agency/inbox
 * Agency view of all client inquiries for their managed talents
 *
 * Query params: filter, sort, page, limit
 */
app.get('/inbox', async (c) => {
  const agencyId = c.req.header('x-agency-id')

  if (!agencyId) {
    return c.json(
      { status: 'error', message: 'Unauthorized' },
      { status: 401 }
    )
  }

  const filter = c.req.query('filter') || 'all' // 'new', 'replied', 'archived', 'all'
  const page = parseInt(c.req.query('page') || '1')
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100)

  try {
    // SELECT inbox entries for all talents under this agency
    // SELECT * FROM client_inquiries
    // WHERE recipientType = 'agency' AND recipientId = ?
    // OR (talentId IN (SELECT id FROM managed_talents WHERE agencyId = ?) AND recipientType = 'talent')
    // ORDER BY createdAt DESC

    return c.json({
      status: 'ok',
      inquiries: [],
      pagination: { page, limit, total: 0 },
    })
  } catch (error) {
    console.error('Inbox fetch error:', error)
    return c.json(
      { status: 'error', message: 'Failed to fetch inbox' },
      { status: 500 }
    )
  }
})

/**
 * POST /agency/inbox/:inquiryId/reply
 * Agency responds to client inquiry (on behalf of talent)
 *
 * Body: {
 *   message: string,
 *   status?: 'replied' | 'interested' | 'declined',
 *   proposedRate?: number,
 *   availability?: string[]
 * }
 */
app.post('/inbox/:inquiryId/reply', async (c) => {
  const agencyId = c.req.header('x-agency-id')
  const inquiryId = c.req.param('inquiryId')
  const body = await c.req.json()

  if (!agencyId) {
    return c.json(
      { status: 'error', message: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Verify this inquiry belongs to this agency's talent
    // SELECT * FROM client_inquiries WHERE id = ?
    // JOIN managed_talents ON client_inquiries.talentId = managed_talents.id
    // WHERE managed_talents.agencyId = ?

    // UPDATE client_inquiries
    // SET status = ?, lastReplyAt = ?, replies = JSON_ARRAY_APPEND(replies, '$', {...})

    // SEND EMAIL TO CLIENT WITH COMPILED RESPONSE (signed by agency)

    return c.json({
      status: 'ok',
      message: 'Reply sent to client',
      inquiryId,
    })
  } catch (error) {
    console.error('Reply send error:', error)
    return c.json(
      { status: 'error', message: 'Failed to send reply' },
      { status: 500 }
    )
  }
})

/**
 * POST /agency/inbox/:inquiryId/forward-to-talent
 * Agency can delegate response to the talent (if canLoginIndependently = true)
 *
 * Body: {
 *   talentId: string,
 *   message?: string
 * }
 */
app.post('/inbox/:inquiryId/forward-to-talent', async (c) => {
  const agencyId = c.req.header('x-agency-id')
  const inquiryId = c.req.param('inquiryId')
  const body = await c.req.json<{ talentId: string; message?: string }>()

  if (!agencyId) {
    return c.json(
      { status: 'error', message: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Check if talent has independent login
    // SELECT canLoginIndependently FROM managed_talents
    // WHERE id = ? AND agencyId = ?

    const canLoginIndependently = false // Mock

    if (!canLoginIndependently) {
      return c.json(
        {
          status: 'error',
          message: 'This talent does not have independent login access',
        },
        { status: 403 }
      )
    }

    // Create delegation task
    // INSERT INTO delegation_tasks (agencyId, talentId, inquiryId, status)

    // Send email to talent with direct link
    // await sendEmailToTalent({...})

    return c.json({
      status: 'ok',
      message: 'Inquiry forwarded to talent',
    })
  } catch (error) {
    console.error('Forward error:', error)
    return c.json(
      { status: 'error', message: 'Failed to forward inquiry' },
      { status: 500 }
    )
  }
})

export default app
