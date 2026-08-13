import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { roleSchema, suspendSchema } from './systemSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Ingat: System Permissions menggunakan DB_SSO
router.get('/permissions', requireRole(['superadmin']), async (c) => {
  const { results } = await c.env.DB_SSO.prepare('SELECT * FROM system_permissions').all()
  return c.json({ status: 'ok', data: results || [] })
})

router.post('/roles', requireRole(['superadmin']), zValidator('json', roleSchema), async (c) => {
  const body = c.req.valid('json')
  const roleId = crypto.randomUUID()
  
  try {
    await c.env.DB_SSO.prepare('INSERT INTO roles (role_id, role_name, permissions) VALUES (?, ?, ?)')
      .bind(roleId, body.role_name, JSON.stringify(body.permissions)).run()
    return c.json({ status: 'ok', id: roleId }, 201)
  } catch (e) {
    return c.json({ status: 'error', message: 'Gagal membuat role, nama mungkin duplikat' }, 400)
  }
})

// Mensuspend user langsung dari database Single Sign-On (SSO)
router.put('/users/:user_id/suspend', requireRole(['superadmin']), zValidator('json', suspendSchema), async (c) => {
  const targetUserId = c.req.param('user_id')
  
  // 1. Pastikan yang disuspend bukan superadmin
  const targetUser = await c.env.DB_SSO.prepare('SELECT role FROM users WHERE id = ?').bind(targetUserId).first<any>()
  if (!targetUser) return c.json({ status: 'error', message: 'User tidak ditemukan' }, 404)
  if (targetUser.role === 'superadmin') return c.json({ status: 'error', message: 'Superadmin tidak dapat disuspend' }, 403)
  
  // 2. Soft delete / suspend di DB_SSO (Sehingga user tidak bisa login lagi)
  await c.env.DB_SSO.prepare('UPDATE users SET is_active = 0, status = "suspended" WHERE id = ?').bind(targetUserId).run()
  
  // 3. Hapus semua sesi aktifnya secara paksa (Logout paksa)
  await c.env.DB_SSO.prepare('DELETE FROM sessions WHERE user_id = ?').bind(targetUserId).run()
  
  return c.json({ status: 'ok', message: `User berhasil disuspend. Alasan: ${c.req.valid('json').reason}` })
})

export default router
