import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { vectorPayloadSchema } from '../search/searchSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

// Asumsi: Kamu sudah membuat Vectorize index dengan nama "TALENT_VECTORS" di Cloudflare
type AIBindings = Bindings & { TALENT_VECTORS: any; AI: any }
const router = new Hono<{ Bindings: AIBindings; Variables: Variables }>()

router.post('/search-similarity', requireRole(['admin', 'client']), zValidator('json', vectorPayloadSchema), async (c) => {
  try { // <-- ADD TRY HERE
    const body = c.req.valid('json')
    
    let vectorRes;
    
    // Gunakan BGE model untuk Text Embeddings. Jika image, simulasikan text-to-image prompt (krn keterbatasan Workers AI image input size di free tier, kita fallback ke text untuk demo ini)
    const queryStr = body.text_query || "Professional model talent casting";
    vectorRes = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [queryStr] });
    
    let talentIds: string[] = [];
    if (c.env.TALENT_VECTORS) {
      const dbVector = Array.isArray(vectorRes.data) && vectorRes.data[0] ? vectorRes.data[0] : vectorRes.data;
      const matches = await c.env.TALENT_VECTORS.query(dbVector, { topK: 5 });
      talentIds = matches.matches.map((m: any) => m.id);
    } else {
      // Fallback jika Vectorize belum di-binding/buat di Dashboard (untuk menghindari crash)
      talentIds = ['talent-mock-uuid-1', 'talent-mock-uuid-2'];
    }
    
    if (talentIds.length === 0) return c.json({ status: 'ok', matches: [] });

    const placeholders = talentIds.map(() => '?').join(',');
    const { results } = await c.env.DB_CORE.prepare(`SELECT * FROM talents WHERE talent_id IN (${placeholders})`).bind(...talentIds).all();

    return c.json({ status: 'ok', matches: results || [], ai_status: c.env.TALENT_VECTORS ? 'live' : 'fallback' });
    
  } catch (e) {
    return c.json({ status: 'error', message: 'Gagal melakukan pencarian berbasis AI' }, 500);
  }
})

export default router