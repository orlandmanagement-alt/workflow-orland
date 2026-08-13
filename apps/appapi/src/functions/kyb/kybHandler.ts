import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { kybDocSchema } from './kybSchemas'
import { statusSchema } from '../kyc/kycSchemas'
import { requireRole, requireOwnerOrAdmin } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.post('/clients/:client_id/documents', requireRole(['client']), requireOwnerOrAdmin('client_id'), zValidator('json', kybDocSchema), async (c) => {
  const body = c.req.valid('json')
  const docId = crypto.randomUUID()
  await c.env.DB_CORE.prepare('INSERT INTO kyb_documents (doc_id, entity_id, entity_type, doc_url) VALUES (?, ?, ?, ?)')
    .bind(docId, c.req.param('client_id'), 'Client', body.doc_url).run()
  return c.json({ status: 'ok', id: docId }, 201)
})

router.put('/clients/:client_id/approve', requireRole(['admin', 'superadmin']), zValidator('json', statusSchema), async (c) => {
  const body = c.req.valid('json')
  const clientId = c.req.param('client_id')
  
  // Kita update master klien jika ada tabel khusus kyb_status di sana, atau simpan ke kyb_verifications
  await c.env.DB_CORE.prepare('INSERT INTO kyb_verifications (verification_id, entity_id, entity_type, status) VALUES (?, ?, ?, ?) ON CONFLICT(verification_id) DO UPDATE SET status = excluded.status')
    .bind(crypto.randomUUID(), clientId, 'Client', body.status).run()
  return c.json({ status: 'ok', message: `Client KYB ${body.status}` })
})

router.get('/vendors/verified', requireRole(['admin', 'client']), async (c) => {
  const { results } = await c.env.DB_CORE.prepare("SELECT * FROM vendors WHERE kyb_status = 'Approved'").all()
  return c.json({ status: 'ok', data: results || [] })
})

export default router
