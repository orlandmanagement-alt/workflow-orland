import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
import { sendNotification } from '../../utils/notifier' // SUDAH DIPERBAIKI MENGGUNAKAN NOTIFIER

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// =====================================================================
// FUNGSI INLINE CRYPTO (Agar tidak perlu file crypto.ts eksternal)
// =====================================================================
async function hashPasswordPBKDF2(password: string, pepper: string, iterations: number = 100000) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password + pepper),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  return { salt: saltHex, hash: hashHex };
}
// =====================================================================

// --- HELPER: Resolve Agency ID ---
async function resolveAgencyId(c: any, userId: string): Promise<string | null> {
  const fromClients = await c.env.DB_CORE.prepare(
    'SELECT client_id FROM clients WHERE user_id = ? AND is_agency = 1'
  ).bind(userId).first()
  if (fromClients?.client_id) return fromClients.client_id

  const fromUsers = await c.env.DB_SSO.prepare(
    'SELECT agency_id FROM users WHERE id = ?'
  ).bind(userId).first()
  return fromUsers?.agency_id || null
}

// --- SCHEMA: Import JSON ---
const importTalentSchema = z.object({
  talents: z.array(z.object({
    full_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    gender: z.string().optional(),
    height_cm: z.number().optional(),
    weight_kg: z.number().optional(),
    domicile: z.string().optional()
  })).max(100) 
})

// --- SCHEMA: Edit Profile by Agency ---
const editTalentSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  birth_date: z.string().optional(),
  height: z.union([z.string(), z.number()]).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
  location: z.string().optional()
})

/**
 * [POST] /api/v1/agency/talents/import
 */
router.post('/import', requireRole(['agency', 'admin']), zValidator('json', importTalentSchema), async (c) => {
  const userId = c.get('userId')
  const { talents } = c.req.valid('json')
  
  try {
    const agencyId = await resolveAgencyId(c, userId)
    if (!agencyId) return c.json({ status: 'error', message: 'Agency not found' }, 403)

    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const t of talents) {
      try {
        const email = t.email.toLowerCase().trim()
        
        let ssoUser = await c.env.DB_SSO.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<any>()
        let talentUserId = ssoUser?.id

        if (!ssoUser) {
          talentUserId = crypto.randomUUID()
          const randomPass = crypto.randomUUID() 
          const pepper = c.env.HASH_PEPPER || 'orland_fallback_pepper_999'
          const { salt, hash } = await hashPasswordPBKDF2(randomPass, pepper, 100000)
          
          const nameParts = t.full_name.split(' ')
          const firstName = nameParts[0]
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

          await c.env.DB_SSO.prepare(`
            INSERT INTO users (id, email, first_name, last_name, phone, user_type, is_active, email_verified, password_hash, password_salt, created_at)
            VALUES (?, ?, ?, ?, ?, 'talent', 1, 0, ?, ?, datetime('now'))
          `).bind(talentUserId, email, firstName, lastName, t.phone || null, hash, salt).run()

          const activationToken = crypto.randomUUID().replace(/-/g, '')
          await c.env.DB_SSO.prepare(`INSERT INTO otp_codes (otp_id, user_id, email, code, method, expires_at) VALUES (?, ?, ?, ?, 'email', datetime('now', '+7 days'))`).bind(crypto.randomUUID(), talentUserId, email, activationToken).run()
          
          // MENGGUNAKAN NOTIFIER SERVICE
          c.executionCtx.waitUntil(
            sendNotification(c.env, {
              to: email,
              type: "email",
              message: `Halo ${t.full_name}, akun Talent Anda telah dibuat oleh Agensi. Gunakan Token Aktivasi ini untuk login: ${activationToken}`
            }).catch(console.error)
          );
        }

        let coreTalent = await c.env.DB_CORE.prepare('SELECT id FROM talents WHERE id = ?').bind(talentUserId).first()
        if (!coreTalent) {
          await c.env.DB_CORE.prepare('INSERT INTO talents (id, fullname, username, phone) VALUES (?, ?, ?, ?)')
            .bind(talentUserId, t.full_name, talentUserId, t.phone || null).run()
        }

        let profile = await c.env.DB_CORE.prepare('SELECT id FROM talent_profiles WHERE talent_id = ?').bind(talentUserId).first()
        if (!profile) {
          await c.env.DB_CORE.prepare(`
            INSERT INTO talent_profiles (id, talent_id, gender, domicile, height_cm, weight_kg)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(crypto.randomUUID(), talentUserId, t.gender || null, t.domicile || null, t.height_cm || null, t.weight_kg || null).run()
        }

        try {
          await c.env.DB_CORE.prepare('INSERT INTO agency_talents (agency_talent_id, agency_id, talent_id) VALUES (?, ?, ?)')
            .bind(crypto.randomUUID(), agencyId, talentUserId).run()
        } catch (e: any) {}

        results.success++
      } catch (e: any) {
        results.failed++
        results.errors.push(`Failed for ${t.email}: ${e.message}`)
      }
    }

    c.executionCtx.waitUntil(c.env.ORLAND_CACHE.delete('PUBLIC_TALENT_ROSTER'))
    return c.json({ status: 'ok', message: 'Import completed', results })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

/**
 * [GET] /api/v1/agency/talents
 */
router.get('/', requireRole(['agency', 'admin']), async (c) => {
  const userId = c.get('userId')
  try {
    const agencyId = await resolveAgencyId(c, userId)
    if (!agencyId) return c.json({ status: 'error', message: 'Agency not found' }, 403)

    const roster = await c.env.DB_CORE.prepare(`
      SELECT at.joined_at, t.id as talent_id, t.fullname, t.phone, p.headshot_url, p.gender, p.domicile
      FROM agency_talents at
      JOIN talents t ON at.talent_id = t.id
      LEFT JOIN talent_profiles p ON t.id = p.talent_id
      WHERE at.agency_id = ?
      ORDER BY at.joined_at DESC
    `).bind(agencyId).all()

    return c.json({ status: 'ok', data: roster.results })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

/**
 * [GET] /api/v1/agency/talents/:talent_id
 */
router.get('/:talent_id', requireRole(['agency', 'admin']), async (c) => {
  const agencyUserId = c.get('userId')
  const targetTalentId = c.req.param('talent_id')

  try {
    const agencyId = await resolveAgencyId(c, agencyUserId)
    
    const ownsTalent = await c.env.DB_CORE.prepare(
      'SELECT 1 FROM agency_talents WHERE agency_id = ? AND talent_id = ?'
    ).bind(agencyId, targetTalentId).first()

    if (!ownsTalent && c.get('role') !== 'admin') {
      return c.json({ status: 'error', message: 'Akses Ditolak. Talent ini bukan downline Anda.' }, 403)
    }

    const talent = await c.env.DB_CORE.prepare(`
      SELECT t.fullname as full_name, t.phone, p.* FROM talents t 
      LEFT JOIN talent_profiles p ON t.id = p.talent_id 
      WHERE t.id = ?
    `).bind(targetTalentId).first<any>()

    if (!talent) return c.json({ status: 'error', message: 'Talent tidak ditemukan' }, 404)

    if (typeof talent.assets_json === 'string') {
        const assets = JSON.parse(talent.assets_json);
        talent.showreels = assets.youtube || [];
        talent.audios = assets.audio || [];
    }
    if (typeof talent.portfolio_photos === 'string') talent.additional_photos = JSON.parse(talent.portfolio_photos);
    if (typeof talent.interested_in_json === 'string') talent.interests = JSON.parse(talent.interested_in_json);
    if (typeof talent.skills_json === 'string') talent.skills = JSON.parse(talent.skills_json);
    if (typeof talent.social_media_json === 'string') {
        const soc = JSON.parse(talent.social_media_json);
        talent.instagram = soc.instagram || "";
        talent.tiktok = soc.tiktok || "";
        talent.twitter = soc.twitter || "";
    }

    return c.json({ status: 'ok', data: talent })

  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

export default router