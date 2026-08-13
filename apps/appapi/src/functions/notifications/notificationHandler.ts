import { Hono } from 'hono'
import { z } from 'zod'
import { Bindings, Variables } from '../../index'

type HonoEnv = { Bindings: Bindings; Variables: Variables }
const notificationRouter = new Hono<HonoEnv>()

// Validation schemas
const NotificationSettingsSchema = z.object({
  msg_enabled: z.number().optional(),
  msg_via_email: z.number().optional(),
  msg_via_push: z.number().optional(),
  msg_sound: z.number().optional(),
  project_enabled: z.number().optional(),
  project_updates: z.number().optional(),
  project_assignments: z.number().optional(),
  project_via_email: z.number().optional(),
  project_via_push: z.number().optional(),
  talent_request_enabled: z.number().optional(),
  talent_approval_enabled: z.number().optional(),
  talent_via_email: z.number().optional(),
  talent_via_push: z.number().optional(),
  payment_enabled: z.number().optional(),
  invoice_enabled: z.number().optional(),
  payment_via_email: z.number().optional(),
  payment_via_push: z.number().optional(),
  booking_enabled: z.number().optional(),
  booking_via_email: z.number().optional(),
  booking_via_push: z.number().optional(),
  system_enabled: z.number().optional(),
  system_urgent_only: z.number().optional(),
  schedule_reminder_24h: z.number().optional(),
  schedule_reminder_1h: z.number().optional(),
  schedule_via_email: z.number().optional(),
  schedule_via_push: z.number().optional(),
  schedule_via_sms: z.number().optional(),
  quiet_hours_enabled: z.number().optional(),
  quiet_hours_start: z.string().optional(),
  quiet_hours_end: z.string().optional(),
})

/**
 * GET /notifications
 * Get all notifications for the user
 */
notificationRouter.get('/', async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const limit = c.req.query('limit') || '50'
    const offset = c.req.query('offset') || '0'
    const notifType = c.req.query('type') // optional filter by type

    const db = c.env.DB_LOGS

    let query = 'SELECT * FROM notifications_v2 WHERE user_id = ?'
    const params: any[] = [userId]

    if (notifType) {
      query += ' AND notif_type = ?'
      params.push(notifType)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(Math.min(parseInt(limit), 100), parseInt(offset))

    const notifications = await db.prepare(query).bind(...params).all()

    // Count unread
    const unreadResult = await db
      .prepare('SELECT COUNT(*) as count FROM notifications_v2 WHERE user_id = ? AND is_read = 0')
      .bind(userId)
      .first<{ count: number }>()

    return c.json({
      success: true,
      unread_count: unreadResult?.count || 0,
      data: notifications.results || [],
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch notifications' }, 500)
  }
})

/**
 * PUT /notifications/:notif_id/read
 * Mark a notification as read
 */
notificationRouter.put('/:notifId/read', async (c) => {
  const userId = c.get('userId')
  const notifId = c.req.param('notifId')

  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const db = c.env.DB_LOGS

    await db
      .prepare('UPDATE notifications_v2 SET is_read = 1, read_at = datetime("now") WHERE notif_id = ? AND user_id = ?')
      .bind(notifId, userId)
      .run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to mark notification as read' }, 500)
  }
})

/**
 * PUT /notifications/read-all
 * Mark all notifications as read
 */
notificationRouter.put('/read-all', async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const db = c.env.DB_LOGS

    await db
      .prepare('UPDATE notifications_v2 SET is_read = 1, read_at = datetime("now") WHERE user_id = ? AND is_read = 0')
      .bind(userId)
      .run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to mark notifications as read' }, 500)
  }
})

/**
 * GET /notifications/settings
 * Get user's notification settings/preferences
 */
notificationRouter.get('/settings', async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const db = c.env.DB_LOGS

    let settings = await db
      .prepare('SELECT * FROM notification_settings WHERE user_id = ?')
      .bind(userId)
      .first()

    // If no settings exist, create default ones
    if (!settings) {
      const settingId = 'NOTIF-SETTINGS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
      await db
        .prepare(
          `INSERT INTO notification_settings 
          (setting_id, user_id, msg_enabled, msg_via_email, msg_via_push, msg_sound,
           project_enabled, project_updates, project_assignments, project_via_email, project_via_push,
           talent_request_enabled, talent_approval_enabled, talent_via_email, talent_via_push,
           payment_enabled, invoice_enabled, payment_via_email, payment_via_push,
           booking_enabled, booking_via_email, booking_via_push,
           system_enabled, system_urgent_only,
           schedule_reminder_24h, schedule_reminder_1h, schedule_via_email, schedule_via_push, schedule_via_sms,
           quiet_hours_enabled, updated_at)
          VALUES (?, ?, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, datetime('now'))`
        )
        .bind(settingId, userId)
        .run()

      settings = await db
        .prepare('SELECT * FROM notification_settings WHERE user_id = ?')
        .bind(userId)
        .first()
    }

    return c.json({ success: true, data: settings })
  } catch (error) {
    return c.json({ error: 'Failed to fetch settings' }, 500)
  }
})

/**
 * PUT /notifications/settings
 * Update user's notification settings/preferences
 */
notificationRouter.put('/settings', async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const body = await c.req.json()
    const parsed = NotificationSettingsSchema.parse(body)

    const db = c.env.DB_LOGS

    // Build dynamic update query
    const updates: string[] = []
    const values: any[] = []

    Object.entries(parsed).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`)
        values.push(value)
      }
    })

    if (updates.length === 0) {
      return c.json({ error: 'No settings to update' }, 400)
    }

    updates.push('updated_at = datetime("now")')
    values.push(userId)

    const query = `UPDATE notification_settings SET ${updates.join(', ')} WHERE user_id = ?`

    await db.prepare(query).bind(...values).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to update settings' }, 500)
  }
})

/**
 * GET /notifications/summary
 * Get notification summary by type
 */
notificationRouter.get('/summary', async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const db = c.env.DB_LOGS

    const summary = await db
      .prepare(
        `SELECT 
          notif_type,
          COUNT(*) as total,
          SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
          SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent
        FROM notifications_v2
        WHERE user_id = ?
        GROUP BY notif_type
        ORDER BY total DESC`
      )
      .bind(userId)
      .all()

    return c.json({ success: true, data: summary.results || [] })
  } catch (error) {
    return c.json({ error: 'Failed to fetch summary' }, 500)
  }
})

/**
 * DELETE /notifications/:notif_id
 * Delete a notification
 */
notificationRouter.delete('/:notifId', async (c) => {
  const userId = c.get('userId')
  const notifId = c.req.param('notifId')

  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const db = c.env.DB_LOGS

    await db
      .prepare('DELETE FROM notifications_v2 WHERE notif_id = ? AND user_id = ?')
      .bind(notifId, userId)
      .run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete notification' }, 500)
  }
})

export default notificationRouter
