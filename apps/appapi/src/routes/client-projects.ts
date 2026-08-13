// Backend API Routes: Client Project Publishing
// File: apps/appapi/src/routes/client-projects.ts
// Purpose: Endpoints for project creation, draft management, and publishing with transactions
// Framework: Hono + D1 (SQLite)

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { Context } from 'hono'
import { Buffer } from 'buffer'
import crypto from 'crypto'

const router = new Hono()

// ===== TYPE DEFINITIONS =====
interface ProjectDraftPayload {
  projectId?: string
  clientId: string
  step1: {
    title: string
    description?: string
    bannerUrl?: string
    budgetTotal: number
    budgetCurrency: string
    castingDeadline: string
    projectStartDate?: string
  }
  step2: {
    roles: Array<{
      id: string
      roleName: string
      roleDescription?: string
      quantityNeeded: number
      budgetPerTalent: number
      genderRequirement?: string
      ageMin?: number
      ageMax?: number
      heightMinCm?: number
      heightMaxCm?: number
      preferredSkills?: string[]
      preferredAppearance?: Record<string, any>
      displayOrder: number
    }>
  }
  step3: {
    castingMode: 'private' | 'public' | 'link-only'
    allowGuestSubmissions?: boolean
    castingDirectorName?: string
    castingDirectorEmail?: string
    guestQuestions?: string[]
  }
  step4?: {
    productionNotes?: string
    scriptUrl?: string
    storyboardUrl?: string
    rundownUrl?: string
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Generate secure casting token
 */
function generateCastingToken(projectId: string): string {
  const randomBytes = crypto.randomBytes(16).toString('hex')
  return `cast_${projectId}_${randomBytes}`
}

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate budget constraints
 */
function validateProjectBudget(payload: ProjectDraftPayload): { valid: boolean; error?: string } {
  const totalAllocated = payload.step2.roles.reduce(
    (sum, role) => sum + role.budgetPerTalent * role.quantityNeeded,
    0
  )

  if (totalAllocated > payload.step1.budgetTotal) {
    return {
      valid: false,
      error: `Total role budget (${totalAllocated}) exceeds project budget (${payload.step1.budgetTotal})`,
    }
  }

  if (payload.step1.budgetTotal <= 0) {
    return {
      valid: false,
      error: 'Project budget must be greater than 0',
    }
  }

  return { valid: true }
}

// ===== ROUTES =====

/**
 * GET /api/client/projects/{id}/draft
 * Retrieve draft state for existing project
 */
router.get('/projects/:projectId/draft', async (c: Context) => {
  try {
    const { projectId } = c.req.param()
    const clientId = c.req.header('x-client-id') // From auth middleware

    if (!clientId) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const db = c.env.DB as any
    const result = await db
      .prepare(
        `
      SELECT * FROM project_draft_state 
      WHERE project_id = ? AND client_id = ?
      `
      )
      .bind(projectId, clientId)
      .first()

    if (!result) {
      throw new HTTPException(404, { message: 'Draft not found' })
    }

    return c.json({
      projectId: result.project_id,
      clientId: result.client_id,
      step1: JSON.parse(result.step_1_data),
      step2: JSON.parse(result.step_2_data),
      step3: JSON.parse(result.step_3_data),
      step4: JSON.parse(result.step_4_data || '{}'),
      currentStep: result.current_step,
      lastCompletedStep: result.last_completed_step,
      lastSavedAt: result.last_saved_at,
    })
  } catch (error) {
    console.error('GET /draft error:', error)
    throw error
  }
})

/**
 * POST /api/client/projects/draft
 * Create new draft (new project)
 */
router.post('/projects/draft', async (c: Context) => {
  try {
    const clientId = c.req.header('x-client-id')
    if (!clientId) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const payload: ProjectDraftPayload = await c.req.json()
    const projectId = generateId('proj')

    const db = c.env.DB as any

    // Create project record (draft status)
    await db
      .prepare(
        `
      INSERT INTO client_projects 
      (id, client_id, title, description, banner_url, budget_total, budget_currency, casting_deadline, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
      `
      )
      .bind(
        projectId,
        clientId,
        payload.step1.title,
        payload.step1.description,
        payload.step1.bannerUrl,
        payload.step1.budgetTotal,
        payload.step1.budgetCurrency,
        payload.step1.castingDeadline
      )
      .run()

    // Create draft state record
    await db
      .prepare(
        `
      INSERT INTO project_draft_state 
      (id, project_id, client_id, step_1_data, step_2_data, step_3_data, step_4_data, current_step, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now', '+7 days'))
      `
      )
      .bind(
        generateId('draft'),
        projectId,
        clientId,
        JSON.stringify(payload.step1),
        JSON.stringify(payload.step2),
        JSON.stringify(payload.step3),
        JSON.stringify(payload.step4 || {})
      )
      .run()

    return c.json({ projectId })
  } catch (error) {
    console.error('POST /draft error:', error)
    throw error
  }
})

/**
 * POST /api/client/projects/{id}/draft
 * Update existing draft (autosave)
 */
router.post('/projects/:projectId/draft', async (c: Context) => {
  try {
    const { projectId } = c.req.param()
    const clientId = c.req.header('x-client-id')

    if (!clientId) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const payload: ProjectDraftPayload = await c.req.json()
    const db = c.env.DB as any

    // Validate ownership
    const project = await db
      .prepare(`SELECT id FROM client_projects WHERE id = ? AND client_id = ?`)
      .bind(projectId, clientId)
      .first()

    if (!project) {
      throw new HTTPException(403, { message: 'Access denied' })
    }

    // Validate budget
    const budgetCheck = validateProjectBudget(payload)
    if (!budgetCheck.valid) {
      throw new HTTPException(400, { message: budgetCheck.error })
    }

    // Update project basic info
    await db
      .prepare(
        `
      UPDATE client_projects 
      SET title = ?, description = ?, banner_url = ?, 
          budget_total = ?, casting_deadline = ?, 
          project_start_date = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `
      )
      .bind(
        payload.step1.title,
        payload.step1.description,
        payload.step1.bannerUrl,
        payload.step1.budgetTotal,
        payload.step1.castingDeadline,
        payload.step1.projectStartDate,
        projectId
      )
      .run()

    // Update or create draft state
    const existingDraft = await db
      .prepare(`SELECT id FROM project_draft_state WHERE project_id = ?`)
      .bind(projectId)
      .first()

    if (existingDraft) {
      await db
        .prepare(
          `
        UPDATE project_draft_state 
        SET step_1_data = ?, step_2_data = ?, step_3_data = ?, step_4_data = ?,
            last_saved_at = CURRENT_TIMESTAMP
        WHERE project_id = ?
        `
        )
        .bind(
          JSON.stringify(payload.step1),
          JSON.stringify(payload.step2),
          JSON.stringify(payload.step3),
          JSON.stringify(payload.step4 || {}),
          projectId
        )
        .run()
    } else {
      await db
        .prepare(
          `
        INSERT INTO project_draft_state 
        (id, project_id, client_id, step_1_data, step_2_data, step_3_data, step_4_data, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+7 days'))
        `
        )
        .bind(
          generateId('draft'),
          projectId,
          clientId,
          JSON.stringify(payload.step1),
          JSON.stringify(payload.step2),
          JSON.stringify(payload.step3),
          JSON.stringify(payload.step4 || {})
        )
        .run()
    }

    return c.json({ projectId, message: 'Draft saved' })
  } catch (error) {
    console.error('POST /draft update error:', error)
    throw error
  }
})

/**
 * POST /api/client/projects/{id}/publish
 * MAIN PUBLISHING ENDPOINT - Uses transaction for atomicity
 * Creates project, roles, and live casting board in one atomic operation
 */
router.post('/projects/:projectId/publish', async (c: Context) => {
  try {
    const { projectId } = c.req.param()
    const clientId = c.req.header('x-client-id')

    if (!clientId) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const payload: ProjectDraftPayload = await c.req.json()
    const db = c.env.DB as any

    // ===== VALIDATION =====
    // 1. Verify project ownership
    const project = await db
      .prepare(`SELECT id FROM client_projects WHERE id = ? AND client_id = ?`)
      .bind(projectId, clientId)
      .first()

    if (!project) {
      throw new HTTPException(403, { message: 'Access denied' })
    }

    // 2. Validate budget
    const budgetCheck = validateProjectBudget(payload)
    if (!budgetCheck.valid) {
      throw new HTTPException(400, { message: budgetCheck.error })
    }

    // 3. Validate step2 - at least one role
    if (!payload.step2.roles || payload.step2.roles.length === 0) {
      throw new HTTPException(400, { message: 'At least one role is required' })
    }

    // ===== BEGIN TRANSACTION =====
    console.log(`[TRANSACTION] Starting publish for project ${projectId}`)

    try {
      // 1. Update project status and timestamps
      await db
        .prepare(
          `
        UPDATE client_projects 
        SET status = 'active',
            published_at = CURRENT_TIMESTAMP,
            is_casting_open = ?,
            casting_visibility = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `
        )
        .bind(
          payload.step3.castingMode !== 'private' ? 1 : 0,
          payload.step3.castingMode === 'link-only' ? 'link-only' : payload.step3.castingMode,
          projectId
        )
        .run()

      // 2. Delete old roles (if re-publishing)
      await db.prepare(`DELETE FROM project_roles WHERE project_id = ?`).bind(projectId).run()

      // 3. Insert roles in batch
      const roleIds = []
      for (const role of payload.step2.roles) {
        const roleId = generateId('role')
        roleIds.push(roleId)

        await db
          .prepare(
            `
          INSERT INTO project_roles 
          (id, project_id, role_name, role_description, quantity_needed, 
           budget_per_talent, gender_requirement, age_min, age_max,
           height_min_cm, height_max_cm, preferred_skills, preferred_appearance,
           display_order, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
          `
          )
          .bind(
            roleId,
            projectId,
            role.roleName,
            role.roleDescription,
            role.quantityNeeded,
            role.budgetPerTalent,
            role.genderRequirement || 'any',
            role.ageMin || null,
            role.ageMax || null,
            role.heightMinCm || null,
            role.heightMaxCm || null,
            role.preferredSkills ? JSON.stringify(role.preferredSkills) : null,
            role.preferredAppearance ? JSON.stringify(role.preferredAppearance) : null,
            role.displayOrder
          )
          .run()
      }

      // 4. Create live casting board if not private
      let castingLink = null
      if (payload.step3.castingMode !== 'private') {
        const boardId = generateId('board')
        const accessToken = generateCastingToken(projectId)
        castingLink = `https://talent.orlandmanagement.com/casting/${accessToken}`

        await db
          .prepare(
            `
          INSERT INTO live_casting_boards 
          (id, project_id, board_type, access_token, allow_guest_submissions,
           casting_director_name, casting_director_email, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
          `
          )
          .bind(
            boardId,
            projectId,
            payload.step3.castingMode,
            accessToken,
            payload.step3.allowGuestSubmissions ? 1 : 0,
            payload.step3.castingDirectorName || null,
            payload.step3.castingDirectorEmail || null
          )
          .run()

        // Update project with casting token
        await db
          .prepare(`UPDATE client_projects SET casting_link_token = ? WHERE id = ?`)
          .bind(accessToken, projectId)
          .run()
      }

      // 5. Store production logistics if provided
      if (payload.step4?.productionNotes || payload.step4?.scriptUrl) {
        const logisticsId = generateId('logis')
        await db
          .prepare(
            `
          INSERT INTO ph_production_logistics 
          (id, project_id, script_url, storyboard_url, rundown_url, production_notes, uploaded_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `
          )
          .bind(
            logisticsId,
            projectId,
            payload.step4.scriptUrl || null,
            payload.step4.storyboardUrl || null,
            payload.step4.rundownUrl || null,
            payload.step4.productionNotes || null,
            clientId
          )
          .run()
      }

      // 6. Delete draft state
      await db.prepare(`DELETE FROM project_draft_state WHERE project_id = ?`).bind(projectId).run()

      // ===== COMMIT SUCCESS =====
      console.log(`[TRANSACTION] Publish completed for project ${projectId}`)

      return c.json({
        success: true,
        projectId,
        status: 'active',
        castingLink,
        rolesCreated: roleIds.length,
        message: 'Project published successfully',
      })
    } catch (transactionError) {
      console.error(`[TRANSACTION] ROLLBACK - Publish failed for project ${projectId}:`, transactionError)
      throw new HTTPException(500, { message: `Transaction failed: ${String(transactionError)}` })
    }
  } catch (error) {
    console.error('POST /publish error:', error)
    throw error
  }
})

/**
 * DELETE /api/client/projects/{id}
 * Delete draft project
 */
router.delete('/projects/:projectId', async (c: Context) => {
  try {
    const { projectId } = c.req.param()
    const clientId = c.req.header('x-client-id')

    if (!clientId) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const db = c.env.DB as any

    // Verify ownership and is draft
    const project = await db
      .prepare(`SELECT status FROM client_projects WHERE id = ? AND client_id = ?`)
      .bind(projectId, clientId)
      .first()

    if (!project) {
      throw new HTTPException(403, { message: 'Access denied' })
    }

    if (project.status !== 'draft') {
      throw new HTTPException(400, { message: 'Can only delete draft projects' })
    }

    // Delete (cascade will handle related records)
    await db.prepare(`DELETE FROM client_projects WHERE id = ?`).bind(projectId).run()

    return c.json({ message: 'Project deleted' })
  } catch (error) {
    console.error('DELETE /project error:', error)
    throw error
  }
})

export default router
