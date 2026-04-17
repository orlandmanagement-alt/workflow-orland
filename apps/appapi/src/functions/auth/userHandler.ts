import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const updateSsoSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional()
})

/**
 * [PUT] /api/v1/auth/update-sso
 * Mengubah data inti di DB_SSO
 */
router.put('/update-sso', requireRole(['talent', 'client', 'admin']), zValidator('json', updateSsoSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  try {
    // 1. Update data di DB_SSO
    await c.env.DB_SSO.prepare(`
      UPDATE users SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.first_name || null, 
      body.last_name || null, 
      body.email || null, 
      body.phone || null, 
      userId
    ).run()

    // 2. Invalidate Cache Profil (PENTING agar nama langsung berubah)
    // Hapus cache untuk profil privat dan publik
    c.executionCtx.waitUntil(Promise.all([
      c.env.ORLAND_CACHE.delete(`talent:profile:${userId}`),
      c.env.ORLAND_CACHE.delete('PUBLIC_TALENT_ROSTER')
    ]))

    return c.json({ status: 'ok', message: 'Data SSO berhasil diperbarui' })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

export default router