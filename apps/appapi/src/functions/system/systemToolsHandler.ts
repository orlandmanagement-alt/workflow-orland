import { Hono } from 'hono'; import { requireRole } from '../../middleware/authRole'; import { Bindings, Variables } from '../../index';
const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
router.post('/maintenance', requireRole(['superadmin']), async (c) => {
  const { is_active } = await c.req.json();
  await c.env.DB_SSO.prepare('INSERT INTO system_settings (setting_key, setting_value) VALUES ("maintenance_mode", ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value').bind(is_active ? '1' : '0').run();
  return c.json({ status: 'ok' }, 201);
});
router.post('/blacklist', requireRole(['superadmin']), async (c) => {
  const b = await c.req.json();
  await c.env.DB_SSO.prepare('INSERT INTO global_blacklists (blacklist_id, identifier_value, identifier_type, reason) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), b.identifier_value, b.identifier_type, b.reason).run();
  return c.json({ status: 'ok' }, 201);
});
router.get('/blacklist/check', requireRole(['admin']), async (c) => c.json({ status: 'ok', blacklisted: false }));
router.delete('/blacklist/:id', requireRole(['superadmin']), async (c) => c.json({ status: 'ok' }));
export default router;
