import { Hono } from 'hono'; import { requireRole } from '../../middleware/authRole'; import { Bindings, Variables } from '../../index';
const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
// Escrows
router.get('/projects/:project_id/escrow-status', requireRole(['admin', 'client']), async (c) => c.json({ status: 'ok', data: { status: 'Secured' } }));
router.put('/projects/:project_id/escrow-release', requireRole(['admin']), async (c) => c.json({ status: 'ok' }));
// Academy
router.get('/academy/courses', async (c) => c.json({ status: 'ok', data: [] }));
router.post('/academy/enrollments', requireRole(['talent']), async (c) => c.json({ status: 'ok' }, 201));
// Inventory
router.get('/inventory/wardrobes', requireRole(['admin']), async (c) => c.json({ status: 'ok', data: [] }));
// Infrastructure
router.get('/infrastructure/catalogs', requireRole(['admin', 'client']), async (c) => c.json({ status: 'ok', data: [] }));
// Legal
router.post('/legal/nda/generate', requireRole(['admin']), async (c) => c.json({ status: 'ok' }, 201));
export default router;
