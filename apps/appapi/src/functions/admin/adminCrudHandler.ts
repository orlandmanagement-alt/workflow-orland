import { Hono } from 'hono'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

// Inisiasi Router khusus Admin
const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Middleware: Pastikan hanya role admin / super_admin yang bisa mengakses seluruh rute di bawah ini
router.use('*', requireRole(['admin', 'super_admin']))

/**
 * ==========================================
 * MODUL 1: MASTER USERS (CRUD)
 * ==========================================
 */

// GET /api/v1/admin/users - Tarik semua data user dengan fitur pencarian
router.get('/users', async (c) => {
  try {
    const search = c.req.query('search') || '';
    let query = `SELECT id, email, role, status, created_at FROM users`;
    let params: any[] = [];
    
    if (search) {
      query += ` WHERE email LIKE ? OR role LIKE ?`;
      params = [`%${search}%`, `%${search}%`];
    }
    
    query += ` ORDER BY created_at DESC LIMIT 100`;
    
    const { results } = await c.env.DB_SSO.prepare(query).bind(...params).all();
    return c.json({ status: 'success', data: results });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ status: 'error', message: 'Gagal memuat data pengguna' }, 500);
  }
})

// PATCH /api/v1/admin/users/:id/status - Ubah status (Banned/Suspend/Active)
router.patch('/users/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const newStatus = body.status; 

    if (!['active', 'suspended', 'deleted', 'banned'].includes(newStatus)) {
      return c.json({ status: 'error', message: 'Status tidak valid' }, 400);
    }

    await c.env.DB_SSO.prepare(`UPDATE users SET status = ? WHERE id = ?`).bind(newStatus, id).run();
    return c.json({ status: 'success', message: `Status pengguna berhasil diubah menjadi ${newStatus}` });
  } catch (error) {
    console.error("Error updating user status:", error);
    return c.json({ status: 'error', message: 'Gagal mengubah status' }, 500);
  }
})

/**
 * ==========================================
 * MODUL 2: VERIFIKASI TALENT (KYC)
 * ==========================================
 */

// GET /api/v1/admin/talents/pending - List talent yang butuh verifikasi
router.get('/talents/pending', async (c) => {
  try {
    const { results } = await c.env.DB_CORE.prepare(`SELECT id, full_name, kyc_status, created_at FROM talents WHERE kyc_status = 'pending'`).all();
    return c.json({ status: 'success', data: results });
  } catch (error) {
    return c.json({ status: 'error', message: 'Gagal memuat data talent' }, 500);
  }
})

// POST /api/v1/admin/talents/:id/verify - Approve talent KYC
router.post('/talents/:id/verify', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB_CORE.prepare(`UPDATE talents SET kyc_status = 'verified', is_public = 1 WHERE id = ?`).bind(id).run();
    return c.json({ status: 'success', message: 'Talent berhasil diverifikasi dan dipublikasikan' });
  } catch (error) {
    return c.json({ status: 'error', message: 'Gagal memverifikasi talent' }, 500);
  }
})

/**
 * ==========================================
 * MODUL 3: MODERASI PROYEK (God-Mode)
 * ==========================================
 */

// GET /api/v1/admin/projects - Lihat semua proyek yang berjalan
router.get('/projects', async (c) => {
  try {
    const { results } = await c.env.DB_CORE.prepare(`SELECT id, title, client_id, status, created_at FROM projects ORDER BY created_at DESC`).all();
    return c.json({ status: 'success', data: results });
  } catch (error) {
    return c.json({ status: 'error', message: 'Gagal memuat data proyek' }, 500);
  }
})

// DELETE /api/v1/admin/projects/:id - Hapus proyek fiktif / bermasalah
router.delete('/projects/:id', async (c) => {
  try {
    const id = c.req.param('id');
    // Soft delete / flag as violation
    await c.env.DB_CORE.prepare(`UPDATE projects SET status = 'deleted', moderation_flag = 1 WHERE id = ?`).bind(id).run();
    return c.json({ status: 'success', message: 'Proyek berhasil diturunkan (take-down) oleh sistem' });
  } catch (error) {
    return c.json({ status: 'error', message: 'Gagal menghapus proyek' }, 500);
  }
})

export default router