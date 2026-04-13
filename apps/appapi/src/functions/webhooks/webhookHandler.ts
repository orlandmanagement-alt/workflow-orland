/**
 * Webhook Management & Event Dispatching Handler
 * Purpose: Enable external integrations via webhooks with retry logic and event queue
 */

import { Hono } from 'hono';
import { requireRole } from '../../middleware/authRole';
import { Bindings, Variables } from '../../index';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

interface WebhookConfig {
  webhook_id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'failed';
  created_by_id: string;
  headers?: Record<string, string>;
  auth_token?: string;
  created_at: string;
  last_triggered?: string;
}

interface WebhookEvent {
  event_type: string;
  payload: Record<string, any>;
  timestamp: string;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * GET /api/v1/webhooks
 * List all webhooks for authenticated user
 */
router.get('/', requireRole(['client', 'admin']), async (c) => {
  const userId = c.get('userId');

  try {
    const webhooks = await c.env.DB_LOGS.prepare(`
      SELECT 
        webhook_id,
        name,
        url,
        events,
        status,
        created_by_id,
        created_at,
        last_triggered,
        consecutive_failures
      FROM webhooks
      WHERE created_by_id = ? AND is_deleted = FALSE
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(userId).all<any>();

    return c.json({
      status: 'success',
      webhooks: webhooks.results || [],
      total: webhooks.results?.length || 0,
      data: {
        webhooks: webhooks.results || [],
        total: webhooks.results?.length || 0,
      },
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to fetch webhooks' }, 500);
  }
});

/**
 * POST /api/v1/webhooks
 * Create a new webhook
 *
 * Request:
 * {
 *   "name": "Stripe Events",
 *   "url": "https://example.com/webhooks/stripe",
 *   "events": ["booking.confirmed", "payment.received"],
 *   "auth_token": "secret-token"
 * }
 */
router.post('/', requireRole(['client', 'admin']), async (c) => {
  const userId = c.get('userId');

  try {
    const body = await c.req.json();
    const { name, url, events, auth_token, headers } = body;

    // Validation
    if (!name || !url || !events || !Array.isArray(events)) {
      return c.json(
        { error: 'Missing required fields: name, url, events' },
        400
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return c.json({ error: 'Invalid webhook URL' }, 400);
    }

    const webhook_id = generateUUID();

    await c.env.DB_LOGS.prepare(`
      INSERT INTO webhooks (
        webhook_id,
        name,
        url,
        events,
        status,
        created_by_id,
        auth_token,
        headers,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      webhook_id,
      name,
      url,
      JSON.stringify(events),
      'active',
      userId,
      auth_token || null,
      JSON.stringify(headers || {}),
      new Date().toISOString()
    ).run();

    return c.json(
      {
        status: 'success',
        data: {
          webhook_id,
          name,
          url,
          events,
          status: 'active',
          message: 'Webhook created successfully',
        },
      },
      201
    );
  } catch (error: any) {
    return c.json(
      { error: 'Failed to create webhook', message: error.message },
      500
    );
  }
});

/**
 * GET /api/v1/webhooks/:webhook_id
 * Get specific webhook details
 */
router.get('/:webhook_id', requireRole(['client', 'admin']), async (c) => {
  const webhook_id = c.req.param('webhook_id');
  const userId = c.get('userId');

  try {
    const webhook = await c.env.DB_LOGS.prepare(`
      SELECT * FROM webhooks
      WHERE webhook_id = ? AND created_by_id = ?
    `).bind(webhook_id, userId).first<any>();

    if (!webhook) {
      return c.json({ error: 'Webhook not found' }, 404);
    }

    return c.json({
      status: 'success',
      data: webhook,
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to fetch webhook' }, 500);
  }
});

/**
 * PUT /api/v1/webhooks/:webhook_id
 * Update webhook configuration
 */
router.put('/:webhook_id', requireRole(['client', 'admin']), async (c) => {
  const webhook_id = c.req.param('webhook_id');
  const userId = c.get('userId');

  try {
    // Verify ownership
    const existing = await c.env.DB_LOGS.prepare(`
      SELECT webhook_id FROM webhooks WHERE webhook_id = ? AND created_by_id = ?
    `).bind(webhook_id, userId).first<any>();

    if (!existing) {
      return c.json({ error: 'Webhook not found or access denied' }, 404);
    }

    const body = await c.req.json();
    const { name, url, events, status, auth_token, headers } = body;

    // Build dynamic update query
    const updates: string[] = [];
    const bindings: any[] = [];

    if (name) {
      updates.push('name = ?');
      bindings.push(name);
    }
    if (url) {
      try {
        new URL(url);
      } catch {
        return c.json({ error: 'Invalid webhook URL' }, 400);
      }
      updates.push('url = ?');
      bindings.push(url);
    }
    if (events && Array.isArray(events)) {
      updates.push('events = ?');
      bindings.push(JSON.stringify(events));
    }
    if (status) {
      updates.push('status = ?');
      bindings.push(status);
    }
    if (auth_token !== undefined) {
      updates.push('auth_token = ?');
      bindings.push(auth_token);
    }
    if (headers) {
      updates.push('headers = ?');
      bindings.push(JSON.stringify(headers));
    }

    updates.push('updated_at = ?');
    bindings.push(new Date().toISOString());

    bindings.push(webhook_id);

    if (updates.length > 1) { // At least updated_at
      await c.env.DB_LOGS.prepare(`
        UPDATE webhooks SET ${updates.join(', ')}
        WHERE webhook_id = ?
      `).bind(...bindings).run();
    }

    return c.json({
      status: 'success',
      data: { webhook_id, message: 'Webhook updated successfully' },
    });
  } catch (error: any) {
    return c.json(
      { error: 'Failed to update webhook', message: error.message },
      500
    );
  }
});

/**
 * DELETE /api/v1/webhooks/:webhook_id
 * Delete (soft delete) webhook
 */
router.delete('/:webhook_id', requireRole(['client', 'admin']), async (c) => {
  const webhook_id = c.req.param('webhook_id');
  const userId = c.get('userId');

  try {
    // Verify ownership
    const existing = await c.env.DB_LOGS.prepare(`
      SELECT webhook_id FROM webhooks WHERE webhook_id = ? AND created_by_id = ?
    `).bind(webhook_id, userId).first<any>();

    if (!existing) {
      return c.json({ error: 'Webhook not found or access denied' }, 404);
    }

    await c.env.DB_LOGS.prepare(`
      UPDATE webhooks SET is_deleted = TRUE, deleted_at = ?
      WHERE webhook_id = ?
    `).bind(new Date().toISOString(), webhook_id).run();

    return c.json({
      status: 'success',
      data: { webhook_id, message: 'Webhook deleted successfully' },
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to delete webhook' }, 500);
  }
});

// ============================================================================
// EVENT DISPATCHING
// ============================================================================

/**
 * POST /api/v1/webhooks/events/:event_type
 * Dispatch an event to all registered webhooks
 * (Called internally by other handlers)
 *
 * Request:
 * {
 *   "payload": { ... event data ... },
 *   "user_id": "sender-uuid" (optional, for filtering webhooks)
 * }
 */
router.post('/events/:event_type', async (c) => {
  const event_type = c.req.param('event_type');

  try {
    const { payload, user_id } = await c.req.json() as WebhookEvent & { user_id?: string };

    // Find all active webhooks listening to this event
    const webhooks = await c.env.DB_LOGS.prepare(`
      SELECT *
      FROM webhooks
      WHERE is_deleted = FALSE
      AND status = 'active'
      AND JSON_CONTAINS(events, JSON_QUOTE(?))
      ${user_id ? 'AND created_by_id = ?' : ''}
    `).bind(
      event_type,
      ...(user_id ? [user_id] : [])
    ).all<any>();

    const results = [];

    for (const webhook of webhooks.results || []) {
      try {
        // Queue the event for processing
        const queue_id = generateUUID();
        const event_data = {
          event_type,
          payload,
          timestamp: new Date().toISOString(),
        };

        await c.env.DB_LOGS.prepare(`
          INSERT INTO webhook_queue (
            queue_id,
            webhook_id,
            event_type,
            payload,
            status,
            retry_count,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          queue_id,
          webhook.webhook_id,
          event_type,
          JSON.stringify(event_data),
          'pending',
          0,
          new Date().toISOString()
        ).run();

        results.push({
          webhook_id: webhook.webhook_id,
          status: 'queued',
          queue_id,
        });
      } catch (err: any) {
        console.error(`Failed to queue event for webhook ${webhook.webhook_id}:`, err);
      }
    }

    // Trigger async processing
    // (In production, this would call a background worker or Queue)
    for (const webhook of webhooks.results || []) {
      await dispatchWebhookEvent(c, webhook, {
        event_type,
        payload,
        timestamp: new Date().toISOString(),
      });
    }

    return c.json({
      status: 'success',
      data: {
        event_type,
        webhooks_notified: results.length,
        results,
      },
    });
  } catch (error: any) {
    console.error('Webhook event dispatch error:', error);
    return c.json(
      { error: 'Failed to dispatch webhook events', message: error.message },
      500
    );
  }
});

/**
 * POST /api/v1/webhooks/trigger
 * Manual webhook trigger (admin only)
 */
router.post('/trigger', requireRole(['admin']), async (c) => {
  try {
    const { webhook_id, event_type, payload } = await c.req.json();

    if (!webhook_id || !event_type || !payload) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const webhook = await c.env.DB_LOGS.prepare(`
      SELECT * FROM webhooks WHERE webhook_id = ?
    `).bind(webhook_id).first<any>();

    if (!webhook) {
      return c.json({ error: 'Webhook not found' }, 404);
    }

    const result = await dispatchWebhookEvent(c, webhook, {
      event_type,
      payload,
      timestamp: new Date().toISOString(),
    });

    return c.json({
      status: 'success',
      data: result,
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to trigger webhook' }, 500);
  }
});

/**
 * POST /api/v1/webhooks/:webhook_id/test
 * Send a synthetic event to a specific webhook
 */
router.post('/:webhook_id/test', requireRole(['client', 'admin']), async (c) => {
  const webhook_id = c.req.param('webhook_id');
  const userId = c.get('userId');

  try {
    const webhook = await c.env.DB_LOGS.prepare(`
      SELECT * FROM webhooks
      WHERE webhook_id = ? AND created_by_id = ? AND is_deleted = FALSE
    `).bind(webhook_id, userId).first<any>();

    if (!webhook) {
      return c.json({ error: 'Webhook not found or access denied' }, 404);
    }

    const testPayload = {
      test: true,
      source: 'orland-webhook-tester',
      webhook_id,
      timestamp: new Date().toISOString(),
    };

    const result = await dispatchWebhookEvent(c, webhook, {
      event_type: 'webhook.test',
      payload: testPayload,
      timestamp: new Date().toISOString(),
    });

    return c.json({ status: 'success', data: result });
  } catch (error: any) {
    return c.json({ error: 'Failed to test webhook' }, 500);
  }
});

/**
 * GET /api/v1/webhooks/:webhook_id/logs
 * View webhook call logs
 */
router.get('/:webhook_id/logs', requireRole(['client', 'admin']), async (c) => {
  const webhook_id = c.req.param('webhook_id');
  const userId = c.get('userId');

  try {
    // Verify ownership
    const webhook = await c.env.DB_LOGS.prepare(`
      SELECT webhook_id FROM webhooks WHERE webhook_id = ? AND created_by_id = ?
    `).bind(webhook_id, userId).first<any>();

    if (!webhook) {
      return c.json({ error: 'Webhook not found or access denied' }, 404);
    }

    const logs = await c.env.DB_LOGS.prepare(`
      SELECT
        log_id,
        event_type,
        response_status,
        duration_ms,
        retry_attempt,
        executed_at
      FROM webhook_logs
      WHERE webhook_id = ?
      ORDER BY executed_at DESC
      LIMIT 50
    `).bind(webhook_id).all<any>();

    return c.json({
      status: 'success',
      data: {
        webhook_id,
        logs: logs.results || [],
        total_logs: logs.results?.length || 0,
      },
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to fetch webhook logs' }, 500);
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Dispatch webhook event with retry logic
 */
async function dispatchWebhookEvent(
  c: any,
  webhook: any,
  event: WebhookEvent & { event_type: string }
): Promise<any> {
  const log_id = generateUUID();
  const startTime = Date.now();
  const maxRetries = 3;
  const retryDelays = [5000, 30000, 300000]; // 5s, 30s, 5min

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      // Build request headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'User-Agent': 'Orland-Webhooks/1.0',
        'X-Webhook-Event': event.event_type,
        'X-Webhook-Delivery': log_id,
        'X-Webhook-Timestamp': event.timestamp,
      };

      // Add custom auth header if configured
      if (webhook.auth_token) {
        headers['Authorization'] = `Bearer ${webhook.auth_token}`;
      }

      // Merge custom headers
      if (webhook.headers) {
        const customHeaders = JSON.parse(webhook.headers || '{}');
        Object.assign(headers, customHeaders);
      }

      const abortController = new AbortController();
      timeoutId = setTimeout(() => abortController.abort(), 30000);

      // Send webhook call
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event_type: event.event_type,
          data: event.payload,
          timestamp: event.timestamp,
        }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);
      timeoutId = undefined;

      const duration = Date.now() - startTime;
      const responseBody = await response.text();

      // Log the webhook call
      await c.env.DB_LOGS.prepare(`
        INSERT INTO webhook_logs (
          log_id,
          webhook_id,
          event_type,
          payload,
          response_status,
          response_body,
          duration_ms,
          retry_attempt,
          executed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        log_id,
        webhook.webhook_id,
        event.event_type,
        JSON.stringify(event.payload),
        response.status,
        responseBody.slice(0, 1000), // Truncate long responses
        duration,
        attempt,
        new Date().toISOString()
      ).run();

      // Success (2xx status)
      if (response.status >= 200 && response.status < 300) {
        // Mark queue as completed if exists
        await c.env.DB_LOGS.prepare(`
          UPDATE webhook_queue SET status = 'completed'
          WHERE webhook_id = ? AND event_type = ? AND created_at > datetime('now', '-1 minute')
          LIMIT 1
        `).bind(webhook.webhook_id, event.event_type).run();

        // Reset failure counter
        await c.env.DB_LOGS.prepare(`
          UPDATE webhooks
          SET consecutive_failures = 0, last_triggered = ?
          WHERE webhook_id = ?
        `).bind(new Date().toISOString(), webhook.webhook_id).run();

        return {
          webhook_id: webhook.webhook_id,
          log_id,
          status: 'success',
          response_status: response.status,
          duration_ms: duration,
        };
      } else {
        // Non-success status, retry
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const duration = Date.now() - startTime;

      if (attempt < maxRetries) {
        // Schedule retry
        console.log(`Webhook ${webhook.webhook_id} failed (attempt ${attempt + 1}), retrying...`);
        
        // In production, use a proper queue/scheduled task
        // For now, just log for demonstration
        await c.env.DB_LOGS.prepare(`
          UPDATE webhook_queue
          SET retry_count = ?, next_retry_at = ?
          WHERE webhook_id = ? AND event_type = ? AND created_at > datetime('now', '-1 minute')
          LIMIT 1
        `).bind(
          attempt + 1,
          new Date(Date.now() + retryDelays[attempt]).toISOString(),
          webhook.webhook_id,
          event.event_type
        ).run();

        // Wait before next attempt (in production, schedule async)
        await new Promise((resolve) => setTimeout(resolve, Math.min(1000, retryDelays[attempt])));
      } else {
        // Final failure
        console.error(`Webhook ${webhook.webhook_id} permanently failed:`, err.message);

        // Increment failure counter and potentially disable
        const failures = (webhook.consecutive_failures || 0) + 1;
        if (failures >= (webhook.max_consecutive_failures || 5)) {
          await c.env.DB_LOGS.prepare(`
            UPDATE webhooks SET status = 'failed', consecutive_failures = ?
            WHERE webhook_id = ?
          `).bind(failures, webhook.webhook_id).run();
        } else {
          await c.env.DB_LOGS.prepare(`
            UPDATE webhooks SET consecutive_failures = ?
            WHERE webhook_id = ?
          `).bind(failures, webhook.webhook_id).run();
        }

        return {
          webhook_id: webhook.webhook_id,
          status: 'failed',
          error: err.message,
          attempts: attempt + 1,
        };
      }
    }
  }

  return null;
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

export default router;
