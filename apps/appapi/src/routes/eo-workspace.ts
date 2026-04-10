// File: apps/appapi/src/routes/eo-workspace.ts
// Backend API routes untuk Event Operations Workspace
// Endpoints untuk manage riders, rundown, dan gate passes

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
// GET /api/client/workspace/eo/:projectId
// Mengambil data lengkap EO workspace (riders + rundown + gate passes)
// ============================================================
app.get('/:projectId', async (c: Context) => {
  try {
    const projectId = c.req.param('projectId')
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!authToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Verify JWT
    const payload = (await verify(authToken, c.env.JWT_SECRET)) as AuthPayload

    // Query database for all EO workspace data
    const db = c.env.DB

    // Get hospitality riders
    const hospitalityRiders = await db
      .prepare(
        `
        SELECT id, talent_id, is_approved, accommodation_required, 
               meal_preferences, transportation_required, special_requests
        FROM eo_hospitality_riders
        WHERE project_id = ?1
        ORDER BY created_at DESC
      `
      )
      .bind(projectId)
      .all()

    // Get technical riders
    const technicalRiders = await db
      .prepare(
        `
        SELECT id, talent_id, is_approved, audio_requirements, 
               lighting_requirements, dressing_room_requirements, special_equipment
        FROM eo_technical_riders
        WHERE project_id = ?1
        ORDER BY created_at DESC
      `
      )
      .bind(projectId)
      .all()

    // Get rundown
    const rundown = await db
      .prepare(
        `
        SELECT id, event_date, timeline, version, is_finalized
        FROM wo_rundowns
        WHERE project_id = ?1
        LIMIT 1
      `
      )
      .bind(projectId)
      .first()

    // Get gate passes
    const gatePasses = await db
      .prepare(
        `
        SELECT id, talent_id, pass_code, pass_type, access_areas, 
               expected_arrival, is_present, scanned_at
        FROM eo_gate_passes
        WHERE project_id = ?1
        ORDER BY expected_arrival ASC
      `
      )
      .bind(projectId)
      .all()

    // Get talent names for display
    const talentIds = [
      ...new Set([
        ...hospitalityRiders.results.map((r: any) => r.talent_id),
        ...technicalRiders.results.map((r: any) => r.talent_id),
        ...gatePasses.results.map((p: any) => p.talent_id),
      ]),
    ]

    const talents = await db
      .prepare('SELECT id, name FROM talents WHERE id IN (' + talentIds.map(() => '?').join(',') + ')')
      .bind(...talentIds)
      .all()

    const talentMap = Object.fromEntries(talents.results.map((t: any) => [t.id, t.name]))

    // Combine riders data per talent
    const riders = talentIds.map((talentId: string) => {
      const hosp = hospitalityRiders.results.find((r: any) => r.talent_id === talentId)
      const tech = technicalRiders.results.find((r: any) => r.talent_id === talentId)
      return {
        id: hosp?.id || tech?.id || `rider_${talentId}`,
        talent_id: talentId,
        talent_name: talentMap[talentId],
        hospitality: hosp ? { ...hosp, is_approved: hosp.is_approved } : null,
        technical: tech ? { ...tech, is_approved: tech.is_approved } : null,
      }
    })

    return c.json({
      success: true,
      data: {
        project_id: projectId,
        riders,
        rundown: rundown
          ? {
              ...rundown,
              timeline: JSON.parse(rundown.timeline || '[]'),
            }
          : null,
        gate_passes: gatePasses.results.map((p: any) => ({
          ...p,
          talent_name: talentMap[p.talent_id],
          access_areas: JSON.parse(p.access_areas || '[]'),
        })),
        stats: {
          total_riders: riders.length,
          riders_approved_hospitality: riders.filter(
            (r: any) => r.hospitality?.is_approved === 1
          ).length,
          riders_approved_technical: riders.filter((r: any) => r.technical?.is_approved === 1).length,
          passes_checked_in: gatePasses.results.filter((p: any) => p.is_present === 1).length,
          passes_not_arrived: gatePasses.results.filter((p: any) => p.is_present === 0).length,
        },
      },
    })
  } catch (error) {
    console.error('Error in GET /workspace/eo:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================================
// PUT /api/client/eo/riders/:riderId/approve
// Approve hospitality atau technical rider
// ============================================================
app.put('/:riderId/approve', async (c: Context) => {
  try {
    const riderId = c.req.param('riderId')
    const type = c.req.query('type') as 'hospitality' | 'technical'
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!authToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const payload = (await verify(authToken, c.env.JWT_SECRET)) as AuthPayload
    const db = c.env.DB

    if (type === 'hospitality') {
      await db
        .prepare(
          `
          UPDATE eo_hospitality_riders
          SET is_approved = 1, approved_by = ?1, approved_at = CURRENT_TIMESTAMP
          WHERE id = ?2
        `
        )
        .bind(payload.user_id, riderId)
        .run()
    } else if (type === 'technical') {
      await db
        .prepare(
          `
          UPDATE eo_technical_riders
          SET is_approved = 1, approved_by = ?1, approved_at = CURRENT_TIMESTAMP
          WHERE id = ?2
        `
        )
        .bind(payload.user_id, riderId)
        .run()
    }

    // Send notification to talent (TODO: implement notification service)

    return c.json({
      success: true,
      message: `${type} rider approved`,
    })
  } catch (error) {
    console.error('Error approving rider:', error)
    return c.json({ error: 'Failed to approve rider' }, 500)
  }
})

// ============================================================
// PUT /api/client/eo/riders/:riderId/reject
// Reject hospitality atau technical rider
// ============================================================
app.put('/:riderId/reject', async (c: Context) => {
  try {
    const riderId = c.req.param('riderId')
    const type = c.req.query('type') as 'hospitality' | 'technical'
    const { reason } = await c.req.json()
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!authToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const payload = (await verify(authToken, c.env.JWT_SECRET)) as AuthPayload
    const db = c.env.DB

    if (type === 'hospitality') {
      await db
        .prepare(
          `
          UPDATE eo_hospitality_riders
          SET is_approved = -1, approved_by = ?1, approved_at = CURRENT_TIMESTAMP,
              rejection_reason = ?2
          WHERE id = ?3
        `
        )
        .bind(payload.user_id, reason, riderId)
        .run()
    } else if (type === 'technical') {
      await db
        .prepare(
          `
          UPDATE eo_technical_riders
          SET is_approved = -1, approved_by = ?1, approved_at = CURRENT_TIMESTAMP,
              rejection_reason = ?2
          WHERE id = ?3
        `
        )
        .bind(payload.user_id, reason, riderId)
        .run()
    }

    // Send notification to talent

    return c.json({
      success: true,
      message: `${type} rider rejected`,
    })
  } catch (error) {
    console.error('Error rejecting rider:', error)
    return c.json({ error: 'Failed to reject rider' }, 500)
  }
})

// ============================================================
// POST /api/client/eo/gate-pass/scan
// Scan QR code untuk check-in talent ke event
// ============================================================
app.post('/gate-pass/scan', async (c: Context) => {
  try {
    const { pass_code } = await c.req.json()
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!authToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const payload = (await verify(authToken, c.env.JWT_SECRET)) as AuthPayload
    const db = c.env.DB

    // Find and update gate pass
    const result = await db
      .prepare(
        `
        UPDATE eo_gate_passes
        SET is_present = 1, scanned_at = CURRENT_TIMESTAMP, scanned_by = ?1
        WHERE pass_code = ?2 AND is_present = 0
        RETURNING *
      `
      )
      .bind(payload.user_id, pass_code)
      .first()

    if (!result) {
      return c.json({ error: 'Pass code not found or already scanned' }, 404)
    }

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error scanning gate pass:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================================
// PUT /api/client/workspace/eo/:projectId/rundown
// Save rundown timeline changes
// ============================================================
app.put('/:projectId/rundown', async (c: Context) => {
  try {
    const projectId = c.req.param('projectId')
    const { timeline, version } = await c.req.json()
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!authToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const payload = (await verify(authToken, c.env.JWT_SECRET)) as AuthPayload
    const db = c.env.DB

    await db
      .prepare(
        `
        UPDATE wo_rundowns
        SET timeline = ?1, version = version + 1, last_modified_by = ?2
        WHERE project_id = ?3
      `
      )
      .bind(JSON.stringify(timeline), payload.user_id, projectId)
      .run()

    return c.json({
      success: true,
      message: 'Rundown saved',
    })
  } catch (error) {
    console.error('Error saving rundown:', error)
    return c.json({ error: 'Failed to save rundown' }, 500)
  }
})

// ============================================================
// POST /api/client/workspace/eo/:projectId/rundown/finalize
// Finalize rundown untuk execution
// ============================================================
app.post('/:projectId/rundown/finalize', async (c: Context) => {
  try {
    const projectId = c.req.param('projectId')
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!authToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const payload = (await verify(authToken, c.env.JWT_SECRET)) as AuthPayload
    const db = c.env.DB

    await db
      .prepare(
        `
        UPDATE wo_rundowns
        SET is_finalized = 1, finalized_at = CURRENT_TIMESTAMP
        WHERE project_id = ?1
      `
      )
      .bind(projectId)
      .run()

    return c.json({
      success: true,
      message: 'Rundown finalized',
    })
  } catch (error) {
    console.error('Error finalizing rundown:', error)
    return c.json({ error: 'Failed to finalize rundown' }, 500)
  }
})

export default app
