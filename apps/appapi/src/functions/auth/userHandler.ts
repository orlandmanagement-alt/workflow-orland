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
 * PENDAFTARAN VIA UNDANGAN AGENSI (INVITE)
 * ========================================
 */
router.post('/register-invite', async (c) => {
  try {
    const body = await c.req.json<any>();
    const email = (body.email || "").toLowerCase().trim();
    const token = (body.token || "").trim();
    
    if (!token) return c.json({ status: 'error', message: 'Token undangan tidak valid atau hilang.' }, 400);
    if (!email) return c.json({ status: 'error', message: 'Format email tidak valid.' }, 400);
    if (!body.password || !body.fullName) return c.json({ status: 'error', message: 'Data pendaftaran tidak lengkap.' }, 400);

    const invite = await c.env.DB_CORE.prepare(
      "SELECT invitation_id, agency_id, current_uses, max_uses FROM agency_invitations WHERE invite_link_token = ? AND status = 'active' AND expires_at > datetime('now')"
    ).bind(token).first<any>();

    if (!invite) return c.json({ status: 'error', message: 'Link undangan kadaluarsa atau batas kuota habis.' }, 400);

    const existing = await c.env.DB_SSO.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<any>();
    
    if (existing) {
      // PERBAIKAN: Mengganti SELECT status menjadi SELECT talent_id untuk menghindari error no such column
      const alreadyLinked = await c.env.DB_CORE.prepare('SELECT talent_id FROM agency_talents WHERE agency_id = ? AND talent_id = ?').bind(invite.agency_id, existing.id).first();
      
      if (!alreadyLinked) {
          // PERBAIKAN: Menghapus kolom status pada proses INSERT
          await c.env.DB_CORE.prepare(`INSERT INTO agency_talents (agency_id, talent_id, joined_at) VALUES (?, ?, datetime('now'))`).bind(invite.agency_id, existing.id).run();
          const newUses = invite.current_uses + 1;
          await c.env.DB_CORE.prepare("UPDATE agency_invitations SET current_uses = ?, status = ? WHERE invitation_id = ?")
            .bind(newUses, newUses >= invite.max_uses ? 'completed' : 'active', invite.invitation_id).run();
      }
      return c.json({ status: 'existing', message: 'Akun sudah terdaftar dan berhasil ditautkan ke Agensi! Silakan Login.' });
    }

    const pepper = 'orland_fallback_pepper_999'; // Gunakan fallback statis jika env tidak terbaca
    const { salt, hash } = await hashPasswordPBKDF2(body.password, pepper, 100000);
    
    const userId = crypto.randomUUID();
    const nameParts = (body.fullName || 'Talent').split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    await c.env.DB_SSO.prepare(
      `INSERT INTO users (id, email, first_name, last_name, phone, user_type, is_active, email_verified, password_hash, password_salt, created_at) 
       VALUES (?, ?, ?, ?, ?, 'talent', 1, 0, ?, ?, datetime('now'))`
    ).bind(userId, email, firstName, lastName, body.phone || null, hash, salt).run();

    // PERBAIKAN: Menghapus kolom status pada proses INSERT
    await c.env.DB_CORE.prepare(`INSERT INTO agency_talents (agency_id, talent_id, joined_at) VALUES (?, ?, datetime('now'))`).bind(invite.agency_id, userId).run();
    
    await c.env.DB_CORE.prepare("UPDATE agency_invitations SET current_uses = ?, status = ? WHERE invitation_id = ?").bind(invite.current_uses + 1, (invite.current_uses + 1) >= invite.max_uses ? 'completed' : 'active', invite.invitation_id).run();

    const activationToken = crypto.randomUUID().replace(/-/g, '');
    await c.env.DB_SSO.prepare(`INSERT INTO otp_codes (otp_id, user_id, email, code, method, expires_at) VALUES (?, ?, ?, ?, 'email', datetime('now', '+1 day'))`).bind(crypto.randomUUID(), userId, email, activationToken).run();
    
    return c.json({ status: 'ok', message: 'Registrasi via undangan berhasil!' });
    
  } catch (error: any) { 
    console.error(error);
    return c.json({ status: 'error', message: error.message }, 500); 
  }
});

export default router