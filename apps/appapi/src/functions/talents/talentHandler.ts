import { Hono } from 'hono'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// MENGAMBIL DATA PROFIL
router.get('/me', async (c) => {
  const userId = c.get('userId')
  try {
    const talent = await c.env.DB_CORE.prepare('SELECT * FROM talents WHERE user_id = ?').bind(userId).first()
    if (talent) return c.json({ status: 'ok', data: talent })
    
    const ssoUser = await c.env.DB_SSO.prepare('SELECT full_name, email, phone FROM users WHERE id = ?').bind(userId).first()
    return c.json({ status: 'ok', data: ssoUser, is_new: true })
  } catch (err: any) {
    console.error("GET /me Error:", err.message)
    return c.json({ status: 'error', message: 'Gagal memuat profil' }, 500)
  }
})

// MENYIMPAN/MEMPERBARUI DATA PROFIL
router.put('/me', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()

  // PERBAIKAN: Mengubah nilai "undefined" menjadi "null" agar Database D1 tidak crash!
  const fullName = body.full_name || null;
  const category = body.category || null;
  const height = body.height || null;
  const weight = body.weight || null;
  const birthDate = body.birth_date || null;
  const gender = body.gender || null;

  try {
    const existing = await c.env.DB_CORE.prepare('SELECT talent_id FROM talents WHERE user_id = ?').bind(userId).first()

    if (existing) {
      // Update jika profil sudah ada
      await c.env.DB_CORE.prepare(`UPDATE talents SET full_name=?, category=?, height=?, weight=?, birth_date=?, gender=? WHERE user_id=?`)
        .bind(fullName, category, height, weight, birthDate, gender, userId).run()
    } else {
      // Insert jika profil baru
      const newTalentId = crypto.randomUUID()
      await c.env.DB_CORE.prepare(`INSERT INTO talents (talent_id, user_id, full_name, category, height, weight, birth_date, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(newTalentId, userId, fullName, category, height, weight, birthDate, gender).run()
    }
    
    // Ambil ulang data terbaru setelah disimpan
    const updated = await c.env.DB_CORE.prepare('SELECT * FROM talents WHERE user_id = ?').bind(userId).first()
    return c.json({ status: 'ok', data: updated })

  } catch (err: any) {
    // Menangkap error spesifik dari D1 (misal: kolom tidak ada di tabel)
    console.error("🔥 ERROR DATABASE (PUT /me):", err.message || err);
    return c.json({ status: 'error', message: err.message || 'Gagal menyimpan ke Database.' }, 500)
  }
})

// --- JANGAN DIHAPUS: Rute untuk Admin jika diperlukan di masa depan ---
router.get('/', async (c) => c.json({ status: 'ok', data: [] }))
router.get('/:id', async (c) => c.json({ status: 'ok', data: null }))

export default router
