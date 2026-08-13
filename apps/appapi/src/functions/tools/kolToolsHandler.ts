import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { briefSchema, draftSchema, reviewDraftSchema, linkSchema, analysisSchema } from './toolSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// --- BRIEFS & DRAFTS ---
router.post('/campaigns/:project_id/briefs', requireRole(['admin', 'client']), zValidator('json', briefSchema), async (c) => {
  const body = c.req.valid('json')
  const briefId = crypto.randomUUID()
  await c.env.DB_CORE.prepare('INSERT INTO kol_briefs (brief_id, project_id, content, guidelines) VALUES (?, ?, ?, ?)')
    .bind(briefId, c.req.param('project_id'), body.content, JSON.stringify(body.guidelines)).run()
  return c.json({ status: 'ok', id: briefId }, 201)
})

router.post('/tasks/:task_id/drafts', requireRole(['talent']), zValidator('json', draftSchema), async (c) => {
  const body = c.req.valid('json')
  const draftId = crypto.randomUUID()
  // Asumsi task_id = booking_id untuk KOL
  await c.env.DB_CORE.prepare('INSERT INTO kol_content_drafts (draft_id, booking_id, video_url) VALUES (?, ?, ?)')
    .bind(draftId, c.req.param('task_id'), body.video_url).run()
  return c.json({ status: 'ok', id: draftId }, 201)
})

router.put('/tasks/:task_id/drafts/review', requireRole(['admin', 'client']), zValidator('json', reviewDraftSchema), async (c) => {
  const body = c.req.valid('json')
  // Untuk simplifikasi, kita update semua draft milik task (booking) tersebut yang pending
  const result = await c.env.DB_CORE.prepare("UPDATE kol_content_drafts SET status = ?, feedback = ? WHERE booking_id = ? AND status = 'Pending Review'")
    .bind(body.status, body.feedback, c.req.param('task_id')).run()
  if (result.meta.changes === 0) return c.json({ status: 'error', message: 'Not found or already reviewed' }, 404)
  return c.json({ status: 'ok', message: 'Draft reviewed' })
})

// --- TRACKING LINKS ---
router.post('/campaigns/:project_id/tracking-links', requireRole(['admin', 'client']), zValidator('json', linkSchema), async (c) => {
  const body = c.req.valid('json')
  const linkId = crypto.randomUUID()
  // Generate tracking URL internal (misal: https://api.orlandmanagement.com/r/link_id)
  const trackUrl = `https://api.orlandmanagement.com/r/${linkId}`
  // Asumsi parameter URL project_id diubah jadi booking_id pada implementasi DB sebenarnya jika link unik per KOL
  await c.env.DB_CORE.prepare('INSERT INTO kol_tracking_links (link_id, booking_id, url) VALUES (?, ?, ?)')
    .bind(linkId, c.req.param('project_id'), body.url).run()
  return c.json({ status: 'ok', link_url: trackUrl }, 201)
})

// --- AI SENTIMENT ANALYSIS (Simulasi Cloudflare Workers AI) ---
router.post('/sentiment-analysis', requireRole(['admin']), zValidator('json', analysisSchema), async (c) => {
  const body = c.req.valid('json')
  const logId = crypto.randomUUID()
  
  // SIMULASI: Di production, kamu akan memanggil env.AI.run('@cf/huggingface/distilbert-sst-2-int8', { text: comments })
  // Di sini kita membuat mock score untuk contoh
  const positiveScore = Math.random() * 0.8 + 0.2 // Random 0.2 - 1.0
  const negativeScore = 1.0 - positiveScore
  
  await c.env.DB_LOGS.prepare('INSERT INTO kol_sentiment_logs (log_id, talent_id, positive_score, negative_score) VALUES (?, ?, ?, ?)')
    .bind(logId, body.talent_id, positiveScore, negativeScore).run()
    
  return c.json({ status: 'ok', scores: { positive: positiveScore, negative: negativeScore } }, 201)
})

export default router
