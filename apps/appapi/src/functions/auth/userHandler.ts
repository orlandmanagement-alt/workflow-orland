import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// =====================================================================
// FUNGSI INLINE CRYPTO (PENTING: Agar Deploy Tidak Gagal)
// =====================================================================
async function hashPasswordPBKDF2(password: string, pepper: string, iterations: number = 100000) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password + pepper), { name: "PBKDF2" }, false, ["deriveBits"]);
  const derivedBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" }, keyMaterial, 256);
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  return { salt: saltHex, hash: hashHex };
}

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
    await c.env.DB_SSO.prepare(`
      UPDATE users SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(body.first_name || null, body.last_name || null, body.email || null, body.phone || null, userId).run()

    c.executionCtx.waitUntil(Promise.all([
      c.env.ORLAND_CACHE.delete(`talent:profile:${userId}`),
      c.env.ORLAND_CACHE.delete('PUBLIC_TALENT_ROSTER')
    ]))

    return c.json({ status: 'ok', message: 'Data SSO berhasil diperbarui' })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

/**
 * ========================================
 * PART 2: PENDAFTARAN VIA UNDANGAN AGENSI
 * ========================================
 */
router.post('/register-invite', async (c) => {
  try {
    const body = await c.req.json<any>();
    const email = (body.email || "").toLowerCase().trim();
    const token = (body.token || "").trim();
    
    // 1. Validasi Input Standar
    if (!token) return c.json({ status: 'error', message: 'Token undangan tidak valid atau hilang.' }, 400);
    if (!email) return c.json({ status: 'error', message: 'Format email tidak valid.' }, 400);
    if (!body.password || !body.fullName) return c.json({ status: 'error', message: 'Data pendaftaran tidak lengkap.' }, 400);

    // 2. Cek Validitas Token & Kuota di DB_CORE
    const invite = await c.env.DB_CORE.prepare(
      "SELECT invitation_id, agency_id, current_uses, max_uses FROM agency_invitations WHERE invite_link_token = ? AND status = 'active' AND expires_at > datetime('now')"
    ).bind(token).first<any>();

    if (!invite) {
      return c.json({ status: 'error', message: 'Link undangan sudah kadaluarsa atau batas kuota habis.' }, 400);
    }

    // 3. Cek Eksistensi Akun di DB_SSO
    const existing = await c.env.DB_SSO.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<any>();
    
    if (existing) {
      // Skenario A: Akun sudah ada. Cek apakah sudah jadi downline agensi ini
      const alreadyLinked = await c.env.DB_CORE.prepare('SELECT talent_id FROM agency_talents WHERE agency_id = ? AND talent_id = ?').bind(invite.agency_id, existing.id).first();
      
      if (!alreadyLinked) {
          await c.env.DB_CORE.prepare(`INSERT INTO agency_talents (agency_id, talent_id, joined_at) VALUES (?, ?, datetime('now'))`).bind(invite.agency_id, existing.id).run();
          
          // Update kuota penggunaan link
          const newUses = invite.current_uses + 1;
          await c.env.DB_CORE.prepare("UPDATE agency_invitations SET current_uses = ?, status = ? WHERE invitation_id = ?")
            .bind(newUses, newUses >= invite.max_uses ? 'completed' : 'active', invite.invitation_id).run();
      }
      // Kembalikan status 'existing' agar Frontend bisa mengarahkan ke halaman Login
      return c.json({ status: 'existing', message: 'Akun Anda sudah terdaftar dan berhasil ditautkan ke Agensi ini! Silakan Login ke portal.' });
    }

    // Skenario B: Akun belum ada (User Baru). Hash password dan Insert ke DB_SSO
    const pepper = c.env.HASH_PEPPER || 'orland_fallback_pepper_999';
    const iter = Number(c.env.PBKDF2_ITER) || 100000;
    const { salt, hash } = await hashPasswordPBKDF2(body.password, pepper, iter);
    
    const userId = crypto.randomUUID();
    const nameParts = (body.fullName || 'Talent').split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    await c.env.DB_SSO.prepare(
      `INSERT INTO users (id, email, first_name, last_name, phone, user_type, is_active, email_verified, password_hash, password_salt, created_at) 
       VALUES (?, ?, ?, ?, ?, 'talent', 1, 0, ?, ?, datetime('now'))`
    ).bind(userId, email, firstName, lastName, body.phone || null, hash, salt).run();

    // Hubungkan User Baru ke Agensi di DB_CORE
    await c.env.DB_CORE.prepare(`INSERT INTO agency_talents (agency_id, talent_id, joined_at) VALUES (?, ?, datetime('now'))`).bind(invite.agency_id, userId).run();
    
    // Update kuota penggunaan link
    const newUsesCount = invite.current_uses + 1;
    await c.env.DB_CORE.prepare("UPDATE agency_invitations SET current_uses = ?, status = ? WHERE invitation_id = ?")
      .bind(newUsesCount, newUsesCount >= invite.max_uses ? 'completed' : 'active', invite.invitation_id).run();

    // Generate dan Simpan OTP Aktivasi Email
    const activationToken = crypto.randomUUID().replace(/-/g, '');
    await c.env.DB_SSO.prepare(`INSERT INTO otp_codes (otp_id, user_id, email, code, method, expires_at) VALUES (?, ?, ?, ?, 'email', datetime('now', '+1 day'))`).bind(crypto.randomUUID(), userId, email, activationToken).run();
    
    // Opsional: Panggil layanan email jika tersedia
    // try { await sendMail(c.env, email, activationToken, 'activation'); } catch(e) {}

    return c.json({ status: 'ok', message: 'Registrasi via undangan berhasil!' });
    
  } catch (error: any) { 
    console.error(error);
    return c.json({ status: 'error', message: 'Kesalahan server internal saat memproses pendaftaran.' }, 500); 
  }
});

export default router