import { Hono } from 'hono'; import { requireRole } from '../../middleware/authRole'; import { Bindings, Variables } from '../../index';
const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
router.post('/subscribe', requireRole(['client']), async (c) => {
  const body = await c.req.json();
  await c.env.DB_CORE.prepare('INSERT INTO client_webhooks (webhook_id, client_id, endpoint_url, event_type) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), c.get('userId'), body.endpoint_url, body.event_type).run();
  return c.json({ status: 'ok' }, 201);
});
router.post('/trigger', requireRole(['superadmin', 'admin']), async (c) => c.json({ status: 'ok', message: 'Webhook triggered' }, 201));
export default router;
