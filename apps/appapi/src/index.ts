import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { verify, decode } from 'hono/jwt' // Tambahkan 'decode'

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

export type Bindings = { DB_CORE: D1Database; DB_LOGS: D1Database; DB_SSO: D1Database; ORLAND_CACHE: KVNamespace; R2_MEDIA: R2Bucket; JWT_SECRET: string; TALENT_URL: string; CLIENT_URL: string; CF_ACCOUNT_ID: string; R2_ACCESS_KEY_ID: string; R2_SECRET_ACCESS_KEY: string }
export type Variables = { userId: string; userRole: string }

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'] }))

// ALAT PENYADAP TERPASANG DI SINI
app.use('/api/v1/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return await next()
  if (c.req.path.startsWith('/api/v1/verify/') || c.req.path.startsWith('/api/v1/public/')) return await next()
  
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("[AUTH-API] Ditolak: Tidak ada Header Authorization yang valid.");
      return c.json({ status: "error", message: "Unauthorized: Token JWT tidak ditemukan" }, 401)
  }
  
  const jwtToken = authHeader.split(' ')[1]
  
  // 1. Coba Decode Token tanpa Verifikasi (hanya untuk melihat isinya)
  try {
      const decoded = decode(jwtToken);
      console.log("[AUTH-API] Token berhasil di-decode (belum diverifikasi):", JSON.stringify(decoded));
  } catch (decodeErr) {
      console.error("[AUTH-API] Gagal men-decode Token. Format token rusak:", decodeErr);
  }

  // 2. Coba Verifikasi Token dengan JWT_SECRET
  try {
    const payload = await verify(jwtToken, c.env.JWT_SECRET || 'orland-rahasia-utama-123')
    console.log("[AUTH-API] Token Berhasil Diverifikasi untuk User:", payload.sub);
    c.set('userId', payload.sub as string)
    c.set('userRole', payload.role as string)
    await next()
  } catch (err: any) { 
    // INI YANG PALING PENTING: Mencetak detail error ke log
    console.error("[AUTH-API] DETAIL ERROR VERIFIKASI JWT:", err.message || err);
    console.error("[AUTH-API] JWT_SECRET yang digunakan (10 karakter pertama):", (c.env.JWT_SECRET || 'orland-rahasia-utama-123').substring(0, 10) + "...");
    
    return c.json({ status: "error", message: `Unauthorized: JWT Error - ${err.message || 'Unknown'}` }, 401) 
  }
})

app.get('/health', (c) => c.json({ status: 'Online', modules_loaded: 30 }))

app.route('/api/v1/talents', talentRouter)
// ... (Saya persingkat router lainnya) ...
app.route('/api/v1', miscToolsRouter)

export default app
