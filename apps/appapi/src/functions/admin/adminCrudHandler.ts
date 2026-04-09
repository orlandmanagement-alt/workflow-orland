/**
 * Admin CRUD Handler
 * God-mode endpoints for admin user management, talent verification, project moderation, etc.
 * 
 * ⚠️ SECURITY: All endpoints require userRole === 'admin' or 'super_admin'
 * These routes are protected by middleware checking userRole from DB_SSO.users
 */

import { Hono } from 'hono';
import { Context } from 'hono';
import type { Bindings, Variables } from '../../index';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Middleware: Require Admin Role
 */
async function requireAdminRole(c: Context, next: () => Promise<void>) {
  const userRole = c.get('userRole');
  
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return c.json({ 
      status: 'error', 
      message: 'Forbidden: Admin access required',
      requiredRole: 'admin | super_admin'
    }, 403);
  }
  
  await next();
}

// Apply admin middleware to all routes
app.use('*', requireAdminRole);
/**
 * ===== USER MANAGEMENT =====
 */

/**
 * GET /api/v1/admin/users
 * List all users with search, filter, and pagination
 * 
 * Query Parameters:
 * - search: Search by email, name, phone (LIKE query)
 * - status: Filter by status (active, suspended, deleted, pending)
 * - role: Filter by role (talent, client, admin, agency)
 * - page: Page number (default 1)
 * - limit: Items per page (default 20, max 100)
 */
app.get('/users', async (c) => {
  try {
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || '';
    const role = c.req.query('role') || '';
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));
    const offset = (page - 1) * limit;

    // Build WHERE clause dynamically
    let whereConditions = ['1=1'];
    let bindParams: any[] = [];

    if (search) {
      whereConditions.push('(email LIKE ? OR name LIKE ? OR phone LIKE ?)');
      const searchTerm = `%${search}%`;
      bindParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status && ['active', 'suspended', 'deleted', 'pending'].includes(status)) {
      whereConditions.push('status = ?');
      bindParams.push(status);
    }

    if (role && ['talent', 'client', 'admin', 'agency', 'super_admin'].includes(role)) {
      whereConditions.push('role = ?');
      bindParams.push(role);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await c.env.DB_SSO.prepare(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`
    ).bind(...bindParams).first<{ total: number }>();
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Get paginated results
    const query = `
      SELECT 
        id, 
        email, 
        phone, 
        name, 
        role, 
        status, 
        created_at, 
        updated_at
      FROM users 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    bindParams.push(limit, offset);
    const users = await c.env.DB_SSO.prepare(query)
      .bind(...bindParams)
      .all<any>();

    return c.json({
      status: 'success',
      data: users.results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch users' }, 500);
  }
});

/**
 * GET /api/v1/admin/users/:id
 * Get single user details
 */
app.get('/users/:id', async (c) => {
  const userId = c.req.param('id');

  try {
    const user = await c.env.DB_SSO.prepare(`
      SELECT 
        id, 
        email, 
        phone, 
        name, 
        role, 
        status, 
        created_at, 
        updated_at
      FROM users 
      WHERE id = ?
    `).bind(userId).first<any>();

    if (!user) {
      return c.json({ status: 'error', message: 'User not found' }, 404);
    }

    return c.json({ status: 'success', data: user });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch user' }, 500);
  }
});

/**
 * PATCH /api/v1/admin/users/:id/status
 * Change user status (active, suspended, deleted)
 * 
 * Request body:
 * {
 *   "status": "active" | "suspended" | "deleted",
 *   "reason": "optional ban reason"
 * }
 */
app.patch('/users/:id/status', async (c) => {
  const userId = c.req.param('id');
  const adminId = c.get('userId');

  try {
    const { status, reason } = await c.req.json<{
      status: 'active' | 'suspended' | 'deleted';
      reason?: string;
    }>();

    if (!['active', 'suspended', 'deleted'].includes(status)) {
      return c.json({ 
        status: 'error', 
        message: 'Invalid status. Must be: active, suspended, or deleted' 
      }, 400);
    }

    // Cannot modify own account
    if (userId === adminId) {
      return c.json({ 
        status: 'error', 
        message: 'Cannot modify your own account' 
      }, 403);
    }

    // Check if user exists
    const user = await c.env.DB_SSO.prepare('SELECT id, status FROM users WHERE id = ?')
      .bind(userId).first<any>();

    if (!user) {
      return c.json({ status: 'error', message: 'User not found' }, 404);
    }

    // Update status
    const now = new Date().toISOString();
    await c.env.DB_SSO.prepare(`
      UPDATE users 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).bind(status, now, userId).run();

    // Log action for audit trail
    if (c.env.DB_LOGS) {
      try {
        await c.env.DB_LOGS.prepare(`
          INSERT INTO audit_logs (admin_id, action, target_id, target_type, details, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          adminId,
          'user_status_change',
          userId,
          'user',
          JSON.stringify({ oldStatus: user.status, newStatus: status, reason }),
          now
        ).run();
      } catch (e) {
      }
    }

    return c.json({
      status: 'success',
      message: `User status changed to ${status}`,
      data: { userId, newStatus: status }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to update user status' }, 500);
  }
});

/**
 * PATCH /api/v1/admin/users/:id/password/reset
 * Trigger password reset for user
 */
app.patch('/users/:id/password/reset', async (c) => {
  const userId = c.req.param('id');
  const adminId = c.get('userId');

  try {
    // Check if user exists
    const user = await c.env.DB_SSO.prepare('SELECT id, email FROM users WHERE id = ?')
      .bind(userId).first<any>();

    if (!user) {
      return c.json({ status: 'error', message: 'User not found' }, 404);
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Store reset token
    await c.env.DB_SSO.prepare(`
      UPDATE users 
      SET password_reset_token = ?, password_reset_expires = ?
      WHERE id = ?
    `).bind(resetToken, expiresAt, userId).run();

    // Log action
    if (c.env.DB_LOGS) {
      try {
        await c.env.DB_LOGS.prepare(`
          INSERT INTO audit_logs (admin_id, action, target_id, target_type, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(adminId, 'password_reset_requested', userId, 'user', new Date().toISOString()).run();
      } catch (e) {
      }
    }

    return c.json({
      status: 'success',
      message: 'Password reset initiated',
      data: { 
        userId,
        resetToken,
        resetUrl: `/auth/reset-password?token=${resetToken}`
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to reset password' }, 500);
  }
});

/**
 * ===== TALENT VERIFICATION =====
 */

/**
 * GET /api/v1/admin/talents/pending
 * List all talents with pending verification (KYC not approved)
 * 
 * Query Parameters:
 * - page: Page number (default 1)
 * - limit: Items per page (default 20)
 */
app.get('/talents/pending', async (c) => {
  try {
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));
    const offset = (page - 1) * limit;

    // Get count of pending talents
    const countResult = await c.env.DB_CORE.prepare(`
      SELECT COUNT(*) as total 
      FROM talents 
      WHERE kyc_status IS NULL OR kyc_status NOT IN ('verified', 'rejected')
    `).first<{ total: number }>();
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Get pending talents
    const talents = await c.env.DB_CORE.prepare(`
      SELECT 
        id,
        user_id,
        name,
        email,
        category,
        kyc_status,
        kyc_submitted_at,
        kyc_verified_at,
        profile_picture_url,
        created_at
      FROM talents 
      WHERE kyc_status IS NULL OR kyc_status NOT IN ('verified', 'rejected')
      ORDER BY kyc_submitted_at ASC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all<any>();

    return c.json({
      status: 'success',
      data: talents.results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch pending talents' }, 500);
  }
});

/**
 * POST /api/v1/admin/talents/:id/verify
 * Approve talent KYC and enable public access
 * 
 * Request body:
 * {
 *   "approvalNotes": "optional approval notes"
 * }
 */
app.post('/talents/:id/verify', async (c) => {
  const talentId = c.req.param('id');
  const adminId = c.get('userId');

  try {
    const body = await c.req.json<{ approvalNotes?: string }>();

    // Check if talent exists
    const talent = await c.env.DB_CORE.prepare('SELECT id, user_id FROM talents WHERE id = ?')
      .bind(talentId).first<any>();

    if (!talent) {
      return c.json({ status: 'error', message: 'Talent not found' }, 404);
    }

    // Update KYC status
    const now = new Date().toISOString();
    await c.env.DB_CORE.prepare(`
      UPDATE talents 
      SET kyc_status = 'verified', kyc_verified_at = ?, profile_visible = true
      WHERE id = ?
    `).bind(now, talentId).run();

    // Update user account tier to premium
    await c.env.DB_SSO.prepare(`
      UPDATE users 
      SET account_tier = 'premium'
      WHERE id = ?
    `).bind(talent.user_id).run();

    // Log action
    if (c.env.DB_LOGS) {
      try {
        await c.env.DB_LOGS.prepare(`
          INSERT INTO audit_logs (admin_id, action, target_id, target_type, details, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          adminId,
          'talent_verified',
          talentId,
          'talent',
          JSON.stringify({ notes: body.approvalNotes }),
          now
        ).run();
      } catch (e) {
      }
    }

    return c.json({
      status: 'success',
      message: 'Talent verified and profile enabled',
      data: { talentId, kycStatus: 'verified' }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to verify talent' }, 500);
  }
});

/**
 * POST /api/v1/admin/talents/:id/reject
 * Reject talent KYC or disable profile
 * 
 * Request body:
 * {
 *   "rejectionReason": "reason for rejection"
 * }
 */
app.post('/talents/:id/reject', async (c) => {
  const talentId = c.req.param('id');
  const adminId = c.get('userId');

  try {
    const { rejectionReason } = await c.req.json<{ rejectionReason: string }>();

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return c.json({ 
        status: 'error', 
        message: 'rejectionReason is required' 
      }, 400);
    }

    // Check if talent exists
    const talent = await c.env.DB_CORE.prepare('SELECT id FROM talents WHERE id = ?')
      .bind(talentId).first<any>();

    if (!talent) {
      return c.json({ status: 'error', message: 'Talent not found' }, 404);
    }

    // Update KYC status
    const now = new Date().toISOString();
    await c.env.DB_CORE.prepare(`
      UPDATE talents 
      SET kyc_status = 'rejected', profile_visible = false
      WHERE id = ?
    `).bind(talentId).run();

    // Log action
    if (c.env.DB_LOGS) {
      try {
        await c.env.DB_LOGS.prepare(`
          INSERT INTO audit_logs (admin_id, action, target_id, target_type, details, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          adminId,
          'talent_rejected',
          talentId,
          'talent',
          JSON.stringify({ reason: rejectionReason }),
          now
        ).run();
      } catch (e) {
      }
    }

    return c.json({
      status: 'success',
      message: 'Talent rejected',
      data: { talentId, kycStatus: 'rejected' }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to reject talent' }, 500);
  }
});

/**
 * ===== PROJECT MODERATION =====
 */

/**
 * GET /api/v1/admin/projects
 * List all projects across all clients (god mode view)
 * 
 * Query Parameters:
 * - status: active, closed, cancelled
 * - search: Search by title
 * - page: Page number (default 1)
 * - limit: Items per page (default 20)
 */
app.get('/projects', async (c) => {
  try {
    const statusFilter = c.req.query('status') || '';
    const search = c.req.query('search') || '';
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['1=1'];
    let bindParams: any[] = [];

    if (statusFilter && ['active', 'closed', 'cancelled'].includes(statusFilter)) {
      whereConditions.push('status = ?');
      bindParams.push(statusFilter);
    }

    if (search) {
      whereConditions.push('title LIKE ?');
      bindParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get count
    const countResult = await c.env.DB_CORE.prepare(
      `SELECT COUNT(*) as total FROM projects WHERE ${whereClause}`
    ).bind(...bindParams).first<{ total: number }>();
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Get projects
    const projects = await c.env.DB_CORE.prepare(`
      SELECT 
        id,
        title,
        category,
        status,
        budget,
        start_date,
        end_date,
        created_at,
        updated_at
      FROM projects 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindParams, limit, offset).all<any>();

    return c.json({
      status: 'success',
      data: projects.results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch projects' }, 500);
  }
});

/**
 * DELETE /api/v1/admin/projects/:id
 * Delete/deactivate a project (with reason for moderation)
 * 
 * Request body:
 * {
 *   "reason": "fraud" | "inappropriate" | "violation" | "other",
 *   "details": "optional details"
 * }
 */
app.delete('/projects/:id', async (c) => {
  const projectId = c.req.param('id');
  const adminId = c.get('userId');

  try {
    const { reason, details } = await c.req.json<{
      reason: 'fraud' | 'inappropriate' | 'violation' | 'other';
      details?: string;
    }>();

    // Check if project exists
    const project = await c.env.DB_CORE.prepare('SELECT id FROM projects WHERE id = ?')
      .bind(projectId).first<any>();

    if (!project) {
      return c.json({ status: 'error', message: 'Project not found' }, 404);
    }

    // Delete project
    const now = new Date().toISOString();
    await c.env.DB_CORE.prepare('DELETE FROM projects WHERE id = ?')
      .bind(projectId).run();

    // Log moderation action
    if (c.env.DB_LOGS) {
      try {
        await c.env.DB_LOGS.prepare(`
          INSERT INTO audit_logs (admin_id, action, target_id, target_type, details, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          adminId,
          'project_deleted',
          projectId,
          'project',
          JSON.stringify({ reason, details }),
          now
        ).run();
      } catch (e) {
      }
    }

    return c.json({
      status: 'success',
      message: 'Project deleted',
      data: { projectId, reason }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to delete project' }, 500);
  }
});

/**
 * PATCH /api/v1/admin/projects/:id/status
 * Mark project as closed or cancelled
 * 
 * Request body:
 * {
 *   "status": "closed" | "cancelled",
 *   "reason": "optional reason"
 * }
 */
app.patch('/projects/:id/status', async (c) => {
  const projectId = c.req.param('id');
  const adminId = c.get('userId');

  try {
    const { status, reason } = await c.req.json<{
      status: 'closed' | 'cancelled';
      reason?: string;
    }>();

    if (!['closed', 'cancelled'].includes(status)) {
      return c.json({ 
        status: 'error', 
        message: 'Invalid status. Must be: closed or cancelled' 
      }, 400);
    }

    // Check if project exists
    const project = await c.env.DB_CORE.prepare('SELECT id FROM projects WHERE id = ?')
      .bind(projectId).first<any>();

    if (!project) {
      return c.json({ status: 'error', message: 'Project not found' }, 404);
    }

    // Update status
    const now = new Date().toISOString();
    await c.env.DB_CORE.prepare(`
      UPDATE projects 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).bind(status, now, projectId).run();

    // Log action
    if (c.env.DB_LOGS) {
      try {
        await c.env.DB_LOGS.prepare(`
          INSERT INTO audit_logs (admin_id, action, target_id, target_type, details, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          adminId,
          'project_status_changed',
          projectId,
          'project',
          JSON.stringify({ newStatus: status, reason }),
          now
        ).run();
      } catch (e) {
      }
    }

    return c.json({
      status: 'success',
      message: `Project marked as ${status}`,
      data: { projectId, newStatus: status }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to update project status' }, 500);
  }
});

/**
 * ===== ANALYTICS & REPORTING =====
 */

/**
 * GET /api/v1/admin/stats/overview
 * Get high-level admin dashboard stats
 */
app.get('/stats/overview', async (c) => {
  try {
    const [totalUsers, activeUsers, totalTalents, verifiedTalents, totalProjects] = await Promise.all([
      c.env.DB_SSO.prepare('SELECT COUNT(*) as count FROM users').first<any>(),
      c.env.DB_SSO.prepare('SELECT COUNT(*) as count FROM users WHERE status = "active"').first<any>(),
      c.env.DB_CORE.prepare('SELECT COUNT(*) as count FROM talents').first<any>(),
      c.env.DB_CORE.prepare('SELECT COUNT(*) as count FROM talents WHERE kyc_status = "verified"').first<any>(),
      c.env.DB_CORE.prepare('SELECT COUNT(*) as count FROM projects').first<any>()
    ]);

    return c.json({
      status: 'success',
      data: {
        totalUsers: totalUsers?.count || 0,
        activeUsers: activeUsers?.count || 0,
        totalTalents: totalTalents?.count || 0,
        verifiedTalents: verifiedTalents?.count || 0,
        totalProjects: totalProjects?.count || 0
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch stats' }, 500);
  }
});

/**
 * GET /api/v1/admin/audit-logs
 * Get recent audit logs of admin actions
 * 
 * Query Parameters:
 * - limit: Number of logs to return (default 50, max 500)
 */
app.get('/audit-logs', async (c) => {
  try {
    const limit = Math.min(500, Math.max(1, parseInt(c.req.query('limit') || '50')));

    const logs = await c.env.DB_LOGS.prepare(`
      SELECT 
        id,
        admin_id,
        action,
        target_id,
        target_type,
        details,
        created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(limit).all<any>();

    return c.json({
      status: 'success',
      data: logs.results,
      count: logs.results?.length || 0
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch audit logs' }, 500);
  }
});

export default app;