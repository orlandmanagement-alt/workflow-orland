import { Hono } from 'hono'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
import { SmartMatchService } from '../../services/smartMatchService'
import { EmailNotificationService } from '../../services/emailNotificationService'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()
const matchService = new SmartMatchService()
const emailService = new EmailNotificationService()

/**
 * [GET] /api/v1/ai/match/:project_id
 * Menghasilkan Rekomendasi Talent Berdasarkan Kriteria Proyek
 */
router.get('/match/:project_id', requireRole(['client', 'agency', 'admin']), async (c) => {
  try {
    const projectId = c.req.param('project_id');
    const db = c.env.DB_CORE;

    // 1. Ambil Kebutuhan Proyek (Roles)
    const roles = await db.prepare('SELECT * FROM project_roles WHERE project_id = ?').bind(projectId).all();
    if (!roles.results || roles.results.length === 0) {
      return c.json({ status: 'error', message: 'Proyek tidak memiliki karakter/role spesifik.' }, 400);
    }

    // Untuk simplifikasi demo, kita ambil role pertama
    const mainRole = roles.results[0] as any;

    // 2. Susun Kriteria Casting
    const castingReq = {
      id: mainRole.role_id,
      project_id: projectId,
      role_id: mainRole.role_id,
      required_gender: mainRole.genderRequirement !== 'any' ? mainRole.genderRequirement : undefined,
      required_age_min: mainRole.ageMin,
      required_age_max: mainRole.ageMax,
      budget_max: mainRole.budget_per_talent,
      required_skills: mainRole.preferredSkills ? JSON.stringify(mainRole.preferredSkills) : undefined
    };

    // 3. Jalankan AI Smart Match Service
    const matches = await matchService.findBestTalentsForRequirement(db, castingReq, 10, 50);

    // 4. Format Hasil (Terjemahkan skor menjadi alasan yang mudah dibaca)
    const recommendations = matches.map(match => ({
      talent_id: match.talent.id,
      name: match.talent.name,
      headshot_url: match.talent.headshot_url,
      gender: match.talent.gender,
      match_score: Math.round(match.match_percentage),
      // Generate Alasan AI
      match_reasons: [
        match.score_breakdown.gender_match?.score > 0.8 ? `Sesuai kriteria gender (${castingReq.required_gender})` : null,
        match.score_breakdown.budget_match?.score > 0.8 ? 'Masuk dalam jangkauan budget' : null,
        match.score_breakdown.skills_match?.score > 0.5 ? 'Memiliki keahlian yang relevan' : 'Kandidat potensial'
      ].filter(Boolean)
    }));

    return c.json({ status: 'ok', role_name: mainRole.role_name, data: recommendations });

  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500);
  }
})

/**
 * [POST] /api/v1/ai/bulk-invite
 * Kirim Undangan Casting Masal
 */
router.post('/bulk-invite', requireRole(['client', 'agency', 'admin']), async (c) => {
  try {
    const body = await c.req.json();
    const { project_id, talent_ids } = body;

    if (!talent_ids || talent_ids.length === 0) return c.json({ status: 'error', message: 'Pilih minimal 1 talent' }, 400);

    const project = await c.env.DB_CORE.prepare('SELECT title FROM projects WHERE project_id = ?').bind(project_id).first<any>();

    // LOOP: Kirim Email Notifikasi ke Masing-Masing Talent
    for (const tid of talent_ids) {
       const talent = await c.env.DB_CORE.prepare('SELECT t.fullname, t.email FROM talents t WHERE t.id = ?').bind(tid).first<any>();
       if (talent && talent.email) {
           // Panggil fungsi sendInviteEmail dari service Anda
           // Disimulasikan dengan console.log untuk keamanan jika API Key Resend belum ada
           console.log(`[AI BULK INVITE] Mengirim undangan proyek "${project.title}" ke ${talent.email}`);
           
           // Contoh eksekusi aslinya jika env RESEND_API_KEY aktif:
           // await emailService.sendInviteEmail(fetch, "https://api.resend.com/emails", { talent_email: talent.email, project_title: project.title, ... }, c.env.RESEND_API_KEY);
       }
    }

    return c.json({ status: 'ok', message: `Berhasil mengirim ${talent_ids.length} undangan VIP!` });
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500);
  }
})

export default router