import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { clientQuerySchema, updateClientSchema } from './clientSchemas'
import { requireRole, requireOwnerOrAdmin } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ==============================================================
// HELPER FUNCTION: Ambil profil Klien, jika belum ada otomatis buat
// ==============================================================
async function getOrCreateClient(c: any, userId: string) {
  let client = await c.env.DB_CORE.prepare(
    'SELECT client_id, company_name FROM clients WHERE user_id = ? AND is_agency = 0'
  ).bind(userId).first();
  
  if (!client) {
    // Ambil nama dari SSO jika baru pertama kali login
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

// ==============================================================
// RUTE KHUSUS CLIENT DASHBOARD (Harus diletakkan di atas /:client_id)
// ==============================================================

/**
 * [GET] /api/v1/clients/me
 * Ambil profil klien yang sedang login
 */
router.get('/me', requireRole(['client', 'admin']), async (c) => {
  try {
    const client = await getOrCreateClient(c, c.get('userId'));
    return c.json({ status: 'ok', data: client });
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500);
  }
});

/**
 * [GET] /api/v1/clients/shortlists
 * Ambil daftar talent favorit (Shortlist) milik klien ini
 */
router.get('/shortlists', requireRole(['client', 'admin']), async (c) => {
  try {
    const client = await getOrCreateClient(c, c.get('userId'));
    
    const shortlists = await c.env.DB_CORE.prepare(`
      SELECT cs.id as shortlist_id, cs.created_at, t.id as talent_id, t.fullname, p.headshot_url, p.gender, p.domicile
      FROM client_shortlists cs
      JOIN talents t ON cs.talent_id = t.id
      LEFT JOIN talent_profiles p ON t.id = p.talent_id
      WHERE cs.client_id = ?
      ORDER BY cs.created_at DESC
    `).bind(client.client_id).all();

    return c.json({ status: 'ok', data: shortlists.results });
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500);
  }
});

/**
 * [POST] /api/v1/clients/shortlists
 * Tambahkan talent ke Shortlist
 */
router.post('/shortlists', requireRole(['client', 'admin']), zValidator('json', z.object({ talent_id: z.string() })), async (c) => {
  try {
    const client = await getOrCreateClient(c, c.get('userId'));
    const { talent_id } = c.req.valid('json');

    await c.env.DB_CORE.prepare(`
      INSERT INTO client_shortlists (id, client_id, talent_id) VALUES (?, ?, ?)
      ON CONFLICT(client_id, talent_id) DO NOTHING
    `).bind(crypto.randomUUID(), client.client_id, talent_id).run();

    return c.json({ status: 'ok', message: 'Talent ditambahkan ke Shortlist' });
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500);
  }
});

/**
 * [DELETE] /api/v1/clients/shortlists/:talent_id
 * Hapus talent dari Shortlist
 */
router.delete('/shortlists/:talent_id', requireRole(['client', 'admin']), async (c) => {
  try {
    const client = await getOrCreateClient(c, c.get('userId'));
    const talent_id = c.req.param('talent_id');

    await c.env.DB_CORE.prepare(`
      DELETE FROM client_shortlists WHERE client_id = ? AND talent_id = ?
    `).bind(client.client_id, talent_id).run();

    return c.json({ status: 'ok', message: 'Talent dihapus dari Shortlist' });
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500);
  }
});

// ==============================================================
// RUTE CRUD ADMIN (Kode Lama Anda Dipertahankan di Sini)
// ==============================================================

router.get('/', requireRole(['admin']), zValidator('query', clientQuerySchema), async (c) => {
  const { limit, offset, type } = c.req.valid('query')
  let query = 'SELECT * FROM clients WHERE is_active = 1'
  let params: any[] = []
  if (type) { query += ' AND client_type = ?'; params.push(type) }
  query += ' LIMIT ? OFFSET ?'; params.push(Math.min(parseInt(limit), 100), parseInt(offset))
  const { results } = await c.env.DB_CORE.prepare(query).bind(...params).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.get('/:client_id', requireRole(['admin', 'client']), requireOwnerOrAdmin('client_id'), async (c) => {
  const client = await c.env.DB_CORE.prepare('SELECT * FROM clients WHERE client_id = ?').bind(c.req.param('client_id')).first()
  if (!client) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', data: client })
})

router.put('/:client_id', requireRole(['admin', 'client']), requireOwnerOrAdmin('client_id'), zValidator('json', updateClientSchema), async (c) => {
  const body = c.req.valid('json')
  const id = c.req.param('client_id')
  const result = await c.env.DB_CORE.prepare('UPDATE clients SET company_name = ?, client_type = ? WHERE client_id = ?').bind(body.company_name, body.client_type, id).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', data: { client_id: id, ...body } })
})

export default router