import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createInvoiceSchema, uploadProofSchema } from './financialSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
import { sendNotification } from '../../utils/notifier';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET: Invoices per Project
router.get('/projects/:project_id/invoices', requireRole(['admin', 'client']), async (c) => {
  const { results } = await c.env.DB_CORE.prepare('SELECT * FROM invoices WHERE project_id = ?').bind(c.req.param('project_id')).all()
  return c.json({ status: 'ok', data: results || [] })
})

// PUT: Mendukung Secure Payment Uploader (UI appclient)
router.put('/invoices/:invoice_id/upload-proof', requireRole(['client']), zValidator('json', uploadProofSchema), async (c) => {
  const body = c.req.valid('json')
  const invId = c.req.param('invoice_id')
  
  // Update Proof URL dan ubah status ke 'Escrow Held' secara otomatis
  const result = await c.env.DB_CORE.prepare(
    "UPDATE invoices SET proof_url = ?, status = 'Escrow Held' WHERE invoice_id = ?"
  ).bind(body.proof_url, invId).run()
  
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Invoice not found' }, 404)
  return c.json({ status: 'ok', message: 'Proof uploaded and status set to Escrow' })
})

export default router
