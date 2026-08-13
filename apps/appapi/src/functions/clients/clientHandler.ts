import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { clientQuerySchema, updateClientSchema } from './clientSchemas'
import { requireRole, requireOwnerOrAdmin } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

async function getOrCreateClient(c: any, userId: string) {
  let client = await c.env.DB_CORE.prepare(
    'SELECT client_id, company_name FROM clients WHERE user_id = ? AND is_agency = 0'
  ).bind(userId).first();
  
  if (!client) {
    const ssoUser = await c.env.DB_SSO.prepare('SELECT first_name, last_name FROM users WHERE id = ?').bind(userId).first();
    const companyName = ssoUser ? `${ssoUser.first_name} ${ssoUser.last_name || ''}`.trim() : 'New Client';
    const clientId = crypto.randomUUID();
    
    await c.env.DB_CORE.prepare(
      'INSERT INTO clients (client_id, user_id, company_name, is_agency, is_active) VALUES (?, ?, ?, 0, 1)'
    ).bind(clientId, userId, companyName).run();
    
    return { client_id: clientId, company_name: companyName };
  }
  return client;
}

/**
 * [GET] /api/v1/clients/me
 */
router.get('/me', requireRole(['client', 'admin']), async (c) => {
  try {
    const client = await getOrCreateClient(c, c.get('userId'));
    return c.json({ status: 'ok', data: client });
  } catch (err: any) { return c.json({ status: 'error', message: err.message }, 500); }
});

/**
 * [GET] /api/v1/clients/shortlists (Menggunakan KV CACHE)
 */
router.get('/shortlists', requireRole(['client', 'admin']), async (c) => {
  try {
    const client = await getOrCreateClient(c, c.get('userId'));
    const cacheKey = `client:shortlists:${client.client_id}`;

    // READ dari KV
    const cached = await c.env.ORLAND_CACHE.get(cacheKey);
    if (cached) return c.json({ status: 'ok', data: JSON.parse(cached), source: 'cache' });

    // READ dari D1 jika KV kosong
    const shortlists = await c.env.DB_CORE.prepare(`
      SELECT cs.id as shortlist_id, cs.created_at, t.id as talent_id, t.fullname, p.headshot_url, p.gender, p.domicile
      FROM client_shortlists cs
      JOIN talents t ON cs.talent_id = t.id
      LEFT JOIN talent_profiles p ON t.id = p.talent_id
      WHERE cs.client_id = ?
      ORDER BY cs.created_at DESC
    `).bind(client.client_id).all();

    // SIMPAN ke KV
    c.executionCtx.waitUntil(c.env.ORLAND_CACHE.put(cacheKey, JSON.stringify(shortlists.results), { expirationTtl: 3600 }));
    return c.json({ status: 'ok', data: shortlists.results, source: 'database' });
  } catch (err: any) { return c.json({ status: 'error', message: err.message }, 500); }
});

/**
 * [POST] /api/v1/clients/shortlists (WRITE D1, INVALIDATE KV)
 */
router.post('/shortlists', requireRole(['client', 'admin']), zValidator('json', z.object({ talent_id: z.string() })), async (c) => {
  try {
    const client = await getOrCreateClient(c, c.get('userId'));
    const { talent_id } = c.req.valid('json');

    await c.env.DB_CORE.prepare(`
      INSERT INTO client_shortlists (id, client_id, talent_id) VALUES (?, ?, ?)
      ON CONFLICT(client_id, talent_id) DO NOTHING
    `).bind(crypto.randomUUID(), client.client_id, talent_id).run();

    c.executionCtx.waitUntil(c.env.ORLAND_CACHE.delete(`client:shortlists:${client.client_id}`));
    return c.json({ status: 'ok', message: 'Talent ditambahkan ke Shortlist' });
  } catch (err: any) { return c.json({ status: 'error', message: err.message }, 500); }
});

/**
 * [DELETE] /api/v1/clients/shortlists/:talent_id (WRITE D1, INVALIDATE KV)
 */
router.delete('/shortlists/:talent_id', requireRole(['client', 'admin']), async (c) => {
  try {
    const client = await getOrCreateClient(c, c.get('userId'));
    const talent_id = c.req.param('talent_id');

    await c.env.DB_CORE.prepare(`DELETE FROM client_shortlists WHERE client_id = ? AND talent_id = ?`).bind(client.client_id, talent_id).run();

    c.executionCtx.waitUntil(c.env.ORLAND_CACHE.delete(`client:shortlists:${client.client_id}`));
    return c.json({ status: 'ok', message: 'Talent dihapus dari Shortlist' });
  } catch (err: any) { return c.json({ status: 'error', message: err.message }, 500); }
});

export default router