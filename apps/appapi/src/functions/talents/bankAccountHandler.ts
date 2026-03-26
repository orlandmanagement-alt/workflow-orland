import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createBankSchema } from './talentSchemas'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.get('/:talent_id/bank-accounts', async (c) => {
  const { results } = await c.env.DB_CORE.prepare('SELECT * FROM talent_bank_accounts WHERE talent_id = ?').bind(c.req.param('talent_id')).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.post('/:talent_id/bank-accounts', zValidator('json', createBankSchema), async (c) => {
  const body = c.req.valid('json')
  const accountId = crypto.randomUUID()
  await c.env.DB_CORE.prepare('INSERT INTO talent_bank_accounts (account_id, talent_id, bank_name, account_number, account_name) VALUES (?, ?, ?, ?, ?)')
    .bind(accountId, c.req.param('talent_id'), body.bank_name, body.account_number, body.account_name).run()
  return c.json({ status: 'ok', id: accountId }, 201)
})

router.delete('/bank-accounts/:bank_id', async (c) => {
  const result = await c.env.DB_CORE.prepare('DELETE FROM talent_bank_accounts WHERE account_id = ?').bind(c.req.param('bank_id')).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found' }, 404)
  return c.json({ status: 'ok', message: 'Dihapus' })
})
export default router
