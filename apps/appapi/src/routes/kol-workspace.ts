// File: apps/appapi/src/routes/kol-workspace.ts
// Backend API routes untuk KOL Specialist Workspace
// Endpoints untuk manage briefs, content review, dan tracking

import { Hono } from 'hono'
import { Context } from 'hono'
import { verify } from 'hono/jwt'

interface AuthPayload {
  user_id: string
  email: string
  role: string
}

const app = new Hono()

// ============================================================
// GET /api/client/kol/briefs/:briefId
// Mengambil detail KOL brief
// ============================================================
app.get('/briefs/:briefId', async (c: Context) => {
  try {
    const briefId = c.req.param('briefId')
    const projectId = c.req.query('project_id')
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!authToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const payload = (await verify(authToken, c.env.JWT_SECRET)) as AuthPayload
    const db = c.env.DB

    const brief = await db
      .prepare(
        `
        SELECT id, campaign_name, campaign_description, campaign_objective,
               guidelines, moodboard_urls, inspiration_links, submission_deadline,
               brief_issued_at, is_active
        FROM kol_briefs
        WHERE id = ?1 AND project_id = ?2
      `
      )
      .bind(briefId, projectId)
      .first()

    if (!brief) {
      return c.json({ error: 'Brief not found' }, 404)
    }

    // Parse JSON fields
    const parsedBrief = {
      ...brief,
      guidelines: JSON.parse(brief.guidelines || '{}'),
      moodboard_urls: JSON.parse(brief.moodboard_urls || '[]'),
      inspiration_links: JSON.parse(brief.inspiration_links || '[]'),
    }

    return c.json({
      success: true,
      data: parsedBrief,
    })
  } catch (error) {
    console.error('Error fetching brief:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================================
// POST /api/client/kol/content/:draftId/review
// Submit content review (approve/revision_requested/rejected)
// With notification to talent
// ============================================================
app.post('/content/:draftId/review', async (c: Context) => {
  try {
    const draftId = c.req.param('draftId')
    const { action, feedback } = await c.req.json()
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!authToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const payload = (await verify(authToken, c.env.JWT_SECRET)) as AuthPayload
    const db = c.env.DB

    // ============================================================
    // TRANSACTION START - Atomic update with audit trail
    // ============================================================
    try {
      await db.exec('BEGIN TRANSACTION')

      // Get current draft
      const draft = await db
        .prepare(
          `
          SELECT id, talent_id, brief_id, status, revision_count
          FROM kol_content_drafts
          WHERE id = ?1
        `
        )
        .bind(draftId)
        .first()

      if (!draft) {
        throw new Error('Draft not found')
      }

      // Determine new status and increment revision count if needed
      let newStatus = action
      let revisionIncrement = 0

      if (action === 'revision_requested') {
        revisionIncrement = 1
      }

      // Update draft status
      const update = await db
        .prepare(
          `
          UPDATE kol_content_drafts
          SET status = ?1, 
              reviewed_by = ?2, 
              reviewed_at = CURRENT_TIMESTAMP,
              feedback_text = ?3,
              revision_count = revision_count + ?4,
              approved_at = CASE WHEN ?1 = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END
          WHERE id = ?5
          RETURNING *
        `
        )
        .bind(newStatus, payload.user_id, feedback || null, revisionIncrement, draftId)
        .first()

      if (!update) {
        throw new Error('Failed to update draft')
      }

      // Create audit trail entry
      await db
        .prepare(
          `
          INSERT INTO kol_content_review_history 
          (id, content_draft_id, reviewed_by, action, feedback, action_timestamp)
          VALUES (hex(randomblob(16)), ?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
        `
        )
        .bind(draftId, payload.user_id, action, feedback || null)
        .run()

      // If approved, generate tracking link
      let trackingLink = null
      if (action === 'approved') {
        const trackingToken = generateTrackingToken()
        const trackingInsert = await db
          .prepare(
            `
            INSERT INTO kol_tracking_links
            (id, content_draft_id, talent_id, project_id, tracking_token, link_created_at)
            SELECT hex(randomblob(16)), ?1, ?2, project_id, ?3, CURRENT_TIMESTAMP
            FROM kol_content_drafts
            WHERE id = ?1
            RETURNING *
          `
          )
          .bind(draftId, draft.talent_id, trackingToken)
          .first()

        // Update draft with tracking link reference
        await db
          .prepare(
            `
            UPDATE kol_content_drafts
            SET tracking_link_id = ?1
            WHERE id = ?2
          `
          )
          .bind(trackingInsert?.id, draftId)
          .run()

        trackingLink = trackingInsert
      }

      // TRANSACTION COMMIT
      await db.exec('COMMIT')

      // ============================================================
      // Send notification to talent (async, non-blocking)
      // ============================================================
      sendNotificationToTalent({
        talent_id: draft.talent_id,
        action,
        feedback,
        draft_id: draftId,
      }).catch((err) => console.error('Notification error:', err))

      return c.json({
        success: true,
        message: `Content ${action}`,
        data: {
          content: update,
          tracking_data: trackingLink,
        },
      })
    } catch (txError) {
      await db.exec('ROLLBACK')
      throw txError
    }
  } catch (error) {
    console.error('Error reviewing content:', error)
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to review content',
      },
      500
    )
  }
})

// ============================================================
// GET /api/client/kol/content/board
// Get kanban board data with stats
// ============================================================
app.get('/content/board', async (c: Context) => {
  try {
    const projectId = c.req.query('project_id')
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!authToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const payload = (await verify(authToken, c.env.JWT_SECRET)) as AuthPayload
    const db = c.env.DB

    // Get all content drafts grouped by status
    const drafts = await db
      .prepare(
        `
        SELECT id, brief_id, talent_id, status, video_url, video_thumbnail_url,
               caption_text, hashtags_used, submitted_at, revision_count,
               feedback_text, approved_at, tracking_link_id
        FROM kol_content_drafts
        WHERE project_id = ?1
        ORDER BY submitted_at DESC
      `
      )
      .bind(projectId)
      .all()

    // Get talent names
    const talentIds = [...new Set(drafts.results.map((d: any) => d.talent_id))]
    const talents = await db
      .prepare(`
        SELECT t.id, u.first_name || ' ' || u.last_name as name
        FROM talents t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id IN (${talentIds.map(() => '?').join(',')})
      `)
      .bind(...talentIds)
      .all()

    const talentMap = Object.fromEntries(talents.results.map((t: any) => [t.id, t.name]))

    // Get tracking data for approved content
    const approvedIds = drafts.results
      .filter((d: any) => d.status === 'approved' && d.tracking_link_id)
      .map((d: any) => d.tracking_link_id)

    let trackingMap = {}
    if (approvedIds.length > 0) {
      const tracking = await db
        .prepare(
          `
          SELECT id, content_draft_id, total_clicks, unique_visitors, conversion_count,
                 bounce_rate, top_countries, device_breakdown
          FROM kol_tracking_links
          WHERE content_draft_id IN (${drafts.results.map(() => '?').join(',')})`
        )
        .bind(...drafts.results.map((d: any) => d.id))
        .all()

      trackingMap = Object.fromEntries(
        tracking.results.map((t: any) => [
          t.content_draft_id,
          {
            ...t,
            top_countries: JSON.parse(t.top_countries || '[]'),
            device_breakdown: JSON.parse(t.device_breakdown || '{}'),
          },
        ])
      )
    }

    // Organize by status
    const board = {
      pending_review: [] as any[],
      revision_requested: [] as any[],
      approved: [] as any[],
    }

    drafts.results.forEach((draft: any) => {
      const enriched = {
        ...draft,
        talent_name: talentMap[draft.talent_id],
        hashtags_used: JSON.parse(draft.hashtags_used || '[]'),
        tracking_data: trackingMap[draft.id],
      }
      board[draft.status as keyof typeof board]?.push(enriched)
    })

    return c.json({
      success: true,
      data: board,
      stats: {
        pending_review: board.pending_review.length,
        revision_requested: board.revision_requested.length,
        approved: board.approved.length,
      },
    })
  } catch (error) {
    console.error('Error fetching kanban board:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================================
// GET /api/client/kol/tracking/:trackingToken/click
// Record click on KOL tracking link
// ============================================================
app.get('/tracking/:trackingToken/click', async (c: Context) => {
  try {
    const trackingToken = c.req.param('trackingToken')
    const db = c.env.DB

    // Find tracking link and increment click counter
    const result = await db
      .prepare(
        `
        UPDATE kol_tracking_links
        SET total_clicks = total_clicks + 1
        WHERE tracking_token = ?1
        RETURNING *
      `
      )
      .bind(trackingToken)
      .first()

    if (!result) {
      return c.json({ error: 'Invalid tracking token' }, 404)
    }

    // In production, redirect to actual link
    // For now, just return success
    return c.json({
      success: true,
      clicks: result.total_clicks,
    })
  } catch (error) {
    console.error('Error tracking click:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================================
// Helper Functions
// ============================================================

function generateTrackingToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function sendNotificationToTalent(data: {
  talent_id: string
  action: string
  feedback?: string
  draft_id: string
}) {
  // TODO: Implement notification service
  // Options:
  // 1. Send email via SendGrid/Resend
  // 2. Push notification
  // 3. Store in notifications table

  console.log(`[Notification] Talent ${data.talent_id}: Content ${data.action}`)
  console.log(`[Message] ${data.feedback || 'No feedback provided'}`)
}

export default app
