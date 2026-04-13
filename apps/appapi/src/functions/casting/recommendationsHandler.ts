/**
 * Talent Recommendations Handler
 * Purpose: Manage AI-powered talent matching and bulk invitations
 * Endpoints: POST /ai/match-recommendation, POST /recommendations/bulk, etc.
 */

import { Hono } from 'hono';
import { requireRole } from '../../middleware/authRole';
import { Bindings, Variables } from '../../index';
import { SmartMatchService } from '../../services/smartMatchService';
import { EmailNotificationService } from '../../services/emailNotificationService';
import {
  BulkCreateRecommendationsSchema,
} from '../../schemas/recommendationSchemas';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
const matchService = new SmartMatchService();
const emailService = new EmailNotificationService();

/**
 * GET /api/v1/public/invites/:token
 * Public endpoint to retrieve invite details
 */
router.get('/invites/:token', async (c) => {
  const token = c.req.param('token');

  try {
    const invite = await c.env.DB_CORE.prepare(`
      SELECT
        tr.recommendation_id,
        tr.invite_token,
        tr.project_id,
        tr.agency_id,
        tr.match_score,
        tr.reason_text,
        tr.expires_at,
        tr.status,
        p.project_title,
        p.description AS project_description,
        COALESCE(p.budget, p.budget_max, p.budget_min) AS budget,
        p.deadline,
        COALESCE(c.company_name, 'Orland Management') AS company_name,
        c.logo_url
      FROM talent_recommendations tr
      LEFT JOIN projects p ON p.project_id = tr.project_id
      LEFT JOIN clients c ON c.user_id = tr.agency_id AND c.is_agency = 1
    if (!invite) {
      return c.json({ error: 'Invite not found' }, 404);
    }

    const isExpired = new Date(invite.expires_at).getTime() < Date.now() || invite.status === 'expired';

    if (isExpired && invite.status !== 'expired') {
      await c.env.DB_CORE.prepare(
        `UPDATE talent_recommendations SET status = 'expired' WHERE recommendation_id = ?`
      ).bind(invite.recommendation_id).run();
    }

    if (invite.status === 'cancelled') {
      return c.json({ error: 'Invite is no longer available' }, 410);
    }

    // Track first view
    if (!isExpired && invite.status === 'sent') {
      await c.env.DB_CORE.prepare(
        `UPDATE talent_recommendations SET status = 'viewed', viewed_at = ? WHERE recommendation_id = ?`
      ).bind(new Date().toISOString(), invite.recommendation_id).run();
    }

    await logInviteEvent(c, 'viewed', {
      recommendation_id: invite.recommendation_id,
      invite_token: token,
      project_id: invite.project_id,
    });

    return c.json({
      recommendation_id: invite.recommendation_id,
      invite_token: invite.invite_token,
      project_id: invite.project_id,
      project_title: invite.project_title,
      project_description: invite.project_description || undefined,
      budget: invite.budget ? Number(invite.budget) : undefined,
      deadline: invite.deadline || undefined,
      company_name: invite.company_name,
      logo_url: invite.logo_url || undefined,
      match_score: Number(invite.match_score || 0),
      reason_text: invite.reason_text || undefined,
      expires_at: invite.expires_at,
      is_expired: isExpired,
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to load invite details' }, 500);
  }
});

/**
 * POST /api/v1/public/invites/:token/accept
 * Accept invite (auth optional; auto-links if user is authenticated)
 */
router.post('/invites/:token/accept', async (c) => {
  const token = c.req.param('token');
  const userId = c.get('userId');

  try {
    const rec = await c.env.DB_CORE.prepare(
      `SELECT recommendation_id, project_id, status, expires_at FROM talent_recommendations WHERE invite_token = ? LIMIT 1`
    ).bind(token).first<any>();

    if (!rec) return c.json({ success: false, error: 'Invite not found' }, 404);

    if (new Date(rec.expires_at).getTime() < Date.now()) {
      await c.env.DB_CORE.prepare(
        `UPDATE talent_recommendations SET status = 'expired' WHERE recommendation_id = ?`
      ).bind(rec.recommendation_id).run();
      return c.json({ success: false, error: 'Invite expired' }, 410);
    }

    await c.env.DB_CORE.prepare(
      `UPDATE talent_recommendations SET status = 'accepted', responded_at = ?, viewed_at = COALESCE(viewed_at, ?) WHERE recommendation_id = ?`
    ).bind(new Date().toISOString(), new Date().toISOString(), rec.recommendation_id).run();

    await logInviteEvent(c, 'accepted', {
      recommendation_id: rec.recommendation_id,
      invite_token: token,
      project_id: rec.project_id,
      user_id: userId || null,
    });

    if (userId) {
      const claim = await c.env.DB_CORE.prepare(
        `SELECT claim_id FROM recommendation_claims WHERE recommendation_id = ? LIMIT 1`
      ).bind(rec.recommendation_id).first<any>();

      if (claim) {
        await c.env.DB_CORE.prepare(
          `UPDATE recommendation_claims SET new_user_id = ?, claimed_at = ?, updated_at = ? WHERE recommendation_id = ?`
        ).bind(userId, new Date().toISOString(), new Date().toISOString(), rec.recommendation_id).run();
      } else {
        const claimId = `claim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await c.env.DB_CORE.prepare(
          `INSERT INTO recommendation_claims (claim_id, recommendation_id, new_user_id, claimed_at, redirect_to_project, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, ?, ?)`
        ).bind(claimId, rec.recommendation_id, userId, new Date().toISOString(), new Date().toISOString(), new Date().toISOString()).run();
      }
    }

    return c.json({
      success: true,
      message: 'Invite accepted successfully',
      redirectUrl: `/projects/${rec.project_id}`,
      data: {
        project_id: rec.project_id,
        recommendation_id: rec.recommendation_id,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to accept invite' }, 500);
  }
});

/**
 * POST /api/v1/public/invites/:token/reject
 * Reject invite
 */
router.post('/invites/:token/reject', async (c) => {
  const token = c.req.param('token');

  try {
    const rec = await c.env.DB_CORE.prepare(
      `SELECT recommendation_id FROM talent_recommendations WHERE invite_token = ? LIMIT 1`
    ).bind(token).first<any>();

    if (!rec) return c.json({ success: false, error: 'Invite not found' }, 404);

    await c.env.DB_CORE.prepare(
      `UPDATE talent_recommendations SET status = 'rejected', responded_at = ?, viewed_at = COALESCE(viewed_at, ?) WHERE recommendation_id = ?`
    ).bind(new Date().toISOString(), new Date().toISOString(), rec.recommendation_id).run();

    await logInviteEvent(c, 'rejected', {
      recommendation_id: rec.recommendation_id,
      invite_token: token,
    });

    return c.json({ success: true, message: 'Invite declined' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to reject invite' }, 500);
  }
});

/**
 * GET /api/v1/recommendations/me
 * List invites for the authenticated talent
 */
router.get('/me', async (c) => {
  const userId = c.get('userId');

  try {
    const talent = await c.env.DB_CORE.prepare(
      'SELECT talent_id FROM talents WHERE user_id = ? OR id = ? LIMIT 1'
    ).bind(userId, userId).first<any>();

    if (!talent?.talent_id) {
      return c.json({ data: [] });
    }

    const invites = await c.env.DB_CORE.prepare(`
      SELECT
        tr.recommendation_id as id,
        tr.project_id,
        tr.status,
        tr.reason_text as message,
        tr.created_at,
        p.project_title,
        p.shoot_location,
        p.shoot_date_start,
        COALESCE(p.budget_max, p.budget, p.budget_min, 0) as budget_max
      FROM talent_recommendations tr
      LEFT JOIN projects p ON p.project_id = tr.project_id
      WHERE tr.talent_id = ?
      ORDER BY tr.created_at DESC
      LIMIT 100
    `).bind(talent.talent_id).all<any>();

    const data = (invites.results || []).map((r: any) => ({
      id: r.id,
      project_id: r.project_id,
      role_id: '',
      status: r.status === 'sent' || r.status === 'viewed' ? 'pending' : r.status,
      message: r.message || 'You have received an invitation',
      created_at: r.created_at,
      project: {
        title: r.project_title || 'Untitled Project',
        client_name: 'Client',
        shoot_location: r.shoot_location || '-',
        shoot_date_start: r.shoot_date_start || new Date().toISOString(),
        budget_max: Number(r.budget_max || 0),
      },
      role: {
        name: 'Talent Role',
      },
    }));

    return c.json({ data });
  } catch (error: any) {
    return c.json({ error: 'Failed to fetch invites' }, 500);
  }
});

/**
 * POST /api/v1/recommendations/:id/respond
 * Compatibility endpoint for jobs invite page
 */
router.post('/:id/respond', async (c) => {
  const recommendationId = c.req.param('id');

  try {
    const body = await c.req.json<{ status?: 'accepted' | 'rejected' }>();
    const accept = body?.status === 'accepted';
    const newStatus = accept ? 'accepted' : 'rejected';

    const rec = await c.env.DB_CORE.prepare(
      'SELECT recommendation_id FROM talent_recommendations WHERE recommendation_id = ? LIMIT 1'
    ).bind(recommendationId).first<any>();

    if (!rec) return c.json({ error: 'Invite not found' }, 404);

    await c.env.DB_CORE.prepare(
      `UPDATE talent_recommendations
       SET status = ?, responded_at = ?, viewed_at = COALESCE(viewed_at, ?)
       WHERE recommendation_id = ?`
    ).bind(newStatus, new Date().toISOString(), new Date().toISOString(), recommendationId).run();

    await logInviteEvent(c, newStatus, { recommendation_id: recommendationId });
    return c.json({ success: true, status: newStatus });
  } catch (error: any) {
    return c.json({ error: 'Failed to respond invite' }, 500);
  }
});

/**
 * POST /api/v1/ai/match-recommendation
 * Get AI talent matches for a project using smartMatchService
 *
 * Request:
 * {
 *   "project_id": "uuid",
 *   "limit": 20
 * }
 *
 * Response:
 * {
 *   "matches": [
 *     {
 *       "id": "talent_id",
 *       "name": "Talent Name",
 *       "avatar": "image_url",
 *       "category": "Photography",
 *       "rating": 4.8,
 *       "match_score": 87,
 *       "match_reason": "Perfect fit for...",
 *       "booking_count": 42,
 *       "completion_rate": 98
 *     }
 *   ]
 * }
 */
router.post('/match-recommendation', requireRole(['client', 'admin']), async (c) => {
  const userId = c.get('userId');

  try {
    const body = await c.req.json();
    const { project_id, limit = 20 } = body;

    if (!project_id) {
      return c.json({ error: 'project_id is required' }, 400);
    }

    // 1. Fetch project details
    const project = await c.env.DB_CORE.prepare(`
      SELECT 
        p.project_id,
        p.project_title,
        p.description,
        p.budget_min,
        p.budget_max,
        p.shoot_location,
        p.deadline,
        p.created_by_id,
        c.company_name
      FROM projects p
      LEFT JOIN clients c ON p.created_by_id = c.user_id AND c.is_agency = 1
      WHERE p.project_id = ? AND p.created_by_id = ?
    `).bind(project_id, userId).first<any>();

    if (!project) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // 2. Fetch project requirements (casting roles)
    const requirements = await c.env.DB_CORE.prepare(`
      SELECT *
      FROM casting_requirements
      WHERE project_id = ?
      LIMIT 10
    `).bind(project_id).all<any>();

    if (!requirements.results || requirements.results.length === 0) {
      return c.json({
        matches: [],
        message: 'No casting requirements defined for project',
      });
    }

    // 3. Fetch all available talents
    const talents = await c.env.DB_CORE.prepare(`
      SELECT
        t.talent_id as id,
        t.name,
        t.profile_image as avatar,
        COALESCE(t.category, 'Other') as category,
        COALESCE(t.gender, 'Not specified') as gender,
        COALESCE(t.age, 0) as age,
        COALESCE(t.height_cm, 0) as height_cm,
        COALESCE(t.skin_tone, '') as skin_tone,
        COALESCE(t.face_type, '') as face_type,
        t.skills_json,
        t.languages_json,
        COALESCE(t.rate_daily_min, 0) as rate_daily_min,
        COALESCE(t.rate_daily_max, 100000) as rate_daily_max,
        COALESCE(t.is_available, true) as is_available,
        COALESCE(t.location_willing_to_travel, false) as location_willing_to_travel,
        COALESCE(t.profile_completion_percent, 0) as profile_completion_percent,
        COALESCE(r.rating, 0) as rating,
        COALESCE(r.booking_count, 0) as booking_count,
        COALESCE(r.completion_rate, 0) as completion_rate
      FROM talents t
      LEFT JOIN (
        SELECT 
          talent_id,
          ROUND(AVG(rating), 1) as rating,
          COUNT(*) as booking_count,
          ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 0) as completion_rate
        FROM bookings
        GROUP BY talent_id
      ) r ON t.talent_id = r.talent_id
      WHERE t.profile_visible = true AND t.is_available = true
      LIMIT ?
    `).bind(limit * 2).all<any>(); // Fetch more to score and rank

    if (!talents.results || talents.results.length === 0) {
      return c.json({
        matches: [],
        message: 'No available talents found',
      });
    }

    // 4. Score all talents against requirements using smartMatchService
    const matches = [];

    for (const talent of talents.results) {
      for (const req of requirements.results) {
        const talentProfile = {
          id: talent.id,
          age: talent.age,
          gender: talent.gender,
          domicile: '',
          height_cm: talent.height_cm,
          weight_kg: 0,
          skin_tone: talent.skin_tone,
          face_type: talent.face_type,
          skills_json: talent.skills_json || '[]',
          languages_json: talent.languages_json || '[]',
          rate_daily_min: talent.rate_daily_min,
          rate_daily_max: talent.rate_daily_max,
          preferred_project_types: '',
          location_willing_to_travel: talent.location_willing_to_travel,
          is_available: talent.is_available,
          profile_completion_percent: talent.profile_completion_percent,
        };

        const result = await matchService.matchTalentToJob(talentProfile, req);

        if (result.hard_filters_passed) {
          matches.push({
            id: talent.id,
            name: talent.name,
            avatar: talent.avatar,
            category: talent.category,
            rating: talent.rating,
            match_score: Math.round(result.match_percentage),
            match_reason:
              generateMatchReason(result, talent, req)|| `Strong match for ${req.role_id}`,
            booking_count: talent.booking_count,
            completion_rate: talent.completion_rate,
            score_breakdown: result.score_breakdown,
          });
        }
      }
    }

    // 5. Sort by match_score descending and limit
    const topMatches = matches
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, limit)
      .map(({ score_breakdown, ...match }) => match); // Remove breakdown from response

    return c.json({
      status: 'success',
      matches: topMatches,
      data: {
        matches: topMatches,
        project: {
          id: project.project_id,
          title: project.project_title,
          company: project.company_name,
        },
        total_matches: topMatches.length,
        matched_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Match recommendation error:', error);
    return c.json(
      {
        error: 'Failed to generate talent matches',
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/v1/recommendations/bulk
 * Create multiple recommendations (send invites to selected talents)
 *
 * Request:
 * {
 *   "project_id": "uuid",
 *   "talent_ids": ["id1", "id2", "id3"],
 *   "method": "ai_match",
 *   "expires_in_days": 30
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "invited_count": 3,
 *   "recommendations": [...]
 * }
 */
router.post('/bulk', requireRole(['client', 'admin']), async (c) => {
  const userId = c.get('userId');

  try {
    const body = await c.req.json();
    const parsed = BulkCreateRecommendationsSchema.parse(body);
    const { project_id, talent_ids, expires_in_days = 30, notify_method = 'none' } = parsed;

    // 1. Verify project ownership
    const project = await c.env.DB_CORE.prepare(`
      SELECT project_id, created_by_id, project_title FROM projects WHERE project_id = ?
    `).bind(project_id).first<any>();

    if (!project || project.created_by_id !== userId) {
      return c.json(
        { error: 'Project not found or access denied' },
        404
      );
    }

    // 2. Get user's agency_id
    const user = await c.env.DB_SSO.prepare(`
      SELECT user_id, agency_id FROM users WHERE user_id = ?
    `).bind(userId).first<any>();

    const agency_id = user?.agency_id || userId;

    // 3. Create recommendations for each talent
    const recommendations = [];
    const expiresAt = new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000);

    for (const talent_id of talent_ids) {
      // Check if talent exists
      const talent = await c.env.DB_CORE.prepare(`
        SELECT talent_id, name FROM talents WHERE talent_id = ?
      `).bind(talent_id).first<any>();

      if (!talent) continue; // Skip invalid talents

      const recommendation_id = generateUUID();
      const invite_token = generateInviteToken();

      try {
        await c.env.DB_CORE.prepare(`
          INSERT INTO talent_recommendations (
            recommendation_id,
            talent_id,
            project_id,
            agency_id,
            created_by_id,
            invite_token,
            invite_method,
            status,
            expires_at,
            match_score,
            reason_text,
            metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          recommendation_id,
          talent_id,
          project_id,
          agency_id,
          userId,
          invite_token,
          'link', // invite method
          'sent', // initial status
          expiresAt.toISOString(),
          0, // match_score (if available from request)
          null, // reason_text
          JSON.stringify({ created_from: 'bulk_invite', source: 'ai_match' })
        ).run();

        recommendations.push({
          recommendation_id,
          talent_id,
          talent_name: talent.name,
          invite_token,
          invite_url: `${c.env.TALENT_URL}/invite/${invite_token}`,
          status: 'sent',
          expires_at: expiresAt.toISOString(),
        });

        if (notify_method === 'email') {
          const talentEmail = await resolveTalentEmail(c, talent_id);
          if (talentEmail && c.env.EMAIL_SERVICE_URL && c.env.EMAIL_SERVICE_API_KEY) {
            await emailService.sendInviteEmail(fetch, c.env.EMAIL_SERVICE_URL, {
              talent_email: talentEmail,
              talent_name: talent.name,
              project_title: project.project_title,
              company_name: 'Orland Management',
              invite_url: `${c.env.TALENT_URL}/invite/${invite_token}`,
              expires_in_days,
            }, c.env.EMAIL_SERVICE_API_KEY);
          }
        }
      } catch (dbError) {
        console.error(`Failed to create recommendation for ${talent_id}:`, dbError);
        // Continue with next talent
      }
    }

    // 4. Log the bulk action
    if (recommendations.length > 0) {
      await c.env.DB_LOGS.prepare(`
        INSERT INTO talent_recommendation_logs (
          log_id,
          project_id,
          created_by_id,
          action_type,
          total_invites,
          successful_invites,
          log_data,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        generateUUID(),
        project_id,
        userId,
        'bulk_invite_created',
        talent_ids.length,
        recommendations.length,
        JSON.stringify({
          method: 'ai_match',
          talent_ids_requested: talent_ids.length,
          talent_ids_successful: recommendations.length,
        }),
        new Date().toISOString()
      ).run();
    }

    return c.json({
      status: 'success',
      success: recommendations.length > 0,
      invited_count: recommendations.length,
      data: {
        success: recommendations.length > 0,
        invited_count: recommendations.length,
        total_requested: talent_ids.length,
        recommendations,
        project: {
          id: project_id,
          title: project.project_title,
        },
      },
    });
  } catch (error: any) {
    console.error('Bulk recommendation error:', error);
    return c.json(
      {
        error: 'Failed to create recommendations',
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/v1/recommendations/respond/:recommendation_id
 * Accept or reject a recommendation
 */
router.post('/respond/:recommendation_id', async (c) => {
  const recommendation_id = c.req.param('recommendation_id');
  const userId = c.get('userId');

  try {
    const { accept } = await c.req.json<{ accept: boolean }>();

    // 1. Get recommendation
    const rec = await c.env.DB_CORE.prepare(`
      SELECT * FROM talent_recommendations WHERE recommendation_id = ?
    `).bind(recommendation_id).first<any>();

    if (!rec) {
      return c.json({ error: 'Recommendation not found' }, 404);
    }

    // 2. Update status
    const newStatus = accept ? 'accepted' : 'rejected';
    await c.env.DB_CORE.prepare(`
      UPDATE talent_recommendations 
      SET status = ?, responded_at = ?, viewed_at = COALESCE(viewed_at, ?)
      WHERE recommendation_id = ?
    `).bind(newStatus, new Date().toISOString(), new Date().toISOString(), recommendation_id).run();

    return c.json({
      status: 'success',
      data: {
        recommendation_id,
        new_status: newStatus,
        message: accept ? 'Recommendation accepted' : 'Recommendation rejected',
      },
    });
  } catch (error: any) {
    return c.json(
      {
        error: 'Failed to respond to recommendation',
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/v1/recommendations/:recommendation_id/views
 * Track when a recommendation is viewed
 */
router.get('/views/:recommendation_id', async (c) => {
  const recommendation_id = c.req.param('recommendation_id');

  try {
    const rec = await c.env.DB_CORE.prepare(`
      SELECT * FROM talent_recommendations WHERE recommendation_id = ?
    `).bind(recommendation_id).first<any>();

    if (!rec) {
      return c.json({ error: 'Recommendation not found' }, 404);
    }

    // Mark as viewed if not already
    if (!rec.viewed_at) {
      await c.env.DB_CORE.prepare(`
        UPDATE talent_recommendations 
        SET viewed_at = ?, status = 'viewed'
        WHERE recommendation_id = ?
      `).bind(new Date().toISOString(), recommendation_id).run();
    }

    return c.json({
      status: 'success',
      data: { recommendation_id, status: 'viewed' },
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to record view' }, 500);
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique invite token
 */
function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function resolveTalentEmail(c: any, talentId: string): Promise<string | null> {
  try {
    const t = await c.env.DB_CORE.prepare(
      'SELECT user_id FROM talents WHERE talent_id = ?'
    ).bind(talentId).first();
    
    if (t?.user_id) {
      const row = await c.env.DB_SSO.prepare(
        'SELECT email FROM users WHERE id = ?'
      ).bind(t.user_id).first();
      if (row?.email) return row.email;
    }
  } catch {
    // Ignore schema differences
  }

  try {
    const row = await c.env.DB_SSO.prepare(
      'SELECT email FROM users WHERE user_id = ?'
    ).bind(talentId).first();
    if (row?.email) return row.email;
  } catch {
    // Ignore schema differences
  }

  return null;
}

/**
 * Generate human-readable match reason based on score breakdown
 */
function generateMatchReason(result: any, talent: any, requirement: any): string {
  const reasons = [];
  const breakdown = result.score_breakdown || {};

  // Check top scoring factors
  if (breakdown.gender_match?.score > 0.8) {
    reasons.push(`Matches ${requirement.required_gender || 'role'} requirement`);
  }
  if (breakdown.age_match?.score > 0.8) {
    reasons.push(`Perfect age range match`);
  }
  if (breakdown.skills_match?.score > 0.7) {
    reasons.push(`Has relevant skills and experience`);
  }
  if (breakdown.location_match?.score > 0.7) {
    reasons.push(`Available in shoot location`);
  }
  if (breakdown.profile_completeness?.score > 0.8) {
    reasons.push(`Complete profile with portfolio`);
  }

  if (reasons.length === 0) {
    reasons.push(`Strong overall fit for the role`);
  }

  return reasons.slice(0, 2).join('. ') + '.';
}

async function logInviteEvent(c: any, eventType: string, metadata: Record<string, unknown>) {
  try {
    const logId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await c.env.DB_LOGS.prepare(`
      INSERT INTO invite_funnel_logs (log_id, event_type, metadata, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(logId, eventType, JSON.stringify(metadata), new Date().toISOString()).run();
  } catch {
    // Best effort only. Table may not exist on all envs.
  }
}

export default router;
