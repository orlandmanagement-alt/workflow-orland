import { Hono } from 'hono'; import { requireRole } from '../../middleware/authRole'; import { Bindings, Variables } from '../../index';
const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
router.get('/client-dashboard', requireRole(['client']), async (c) => {
  const count = await c.env.DB_LOGS.prepare('SELECT COUNT(*) as total FROM projects WHERE client_id = ?').bind(c.get('userId')).first();
  return c.json({ status: 'ok', data: { total_projects: count?.total || 0 } });
});
router.get('/talent-dashboard', requireRole(['talent']), async (c) => c.json({ status: 'ok', data: { estimated_fee: 0 } }));
router.get('/admin-dashboard', requireRole(['admin']), async (c) => c.json({ status: 'ok', data: { revenue: 0 } }));
export default router;
