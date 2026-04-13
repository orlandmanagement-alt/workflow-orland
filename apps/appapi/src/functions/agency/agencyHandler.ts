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

const bulkSubmissionItemSchema = z.object({
  talentId: z.string().min(1),
  agencyTalentId: z.string().min(1),
  roleName: z.string().min(1),
  roleId: z.string().optional().default(''),
  matchScore: z.number().min(0).max(100),
  matchBreakdown: z.record(z.string(), z.number()).default({}),
  pricing: z.object({
    serviceName: z.string().min(1),
    proposedAmount: z.number().positive(),
    currency: z.string().default('IDR'),
    agencyMarkupPercent: z.number().min(0).max(100).default(15),
    agencyCommissionPercent: z.number().min(0).max(100).default(20),
  }),
})

const bulkSubmissionSchema = z.object({
  projectId: z.string().min(1),
  batchNotes: z.string().optional().default(''),
  submissions: z.array(bulkSubmissionItemSchema).min(1).max(100),
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

    // Get agency details from DB_CORE
    const agencyCore = await c.env.DB_CORE.prepare(`
      SELECT 
        client_id as agency_id,
        company_name as agency_name,
        logo_url,
        user_id
      FROM clients
      WHERE client_id = ? AND is_agency = 1
    `).bind(talent.agency_id).first<any>()

    if (!agencyCore) {
      return c.json({ status: 'error', message: 'Agency not found' }, 404)
    }

    // Fetch user details from DB_SSO
    const adminUser = await c.env.DB_SSO.prepare(`
      SELECT first_name || ' ' || last_name as admin_name, email as admin_email
      FROM users
      WHERE id = ?
    `).bind(agencyCore.user_id).first<any>()

    return c.json({
      status: 'ok',
      data: {
        agency_id: agencyCore.agency_id,
        agency_name: agencyCore.agency_name,
        logo_url: agencyCore.logo_url,
        admin_name: adminUser?.admin_name || 'Unknown Admin',
        admin_email: adminUser?.admin_email || 'unknown@example.com'
      },
    })
  } catch (err: any) {
    return c.json({ status: 'error', message: 'Failed to fetch agency info' }, 500)
  }
})

// GET /api/v1/agency/roster?project_id={id}
// Fetch agency roster and apply basic eligibility scoring against project requirements
router.get('/roster', async (c) => {
  const userId = c.get('userId')
  const projectId = c.req.query('project_id')

  if (!projectId) {
    return c.json({ success: false, error: { code: 'MISSING_PARAM', message: 'project_id required' } }, 400)
  }

  try {
    const agencyId = await resolveAgencyId(c, userId)
    if (!agencyId) {
      return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Agency not found' } }, 403)
    }

    const project = await c.env.DB_CORE.prepare(
      'SELECT project_id, project_title FROM projects WHERE project_id = ?'
    ).bind(projectId).first<any>()

    if (!project) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404)
    }

    const req = await c.env.DB_CORE.prepare(`
      SELECT required_gender, required_age_min, required_age_max, height_min_cm, height_max_cm,
             required_skills, required_languages, budget_min, budget_max,
             shoot_date_start, shoot_date_end, required_location_pref, special_requirements
      FROM casting_requirements
      WHERE project_id = ?
      LIMIT 1
    `).bind(projectId).first<any>()

    const roster = await c.env.DB_CORE.prepare(`
      SELECT
        at.id as agency_talent_id,
        t.talent_id,
        t.user_id,
        COALESCE(t.gender, 'female') as gender,
        COALESCE(t.height_cm, 0) as height_cm,
        COALESCE(t.weight_kg, 0) as weight_kg,
        COALESCE(t.skin_tone, 'medium') as skin_tone,
        COALESCE(t.hair_color, '') as hair_color,
        COALESCE(t.eye_color, '') as eye_color,
        COALESCE(t.face_type, '') as face_type,
        COALESCE(t.domicile, '') as domicile,
        COALESCE(t.skills_json, '[]') as skills_json,
        COALESCE(t.languages_json, '[]') as languages_json,
        COALESCE(t.profile_image, '') as profile_image,
        COALESCE(t.comp_card_url, '') as comp_card_url,
        COALESCE(t.rate_daily_min, 0) as rate_daily_min,
        COALESCE(t.rate_daily_max, 0) as rate_daily_max,
        COALESCE(t.profile_completion_percent, 60) as profile_completion_percent,
        COALESCE(t.is_available, 1) as is_available
      FROM agency_talents at
      JOIN talents t ON at.talent_id = t.talent_id
      WHERE at.agency_id = ?
    `).bind(agencyId).all<any>()

    const requiredSkills = safeParseArray(req?.required_skills)
    const requiredLanguages = safeParseArray(req?.required_languages)

    // Fetch names and emails from SSO
    let ssoUsersMap: Record<string, { name: string; email: string }> = {};
    if (roster.results && roster.results.length > 0) {
      const userIds = roster.results.map(t => `'${t.user_id}'`).join(',');
      const { results: users } = await c.env.DB_SSO.prepare(`
        SELECT id, first_name || ' ' || last_name as full_name, email FROM users WHERE id IN (${userIds})
      `).all<any>();
      
      ssoUsersMap = (users || []).reduce((acc, user) => ({
        ...acc,
        [user.id]: { name: user.full_name, email: user.email }
      }), {});
    }

    const candidates: any[] = []
    const ineligibleReasons: Array<{ talentId: string; name: string; failureReason: string }> = []

    for (const t of roster.results || []) {
      const ssoUser = ssoUsersMap[t.user_id] || { name: 'Unknown Talent', email: '' };
      t.name = ssoUser.name;
      t.email = ssoUser.email;
      const skills = safeParseArray(t.skills_json)
      const languages = safeParseArray(t.languages_json)

      const eligibility = evaluateEligibility(t, req, skills, languages)
      if (!eligibility.eligible) {
        ineligibleReasons.push({
          talentId: t.talent_id,
          name: t.name,
          failureReason: eligibility.reason,
        })
        continue
      }

      const proposedAmount = t.rate_daily_min > 0 ? t.rate_daily_min : Math.max(0, req?.budget_min || 0)
      const agencyFee = proposedAmount * 0.2

      candidates.push({
        id: t.talent_id,
        agencyTalentId: t.agency_talent_id,
        name: t.name,
        email: t.email,
        profiles: {
          gender: t.gender,
          dateOfBirth: '',
          age: t.age,
          height_cm: t.height_cm,
          weight_kg: t.weight_kg,
          skin_tone: t.skin_tone,
          hair_color: t.hair_color,
          eye_color: t.eye_color,
          face_type: t.face_type,
          domicile: t.domicile,
          skills,
          languages,
        },
        rateCard: {
          serviceName: 'Daily Service',
          dailyRateMin: t.rate_daily_min,
          dailyRateMax: t.rate_daily_max,
          baseCurrency: 'IDR',
        },
        availability: {
          status: t.is_available ? 'available' : 'unavailable',
          conflicts: [],
        },
        profilePhoto: t.profile_image,
        compCardUrl: t.comp_card_url,
        matchScore: eligibility.score,
        matchBreakdown: eligibility.breakdown,
        profileQuality: t.profile_completion_percent,
        pricing: {
          serviceName: 'Daily Service',
          proposedAmount,
          agencyMarkupPercent: 15,
          agencyCommissionPercent: 20,
          agencyFee,
          talentPayment: proposedAmount - agencyFee,
          currency: 'IDR',
        },
      })
    }

    return c.json({
      success: true,
      data: {
        projectId,
        projectName: project.project_title,
        totalRosterCount: (roster.results || []).length,
        eligibleCount: candidates.length,
        ineligibleCount: ineligibleReasons.length,
        candidates,
        ineligibleReasons,
        requirements: {
          projectId,
          gender: req?.required_gender || 'any',
          ageMin: req?.required_age_min || 0,
          ageMax: req?.required_age_max || 100,
          heightMinCm: req?.height_min_cm || 0,
          heightMaxCm: req?.height_max_cm || 999,
          requiredSkills,
          requiredLanguages,
          budgetMin: req?.budget_min || 0,
          budgetMax: req?.budget_max || 0,
          shootDateStart: req?.shoot_date_start || '',
          shootDateEnd: req?.shoot_date_end || '',
          locationPref: req?.required_location_pref || 'flexible',
          specialRequirements: req?.special_requirements || '',
        },
      },
    })
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch roster' } }, 500)
  }
})

// POST /api/v1/agency/projects/apply-bulk
// Create a submission batch and item records
router.post('/projects/apply-bulk', zValidator('json', bulkSubmissionSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  try {
    const agencyId = await resolveAgencyId(c, userId)
    if (!agencyId) {
      return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Agency not found' } }, 403)
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const now = Date.now()

    await c.env.DB_CORE.prepare(`
      INSERT INTO agency_bulk_submissions
      (id, agencyId, projectId, totalTalents, submittedTalents, status, createdAt, submittedAt, notes, submittedBy)
      VALUES (?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?)
    `).bind(
      batchId,
      agencyId,
      body.projectId,
      body.submissions.length,
      body.submissions.length,
      now,
      now,
      body.batchNotes,
      userId,
    ).run()

    let totalProposedRevenue = 0
    let totalAgencyFee = 0
    let totalTalentPayment = 0
    const submissionStatuses: any[] = []

    for (const sub of body.submissions) {
      const itemId = `bsi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const bookingId = `BK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const agencyFee = sub.pricing.proposedAmount * (sub.pricing.agencyCommissionPercent / 100)
      const talentPayment = sub.pricing.proposedAmount - agencyFee

      await c.env.DB_CORE.prepare(`
        INSERT INTO project_talents
        (booking_id, project_id, talent_id, agency_id, proposed_rate, status, created_at, bulk_submission_item_id)
        VALUES (?, ?, ?, ?, ?, 'shortlisted', ?, ?)
      `).bind(
        bookingId,
        body.projectId,
        sub.talentId,
        agencyId,
        sub.pricing.proposedAmount,
        new Date(now).toISOString(),
        itemId,
      ).run()

      await c.env.DB_CORE.prepare(`
        INSERT INTO bulk_submission_items
        (id, batchId, talentId, agencyTalentId, roleName, roleId, matchPercentage, matchBreakdown,
         serviceName, proposedAmount, commissionPercent, agencyFee, talentPayment,
         itemStatus, createdProjectTalentId, createdAt, submittedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
      `).bind(
        itemId,
        batchId,
        sub.talentId,
        sub.agencyTalentId,
        sub.roleName,
        sub.roleId,
        sub.matchScore,
        JSON.stringify(sub.matchBreakdown),
        sub.pricing.serviceName,
        sub.pricing.proposedAmount,
        sub.pricing.agencyCommissionPercent,
        agencyFee,
        talentPayment,
        bookingId,
        now,
        now,
      ).run()

      totalProposedRevenue += sub.pricing.proposedAmount
      totalAgencyFee += agencyFee
      totalTalentPayment += talentPayment

      submissionStatuses.push({
        itemId,
        talentId: sub.talentId,
        talentName: '',
        status: 'pending',
        projectTalentId: bookingId,
        proposedAmount: sub.pricing.proposedAmount,
        agencyFee,
        talentPayment,
      })
    }

    await c.env.DB_CORE.prepare(`
      UPDATE agency_bulk_submissions
      SET totalProposedRevenue = ?, totalAgencyFee = ?, totalTalentPayment = ?
      WHERE id = ?
    `).bind(totalProposedRevenue, totalAgencyFee, totalTalentPayment, batchId).run()

    return c.json({
      success: true,
      data: {
        batchId,
        projectId: body.projectId,
        agencyId,
        submittedAt: now,
        totalSubmissions: body.submissions.length,
        submissionStatuses,
        financialSummary: {
          totalProposedRevenue,
          totalAgencyFee,
          totalTalentPayment,
          currency: 'IDR',
        },
        nextSteps: [
          'Client will review submissions within 24 hours',
          'Track updates in submissions dashboard',
        ],
      },
    })
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to process submission' } }, 500)
  }
})

// GET /api/v1/agency/submissions
// List agency submission batches with item statuses
router.get('/submissions', async (c) => {
  const userId = c.get('userId')

  try {
    const agencyId = await resolveAgencyId(c, userId)
    if (!agencyId) {
      return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Agency not found' } }, 403)
    }

    const batches = await c.env.DB_CORE.prepare(`
      SELECT b.id as batch_id, b.projectId, b.status, b.submittedAt, b.totalTalents,
             b.approvedCount, b.rejectedCount, b.totalProposedRevenue, b.totalAgencyFee, b.totalTalentPayment,
             COALESCE(p.project_title, '') as project_title
      FROM agency_bulk_submissions b
      LEFT JOIN projects p ON p.project_id = b.projectId
      WHERE b.agencyId = ?
      ORDER BY b.createdAt DESC
      LIMIT 100
    `).bind(agencyId).all<any>()

    const submissions = (batches.results || []).map((b: any) => ({
      batchId: b.batch_id,
      projectId: b.projectId,
      projectName: b.project_title,
      status: b.status,
      submittedAt: b.submittedAt,
      totalTalents: b.totalTalents,
      approvedCount: b.approvedCount,
      rejectedCount: b.rejectedCount,
      pendingCount: Math.max(0, b.totalTalents - b.approvedCount - b.rejectedCount),
      financialSummary: {
        totalProposedRevenue: b.totalProposedRevenue,
        totalAgencyFee: b.totalAgencyFee,
        totalTalentPayment: b.totalTalentPayment,
      },
    }))

    return c.json({
      success: true,
      data: {
        total: submissions.length,
        submissions,
      },
    })
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch submissions' } }, 500)
  }
})

async function resolveAgencyId(c: any, userId: string): Promise<string | null> {
  const fromClients = await c.env.DB_CORE.prepare(
    'SELECT client_id FROM clients WHERE user_id = ? AND is_agency = 1'
  ).bind(userId).first()

  if (fromClients?.client_id) return fromClients.client_id

  const fromUsers = await c.env.DB_SSO.prepare(
    'SELECT agency_id FROM users WHERE id = ? OR user_id = ?'
  ).bind(userId, userId).first()

  return fromUsers?.agency_id || null
}

function safeParseArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function evaluateEligibility(t: any, req: any, skills: string[], languages: string[]) {
  if (!req) {
    return {
      eligible: true,
      reason: '',
      score: 70,
      breakdown: {
        height: 10,
        physique: 10,
        skills: 15,
        languages: 10,
        availability: 15,
        profileQuality: 10,
        rateAlignment: 10,
      },
    }
  }

  if (req.required_gender && req.required_gender !== 'any' && t.gender !== req.required_gender) {
    return { eligible: false, reason: 'Gender mismatch', score: 0, breakdown: {} }
  }
  if (req.required_age_min && t.age < req.required_age_min) {
    return { eligible: false, reason: 'Age below requirement', score: 0, breakdown: {} }
  }
  if (req.required_age_max && t.age > req.required_age_max) {
    return { eligible: false, reason: 'Age above requirement', score: 0, breakdown: {} }
  }
  if (req.height_min_cm && t.height_cm < req.height_min_cm) {
    return { eligible: false, reason: 'Height below requirement', score: 0, breakdown: {} }
  }
  if (req.height_max_cm && t.height_cm > req.height_max_cm) {
    return { eligible: false, reason: 'Height above requirement', score: 0, breakdown: {} }
  }

  const reqSkills = safeParseArray(req.required_skills)
  const reqLanguages = safeParseArray(req.required_languages)
  const matchedSkills = reqSkills.filter((s) => skills.includes(s)).length
  const matchedLanguages = reqLanguages.filter((l) => languages.includes(l)).length

  const breakdown = {
    height: 15,
    physique: 10,
    skills: reqSkills.length ? Math.round((matchedSkills / reqSkills.length) * 20) : 12,
    languages: reqLanguages.length ? Math.round((matchedLanguages / reqLanguages.length) * 10) : 7,
    availability: t.is_available ? 15 : 0,
    profileQuality: Math.min(15, Math.round((Number(t.profile_completion_percent || 0) / 100) * 15)),
    rateAlignment:
      req.budget_max && Number(t.rate_daily_min || 0) > 0 && Number(t.rate_daily_min) <= Number(req.budget_max)
        ? 10
        : 5,
  }

  const score = Object.values(breakdown).reduce((acc, cur) => acc + cur, 0)
  return { eligible: true, reason: '', score, breakdown }
}

export default router
