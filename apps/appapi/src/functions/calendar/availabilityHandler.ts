/**
 * Availability & Calendar Management
 * Talents can set their availability and booking status
 */

import { Hono } from 'hono';
import { Context } from 'hono';
import type { Bindings, Variables } from '../../index';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Middleware: Ensure user is a talent
 */
const ensureTalent = async (c: Context) => {
  const userId = c.get('userId');
  const talent = await c.env.DB_CORE.prepare(
    'SELECT id FROM talents WHERE user_id = ?'
  ).bind(userId).first<any>();

  if (!talent) {
    return null;
  }
  return talent;
};

/**
 * GET /api/v1/talents/me/availability
 * Get all availability blocks for current talent
 */
app.get('/talents/me/availability', async (c) => {
  const userId = c.get('userId');

  try {
    const talent = await ensureTalent(c);
    if (!talent) {
      return c.json({ error: 'Not a talent account' }, 403);
    }

    const availability = await c.env.DB_CORE.prepare(`
      SELECT 
        id,
        start_date,
        end_date,
        status,
        reason,
        created_at,
        updated_at
      FROM availability
      WHERE talent_id = ? AND end_date >= DATE('now')
      ORDER BY start_date ASC
    `).bind(talent.id).all<any>();

    return c.json({
      status: 'success',
      data: {
        talent_id: talent.id,
        availability: availability.results
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch availability' }, 500);
  }
});

/**
 * POST /api/v1/talents/me/availability
 * Add an availability block (mark as booked, unavailable, or available)
 */
app.post('/talents/me/availability', async (c) => {
  const userId = c.get('userId');

  try {
    const talent = await ensureTalent(c);
    if (!talent) {
      return c.json({ error: 'Not a talent account' }, 403);
    }

    const body = await c.req.json<any>();
    const { start_date, end_date, status, reason } = body;

    // Validate input
    if (!start_date || !end_date || !status) {
      return c.json({ 
        error: 'Missing required fields',
        message: 'start_date, end_date, and status are required'
      }, 400);
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return c.json({ error: 'Invalid date format' }, 400);
    }

    if (startDate >= endDate) {
      return c.json({ error: 'Start date must be before end date' }, 400);
    }

    // Validate status
    const validStatuses = ['available', 'booked', 'unavailable'];
    if (!validStatuses.includes(status)) {
      return c.json({ 
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      }, 400);
    }

    // Check for conflicting availability
    const conflicts = await c.env.DB_CORE.prepare(`
      SELECT COUNT(*) as count FROM availability
      WHERE talent_id = ?
      AND NOT (end_date < ? OR start_date > ?)
    `).bind(talent.id, start_date, end_date).first<any>();

    if (conflicts.count > 0) {
      return c.json({
        error: 'Conflicting availability',
        message: 'This date range overlaps with existing availability'
      }, 400);
    }

    // Create availability record
    const now = new Date().toISOString();
    const availId = `avail_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await c.env.DB_CORE.prepare(`
      INSERT INTO availability (id, talent_id, start_date, end_date, status, reason, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(availId, talent.id, start_date, end_date, status, reason || null, now, now).run();

    return c.json({
      status: 'success',
      message: 'Availability added',
      data: {
        id: availId,
        start_date,
        end_date,
        status,
        reason: reason || null,
        created_at: now
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to create availability' }, 500);
  }
});

/**
 * PATCH /api/v1/talents/me/availability/:id
 * Update an availability block
 */
app.patch('/talents/me/availability/:id', async (c) => {
  const userId = c.get('userId');
  const availId = c.req.param('id');

  try {
    const talent = await ensureTalent(c);
    if (!talent) {
      return c.json({ error: 'Not a talent account' }, 403);
    }

    // Verify ownership
    const availability = await c.env.DB_CORE.prepare(
      'SELECT * FROM availability WHERE id = ? AND talent_id = ?'
    ).bind(availId, talent.id).first<any>();

    if (!availability) {
      return c.json({ error: 'Availability not found' }, 404);
    }

    const body = await c.req.json<any>();
    const { start_date, end_date, status, reason } = body;

    // Validate new dates if provided
    if (start_date || end_date) {
      const newStart = start_date || availability.start_date;
      const newEnd = end_date || availability.end_date;

      const startDate = new Date(newStart);
      const endDate = new Date(newEnd);

      if (startDate >= endDate) {
        return c.json({ error: 'Start date must be before end date' }, 400);
      }

      // Check for conflicts (excluding current record)
      const conflicts = await c.env.DB_CORE.prepare(`
        SELECT COUNT(*) as count FROM availability
        WHERE talent_id = ? AND id != ?
        AND NOT (end_date < ? OR start_date > ?)
      `).bind(talent.id, availId, newStart, newEnd).first<any>();

      if (conflicts.count > 0) {
        return c.json({ error: 'Conflicting availability dates' }, 400);
      }
    }

    // Update availability
    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [now];

    if (start_date) {
      updates.push('start_date = ?');
      params.push(start_date);
    }
    if (end_date) {
      updates.push('end_date = ?');
      params.push(end_date);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (reason !== undefined) {
      updates.push('reason = ?');
      params.push(reason);
    }

    params.push(availId);
    params.push(talent.id);

    await c.env.DB_CORE.prepare(`
      UPDATE availability
      SET ${updates.join(', ')}
      WHERE id = ? AND talent_id = ?
    `).bind(...params).run();

    const updated = await c.env.DB_CORE.prepare(
      'SELECT id, start_date, end_date, status, reason, updated_at FROM availability WHERE id = ?'
    ).bind(availId).first<any>();

    return c.json({
      status: 'success',
      message: 'Availability updated',
      data: updated
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to update availability' }, 500);
  }
});

/**
 * DELETE /api/v1/talents/me/availability/:id
 * Remove an availability block
 */
app.delete('/talents/me/availability/:id', async (c) => {
  const userId = c.get('userId');
  const availId = c.req.param('id');

  try {
    const talent = await ensureTalent(c);
    if (!talent) {
      return c.json({ error: 'Not a talent account' }, 403);
    }

    // Verify ownership
    const availability = await c.env.DB_CORE.prepare(
      'SELECT id FROM availability WHERE id = ? AND talent_id = ?'
    ).bind(availId, talent.id).first<any>();

    if (!availability) {
      return c.json({ error: 'Availability not found' }, 404);
    }

    await c.env.DB_CORE.prepare(
      'DELETE FROM availability WHERE id = ?'
    ).bind(availId).run();

    return c.json({
      status: 'success',
      message: 'Availability removed'
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to delete availability' }, 500);
  }
});

/**
 * GET /api/v1/public/talents/:id/availability
 * Get talent's AVAILABILITY SUMMARY (public, non-authenticated)
 * Shows only if talent is available/booked (not detailed blocks)
 */
app.get('/public/talents/:id/availability', async (c) => {
  const talentId = c.req.param('id');

  try {
    // Get talent info
    const talent = await c.env.DB_CORE.prepare(
      'SELECT id, name FROM talents WHERE id = ?'
    ).bind(talentId).first<any>();

    if (!talent) {
      return c.json({ error: 'Talent not found' }, 404);
    }

    // Get current availability status
    const today = new Date().toISOString().split('T')[0];
    const currentStatus = await c.env.DB_CORE.prepare(`
      SELECT status FROM availability
      WHERE talent_id = ?
      AND start_date <= ?
      AND end_date > ?
      LIMIT 1
    `).bind(talentId, today, today).first<any>();

    const upcomingBlocks = await c.env.DB_CORE.prepare(`
      SELECT 
        start_date,
        end_date,
        status
      FROM availability
      WHERE talent_id = ?
      AND end_date > DATE('now')
      AND status IN ('booked', 'unavailable')
      ORDER BY start_date ASC
      LIMIT 10
    `).bind(talentId).all<any>();

    return c.json({
      status: 'success',
      data: {
        talent_name: talent.name,
        current_status: currentStatus?.status || 'available',
        upcoming_blocks: upcomingBlocks.results,
        summary: {
          booked_dates: upcomingBlocks.results.filter(b => b.status === 'booked').length,
          unavailable_dates: upcomingBlocks.results.filter(b => b.status === 'unavailable').length
        }
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch availability' }, 500);
  }
});

/**
 * GET /api/v1/admin/talents/availability-summary
 * Get availability summary for all talents (admin only)
 */
app.get('/admin/talents/availability-summary', async (c) => {
  const userRole = c.get('userRole');

  if (userRole !== 'platform_admin') {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const summary = await c.env.DB_CORE.prepare(`
      SELECT 
        t.id,
        t.name,
        t.category,
        COUNT(CASE WHEN a.status = 'available' THEN 1 END) as available_count,
        COUNT(CASE WHEN a.status = 'booked' THEN 1 END) as booked_count,
        COUNT(CASE WHEN a.status = 'unavailable' THEN 1 END) as unavailable_count
      FROM talents t
      LEFT JOIN availability a ON t.id = a.talent_id AND a.end_date > DATE('now')
      GROUP BY t.id
      ORDER BY booked_count DESC
    `).all<any>();

    return c.json({
      status: 'success',
      data: summary.results
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch summary' }, 500);
  }
});

export default app;
