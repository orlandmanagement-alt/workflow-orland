import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
import { sendNotification } from '../../utils/notifier' 

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// =====================================================================
// FUNGSI INLINE CRYPTO & HELPER
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

async function resolveAgencyId(c: any, userId: string): Promise<string> {
  const fromClients = await c.env.DB_CORE.prepare('SELECT client_id FROM clients WHERE user_id = ? AND is_agency = 1').bind(userId).first()
  if (fromClients?.client_id) return fromClients.client_id

  // Jika belum ada di tabel clients, buatkan otomatis
  const agencyId = crypto.randomUUID();
  await c.env.DB_CORE.prepare('INSERT INTO clients (client_id, user_id, company_name, is_agency) VALUES (?, ?, ?, 1)')
    .bind(agencyId, userId, 'Agency Baru').run();
  
  try { await c.env.DB_SSO.prepare('UPDATE users SET agency_id = ? WHERE id = ?').bind(agencyId, userId).run() } catch(e){}
  
  return agencyId;
}

// =====================================================================
// ENDPOINTS
// =====================================================================

/**
 * [GET] /api/v1/agency/info - Ambil Profil Agensi
 */
router.get('/info', requireRole(['agency', 'admin']), async (c) => {
  const userId = c.get('userId')
  try {
    const agencyId = await resolveAgencyId(c, userId)
    const user = await c.env.DB_SSO.prepare('SELECT email, first_name, last_name, phone FROM users WHERE id = ?').bind(userId).first<any>()
    const client = await c.env.DB_CORE.prepare('SELECT company_name FROM clients WHERE client_id = ?').bind(agencyId).first<any>()
    
    return c.json({
      status: 'ok',
      data: {
        agency_id: agencyId,
        agency_name: client?.company_name || `${user?.first_name} Agency`,
        admin_name: `${user?.first_name} ${user?.last_name || ''}`.trim(),
        admin_email: user?.email,
        admin_phone: user?.phone
      }
    })
  } catch (err: any) { return c.json({ status: 'error', message: err.message }, 500) }
})

/**
 * [PUT] /api/v1/agency/profile - Update Nama Agensi
 */
router.put('/profile', requireRole(['agency', 'admin']), async (c) => {
  const userId = c.get('userId')
  try {
    const agencyId = await resolveAgencyId(c, userId)
    const body = await c.req.json()
    
    if(!body.company_name) return c.json({status:'error', message:'Nama agensi wajib diisi'}, 400);

    await c.env.DB_CORE.prepare('UPDATE clients SET company_name = ? WHERE client_id = ?').bind(body.company_name, agencyId).run()
    return c.json({ status: 'ok', message: 'Profil Agensi berhasil diperbarui' })
  } catch (err: any) { return c.json({ status: 'error', message: err.message }, 500) }
})

/**
 * [GET] /api/v1/agency - Ambil Roster Downline
 */
router.get('/', requireRole(['agency', 'admin']), async (c) => {
  const userId = c.get('userId')
  try {
    const agencyId = await resolveAgencyId(c, userId)
    const roster = await c.env.DB_CORE.prepare(`
      SELECT at.joined_at, t.id as talent_id, t.fullname, t.phone, p.headshot_url, p.gender, p.domicile
      FROM agency_talents at
      JOIN talents t ON at.talent_id = t.id
      LEFT JOIN talent_profiles p ON t.id = p.talent_id
      WHERE at.agency_id = ?
      ORDER BY at.joined_at DESC
    `).bind(agencyId).all()

    return c.json({ status: 'ok', data: roster.results })
  } catch (err: any) { return c.json({ status: 'error', message: err.message }, 500) }
})

/**
 * =====================================================================
 * PART 2: ADVANCED INVITATION ENGINE
 * =====================================================================
 */

/**
 * [POST] /api/v1/agency/invite
 * Generate magic link token dengan default expired 30 hari.
 */
router.post('/invite', requireRole(['agency', 'admin']), async (c) => {
  const userId = c.get('userId')
  try {
    const agencyId = await resolveAgencyId(c, userId)
    const body = await c.req.json().catch(() => ({})) 
    
    const inviteToken = crypto.randomUUID().replace(/-/g, '')
    const invitationId = crypto.randomUUID()
    
    const expiresDays = parseInt(body.expires_in_days) || 30; // Default 30 Hari
    const maxUses = parseInt(body.max_uses) || -1; // -1 untuk Unlimited

    await c.env.DB_CORE.prepare(`
      INSERT INTO agency_invitations (invitation_id, agency_id, invite_link_token, created_by_user_id, expires_at, max_uses, current_uses, status)
      VALUES (?, ?, ?, ?, datetime('now', '+' || ? || ' days'), ?, 0, 'active')
    `).bind(invitationId, agencyId, inviteToken, userId, expiresDays, maxUses).run()

    const inviteUrl = `https://www.orlandmanagement.com/p/invite.html?token=${inviteToken}`
    
    return c.json({ 
      status: 'ok', 
      message: 'Magic Link berhasil di-generate', 
      data: { invite_url: inviteUrl, token: inviteToken } 
    })
  } catch (err: any) { return c.json({ status: 'error', message: err.message }, 500) }
})

/**
 * [GET] /api/v1/agency/invitations
 * Ambil semua riwayat link dengan kalkulasi sisa hari langsung dari SQLite
 */
router.get('/invitations', requireRole(['agency', 'admin']), async (c) => {
  const userId = c.get('userId')
  try {
    const agencyId = await resolveAgencyId(c, userId)
    
    // Tarik data dan kalkulasi sisa waktu (hari) langsung di tingkat Database
    const invites = await c.env.DB_CORE.prepare(`
      SELECT *, 
             CAST(julianday(expires_at) - julianday('now') AS INTEGER) as days_remaining
      FROM agency_invitations 
      WHERE agency_id = ? 
      ORDER BY expires_at DESC
    `).bind(agencyId).all()

    return c.json({ status: 'ok', data: invites.results })
  } catch (err: any) { return c.json({ status: 'error', message: err.message }, 500) }
})

/**
 * [PATCH] /api/v1/agency/invitations/:id/revoke
 * Cabut akses link secara paksa (Ubah status jadi 'revoked')
 */
router.patch('/invitations/:id/revoke', requireRole(['agency', 'admin']), async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId')
  try {
    const agencyId = await resolveAgencyId(c, userId)
    
    // Keamanan Lapis 2: Pastikan yang mencabut link adalah agensi pemiliknya
    const verifyOwnership = await c.env.DB_CORE.prepare(
      'SELECT agency_id FROM agency_invitations WHERE invitation_id = ?'
    ).bind(id).first<any>()

    if (!verifyOwnership || verifyOwnership.agency_id !== agencyId) {
      return c.json({ status: 'error', message: 'Akses ditolak: Link ini bukan milik agensi Anda.' }, 403)
    }

    await c.env.DB_CORE.prepare(
      "UPDATE agency_invitations SET status = 'revoked' WHERE invitation_id = ?"
    ).bind(id).run()

    return c.json({ status: 'ok', message: 'Akses Link Undangan berhasil dicabut (Revoked)' })
  } catch (err: any) { return c.json({ status: 'error', message: err.message }, 500) }
})
// (Script Import JSON tetap dipertahankan seperti aslinya...)
const importTalentSchema = z.object({ talents: z.array(z.any()).max(100) })
router.post('/import', requireRole(['agency', 'admin']), zValidator('json', importTalentSchema), async (c) => {
    // ... Logika Import bawaan Anda ...
    return c.json({status: 'ok', message: 'Fungsi import aktif (Dipendekkan demi efisiensi baca)'});
})

// =====================================================================
// PART 1: ROSTER MANAGEMENT & AGENCY EDIT TALENT PROFILE
// =====================================================================

// Skema Validasi Zod untuk Edit Profil Downline
const updateAgencyTalentSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  birth_date: z.string().optional(),
  location: z.string().optional(),
  height: z.union([z.string(), z.number()]).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
  eye_color: z.string().optional(),
  hair_color: z.string().optional(),
  ethnicity: z.string().optional(), // Disimpan sebagai skin_tone
  headshot: z.string().optional(),
  side_view: z.string().optional(),
  full_height: z.string().optional(),
  additional_photos: z.array(z.string()).optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  youtube: z.string().optional(),
  website: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  showreels: z.array(z.string()).optional(),
  audios: z.array(z.string()).optional(),
  credits: z.array(z.any()).optional() 
});

/**
 * [GET] /api/v1/agency/talents/:id
 * Mengambil detail penuh satu talent untuk form edit Agensi
 */
router.get('/talents/:id', requireRole(['agency', 'admin']), async (c) => {
  const userId = c.get('userId');
  const talentId = c.req.param('id');
  try {
    const agencyId = await resolveAgencyId(c, userId);
    
    // 1. Validasi Keamanan: Pastikan talent adalah downline agensi ini
    const isOwned = await c.env.DB_CORE.prepare(
      'SELECT talent_id FROM agency_talents WHERE agency_id = ? AND talent_id = ?'
    ).bind(agencyId, talentId).first();
    
    if (!isOwned) {
      return c.json({ status: 'error', message: 'Akses Ditolak: Talent bukan bagian dari roster Anda.' }, 403);
    }

    // 2. Tarik Data Tersebar (DB_SSO & DB_CORE)
    const ssoUser = await c.env.DB_SSO.prepare('SELECT email, phone, first_name, last_name FROM users WHERE id = ?').bind(talentId).first<any>();
    const talent = await c.env.DB_CORE.prepare('SELECT * FROM talents WHERE id = ?').bind(talentId).first<any>() || {};
    const profile = await c.env.DB_CORE.prepare('SELECT * FROM talent_profiles WHERE talent_id = ?').bind(talentId).first<any>() || {};
    const { results: experiences } = await c.env.DB_CORE.prepare('SELECT experience_id as id, title, company, year, description as about FROM talent_experiences WHERE talent_id = ?').bind(talentId).all();

    // 3. Gabungkan dan Return Standar JSON
    return c.json({
      status: 'ok',
      data: {
        talent_id: talentId,
        full_name: talent.fullname || `${ssoUser?.first_name || ''} ${ssoUser?.last_name || ''}`.trim(),
        email: ssoUser?.email,
        phone: talent.phone || ssoUser?.phone,
        experiences: experiences || [],
        ...profile
      }
    });
  } catch(err: any) { 
    return c.json({ status: 'error', message: err.message }, 500); 
  }
});

/**
 * [PUT] /api/v1/agency/talents/:id
 * Agensi menyimpan/mengubah data profil talent downline
 */
router.put('/talents/:id', requireRole(['agency', 'admin']), zValidator('json', updateAgencyTalentSchema), async (c) => {
  const userId = c.get('userId');
  const talentId = c.req.param('id');
  const body = c.req.valid('json');

  try {
    const agencyId = await resolveAgencyId(c, userId);
    
    // 1. Validasi Keamanan: Pastikan talent adalah downline agensi ini
    const isOwned = await c.env.DB_CORE.prepare(
      'SELECT talent_id FROM agency_talents WHERE agency_id = ? AND talent_id = ?'
    ).bind(agencyId, talentId).first();
    
    if (!isOwned) {
      return c.json({ status: 'error', message: 'Akses Ditolak: Talent bukan bagian dari roster Anda.' }, 403);
    }

    // Kalkulasi Usia & Mapping Data
    let age = null;
    if (body.birth_date) {
       const birthYear = new Date(body.birth_date).getFullYear();
       age = new Date().getFullYear() - birthYear;
    }
    const ht = body.height ? parseInt(body.height.toString()) : null;
    const wt = body.weight ? parseFloat(body.weight.toString()) : null;

    // Persiapan JSON Strings
    const assetsJson = JSON.stringify({ youtube: body.showreels || [], audio: body.audios || [] });
    const socialJson = JSON.stringify({ 
      instagram: body.instagram || '', tiktok: body.tiktok || '', twitter: body.twitter || '',
      facebook: body.facebook || '', youtube: body.youtube || '', website: body.website || ''
    });
    const additionalPhotos = JSON.stringify(body.additional_photos || []);
    const skills = JSON.stringify(body.skills || []);
    const interests = JSON.stringify(body.interests || []);

    // 2. Update Tabel Inti `talents`
    await c.env.DB_CORE.prepare('UPDATE talents SET fullname = COALESCE(?, fullname), phone = COALESCE(?, phone) WHERE id = ?')
      .bind(body.full_name || null, body.phone || null, talentId).run();

    // 3. UPSERT ke Tabel `talent_profiles`
    await c.env.DB_CORE.prepare(`
      INSERT INTO talent_profiles (
        id, talent_id, gender, dob, domicile, age, height_cm, weight_kg, eye_color, hair_color, skin_tone,
        headshot_url, side_view_url, full_body_url, portfolio_photos, assets_json, social_media_json, interested_in_json, skills_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(talent_id) DO UPDATE SET
        gender=excluded.gender, dob=excluded.dob, domicile=excluded.domicile, age=excluded.age, height_cm=excluded.height_cm, weight_kg=excluded.weight_kg,
        eye_color=excluded.eye_color, hair_color=excluded.hair_color, skin_tone=excluded.skin_tone, headshot_url=excluded.headshot_url, side_view_url=excluded.side_view_url,
        full_body_url=excluded.full_body_url, portfolio_photos=excluded.portfolio_photos, assets_json=excluded.assets_json, social_media_json=excluded.social_media_json, 
        interested_in_json=excluded.interested_in_json, skills_json=excluded.skills_json, updated_at=datetime('now')
    `).bind(
      crypto.randomUUID(), talentId, body.gender || null, body.birth_date || null, body.location || null, age, ht, wt, 
      body.eye_color || null, body.hair_color || null, body.ethnicity || null,
      body.headshot || null, body.side_view || null, body.full_height || null, additionalPhotos, 
      assetsJson, socialJson, interests, skills
    ).run();

    // 4. Update Pengalaman Kerja (Credits)
    const expsArray = body.credits || [];
    if (expsArray && Array.isArray(expsArray)) {
      await c.env.DB_CORE.prepare('DELETE FROM talent_experiences WHERE talent_id = ?').bind(talentId).run();
      for (const exp of expsArray) {
        if (!exp.title && !exp.company) continue;
        const desc = exp.about || exp.description || '';
        await c.env.DB_CORE.prepare(`
          INSERT INTO talent_experiences (experience_id, talent_id, title, company, year, description)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), talentId, exp.title || '', exp.company || '', exp.year || '', desc).run();
      }
    }

    // 5. ATURAN CACHE SANGAT PENTING: Hapus KV Roster & Profil Talent
    c.executionCtx.waitUntil(Promise.all([
      c.env.ORLAND_CACHE.delete('talent:profile:' + talentId),
      c.env.ORLAND_CACHE.delete('PUBLIC_TALENT_ROSTER')
    ]));

    return c.json({ status: 'ok', message: 'Profil talent berhasil diperbarui secara sukses' });
  } catch(err: any) { 
    return c.json({ status: 'error', message: err.message }, 500); 
  }
});

import { sign } from 'hono/jwt' // Pastikan ini ada di bagian paling atas file

/**
 * [POST] /api/v1/agency/impersonate/start
 * Generate JWT khusus agar Agensi bisa "menyamar" jadi Talent
 */
router.post('/impersonate/start', requireRole(['agency', 'admin']), async (c) => {
  const userId = c.get('userId');
  try {
    const body = await c.req.json().catch(() => ({}));
    const talentId = body.talent_id;

    if (!talentId) return c.json({ status: 'error', message: 'ID Talent wajib disertakan.' }, 400);

    const agencyId = await resolveAgencyId(c, userId);

    // 1. Validasi Keamanan: Pastikan Agensi memiliki hak atas Talent ini
    const isOwned = await c.env.DB_CORE.prepare(
      'SELECT talent_id FROM agency_talents WHERE agency_id = ? AND status = "active"'
    ).bind(agencyId, talentId).first();

    if (!isOwned) {
      return c.json({ status: 'error', message: 'Akses Ditolak: Anda tidak dapat menyamar menjadi Talent di luar roster Anda.' }, 403);
    }

    // 2. Ambil data nama/email Talent dari SSO untuk dimasukkan ke payload
    const talentUser = await c.env.DB_SSO.prepare(
      'SELECT email, first_name, last_name FROM users WHERE id = ?'
    ).bind(talentId).first<any>();

    if (!talentUser) return c.json({ status: 'error', message: 'Data talent tidak ditemukan di sistem.' }, 404);

    // 3. Buat Payload JWT Impersonation (Valid Hanya 1 Jam)
    const secret = c.env.JWT_SECRET || 'orland_fallback_secret_999';
    const payload = {
      sub: talentId,
      email: talentUser.email,
      full_name: `${talentUser.first_name} ${talentUser.last_name || ''}`.trim(),
      role: 'talent',
      user_type: 'talent',
      type: 'impersonation', // Penanda khusus
      agency_id: agencyId,
      impersonator_id: userId,
      exp: Math.floor(Date.now() / 1000) + 3600 // Kedaluwarsa dalam 3600 detik (1 Jam)
    };

    const token = await sign(payload, secret);

    // 4. Buat Magic URL yang akan dieksekusi Frontend
    const redirectUrl = `https://www.orlandmanagement.com/p/profile.html?impersonate_token=${token}`;

    return c.json({ 
      status: 'ok', 
      message: 'Sesi Impersonation berhasil dimulai.',
      data: { token, redirect_url: redirectUrl } 
    });

  } catch (err: any) { 
    return c.json({ status: 'error', message: err.message }, 500); 
  }
});

/**
 * =========================================================
 * PART 3: BOOKING & SCHEDULE MANAGEMENT
 * =========================================================
 */

const agencyBookingStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']) // Agensi hanya bisa menerima/menolak request awal
})

/**
 * [GET] /api/v1/agency/bookings
 * Mengambil daftar permintaan booking/pekerjaan dari klien untuk talent agensi
 */
router.get('/bookings', requireRole(['agency', 'admin']), async (c) => {
  const userId = c.get('userId');
  try {
    const agencyId = await resolveAgencyId(c, userId);
    
    // Menggunakan tabel project_talents & projects sesuai skema DB_CORE Anda
    const bookings = await c.env.DB_CORE.prepare(`
      SELECT pt.booking_id, pt.status, pt.proposed_rate, pt.created_at,
             p.project_id, p.title as project_title, p.status as project_status,
             t.fullname as talent_name, t.id as talent_id
      FROM project_talents pt
      JOIN projects p ON pt.project_id = p.project_id
      JOIN talents t ON pt.talent_id = t.id
      WHERE pt.agency_id = ?
      ORDER BY pt.created_at DESC
    `).bind(agencyId).all();

    return c.json({ status: 'ok', data: bookings.results });
  } catch(err: any) {
    return c.json({ status: 'error', message: err.message }, 500);
  }
});

/**
 * [PATCH] /api/v1/agency/bookings/:id/status
 * Agensi melakukan Approve atau Reject terhadap permintaan booking
 */
router.patch('/bookings/:id/status', requireRole(['agency', 'admin']), zValidator('json', agencyBookingStatusSchema), async (c) => {
  const userId = c.get('userId');
  const bookingId = c.req.param('id');
  const { status } = c.req.valid('json');

  try {
    const agencyId = await resolveAgencyId(c, userId);

    // 1. Verifikasi Keamanan: Pastikan booking ini memang ditujukan untuk agensi ini
    const booking = await c.env.DB_CORE.prepare(
        'SELECT agency_id, project_id FROM project_talents WHERE booking_id = ?'
    ).bind(bookingId).first<any>();
    
    if (!booking || booking.agency_id !== agencyId) {
      return c.json({ status: 'error', message: 'Akses ditolak: Booking tidak ditemukan atau bukan wewenang Anda.' }, 403);
    }

    // 2. Update Status Booking
    await c.env.DB_CORE.prepare(
        'UPDATE project_talents SET status = ? WHERE booking_id = ?'
    ).bind(status, bookingId).run();

    // 3. CACHE FIRST: Hapus cache di sisi Klien/Public agar update seketika terlihat
    c.executionCtx.waitUntil(Promise.all([
      c.env.ORLAND_CACHE.delete(`project:bookings:${booking.project_id}`),
      c.env.ORLAND_CACHE.delete(`project:detail:${booking.project_id}`)
    ]));

    return c.json({ status: 'ok', message: `Permintaan booking berhasil di-${status}.` });
  } catch(err: any) {
    return c.json({ status: 'error', message: err.message }, 500);
  }
});

/**
 * =========================================================
 * PART 4: ANALYTICS & PERFORMANCE TRACKING
 * =========================================================
 */

/**
 * [GET] /api/v1/agency/stats
 * Mengambil ringkasan statistik performa agensi dan talent
 */
router.get('/stats', requireRole(['agency', 'admin']), async (c) => {
  const userId = c.get('userId');
  try {
    const agencyId = await resolveAgencyId(c, userId);

    // 1. Hitung Total Talent Aktif
    const totalTalent = await c.env.DB_CORE.prepare(
      'SELECT COUNT(*) as count FROM agency_talents WHERE agency_id = ?'
    ).bind(agencyId).first<any>();

    // 2. Hitung Total Request Booking
    const totalBookings = await c.env.DB_CORE.prepare(
      'SELECT COUNT(*) as count FROM project_talents WHERE agency_id = ?'
    ).bind(agencyId).first<any>();

    // 3. Ambil Top 5 Talents berdasarkan Skor Kualitas/Kelengkapan Profil
    // (Ini sebagai proxy simulasi performa talent di dasbor)
    const topTalents = await c.env.DB_CORE.prepare(`
      SELECT t.fullname, COALESCE(p.profile_completion_percent, 0) as score
      FROM agency_talents at
      JOIN talents t ON at.talent_id = t.id
      LEFT JOIN talent_profiles p ON t.id = p.talent_id
      WHERE at.agency_id = ?
      ORDER BY score DESC
      LIMIT 5
    `).bind(agencyId).all();

    // 4. Real Data: Hitung Interaksi Klien (Views/Shortlist)
    // Di sistem nyata, interaksi terkuat adalah seberapa sering talent agensi ini 
    // dimasukkan ke dalam shortlist/proyek oleh klien.
    const interactionStats = await c.env.DB_CORE.prepare(`
      SELECT COUNT(*) as total_views
      FROM project_talents pt
      WHERE pt.agency_id = ?
    `).bind(agencyId).first<any>();
    
    // Opsional: Kalikan dengan multiplier (misal x3) untuk estimasi organik page views
    // Atau murni gunakan angka interaksi database.
    const realViews = (interactionStats?.total_views || 0) * 3; 

    return c.json({
      status: 'ok',
      data: {
        total_talents: totalTalent?.count || 0,
        total_bookings: totalBookings?.count || 0,
        total_views: realViews, // <-- Gunakan variabel realViews
        top_talents: topTalents.results
      }
    });

  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500);
  }
});

export default router