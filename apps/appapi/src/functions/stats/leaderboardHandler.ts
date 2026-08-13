/**
 * Leaderboard Handler
 * Purpose: Expose talent rankings via REST API
 */

import { Hono } from 'hono';
import { Bindings, Variables } from '../../index';
import { LeaderboardService } from '../../services/leaderboardService';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /api/v1/leaderboard/top
 * Get top talents overall
 *
 * Query params:
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 * - period: 'all_time' | 'monthly' | 'weekly' (default: 'all_time')
 */
router.get('/top', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const offset = parseInt(c.req.query('offset') || '0');
    const period = (c.req.query('period') || 'all_time') as any;

    const leaderboard = new LeaderboardService(
      c.env.DB_CORE,
      c.env.ORLAND_CACHE
    );

    const rankings = await leaderboard.getTopTalents(limit, offset, period);

    return c.json({
      status: 'success',
      data: {
        period,
        limit,
        offset,
        rankings,
        total: rankings.length,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return c.json(
      { error: 'Failed to fetch leaderboard', message: error.message },
      500
    );
  }
});

/**
 * GET /api/v1/leaderboard/category/:category
 * Get top talents in specific category
 *
 * Query params:
 * - limit: number (default: 20, max: 100)
 * - period: 'all_time' | 'monthly' | 'weekly' (default: 'all_time')
 */
router.get('/category/:category', async (c) => {
  try {
    const category = decodeURIComponent(c.req.param('category'));
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const period = (c.req.query('period') || 'all_time') as any;

    const leaderboard = new LeaderboardService(
      c.env.DB_CORE,
      c.env.ORLAND_CACHE
    );

    const rankings = await leaderboard.getTopTalentsByCategory(
      category,
      limit,
      period
    );

    return c.json({
      status: 'success',
      data: {
        category,
        period,
        limit,
        rankings,
        total: rankings.length,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return c.json(
      { error: 'Failed to fetch category leaderboard', message: error.message },
      500
    );
  }
});

/**
 * GET /api/v1/leaderboard/all-categories
 * Get leaderboards for all categories
 *
 * Query params:
 * - limit: number (default: 10, perleaderboard)
 * - period: 'all_time' | 'monthly' | 'weekly' (default: 'all_time')
 */
router.get('/all-categories', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);
    const period = (c.req.query('period') || 'all_time') as any;

    const leaderboard = new LeaderboardService(
      c.env.DB_CORE,
      c.env.ORLAND_CACHE
    );

    const leaderboards = await leaderboard.getAllCategoryLeaderboards(
      limit,
      period
    );

    return c.json({
      status: 'success',
      data: {
        period,
        limit,
        leaderboards,
        total_categories: leaderboards.length,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return c.json(
      { error: 'Failed to fetch category leaderboards', message: error.message },
      500
    );
  }
});

/**
 * GET /api/v1/leaderboard/trending
 * Get trending talents (rising stars)
 *
 * Query params:
 * - limit: number (default: 10, max: 50)
 */
router.get('/trending', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);

    const leaderboard = new LeaderboardService(
      c.env.DB_CORE,
      c.env.ORLAND_CACHE
    );

    const trending = await leaderboard.getTrendingTalents(limit);

    return c.json({
      status: 'success',
      data: {
        type: 'trending',
        limit,
        rankings: trending,
        total: trending.length,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return c.json(
      { error: 'Failed to fetch trending talents', message: error.message },
      500
    );
  }
});

/**
 * GET /api/v1/leaderboard/talent/:talent_id
 * Get specific talent's rank
 *
 * Query params:
 * - category: string (optional, filters rank by category)
 * - period: 'all_time' | 'monthly' | 'weekly' (default: 'all_time')
 */
router.get('/talent/:talent_id', async (c) => {
  try {
    const talent_id = c.req.param('talent_id');
    const category = c.req.query('category');
    const period = (c.req.query('period') || 'all_time') as any;

    const leaderboard = new LeaderboardService(
      c.env.DB_CORE,
      c.env.ORLAND_CACHE
    );

    const rank = await leaderboard.getTalentRank(talent_id, category, period);

    if (!rank) {
      return c.json({ error: 'Talent not found or not ranked' }, 404);
    }

    return c.json({
      status: 'success',
      data: {
        talent_id,
        category: category || 'all',
        period,
        rank: rank.rank,
        percentile: rank.percentile,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return c.json(
      {
        error: 'Failed to fetch talent rank',
        message: error.message,
      },
      500
    );
  }
});

export default router;
