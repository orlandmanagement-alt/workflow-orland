import { Hono } from 'hono'; import { requireRole } from '../../middleware/authRole'; import { Bindings, Variables } from '../../index';
const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
router.post('/whatsapp/blast', requireRole(['admin']), async (c) => c.json({ status: 'ok', message: 'WA Sent' }, 201));
router.post('/email/newsletters', requireRole(['admin']), async (c) => c.json({ status: 'ok', message: 'Email Sent' }, 201));
export default router;
