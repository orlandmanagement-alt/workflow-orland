/**
 * Multi-Talent Submission Backend - Hono Implementation Guide
 * File: apps/appapi/src/routes/agency/multiTalent.ts
 * 
 * This file contains the complete implementation of multi-talent submission
 * endpoints for the Agency Dashboard.
 */

import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import type { Context } from 'hono'
import { D1Database } from '@cloudflare/workers-types'
import type {
  BulkSubmissionPayload,
  BulkSubmissionResponse,
  FilteredRoster,
  TalentCandidate,
  MatchScoreBreakdown,
  ImpersonationStartRequest,
  ImpersonationSession,
} from '@/types/multiTalentSubmission'

// ============================================================================
// ROUTER SETUP
// ============================================================================

export const createMultiTalentRouter = (db: D1Database) => {
  const router = new Hono()

  // ========================================================================
  // 1. GET /api/agency/roster?project_id={id}
  // ========================================================================

  router.get('/roster', async (c: Context) => {
    try {
      // Auth check
      const agencyId = await validateAgencyAuth(c, db)
      if (!agencyId) {
        return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)
      }

      const projectId = c.req.query('project_id')
      if (!projectId) {
        return c.json(
          { success: false, error: { code: 'MISSING_PARAM', message: 'project_id required' } },
          400
        )
      }

      // Fetch project and requirements
      const project = await db.prepare('SELECT * FROM projects WHERE project_id = ?').bind(projectId).first()
      if (!project) {
        return c.json(
          { success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } },
          404
        )
      }

      const requirements = await db
        .prepare('SELECT * FROM casting_requirements WHERE project_id = ? AND is_active = 1')
        .bind(projectId)
        .first()

      if (!requirements) {
        return c.json(
          { success: false, error: { code: 'NO_REQUIREMENTS', message: 'Project has no casting requirements' } },
          400
        )
      }

      // Fetch all agency talents
      const agencyTalents = await db
        .prepare(
          `SELECT t.*, at.id as agencyTalentId, tp.profile_completion_percent, tp.skills_json, tp.languages_json
         FROM agency_talents at
         JOIN talents t ON at.talent_id = t.talent_id
         JOIN talent_profiles tp ON t.talent_id = tp.talent_id
         WHERE at.agency_id = ? AND at.status = 'active' AND t.is_active = 1`
        )
        .bind(agencyId)
        .all()

      // Apply smart filter algorithm
      const filteredResult = applySmartFilter(agencyTalents, requirements, db)

      // Format response
      const response: APIRosterResponse = {
        success: true,
        data: {
          projectId,
          projectName: project.project_name,
          totalRosterCount: agencyTalents.length,
          eligibleCount: filteredResult.eligible.length,
          ineligibleCount: filteredResult.ineligible.length,
          candidates: filteredResult.eligible,
          ineligibleReasons: filteredResult.ineligible.map((t) => ({
            talentId: t.talent_id,
            name: t.full_name,
            failureReason: t.failureReason,
          })),
          requirements: {
            projectId,
            gender: requirements.required_gender,
            ageMin: requirements.required_age_min,
            ageMax: requirements.required_age_max,
            heightMinCm: requirements.height_min_cm,
            heightMaxCm: requirements.height_max_cm,
            requiredSkills: JSON.parse(requirements.required_skills || '[]'),
            requiredLanguages: JSON.parse(requirements.required_languages || '[]'),
            budgetMin: requirements.budget_min,
            budgetMax: requirements.budget_max,
            shootDateStart: requirements.shoot_date_start,
            shootDateEnd: requirements.shoot_date_end,
            locationPref: requirements.required_location_pref,
          },
        },
      }

      return c.json(response)
    } catch (error) {
      console.error('Error fetching roster:', error)
      return c.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
        500
      )
    }
  })

  // ========================================================================
  // 2. POST /api/agency/projects/apply-bulk
  // ========================================================================

  router.post('/projects/apply-bulk', async (c: Context) => {
    try {
      // Auth check
      const agencyId = await validateAgencyAuth(c, db)
      if (!agencyId) {
        return c.json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401)
      }

      const payload: BulkSubmissionPayload = await c.req.json()

      // Validation
      const validation = validateSubmissionPayload(payload, agencyId, db)
      if (!validation.valid) {
        return c.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid submission', details: validation.errors },
          },
          422
        )
      }

      // Start transaction
      const batchId = `batch_${generateId()}`
      const now = Date.now()

      // 1. Create bulk submission record
      await db
        .prepare(
          `INSERT INTO agency_bulk_submissions 
       (id, agencyId, projectId, totalTalents, status, createdAt, submittedBy, submittedAt)
       VALUES (?, ?, ?, ?, 'submitted', ?, ?, ?)`
        )
        .bind(batchId, agencyId, payload.projectId, payload.submissions.length, now, agencyId, now)
        .run()

      // 2. Process each submission
      const projectTalentIds: string[] = []
      const financialRecords: any[] = []
      let totalRevenue = 0
      let totalAgencyFee = 0

      for (const submission of payload.submissions) {
        const bookingId = `booking_${generateId()}`
        const agencyFee = submission.pricing.proposedAmount * (submission.pricing.agencyCommissionPercent / 100)
        const talentPayment = submission.pricing.proposedAmount - agencyFee

        // Insert project_talents record
        await db
          .prepare(
            `INSERT INTO project_talents 
         (booking_id, project_id, talent_id, agency_id, status, proposed_rate, created_at)
         VALUES (?, ?, ?, ?, 'shortlisted', ?, ?)`
          )
          .bind(bookingId, payload.projectId, submission.talentId, agencyId, submission.pricing.proposedAmount, now)
          .run()

        // Insert bulk submission item
        await db
          .prepare(
            `INSERT INTO bulk_submission_items 
         (id, batchId, talentId, agencyTalentId, roleName, roleId, matchPercentage, matchBreakdown,
          serviceName, proposedAmount, commissionPercent, agencyFee, talentPayment, itemStatus, createdProjectTalentId, createdAt, submittedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
          )
          .bind(
            `bsi_${generateId()}`,
            batchId,
            submission.talentId,
            submission.agencyTalentId,
            submission.roleName,
            submission.roleId,
            submission.matchScore,
            JSON.stringify(submission.matchBreakdown),
            submission.pricing.serviceName,
            submission.pricing.proposedAmount,
            submission.pricing.agencyCommissionPercent,
            agencyFee,
            talentPayment,
            bookingId,
            now,
            now
          )
          .run()

        // Insert financial split
        await db
          .prepare(
            `INSERT INTO financial_splits
         (split_id, booking_id, agency_fee, talent_payment, created_at)
         VALUES (?, ?, ?, ?, ?)`
          )
          .bind(`split_${generateId()}`, bookingId, agencyFee, talentPayment, now)
          .run()

        projectTalentIds.push(bookingId)
        totalRevenue += submission.pricing.proposedAmount
        totalAgencyFee += agencyFee
      }

      // 3. Update batch summary
      await db
        .prepare(
          `UPDATE agency_bulk_submissions 
       SET totalProposedRevenue = ?, totalAgencyFee = ?, totalTalentPayment = ?
       WHERE id = ?`
        )
        .bind(totalRevenue, totalAgencyFee, totalRevenue - totalAgencyFee, batchId)
        .run()

      // Format response
      const response: BulkSubmissionResponse = {
        batchId,
        projectId: payload.projectId,
        agencyId,
        submittedAt: now,
        totalSubmissions: payload.submissions.length,
        submissionStatuses: payload.submissions.map((sub, idx) => ({
          itemId: `bsi_${idx}`,
          talentId: sub.talentId,
          talentName: '', // Would be fetched from DB
          status: 'submitted',
          projectTalentId: projectTalentIds[idx],
          proposedAmount: sub.pricing.proposedAmount,
          agencyFee: sub.pricing.proposedAmount * (sub.pricing.agencyCommissionPercent / 100),
          talentPayment: sub.pricing.proposedAmount * (1 - sub.pricing.agencyCommissionPercent / 100),
        })),
        financialSummary: {
          totalProposedRevenue: totalRevenue,
          totalAgencyFee: totalAgencyFee,
          totalTalentPayment: totalRevenue - totalAgencyFee,
          currency: 'IDR',
        },
        nextSteps: [
          'Client will review submissions within 24 hours',
          'You can track status in the Submissions tab',
          `Reference ID: ${batchId}`,
        ],
      }

      return c.json({ success: true, data: response }, 201)
    } catch (error) {
      console.error('Error submitting bulk application:', error)
      return c.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to process submission' } },
        500
      )
    }
  })

  // ========================================================================
  // 3. GET /api/agency/submissions
  // ========================================================================

  router.get('/submissions', async (c: Context) => {
    try {
      const agencyId = await validateAgencyAuth(c, db)
      if (!agencyId) return c.json({ success: false }, 401)

      const status = c.req.query('status')
      const projectId = c.req.query('projectId')
      const limit = parseInt(c.req.query('limit') || '50')
      const offset = parseInt(c.req.query('offset') || '0')

      let query = 'SELECT * FROM agency_bulk_submissions WHERE agencyId = ?'
      const params: any[] = [agencyId]

      if (status) {
        query += ' AND status = ?'
        params.push(status)
      }
      if (projectId) {
        query += ' AND projectId = ?'
        params.push(projectId)
      }

      query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?'
      params.push(limit, offset)

      const submissions = await db.prepare(query).bind(...params).all()

      // Fetch items for each submission
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (sub) => ({
          ...sub,
          items: await db
            .prepare('SELECT * FROM bulk_submission_items WHERE batchId = ?')
            .bind(sub.id)
            .all(),
        }))
      )

      return c.json({
        success: true,
        data: {
          total: enrichedSubmissions.length,
          submissions: enrichedSubmissions,
        },
      })
    } catch (error) {
      console.error('Error fetching submissions:', error)
      return c.json({ success: false }, 500)
    }
  })

  // ========================================================================
  // 4. POST /api/agency/impersonate/start
  // ========================================================================

  router.post('/impersonate/start', async (c: Context) => {
    try {
      const agencyId = await validateAgencyAuth(c, db)
      if (!agencyId) return c.json({ success: false }, 401)

      const { talentId, reason }: ImpersonationStartRequest = await c.req.json()

      // Validate talent belongs to agency
      const agencyTalent = await db
        .prepare('SELECT * FROM managed_talents WHERE id = ? AND agencyId = ?')
        .bind(talentId, agencyId)
        .first()

      if (!agencyTalent) {
        return c.json({ success: false, error: 'TALENT_NOT_FOUND' }, 404)
      }

      // Check rate limit
      const recentAttempts = await db
        .prepare(
          'SELECT COUNT(*) as count FROM impersonation_rate_limit WHERE agencyId = ? AND timestamp > ?'
        )
        .bind(agencyId, Date.now() - 15 * 60 * 1000)
        .first()

      if ((recentAttempts as any)?.count > 5) {
        return c.json({ success: false, error: 'RATE_LIMIT_EXCEEDED' }, 429)
      }

      // Generate token
      const sessionId = `imp_${generateId()}`
      const token = generateImpersonationToken(talentId, sessionId)
      const tokenHash = hashToken(token)
      const expiresAt = Date.now() + 3600000 // 1 hour

      // Insert session
      await db
        .prepare(
          `INSERT INTO impersonation_sessions
         (id, agencyId, talentId, tokenHash, createdAt, expiresAt, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`
        )
        .bind(sessionId, agencyId, talentId, tokenHash, Date.now(), expiresAt)
        .run()

      // Audit log
      const clientIp = c.req.header('x-forwarded-for') || 'unknown'
      await db
        .prepare(
          `INSERT INTO impersonation_audit_log
         (id, agencyId, agencyUserId, talentId, action, reason, ipAddress, timestamp)
         VALUES (?, ?, ?, ?, 'impersonate_start', ?, ?, ?)`
        )
        .bind(`audit_${generateId()}`, agencyId, agencyId, talentId, reason, clientIp, Date.now())
        .run()

      const response: ImpersonationSession = {
        impersonationSessionId: sessionId,
        talentId: agencyTalent.id,
        talentName: agencyTalent.name,
        impersonationToken: token,
        expiresIn: 3600,
        redirectUrl: `${process.env.TALENT_DASHBOARD_URL}?token=${encodeURIComponent(token)}`,
      }

      return c.json({ success: true, data: response }, 201)
    } catch (error) {
      console.error('Error starting impersonation:', error)
      return c.json({ success: false }, 500)
    }
  })

  return router
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate agency authentication
 */
async function validateAgencyAuth(c: Context, db: D1Database): Promise<string | null> {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) return null

    const token = authHeader.replace('Bearer ', '')
    const decoded = await verify(token, process.env.JWT_SECRET || 'secret')
    return (decoded.sub as string) || null
  } catch {
    return null
  }
}

/**
 * Apply smart filter algorithm (simplified version)
 */
function applySmartFilter(talents: any[], requirements: any, db: D1Database) {
  const eligible: TalentCandidate[] = []
  const ineligible: any[] = []

  for (const talent of talents) {
    // Hard filters
    if (requirements.required_gender && talent.gender !== requirements.required_gender) {
      ineligible.push({
        ...talent,
        failureReason: `Gender requirement: ${requirements.required_gender} required`,
      })
      continue
    }

    const age = calculateAge(talent.birth_date)
    if (age < requirements.required_age_min || age > requirements.required_age_max) {
      ineligible.push({
        ...talent,
        failureReason: `Age out of range: ${requirements.required_age_min}-${requirements.required_age_max} required`,
      })
      continue
    }

    // Calculate match score
    const matchScore = calculateMatchScore(talent, requirements)

    // Format candidate
    const candidate: TalentCandidate = {
      id: talent.talent_id,
      agencyTalentId: talent.agencyTalentId,
      name: talent.full_name,
      email: talent.email,
      profiles: {
        gender: talent.gender,
        dateOfBirth: talent.birth_date,
        age,
        height_cm: talent.height,
        weight_kg: talent.weight,
        skin_tone: 'medium',
        hair_color: talent.hair_color || 'black',
        eye_color: talent.eye_color || 'brown',
        face_type: 'oval',
        domicile: talent.location,
        skills: JSON.parse(talent.skills || '[]'),
        languages: JSON.parse(talent.languages_json || '[]'),
      },
      rateCard: {
        serviceName: 'Standard Rate',
        dailyRateMin: talent.base_rate || 1000000,
        dailyRateMax: (talent.base_rate || 1000000) * 1.5,
        baseCurrency: 'IDR',
      },
      availability: { status: 'available', conflicts: [] },
      matchScore,
      matchBreakdown: calculateMatchBreakdown(talent, requirements),
      profileQuality: talent.profile_completion_percent || 50,
      pricing: {
        serviceName: 'Commercial Model',
        proposedAmount: (talent.base_rate || 1000000 * 1.2),
        agencyMarkupPercent: 15,
        agencyCommissionPercent: 20,
        agencyFee: 0,
        talentPayment: 0,
        currency: 'IDR',
      },
    }

    // Calculate fees
    const agencyFee = candidate.pricing.proposedAmount * 0.2
    candidate.pricing.agencyFee = agencyFee
    candidate.pricing.talentPayment = candidate.pricing.proposedAmount - agencyFee

    eligible.push(candidate)
  }

  // Sort by match score DESC
  eligible.sort((a, b) => b.matchScore - a.matchScore)

  return { eligible, ineligible }
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/**
 * Calculate match score (simplified)
 */
function calculateMatchScore(talent: any, requirements: any): number {
  let score = 0

  // Height match
  if (Math.abs(talent.height - (requirements.height_min_cm + requirements.height_max_cm) / 2) <= 5) {
    score += 15
  }

  // Skills match
  const talentSkills = JSON.parse(talent.skills || '[]')
  const requiredSkills = JSON.parse(requirements.required_skills || '[]')
  const skillMatches = requiredSkills.filter((s: string) => talentSkills.includes(s)).length
  score += (skillMatches / Math.max(1, requiredSkills.length)) * 20

  // Languages
  const talentLangs = JSON.parse(talent.languages_json || '[]')
  const requiredLangs = JSON.parse(requirements.required_languages || '[]')
  const langMatches = requiredLangs.filter((l: string) => talentLangs.includes(l)).length
  score += (langMatches / Math.max(1, requiredLangs.length)) * 10

  // Profile quality
  score += (talent.profile_completion_percent || 0) * 0.15

  // Availability
  score += 15

  return Math.min(100, Math.max(0, score))
}

/**
 * Calculate match breakdown
 */
function calculateMatchBreakdown(talent: any, requirements: any): MatchScoreBreakdown {
  return {
    height: 15,
    physique: 14,
    skills: 18,
    languages: 8,
    availability: 15,
    profileQuality: 10,
    rateAlignment: 4,
  }
}

/**
 * Validate submission payload
 */
function validateSubmissionPayload(
  payload: BulkSubmissionPayload,
  agencyId: string,
  db: D1Database
): { valid: boolean; errors?: any[] } {
  if (!payload.projectId) return { valid: false, errors: [{ message: 'projectId required' }] }
  if (!Array.isArray(payload.submissions) || payload.submissions.length === 0) {
    return { valid: false, errors: [{ message: 'At least 1 submission required' }] }
  }

  const errors: any[] = []

  for (const sub of payload.submissions) {
    if (!sub.talentId || sub.pricing.proposedAmount <= 0) {
      errors.push({ talentId: sub.talentId, error: 'Invalid submission data' })
    }
  }

  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

/**
 * Generate JWT impersonation token
 */
function generateImpersonationToken(talentId: string, sessionId: string): string {
  // In production, use proper JWT library
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: talentId,
    imp_session_id: sessionId,
    type: 'impersonation',
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

/**
 * Hash token for storage
 */
function hashToken(token: string): string {
  // In production, use crypto.subtle
  return Buffer.from(token).toString('base64').substring(0, 64)
}

// ============================================================================
// TYPE DEFINITIONS (API REQUEST/RESPONSE)
// ============================================================================

interface APIRosterResponse {
  success: boolean
  data?: {
    projectId: string
    projectName: string
    totalRosterCount: number
    eligibleCount: number
    ineligibleCount: number
    candidates: TalentCandidate[]
    ineligibleReasons: Array<{ talentId: string; name: string; failureReason: string }>
    requirements: any
  }
  error?: any
}

export default createMultiTalentRouter
