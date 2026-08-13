import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { kycDocSchema, livenessSchema, statusSchema } from './kycSchemas'
import { requireRole, requireOwnerOrAdmin } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.post('/talents/:talent_id/documents', requireRole(['talent']), requireOwnerOrAdmin('talent_id'), zValidator('json', kycDocSchema), async (c) => {
  const body = c.req.valid('json')
  const docId = crypto.randomUUID()
  await c.env.DB_CORE.prepare('INSERT INTO kyc_documents (doc_id, talent_id, id_card_url, selfie_url) VALUES (?, ?, ?, ?)')
    .bind(docId, c.req.param('talent_id'), body.id_card_url, body.selfie_url).run()
  return c.json({ status: 'ok', id: docId }, 201)
})

router.post('/talents/:talent_id/liveness', requireRole(['talent']), requireOwnerOrAdmin('talent_id'), zValidator('json', livenessSchema), async (c) => {
  const body = c.req.valid('json')
  const verificationId = crypto.randomUUID()
  
  // SIMULASI: AI Liveness Check (Mendeteksi wajah asli vs foto printed)
  const livenessScore = Math.random() * 0.5 + 0.5 // Random 0.5 - 1.0
  const status = livenessScore > 0.8 ? 'Passed' : 'Manual Review'
  
  await c.env.DB_LOGS.prepare('INSERT INTO kyc_verifications (verification_id, talent_id, liveness_score, status) VALUES (?, ?, ?, ?)')
    .bind(verificationId, c.req.param('talent_id'), livenessScore, status).run()
  return c.json({ status: 'ok', verification_status: status, score: livenessScore }, 201)
})

router.put('/talents/:talent_id/approve', requireRole(['admin', 'superadmin']), zValidator('json', statusSchema), async (c) => {
  const body = c.req.valid('json')
  const talentId = c.req.param('talent_id')
  
  // Update status di profil utama talent & tabel verifikasi (dieksekusi terpisah karena beda DB)
  await c.env.DB_CORE.prepare('UPDATE talents SET kyc_status = ? WHERE talent_id = ?').bind(body.status, talentId).run()
  await c.env.DB_LOGS.prepare('UPDATE kyc_verifications SET status = ? WHERE talent_id = ?').bind(body.status, talentId).run()
  return c.json({ status: 'ok', message: `Talent KYC ${body.status}` })
})

export default router
