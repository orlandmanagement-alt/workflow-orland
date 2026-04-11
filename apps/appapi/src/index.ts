import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie } from 'hono/cookie'

// Cloudflare Workers type imports
import type { D1Database, KVNamespace, R2Bucket, Fetcher } from '@cloudflare/workers-types'

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
import adminCrudRouter from './functions/admin/adminCrudHandler'
import adminChatRouter from './functions/admin/adminChatHandler'
import fintechRouter from './functions/fintech/fintechHandler'
import aiMatchRouter from './functions/ai/aiMatchHandler'
import analyticsRouter from './functions/analytics/analyticsHandler'
import whitelabelRouter from './functions/whitelabel/whitelabelHandler'
import availabilityRouter from './functions/calendar/availabilityHandler'

export type Bindings = { DB_CORE: D1Database; DB_LOGS: D1Database; DB_SSO: D1Database; ORLAND_CACHE: KVNamespace; R2_MEDIA: R2Bucket; R2_BUCKET?: R2Bucket; R2_PUBLIC_URL?: string; JWT_SECRET: string; TALENT_URL: string; CLIENT_URL: string; CF_ACCOUNT_ID: string; R2_ACCESS_KEY_ID: string; R2_SECRET_ACCESS_KEY: string; CF_AI_GATEWAY?: Fetcher }
export type Variables = { userId: string; userRole: string; userTier: string }

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 1. KONFIGURASI CORS: Mendukung Credentials untuk Cookie antar-domain
app.use('*', cors({ 
  origin: (origin) => {
    const allowedDomains = [
      'https://www.orlandmanagement.com',
      'https://sso.orlandmanagement.com',
      'https://admin.orlandmanagement.com',
      'https://talent.orlandmanagement.com',
      'https://client.orlandmanagement.com',
      'http://localhost:8787',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    return allowedDomains.includes(origin) ? origin : null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
}))

// 2. MIDDLEWARE GATEKEEPER GLOBAL (SYNC DENGAN SKEMA 027)
app.use('/api/v1/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return await next()
  if (c.req.path.startsWith('/api/v1/public/')) return await next()
  
  let userId = null;

  // JALUR A: Cek Bearer Token dari Header Authorization
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // PERBAIKAN: Gunakan session_id sesuai skema baru
    const session = await c.env.DB_SSO.prepare(
      "SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > datetime('now') AND is_active = 1"
    ).bind(token).first<any>();
    if (session) userId = session.user_id;
  }

  // JALUR B: Cek Cookie 'sid' jika Bearer Token tidak ada
  if (!userId) {
    const sid = getCookie(c, 'sid');
    if (sid) {
      const session = await c.env.DB_SSO.prepare(
        "SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > datetime('now') AND is_active = 1"
      ).bind(sid).first<any>();
      if (session) userId = session.user_id;
    }
  }

  if (!userId) {
    return c.json({ status: "error", message: "Unauthorized: Sesi tidak valid atau telah berakhir" }, 401);
  }

  // VALIDASI USER (SYNC DENGAN SKEMA 027)
  // Perbaikan: Gunakan user_type, is_active, dan id
  const user = await c.env.DB_SSO.prepare(
    "SELECT id, user_type, is_active FROM users WHERE id = ?"
  ).bind(userId).first<any>();
  
  if (!user || user.is_active === 0) {
    return c.json({ status: "error", message: "Unauthorized: Akun tidak ditemukan atau dinonaktifkan" }, 401);
  }

  // Inject data ke context agar bisa dibaca router/middleware lain
  c.set('userId', user.id);
  c.set('userRole', user.user_type);
  
  await next();
});

// ROUTES DEFINITION
app.get('/health', (c) => c.json({ status: 'Online', modules_loaded: 42 }))
app.get('/api/v1/auth/verify-session', (c) => c.json({ status: 'ok', userId: c.get('userId'), userRole: c.get('userRole') }))

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
app.route('/api/v1', miscToolsRouter)
app.route('/api/v1/public/talents', publicTalentRouter)
app.route('/api/v1/admin', adminCrudRouter)
app.route('/api/v1/admin', adminChatRouter)
app.route('/api/v1/contracts', fintechRouter)
app.route('/api/v1/ai', aiMatchRouter)
app.route('/api/v1/talents', analyticsRouter)
app.route('/api/v1/rankings', analyticsRouter)
app.route('/api/v1/dashboard', analyticsRouter)
app.route('/api/v1/agencies', whitelabelRouter)
app.route('/api/v1/whitelabel', whitelabelRouter)
app.route('/api/v1/talents', availabilityRouter)
app.route('/api/v1/public', availabilityRouter)
app.route('/api/v1/admin', availabilityRouter)

// PUBLIC R2 MEDIA SERVER
app.get("/api/v1/public/media/:key", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.R2_MEDIA.get(key);
  if (!object) return c.text("Gambar Tidak Ditemukan", 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000");
  return new Response(object.body, { headers });
});

export { ChatRoom } from './functions/messages/ChatRoom';
export default app