import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

// Cloudflare Workers type imports
import type { D1Database, KVNamespace, R2Bucket, Fetcher } from '@cloudflare/workers-types'

/**
 * IMPORT SEMUA ROUTER FUNGSIONAL
 */
import talentRouter from './functions/talents/talentHandler'
import experienceRouter from './functions/talents/experienceHandler'
import certificationRouter from './functions/talents/certificationHandler'
import bankAccountRouter from './functions/talents/bankAccountHandler'
import rateCardRouter from './functions/talents/rateCardHandler'
import internalNoteRouter from './functions/talents/internalNoteHandler'
import clientRouter from './functions/clients/clientHandler'
import projectRouter from './functions/projects/projectHandler'
import evaluationRouter from './functions/projects/evaluationHandler'
import bookingRouter from './functions/bookings/bookingHandler'
import scheduleRouter from './functions/schedules/scheduleHandler'
import mediaRouter from './functions/media/mediaHandler'
import notificationRouter from './functions/notifications/notificationHandler'
import broadcastRouter from './functions/notifications/broadcastHandler'
import messageRouter from './functions/messages/messageHandler'
import financialRouter from './functions/financials/financialHandler'
import kycRouter from './functions/kyc/kycHandler'
import kybRouter from './functions/kyb/kybHandler'
import masterDataRouter from './functions/master/masterDataHandler'
import searchRouter from './functions/search/searchHandler'
import aiSearchRouter from './functions/ai/aiSearchHandler'
import kolToolsRouter from './functions/tools/kolToolsHandler'
import woEoToolsRouter from './functions/tools/woEoToolsHandler'
import liveBoardRouter from './functions/castings/liveBoardHandler'
import systemRoleRouter from './functions/system/systemRoleHandler'
import disputeRouter from './functions/system/disputeHandler'
import dashboardRouter from './functions/stats/dashboardHandler'
import webhookRouter from './functions/webhooks/webhookHandler'
import commsRouter from './functions/comms/commsHandler'
import systemToolsRouter from './functions/system/systemToolsHandler'
import miscToolsRouter from './functions/tools/miscToolsHandler'
import publicTalentRouter from './functions/public/publicTalentHandler'
import agencyRouter from './functions/agency/agencyHandler'
import adminCrudRouter from './functions/admin/adminCrudHandler'
import adminChatRouter from './functions/admin/adminChatHandler'
import fintechRouter from './functions/fintech/fintechHandler'
import aiMatchRouter from './functions/ai/aiMatchHandler'
import analyticsRouter from './functions/analytics/analyticsHandler'
import whitelabelRouter from './functions/whitelabel/whitelabelHandler'
import availabilityRouter from './functions/calendar/availabilityHandler'
import recommendationsRouter from './functions/casting/recommendationsHandler'
import leaderboardRouter from './functions/stats/leaderboardHandler'

/**
 * TYPE DEFINITIONS
 */
export type Bindings = { 
  DB_CORE: D1Database; 
  DB_LOGS: D1Database; 
  DB_SSO: D1Database; 
  DB_ARCHIVES: D1Database;
  ORLAND_CACHE: KVNamespace; 
  R2_MEDIA: R2Bucket; 
  JWT_SECRET: string; 
  TALENT_URL: string; 
  CLIENT_URL: string; 
  ADMIN_URL: string;
  AGENCY_URL: string;
  EMAIL_SERVICE_URL?: string;
  EMAIL_SERVICE_API_KEY?: string;
}

export type Variables = { 
  userId: string; 
  userRole: string; 
  userTier: string;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

/**
 * 1. KONFIGURASI CORS PRO (Multi-Domain & Credentials)
 * Mengizinkan akses dari seluruh ekosistem Orland Management.
 */
app.use('*', cors({ 
  origin: (origin) => {
    const allowedDomains = [
      'https://www.orlandmanagement.com',
      'https://sso.orlandmanagement.com',
      'https://admin.orlandmanagement.com',
      'https://agency.orlandmanagement.com',
      'https://talent.orlandmanagement.com',
      'https://client.orlandmanagement.com',
      'http://localhost:8787',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    return allowedDomains.includes(origin) ? origin : null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
}))

/**
 * 2. GLOBAL GATEKEEPER MIDDLEWARE (Sync dengan DB_SSO Skema 027)
 * Memvalidasi sesi pengguna secara real-time terhadap Database SSO.
 */
app.use('/api/v1/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return await next()
  if (c.req.path.startsWith('/api/v1/public/')) return await next()
  
  let sid = null;

  // JALUR 1: Ekstrak SID dari JWT (Header Authorization)
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // Decode JWT menggunakan Secret terpusat
      const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
      sid = payload.sid; // Mendapatkan session_id (UUID) asli
    } catch (e) { 
      console.warn("JWT Verification Failed atau Kadaluarsa"); 
    }
  }

  // JALUR 2: Cek Cookie 'sid' jika jalur 1 gagal (Silent Auth)
  if (!sid) sid = getCookie(c, 'sid');

  if (!sid) return c.json({ status: "error", message: "Unauthorized: Sesi tidak ditemukan" }, 401);

  try {
    // QUERY SESI: Menggunakan kolom session_id & is_active sesuai Skema 027
    const session = await c.env.DB_SSO.prepare(
      "SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > datetime('now') AND is_active = 1"
    ).bind(sid).first<{ user_id: string }>();

    if (!session) return c.json({ status: "error", message: "Unauthorized: Sesi tidak valid atau telah berakhir" }, 401);

    // VALIDASI USER: Menggunakan kolom id, user_type, dan is_active sesuai Skema 027
    const user = await c.env.DB_SSO.prepare(
      "SELECT id, user_type, is_active FROM users WHERE id = ?"
    ).bind(session.user_id).first<{ id: string, user_type: string, is_active: number }>();
    
    if (!user || user.is_active === 0) {
      return c.json({ status: "error", message: "Unauthorized: Akun ditangguhkan atau tidak ditemukan" }, 401);
    }

    // Set variabel context untuk digunakan oleh router internal
    c.set('userId', user.id);
    c.set('userRole', user.user_type); // Memetakan user_type ke role
    c.set('userTier', 'free'); // Default tier (bisa ditambahkan ke skema users jika diperlukan)
    
    await next();
  } catch (err) {
    console.error("Critical Auth Error:", err);
    return c.json({ status: "error", message: "Internal Server Error saat validasi sesi" }, 500);
  }
});

/**
 * 3. ROUTING PORTAL ORLAND
 */
app.get('/health', (c) => c.json({ status: 'Online', modules_loaded: 42 }))
app.get('/api/v1/auth/verify-session', (c) => c.json({ 
  status: 'ok', 
  userId: c.get('userId'), 
  userRole: c.get('userRole') 
}))
app.get('/api/v1/auth/me', async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ status: 'error', message: 'Unauthorized' }, 401)

  const user = await c.env.DB_SSO.prepare(
    `SELECT id, email, phone, first_name, last_name, user_type, is_active,
            email_verified, email_verified_at, phone_verified, phone_verified_at,
            pin_required, profile_completed, last_login, last_login_ip,
            two_factor_enabled, two_factor_method
     FROM users WHERE id = ?`
  ).bind(userId).first<any>()

  if (!user || user.is_active === 0) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401)
  }

  return c.json({ status: 'ok', user, role: user.user_type })
})

// MOUNTING SEMUA ROUTER BISNIS
app.route('/api/v1/talents', talentRouter)
app.route('/api/v1/talents', experienceRouter)
app.route('/api/v1/talents', certificationRouter)
app.route('/api/v1/talents', bankAccountRouter)
app.route('/api/v1/talents', rateCardRouter)
app.route('/api/v1/talents', internalNoteRouter)
app.route('/api/v1/clients', clientRouter)
app.route('/api/v1/projects', projectRouter)
app.route('/api/v1/projects', evaluationRouter)
app.route('/api/v1', bookingRouter)
app.route('/api/v1', scheduleRouter)
app.route('/api/v1/media', mediaRouter)
app.route('/api/v1/notifications', notificationRouter)
app.route('/api/v1/system/broadcast', broadcastRouter)
app.route('/api/v1/messages', messageRouter)
app.route('/api/v1/financials', financialRouter)
app.route('/api/v1/kyc', kycRouter)
app.route('/api/v1/kyb', kybRouter)
app.route('/api/v1/master', masterDataRouter)
app.route('/api/v1/search', searchRouter)
app.route('/api/v1/ai', aiSearchRouter)
app.route('/api/v1/tools/kol', kolToolsRouter)
app.route('/api/v1/tools/events', woEoToolsRouter)
app.route('/api/v1', liveBoardRouter)
app.route('/api/v1/system', systemRoleRouter)
app.route('/api/v1/disputes', disputeRouter)
app.route('/api/v1/stats', dashboardRouter)
app.route('/api/v1/webhooks', webhookRouter)
app.route('/api/v1/tools/comms', commsRouter)
app.route('/api/v1/system', systemToolsRouter)
app.route('/api/v1/tools', miscToolsRouter)
app.route('/api/v1/public/talents', publicTalentRouter)
app.route('/api/v1/agency', agencyRouter)
app.route('/api/v1/admin', adminCrudRouter)
app.route('/api/v1/admin', adminChatRouter)
app.route('/api/v1', fintechRouter)
app.route('/api/v1/ai', aiMatchRouter)
app.route('/api/v1/talents', analyticsRouter)
app.route('/api/v1/rankings', analyticsRouter)
app.route('/api/v1/dashboard', analyticsRouter)
app.route('/api/v1/agencies', whitelabelRouter)
app.route('/api/v1/whitelabel', whitelabelRouter)
app.route('/api/v1/talents', availabilityRouter)
app.route('/api/v1/public', availabilityRouter)
app.route('/api/v1/ai', recommendationsRouter)
app.route('/api/v1/recommendations', recommendationsRouter)
app.route('/api/v1/leaderboard', leaderboardRouter)
app.route('/api/v1/public', recommendationsRouter)

/**
 * 4. PUBLIC R2 MEDIA ACCESS
 * Menyediakan akses langsung ke file media di Cloudflare R2 secara publik.
 */
app.get("/api/v1/public/media/:key", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.R2_MEDIA.get(key);
  if (!object) return c.text("Gambar Tidak Ditemukan", 404);
  
  const headers = new Headers();
  object.writeHttpMetadata(headers as any);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000"); // Cache 1 tahun
  
  return new Response(object.body as any, { headers: headers as any });
});

export { ChatRoom } from './functions/messages/ChatRoom';
export default app