import { Hono } from 'hono'
import { z } from 'zod'
import { Bindings, Variables } from '../../index'
import { sanitizeMessage } from '../../utils/wordFilter'

type HonoEnv = { Bindings: Bindings; Variables: Variables }
const messageRouter = new Hono<HonoEnv>()

// Validation schemas
const MessageSchema = z.object({
  thread_id: z.string(),
  recipient_id: z.string(),
  body: z.string().min(1).max(4000),
  attachment_url: z.string().optional(),
  attachment_type: z.enum(['image', 'pdf', 'video', 'other']).optional(),
})

const ThreadSchema = z.object({
  project_id: z.string(),
  client_id: z.string(),
  talent_id: z.string(),
  subject: z.string().optional(),
})

/**
 * GET /messages/threads
 * Get all message threads for the user
 */
messageRouter.get('/threads', async (c) => {
  const userId = c.get('userId')
  
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const db = c.env.DB_LOGS
    const threads = await db
      .prepare(
        `SELECT 
          t.thread_id, t.project_id, t.client_id, t.talent_id, t.subject,
          t.is_archived, t.created_at, t.last_message_at, t.message_count,
          (SELECT COUNT(*) FROM messages_v2 WHERE thread_id = t.thread_id AND recipient_id = ? AND is_read = 0) as unread_count,
          (SELECT body FROM messages_v2 WHERE thread_id = t.thread_id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages_v2 WHERE thread_id = t.thread_id ORDER BY created_at DESC LIMIT 1) as last_message_at
        FROM message_threads_v2 t
        WHERE (t.client_id = ? OR t.talent_id = ?) AND t.is_archived = 0
        ORDER BY t.last_message_at DESC
        LIMIT 50`
      )
      .bind(userId, userId, userId)
      .all()

    return c.json({
      success: true,
      data: threads.results || [],
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch threads' }, 500)
  }
})

/**
 * POST /messages/threads
 * Create a new message thread
 */
messageRouter.post('/threads', async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const body = await c.req.json()
    const parsed = ThreadSchema.parse(body)

    const threadId = 'THREAD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    const db = c.env.DB_LOGS

    // Check if thread already exists
    const existing = await db
      .prepare(
        'SELECT thread_id FROM message_threads_v2 WHERE client_id = ? AND talent_id = ? AND project_id = ?'
      )
      .bind(parsed.client_id, parsed.talent_id, parsed.project_id)
      .first()

    if (existing) {
      return c.json({ success: true, data: { thread_id: existing.thread_id } })
    }

    // Create new thread
    await db
      .prepare(
        `INSERT INTO message_threads_v2 
        (thread_id, project_id, client_id, talent_id, subject, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(threadId, parsed.project_id, parsed.client_id, parsed.talent_id, parsed.subject || 'Project Discussion')
      .run()

    return c.json({ success: true, data: { thread_id: threadId } })
  } catch (error) {
    return c.json({ error: 'Failed to create thread' }, 500)
  }
})

/**
 * GET /messages/:thread_id
 * Get all messages in a thread
 */
messageRouter.get('/:threadId', async (c) => {
  const userId = c.get('userId')
  const threadId = c.req.param('threadId')

  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const db = c.env.DB_LOGS

    // Verify user has access to this thread
    const thread = await db
      .prepare(
        'SELECT * FROM message_threads_v2 WHERE thread_id = ? AND (client_id = ? OR talent_id = ?)'
      )
      .bind(threadId, userId, userId)
      .first()

    if (!thread) return c.json({ error: 'Thread not found or access denied' }, 404)

    // Fetch messages
    const messages = await db
      .prepare(
        `SELECT * FROM messages_v2 
        WHERE thread_id = ? AND is_deleted = 0
        ORDER BY created_at ASC
        LIMIT 500`
      )
      .bind(threadId)
      .all()

    // Mark as read
    await db
      .prepare(
        `UPDATE messages_v2 
        SET is_read = 1
        WHERE thread_id = ? AND recipient_id = ? AND is_read = 0`
      )
      .bind(threadId, userId)
      .run()

    // Update thread metadata
    await db
      .prepare(
        'UPDATE message_threads_v2 SET last_message_at = datetime("now") WHERE thread_id = ?'
      )
      .bind(threadId)
      .run()

    return c.json({
      success: true,
      data: {
        thread,
        messages: messages.results || [],
      },
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch messages' }, 500)
  }
})

/**
 * POST /messages
 * Send a message
 */
messageRouter.post('/', async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const body = await c.req.json()
    const parsed = MessageSchema.parse(body)

    const messageId = 'MSG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    const db = c.env.DB_LOGS

    // Verify thread exists and user has access
    const thread = await db
      .prepare(
        'SELECT * FROM message_threads_v2 WHERE thread_id = ? AND (client_id = ? OR talent_id = ?)'
      )
      .bind(parsed.thread_id, userId, userId)
      .first()

    if (!thread) return c.json({ error: 'Thread not found' }, 404)

    const senderRole = c.get('userRole') || 'client'

    // Insert message
    await db
      .prepare(
        `INSERT INTO messages_v2 
        (message_id, thread_id, sender_id, sender_role, recipient_id, body, attachment_url, attachment_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
      .bind(
        messageId,
        parsed.thread_id,
        userId,
        senderRole,
        parsed.recipient_id,
        sanitizeMessage(parsed.body),
        parsed.attachment_url || null,
        parsed.attachment_type || null
      )
      .run()

    // Update thread metadata
    await db
      .prepare(
        `UPDATE message_threads_v2 
        SET last_message_at = datetime('now'), message_count = message_count + 1
        WHERE thread_id = ?`
      )
      .bind(parsed.thread_id)
      .run()

    // Create notification for recipient
    const notifId = 'NOTIF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    await db
      .prepare(
        `INSERT INTO notifications_v2
        (notif_id, user_id, notif_type, title, message, related_entity_id, related_entity_type, action_url, priority, created_at)
        VALUES (?, ?, 'message', ?, ?, ?, 'message', ?, 'normal', datetime('now'))`
      )
      .bind(
        notifId,
        parsed.recipient_id,
        'Pesan baru',
        parsed.body.substring(0, 100),
        messageId,
        `/messages/${parsed.thread_id}`,
      )
      .run()

    return c.json({
      success: true,
      data: {
        message_id: messageId,
        thread_id: parsed.thread_id,
      },
    })
  } catch (error) {
    return c.json({ error: 'Failed to send message' }, 500)
  }
})

/**
 * DELETE /messages/:message_id
 * Delete a message (soft delete)
 */
messageRouter.delete('/:messageId', async (c) => {
  const userId = c.get('userId')
  const messageId = c.req.param('messageId')

  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const db = c.env.DB_LOGS

    // Verify user is the sender
    const message = await db
      .prepare('SELECT * FROM messages_v2 WHERE message_id = ?')
      .bind(messageId)
      .first()

    if (!message) return c.json({ error: 'Message not found' }, 404)
    if (message.sender_id !== userId) {
      return c.json({ error: 'Cannot delete other users messages' }, 403)
    }

    // Soft delete
    await db
      .prepare(
        `UPDATE messages_v2 
        SET is_deleted = 1, deleted_by = ?, deleted_at = datetime('now')
        WHERE message_id = ?`
      )
      .bind(userId, messageId)
      .run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete message' }, 500)
  }
})

/**
 * PUT /messages/:message_id
 * Edit a message (within 5 minutes)
 */
messageRouter.put('/:messageId', async (c) => {
  const userId = c.get('userId')
  const messageId = c.req.param('messageId')

  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const body = await c.req.json()
    const { body: newBody } = body

    if (!newBody || newBody.length === 0) {
      return c.json({ error: 'Message body cannot be empty' }, 400)
    }

    const db = c.env.DB_LOGS

    // Verify user is the sender and message is recent
    const message = await db
      .prepare(
        `SELECT * FROM messages_v2 
        WHERE message_id = ? AND sender_id = ?
        AND datetime(created_at) > datetime('now', '-5 minutes')`
      )
      .bind(messageId, userId)
      .first()

    if (!message) {
      return c.json({ error: 'Message not found or too old to edit' }, 404)
    }

    // Update message
    await db
      .prepare(
        `UPDATE messages_v2 
        SET body = ?, updated_at = datetime('now')
        WHERE message_id = ?`
      )
      .bind(sanitizeMessage(newBody), messageId)
      .run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to edit message' }, 500)
  }
})

/**
 * POST /messages/threads/:thread_id/archive
 * Archive a thread
 */
messageRouter.post('/threads/:threadId/archive', async (c) => {
  const userId = c.get('userId')
  const threadId = c.req.param('threadId')

  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const db = c.env.DB_LOGS

    // Verify access
    const thread = await db
      .prepare(
        'SELECT * FROM message_threads_v2 WHERE thread_id = ? AND (client_id = ? OR talent_id = ?)'
      )
      .bind(threadId, userId, userId)
      .first()

    if (!thread) return c.json({ error: 'Thread not found' }, 404)

    // Archive thread
    await db
      .prepare('UPDATE message_threads_v2 SET is_archived = 1 WHERE thread_id = ?')
      .bind(threadId)
      .run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to archive thread' }, 500)
  }
})

export default messageRouter
