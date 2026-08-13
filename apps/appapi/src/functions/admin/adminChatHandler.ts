import { Hono } from 'hono'
import { z } from 'zod'
import { Bindings, Variables } from '../../index'

type HonoEnv = { Bindings: Bindings; Variables: Variables }
const adminChatRouter = new Hono<HonoEnv>()

// Validation schemas
const ChatFilterSchema = z.object({
  search_keyword: z.string().optional(),
  user_id: z.string().optional(),
  project_id: z.string().optional(),
  flagged_only: z.number().optional(),
  status: z.enum(['all', 'active', 'archived', 'flagged']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

const ModerateMessageSchema = z.object({
  message_id: z.string(),
  action: z.enum(['flag', 'delete', 'suspend']),
  reason: z.string(),
  admin_notes: z.string().optional(),
})

/**
 * GET /admin/chats
 * Get all chats (admin only) with filters
 */
adminChatRouter.get('/chats', async (c) => {
  const userRole = c.get('userRole')
  if (userRole !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  try {
    const search = c.req.query('search') || ''
    const userId = c.req.query('user_id') || ''
    const projectId = c.req.query('project_id') || ''
    const flaggedOnly = c.req.query('flagged_only') || '0'
    const status = c.req.query('status') || 'all'
    const limit = c.req.query('limit') || '50'
    const offset = c.req.query('offset') || '0'

    const db = c.env.DB_LOGS
    let query = `SELECT 
      t.*,
      (SELECT COUNT(*) FROM messages_v2 WHERE thread_id = t.thread_id AND is_deleted = 0) as message_count,
      (SELECT COUNT(*) FROM chat_moderation WHERE thread_id = t.thread_id) as flagged_count
    FROM message_threads_v2 t`

    const params: any[] = []

    // Add filters
    const conditions: string[] = []

    if (status === 'archived') {
      conditions.push('t.is_archived = 1')
    } else if (status === 'active') {
      conditions.push('t.is_archived = 0')
    } else if (status === 'flagged') {
      conditions.push('EXISTS (SELECT 1 FROM chat_moderation WHERE thread_id = t.thread_id)')
    }

    if (userId) {
      conditions.push('(t.client_id = ? OR t.talent_id = ?)')
      params.push(userId, userId)
    }

    if (projectId) {
      conditions.push('t.project_id = ?')
      params.push(projectId)
    }

    if (search) {
      conditions.push('(t.subject LIKE ? OR t.thread_id LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    if (flaggedOnly === '1') {
      conditions.push('EXISTS (SELECT 1 FROM chat_moderation WHERE thread_id = t.thread_id)')
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY t.last_message_at DESC LIMIT ? OFFSET ?'
    params.push(Math.min(parseInt(limit), 100), parseInt(offset))

    const threads = await db.prepare(query).bind(...params).all()

    return c.json({
      success: true,
      data: threads.results || [],
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch chats' }, 500)
  }
})

/**
 * GET /admin/chats/:thread_id/messages
 * Get all messages in a thread (admin view)
 */
adminChatRouter.get('/chats/:threadId/messages', async (c) => {
  const userRole = c.get('userRole')
  const threadId = c.req.param('threadId')

  if (userRole !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  try {
    const db = c.env.DB_LOGS
    const limit = c.req.query('limit') || '100'
    const offset = c.req.query('offset') || '0'

    // Get thread info
    const thread = await db
      .prepare('SELECT * FROM message_threads_v2 WHERE thread_id = ?')
      .bind(threadId)
      .first()

    if (!thread) return c.json({ error: 'Thread not found' }, 404)

    // Get all messages (including deleted ones for admin)
    const messages = await db
      .prepare(
        `SELECT m.*, 
          (SELECT COUNT(*) FROM chat_moderation WHERE message_id = m.message_id) as moderation_count
        FROM messages_v2 m
        WHERE m.thread_id = ?
        ORDER BY m.created_at ASC
        LIMIT ? OFFSET ?`
      )
      .bind(threadId, Math.min(parseInt(limit), 100), parseInt(offset))
      .all()

    // Get moderation history for thread
    const moderation = await db
      .prepare('SELECT * FROM chat_moderation WHERE thread_id = ? ORDER BY created_at DESC')
      .bind(threadId)
      .all()

    return c.json({
      success: true,
      data: {
        thread,
        messages: messages.results || [],
        moderation: moderation.results || [],
      },
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch messages' }, 500)
  }
})

/**
 * POST /admin/chats/moderate
 * Moderate a message (flag, delete, suspend)
 */
adminChatRouter.post('/moderate', async (c) => {
  const userId = c.get('userId')
  const userRole = c.get('userRole')

  if (userRole !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  try {
    const body = await c.req.json()
    const parsed = ModerateMessageSchema.parse(body)

    const db = c.env.DB_LOGS

    // Get message
    const message = await db
      .prepare('SELECT * FROM messages_v2 WHERE message_id = ?')
      .bind(parsed.message_id)
      .first()

    if (!message) return c.json({ error: 'Message not found' }, 404)

    // Create moderation record
    const modId = 'MOD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    await db
      .prepare(
        `INSERT INTO chat_moderation 
        (moderation_id, message_id, thread_id, flagged_by, reason, action_taken, admin_notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(
        modId,
        parsed.message_id,
        message.thread_id,
        userId,
        parsed.reason,
        parsed.action,
        parsed.admin_notes || null
      )
      .run()

    // If action is delete, soft delete the message
    if (parsed.action === 'delete') {
      await db
        .prepare(
          `UPDATE messages_v2 
          SET is_deleted = 1, deleted_by = ?, deleted_at = datetime('now')
          WHERE message_id = ?`
        )
        .bind(userId, parsed.message_id)
        .run()
    }

    // If action is suspend, maybe flag the user or thread (for future implementation)

    return c.json({ success: true, data: { moderation_id: modId } })
  } catch (error) {
    return c.json({ error: 'Failed to moderate message' }, 500)
  }
})

/**
 * DELETE /admin/chats/:thread_id
 * Delete entire chat thread
 */
adminChatRouter.delete('/chats/:threadId', async (c) => {
  const userId = c.get('userId')
  const userRole = c.get('userRole')
  const threadId = c.req.param('threadId')

  if (userRole !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  try {
    const db = c.env.DB_LOGS

    // Get thread
    const thread = await db
      .prepare('SELECT * FROM message_threads_v2 WHERE thread_id = ?')
      .bind(threadId)
      .first()

    if (!thread) return c.json({ error: 'Thread not found' }, 404)

    // Soft delete all messages in thread
    await db
      .prepare(
        `UPDATE messages_v2 
        SET is_deleted = 1, deleted_by = ?, deleted_at = datetime('now')
        WHERE thread_id = ?`
      )
      .bind(userId, threadId)
      .run()

    // Archive thread
    await db
      .prepare('UPDATE message_threads_v2 SET is_archived = 1 WHERE thread_id = ?')
      .bind(threadId)
      .run()

    // Create moderation record
    const modId = 'MOD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    await db
      .prepare(
        `INSERT INTO chat_moderation 
        (moderation_id, thread_id, flagged_by, reason, action_taken, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(modId, threadId, userId, 'Admin deleted entire thread', 'deleted')
      .run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete thread' }, 500)
  }
})

/**
 * GET /admin/chats/moderation-logs
 * Get all moderation logs
 */
adminChatRouter.get('/moderation-logs', async (c) => {
  const userRole = c.get('userRole')
  if (userRole !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  try {
    const db = c.env.DB_LOGS
    const action = c.req.query('action') || '' // filter by action
    const limit = c.req.query('limit') || '50'
    const offset = c.req.query('offset') || '0'

    let query = 'SELECT * FROM chat_moderation'
    const params: any[] = []

    if (action) {
      query += ' WHERE action_taken = ?'
      params.push(action)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(Math.min(parseInt(limit), 100), parseInt(offset))

    const logs = await db.prepare(query).bind(...params).all()

    return c.json({
      success: true,
      data: logs.results || [],
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch logs' }, 500)
  }
})

/**
 * GET /admin/chat-statistics
 * Get chat statistics for admin dashboard
 */
adminChatRouter.get('/statistics', async (c) => {
  const userRole = c.get('userRole')
  if (userRole !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  try {
    const db = c.env.DB_LOGS

    const stats = await db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM message_threads_v2 WHERE is_archived = 0) as active_threads,
          (SELECT COUNT(*) FROM message_threads_v2) as total_threads,
          (SELECT COUNT(*) FROM messages_v2 WHERE is_deleted = 0) as total_messages,
          (SELECT COUNT(*) FROM chat_moderation) as total_moderation_actions,
          (SELECT COUNT(*) FROM chat_moderation WHERE action_taken = 'deleted') as deleted_messages,
          (SELECT COUNT(*) FROM chat_moderation WHERE action_taken = 'flagged') as flagged_messages
        FROM message_threads_v2 LIMIT 1`
      )
      .first()

    return c.json({ success: true, data: stats || {} })
  } catch (error) {
    return c.json({ error: 'Failed to fetch statistics' }, 500)
  }
})

export default adminChatRouter
