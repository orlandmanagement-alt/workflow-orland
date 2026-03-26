import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createCertSchema } from './talentSchemas'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.post('/:talent_id/certifications', zValidator('json', createCertSchema), async (c) => {
  const body = c.req.valid('json')
  const certId = crypto.randomUUID()
  await c.env.DB_CORE.prepare('INSERT INTO talent_certifications (cert_id, talent_id, cert_name, issued_by, year) VALUES (?, ?, ?, ?, ?)')
    .bind(certId, c.req.param('talent_id'), body.cert_name, body.issued_by, body.year).run()
  return c.json({ status: 'ok', id: certId }, 201)
})

router.delete('/certifications/:cert_id', async (c) => {
  const result = await c.env.DB_CORE.prepare('DELETE FROM talent_certifications WHERE cert_id = ?').bind(c.req.param('cert_id')).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', message: 'Dihapus' })
})

router.get('/certifications/:cert_id/qr', async (c) => {
  // Simulasi Endpoint QR
  const cert = await c.env.DB_CORE.prepare('SELECT * FROM talent_certifications WHERE cert_id = ?').bind(c.req.param('cert_id')).first()
  if (!cert) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', qr_url: `https://api.orlandmanagement.com/api/v1/verify/certificate/${cert.cert_id}` })
})
export default router
