import { Hono } from 'hono'
import { LeaderboardService } from '../../services/leaderboardService'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

/**
 * [GET] /api/v1/leaderboard
 * Mengambil peringkat Top Talent dengan KV Caching super cepat
 */
router.get('/', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const period = (c.req.query('period') || 'all_time') as 'all_time' | 'monthly' | 'weekly';
    
    // Inisialisasi Service menggunakan D1 dan KV dari environment Cloudflare
    const leaderboardService = new LeaderboardService(c.env.DB_CORE, c.env.ORLAND_CACHE);
    
    // Tarik data peringkat
    const rankings = await leaderboardService.getTopTalents(limit, 0, period);

    return c.json({ status: 'ok', period: period, data: rankings });
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500);
  }
})

export default router