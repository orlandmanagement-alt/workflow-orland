import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { verify } from 'hono/jwt'

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

app.use('/api/v1/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return await next()
  if (c.req.path.startsWith('/api/v1/verify/') || c.req.path.startsWith('/api/v1/public/')) return await next()
  
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ status: "error", message: "Unauthorized" }, 401)
  }
  
  try {
    const jwtToken = authHeader.split(' ')[1]
    const payload = await verify(jwtToken, c.env.JWT_SECRET || 'orland-rahasia-utama-123', 'HS256')
    c.set('userId', payload.sub as string)
    c.set('userRole', payload.role as string)
    await next()
  } catch (err) { 
    return c.json({ status: "error", message: "Unauthorized" }, 401) 
  }
})

app.get('/health', (c) => c.json({ status: 'Online', modules_loaded: 30 }))
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
app.route('/api/v1', financialRouter)
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

// PUBLIC R2 MEDIA SERVER (Tanpa JWT)
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

export default app
