import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createInvoiceSchema, uploadProofSchema, invoiceStatusSchema, processPayoutSchema, payoutStatusQuerySchema, splitPaymentSchema } from './financialSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// --- INVOICES ---
router.get('/projects/:project_id/invoices', requireRole(['admin', 'client']), async (c) => {
  const { results } = await c.env.DB_CORE.prepare('SELECT * FROM invoices WHERE project_id = ?').bind(c.req.param('project_id')).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.post('/projects/:project_id/invoices', requireRole(['admin']), zValidator('json', createInvoiceSchema), async (c) => {
  const body = c.req.valid('json')
  const invoiceId = crypto.randomUUID()
  // Asumsi client_id didapatkan dari query project terlebih dahulu. Disimulasikan dengan param di sini.
  const project = await c.env.DB_CORE.prepare('SELECT client_id FROM projects WHERE project_id = ?').bind(c.req.param('project_id')).first<any>()
  if (!project) return c.json({ status: 'error', message: 'Project not found' }, 404)

  await c.env.DB_CORE.prepare('INSERT INTO invoices (invoice_id, project_id, client_id, amount, due_date) VALUES (?, ?, ?, ?, ?)')
    .bind(invoiceId, c.req.param('project_id'), project.client_id, body.amount, body.due_date).run()
  return c.json({ status: 'ok', id: invoiceId }, 201)
})

router.put('/invoices/:invoice_id/upload-proof', requireRole(['client']), zValidator('json', uploadProofSchema), async (c) => {
  const body = c.req.valid('json')
  const result = await c.env.DB_CORE.prepare('UPDATE invoices SET proof_url = ? WHERE invoice_id = ?').bind(body.proof_url, c.req.param('invoice_id')).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', message: 'Proof uploaded' })
})

router.put('/invoices/:invoice_id/verify', requireRole(['admin']), async (c) => {
  const result = await c.env.DB_CORE.prepare("UPDATE invoices SET status = 'Paid' WHERE invoice_id = ?").bind(c.req.param('invoice_id')).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', message: 'Invoice verified as Paid' })
})

// --- PAYOUTS & SPLITS ---
router.get('/payouts', requireRole(['admin']), zValidator('query', payoutStatusQuerySchema), async (c) => {
  const { limit, offset, status } = c.req.valid('query')
  let query = 'SELECT * FROM payouts WHERE 1=1'
  let params: any[] = []
  if (status) { query += ' AND status = ?'; params.push(status) }
  query += ' LIMIT ? OFFSET ?'; params.push(Math.min(parseInt(limit), 100), parseInt(offset))
  const { results } = await c.env.DB_CORE.prepare(query).bind(...params).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.post('/payouts', requireRole(['admin']), zValidator('json', processPayoutSchema), async (c) => {
  const body = c.req.valid('json')
  const payoutId = crypto.randomUUID()
  await c.env.DB_CORE.prepare("INSERT INTO payouts (payout_id, talent_id, booking_id, amount, status) VALUES (?, ?, ?, ?, 'Processed')")
    .bind(payoutId, body.talent_id, body.booking_id, body.amount).run()
  return c.json({ status: 'ok', id: payoutId }, 201)
})

router.get('/my-payouts', requireRole(['talent']), async (c) => {
  // Hanya talent pemilik akun yang bisa melihat mutasinya sendiri
  const { results } = await c.env.DB_CORE.prepare('SELECT * FROM payouts WHERE talent_id = ?').bind(c.get('userId')).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.post('/tools/finance/split-payments', requireRole(['admin']), zValidator('json', splitPaymentSchema), async (c) => {
  const body = c.req.valid('json')
  const splitId = crypto.randomUUID()
  
  // Asumsi validasi agency_amount + talent_amount <= total invoice diatur di level service/logic
  await c.env.DB_CORE.prepare('INSERT INTO financial_splits (split_id, invoice_id, agency_amount, talent_amount) VALUES (?, ?, ?, ?)')
    .bind(splitId, body.invoice_id, body.agency_amount, body.talent_amount).run()
  return c.json({ status: 'ok', id: splitId }, 201)
})

export default router
