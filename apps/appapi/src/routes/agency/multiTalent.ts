/**
 * Multi-Talent Submission Backend - Standardized Hono Router
 * File: apps/appapi/src/routes/agency/multiTalent.ts
 */

import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { Bindings, Variables } from '../../index'

// Definisikan tipe untuk keamanan TS (diambil dari internal jika file types tidak tersedia)
interface TalentCandidate { id: string; agencyTalentId: string; name: string; email: string; profiles: any; rateCard: any; availability: any; matchScore: number; matchBreakdown: any; profileQuality: number; pricing: any; }
interface BulkSubmissionPayload { projectId: string; submissions: any[]; }

// Inisialisasi Standard Hono Router
const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ========================================================================
// 1. GET /api/v1/agency/casting/roster?project_id={id}
// ========================================================================
router.get('/roster', async (c) => {
  const db = c.env.DB_CORE;
  try {
    const agencyId = await validateAgencyAuth(c);
    if (!agencyId) return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401);

    const projectId = c.req.query('project_id');
    if (!projectId) return c.json({ success: false, error: { code: 'MISSING_PARAM', message: 'project_id required' } }, 400);

    const project = await db.prepare('SELECT * FROM projects WHERE project_id = ?').bind(projectId).first<any>();
    if (!project) return c.json({ success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } }, 404);

    const requirements = await db.prepare('SELECT * FROM casting_requirements WHERE project_id = ? AND is_active = 1').bind(projectId).first<any>();
    if (!requirements) return c.json({ success: false, error: { code: 'NO_REQUIREMENTS', message: 'Project has no casting requirements' } }, 400);

    const agencyTalents = await db.prepare(`
       SELECT t.*, at.agency_talent_id as agencyTalentId, tp.profile_completion_percent, tp.skills_json, tp.languages_json, tp.height_cm, tp.gender as profile_gender
       FROM agency_talents at
       JOIN talents t ON at.talent_id = t.id
       JOIN talent_profiles tp ON t.id = tp.talent_id
       WHERE at.agency_id = ?
    `).bind(agencyId).all();

    const filteredResult = applySmartFilter(agencyTalents.results, requirements);

    return c.json({
      success: true,
      data: {
        projectId,
        projectName: project.title,
        totalRosterCount: agencyTalents.results.length,
        eligibleCount: filteredResult.eligible.length,
        candidates: filteredResult.eligible,
        requirements: requirements
      }
    });
  } catch (error) {
    console.error('Error fetching roster:', error);
    return c.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});

// ========================================================================
// 2. POST /api/v1/agency/casting/projects/apply-bulk
// ========================================================================
router.post('/projects/apply-bulk', async (c) => {
  const db = c.env.DB_CORE;
  try {
    const agencyId = await validateAgencyAuth(c);
    if (!agencyId) return c.json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401);

    const payload: BulkSubmissionPayload = await c.req.json();
    if (!payload.projectId || !payload.submissions || payload.submissions.length === 0) {
        return c.json({ success: false, error: { message: 'Invalid submission payload' } }, 422);
    }

    const batchId = `batch_${generateId()}`;
    const now = Date.now();

    await db.prepare(`INSERT INTO agency_bulk_submissions (id, agencyId, projectId, totalTalents, status, createdAt, submittedBy, submittedAt) VALUES (?, ?, ?, ?, 'submitted', ?, ?, ?)`)
      .bind(batchId, agencyId, payload.projectId, payload.submissions.length, now, agencyId, now).run();

    let totalRevenue = 0, totalAgencyFee = 0;

    for (const submission of payload.submissions) {
      const bookingId = `booking_${generateId()}`;
      const agencyFee = submission.pricing.proposedAmount * (submission.pricing.agencyCommissionPercent / 100);
      const talentPayment = submission.pricing.proposedAmount - agencyFee;

      await db.prepare(`INSERT INTO project_talents (booking_id, project_id, talent_id, agency_id, status, proposed_rate, created_at) VALUES (?, ?, ?, ?, 'shortlisted', ?, datetime('now'))`)
        .bind(bookingId, payload.projectId, submission.talentId, agencyId, submission.pricing.proposedAmount).run();

      await db.prepare(`INSERT INTO bulk_submission_items (id, batchId, talentId, agencyTalentId, roleName, roleId, matchPercentage, matchBreakdown, serviceName, proposedAmount, commissionPercent, agencyFee, talentPayment, itemStatus, createdProjectTalentId, createdAt, submittedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`)
        .bind(`bsi_${generateId()}`, batchId, submission.talentId, submission.agencyTalentId, submission.roleName, submission.roleId, submission.matchScore, JSON.stringify(submission.matchBreakdown), submission.pricing.serviceName, submission.pricing.proposedAmount, submission.pricing.agencyCommissionPercent, agencyFee, talentPayment, bookingId, now, now).run();

      await db.prepare(`INSERT INTO financial_splits (split_id, booking_id, agency_fee, talent_payment, created_at) VALUES (?, ?, ?, ?, ?)`)
        .bind(`split_${generateId()}`, bookingId, agencyFee, talentPayment, now).run();

      totalRevenue += submission.pricing.proposedAmount;
      totalAgencyFee += agencyFee;
    }

    await db.prepare(`UPDATE agency_bulk_submissions SET totalProposedRevenue = ?, totalAgencyFee = ?, totalTalentPayment = ? WHERE id = ?`)
      .bind(totalRevenue, totalAgencyFee, totalRevenue - totalAgencyFee, batchId).run();

    return c.json({ success: true, data: { batchId, projectId: payload.projectId, submittedAt: now } }, 201);
  } catch (error) {
    console.error('Error submitting bulk application:', error);
    return c.json({ success: false, error: { message: 'Failed to process submission' } }, 500);
  }
});

export default router;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
async function validateAgencyAuth(c: any): Promise<string | null> {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    // Gunakan env Hono, bukan process.env
    const decoded = await verify(token, c.env.JWT_SECRET || 'secret');
    return (decoded.sub as string) || null;
  } catch { return null; }
}

function applySmartFilter(talents: any[], requirements: any) {
  const eligible: TalentCandidate[] = [];
  const ineligible: any[] = [];

  for (const talent of talents) {
    if (requirements.required_gender && talent.profile_gender !== requirements.required_gender) {
      ineligible.push({ ...talent, failureReason: `Gender requirement mismatch` });
      continue;
    }
    const matchScore = calculateMatchScore(talent, requirements);
    const candidate: any = {
      id: talent.id,
      agencyTalentId: talent.agencyTalentId,
      name: talent.fullname,
      matchScore,
      matchBreakdown: { height: 15, physique: 14, skills: 18, profileQuality: talent.profile_completion_percent || 50 },
      pricing: { proposedAmount: 1500000, agencyCommissionPercent: 20 }
    };
    eligible.push(candidate);
  }
  eligible.sort((a, b) => b.matchScore - a.matchScore);
  return { eligible, ineligible };
}

function calculateMatchScore(talent: any, requirements: any): number {
  let score = 50; // Base score
  if (talent.height_cm >= requirements.height_min_cm && talent.height_cm <= requirements.height_max_cm) score += 20;
  score += (talent.profile_completion_percent || 0) * 0.3;
  return Math.min(100, score);
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}