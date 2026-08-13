import { Hono } from 'hono'; import { requireRole } from '../../middleware/authRole'; import { Bindings, Variables } from '../../index';
const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const CLIENT_TOOL_MAP: Record<string, Array<{ key: string; label: string; endpoint: string }>> = {
	PH: [
		{ key: 'escrow', label: 'Escrow Tracker', endpoint: '/api/v1/tools/projects/:project_id/escrow-status' },
		{ key: 'infrastructure', label: 'Infrastructure Catalog', endpoint: '/api/v1/tools/infrastructure/catalogs' },
	],
	EO: [
		{ key: 'rundown', label: 'Event Rundown', endpoint: '/api/v1/tools/events/events/:project_id/rundowns' },
		{ key: 'song_list', label: 'Song List', endpoint: '/api/v1/tools/events/events/:project_id/song-lists' },
	],
	KOL: [
		{ key: 'brief', label: 'Campaign Brief', endpoint: '/api/v1/tools/kol/campaigns/:project_id/briefs' },
		{ key: 'tracking_link', label: 'Tracking Links', endpoint: '/api/v1/tools/kol/campaigns/:project_id/tracking-links' },
	],
	BRAND: [
		{ key: 'brief', label: 'Campaign Brief', endpoint: '/api/v1/tools/kol/campaigns/:project_id/briefs' },
		{ key: 'escrow', label: 'Escrow Tracker', endpoint: '/api/v1/tools/projects/:project_id/escrow-status' },
	],
}

router.get('/client/categories', requireRole(['admin', 'client']), async (c) => {
	const categories = Object.keys(CLIENT_TOOL_MAP).map((key) => ({ key, tools_count: CLIENT_TOOL_MAP[key].length }))
	return c.json({ status: 'ok', data: categories })
})

router.get('/client/categories/:category/tools', requireRole(['admin', 'client']), async (c) => {
	const category = (c.req.param('category') || '').toUpperCase()
	return c.json({ status: 'ok', data: CLIENT_TOOL_MAP[category] || [] })
})

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
