import { Hono } from 'hono'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const adminRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()
// Inisiasi Router khusus Admin
const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GLOBAL ADMIN MIDDLEWARE
adminRouter.use('*', async (c, next) => {
    const role = c.get('userRole');
    if (role !== 'super_admin' && role !== 'admin') {
        return c.json({ status: 'error', message: 'Access Denied: Admin Privileges Required' }, 403);
    }
    await next();
});
// Middleware: Pastikan hanya role admin / super_admin yang bisa mengakses seluruh rute di bawah ini
router.use('*', requireRole(['admin', 'super_admin']))

// 1. MASTER USERS: Fetch All Users
adminRouter.get('/users', async (c) => {
    try {
        const query = c.req.query('q');
        let sql = `
           SELECT id, full_name as name, email, role, status, created_at 
           FROM users 
        `;
        let params: any[] = [];
/**
 * ==========================================
 * MODUL 1: MASTER USERS (CRUD)
 * ==========================================
 */

        if (query) {
             sql += " WHERE (full_name LIKE ? OR email LIKE ?)";
             params = [`%${query}%`, `%${query}%`];
        }
        
        sql += " ORDER BY created_at DESC LIMIT 100";

        const { results } = await c.env.DB_SSO.prepare(sql).bind(...params).all();

        // Optional: Aggregate dummy projects count (or cross DB in future)
        const enriched = results.map(u => ({ ...u, projects_count: 0 }));

        return c.json({ status: 'ok', data: enriched });
    } catch (err: any) {
        return c.json({ status: 'error', message: err.message }, 500);
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
});
    
    query += ` ORDER BY created_at DESC LIMIT 100`;
    
    const { results } = await c.env.DB_SSO.prepare(query).bind(...params).all();
    return c.json({ status: 'success', data: results });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ status: 'error', message: 'Gagal memuat data pengguna' }, 500);
  }
})

// 2. MASTER USERS: Change Status (Ban/Suspend/Active)
adminRouter.patch('/users/:id/status', async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const newStatus = body.status;
        
        if (!['active', 'pending', 'suspended', 'deleted', 'banned'].includes(newStatus)) {
            return c.json({ status: 'error', message: 'Invalid status provided' }, 400);
        }
// PATCH /api/v1/admin/users/:id/status - Ubah status (Banned/Suspend/Active)
router.patch('/users/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const newStatus = body.status; 

        const res = await c.env.DB_SSO.prepare("UPDATE users SET status = ? WHERE id = ?").bind(newStatus, id).run();
        
        if (!res.success) throw new Error("Failed to commit status change");

        return c.json({ status: 'ok', message: `User status successfully updated to ${newStatus}` });
    } catch (err: any) {
        return c.json({ status: 'error', message: err.message }, 500);
    if (!['active', 'suspended', 'deleted', 'banned'].includes(newStatus)) {
      return c.json({ status: 'error', message: 'Status tidak valid' }, 400);
    }
});

// 3. TALENTS: Pending Verification List
adminRouter.get('/talents/pending', async (c) => {
    try {
        // Assume pending talents have their profile stored in DB_CORE but kyc_status != 'verified'
        const sql = `SELECT * FROM talents WHERE kyc_status = 'pending' OR is_verified = 0`;
        const { results } = await c.env.DB_CORE.prepare(sql).all();
        
        return c.json({ status: 'ok', data: results });
    } catch (err: any) {
        // Silent fail block if columns aren't standard yet
        return c.json({ status: 'ok', data: [] });
    }
});
    await c.env.DB_SSO.prepare(`UPDATE users SET status = ? WHERE id = ?`).bind(newStatus, id).run();
    return c.json({ status: 'success', message: `Status pengguna berhasil diubah menjadi ${newStatus}` });
  } catch (error) {
    console.error("Error updating user status:", error);
    return c.json({ status: 'error', message: 'Gagal mengubah status' }, 500);
  }
})

// 4. TALENTS: Verify Talent manually
adminRouter.post('/talents/:id/verify', async (c) => {
     try {
        const id = c.req.param('id');
        await c.env.DB_CORE.prepare("UPDATE talents SET is_verified = 1, kyc_status = 'verified' WHERE user_id = ?").bind(id).run();
        return c.json({ status: 'ok', message: 'Talent has been securely verified' });
     } catch (err: any) {
        return c.json({ status: 'error', message: err.message }, 500);
     }
});
/**
 * ==========================================
 * MODUL 2: VERIFIKASI TALENT (KYC)
 * ==========================================
 */

// 5. PROJECTS / CASTING ADMIN OVERSIGHT
adminRouter.get('/projects', async (c) => {
    try {
        // DB_CORE projects table gives overarching view
        const { results } = await c.env.DB_CORE.prepare("SELECT * FROM projects ORDER BY created_at DESC LIMIT 50").all();
        return c.json({ status: 'ok', data: results });
    } catch (err: any) {
         return c.json({ status: 'ok', data: [] });
    }
});
// GET /api/v1/admin/talents/pending - List talent yang butuh verifikasi
router.get('/talents/pending', async (c) => {
  try {
    const { results } = await c.env.DB_CORE.prepare(`SELECT id, full_name, kyc_status, created_at FROM talents WHERE kyc_status = 'pending'`).all();
    return c.json({ status: 'success', data: results });
  } catch (error) {
    return c.json({ status: 'error', message: 'Gagal memuat data talent' }, 500);
  }
})

// 6. PROJECTS: Delete / Moderate
adminRouter.delete('/projects/:id', async (c) => {
    try {
        const id = c.req.param('id');
        await c.env.DB_CORE.prepare("UPDATE projects SET status = 'cancelled' WHERE id = ?").bind(id).run();
        return c.json({ status: 'ok', message: 'Project forcibly removed/cancelled' });
    } catch (err: any) {
        return c.json({ status: 'error', message: err.message }, 500);
    }
});
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

// 7. PROJECTS: Force Resolve Dispute
adminRouter.patch('/projects/:id/resolve', async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const finalStatus = body.resolution === 'client_wins' ? 'cancelled' : 'completed';
        
        await c.env.DB_CORE.prepare("UPDATE projects SET status = ? WHERE id = ?")
             .bind(finalStatus, id).run();
             
        return c.json({ status: 'ok', message: `Sengketa diputus sepihak untuk ${body.resolution}` });
    } catch (err: any) {
        return c.json({ status: 'error', message: err.message }, 500);
    }
});
/**
 * ==========================================
 * MODUL 3: MODERASI PROYEK (God-Mode)
 * ==========================================
 */

// 8. FINANCIALS: Treasury Metrics & Withdrawals
adminRouter.get('/financials', async (c) => {
    try {
        const { results: projects } = await c.env.DB_CORE.prepare("SELECT * FROM projects WHERE status IN ('completed', 'disputed') ORDER BY created_at DESC LIMIT 50").all();
        
        let totalRevenue = 0;
        let pendingPayouts = 0;
        
        const payouts = projects.map(p => {
             const amt = (p.total_budget || 0) as number;
             totalRevenue += amt;
             const isPaid = (p.internal_notes || '').includes('Payout Released');
             if (!isPaid && p.status === 'completed') pendingPayouts += amt * 0.9;
             
             return {
                 id: p.id,
                 talentName: p.talent_name || 'System Talent',
                 projectName: p.title || 'Untitled Project',
                 amount: amt * 0.9, 
                 bankDetail: 'Bank Account - Check D1',
                 status: isPaid ? 'paid' : 'pending',
                 requestedAt: p.created_at
             };
        });
        
        return c.json({
            status: 'ok',
            data: {
               stats: { totalRevenue, netProfit: totalRevenue * 0.1, pendingPayouts },
               payouts,
               chart: [
                  { month: 'Jan', revenue: 150000000, profit: 15000000 },
                  { month: 'Feb', revenue: 230000000, profit: 23000000 },
                  { month: 'Mar', revenue: 180000000, profit: 18000000 },
                  { month: 'Apr', revenue: 320000000, profit: 32000000 },
                  { month: 'May', revenue: totalRevenue, profit: totalRevenue * 0.1 }
               ]
            }
        });
    } catch (err: any) {
        return c.json({ status: 'error', message: err.message }, 500);
    }
});
// GET /api/v1/admin/projects - Lihat semua proyek yang berjalan
router.get('/projects', async (c) => {
  try {
    const { results } = await c.env.DB_CORE.prepare(`SELECT id, title, client_id, status, created_at FROM projects ORDER BY created_at DESC`).all();
    return c.json({ status: 'success', data: results });
  } catch (error) {
    return c.json({ status: 'error', message: 'Gagal memuat data proyek' }, 500);
  }
})

adminRouter.patch('/financials/payouts/:id/approve', async (c) => {
    try {
        const id = c.req.param('id');
        await c.env.DB_CORE.prepare("UPDATE projects SET internal_notes = coalesce(internal_notes, '') || '\n- Payout Released' WHERE id = ?").bind(id).run();
        return c.json({ status: 'ok', message: 'Payout approved & processed' });
    } catch (err: any) {
        return c.json({ status: 'error', message: err.message }, 500);
    }
});
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

export default adminRouter;
export default router
