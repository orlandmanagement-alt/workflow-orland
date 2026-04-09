/**
 * Analytics & Profile Views Tracking
 * Tracks talent profile views and calculates ranking/gamification metrics
 */

import { Hono } from 'hono';
import { Context } from 'hono';
import type { Bindings, Variables } from '../../index';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Middleware: Track profile view
 * Automatically log view when talent profile is accessed
 */
export const trackProfileView = async (c: Context, talentId: string) => {
  try {
    const viewerId = c.get('userId') || null;
    const now = new Date().toISOString();
    const viewId = `pv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Get user agent and basic info for analytics
    const userAgent = c.req.header('User-Agent') || 'unknown';

    await c.env.DB_LOGS.prepare(`
      INSERT INTO profile_views (id, talent_id, viewer_id, user_agent, viewed_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(viewId, talentId, viewerId, userAgent, now).run();

    // Update talent analytics asynchronously (non-blocking)
    updateTalentAnalytics(c.env, talentId).catch(err => 
  } catch (error) {
    // Don't fail the main request if tracking fails
  }
};

/**
 * Update talent analytics (views, score, rank)
 */
async function updateTalentAnalytics(env: any, talentId: string) {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Count views in different time periods
    const [views7d, views30d, viewsAllTime] = await Promise.all([
      env.DB_LOGS.prepare(`
        SELECT COUNT(*) as count FROM profile_views 
        WHERE talent_id = ? AND viewed_at > ?
      `).bind(talentId, sevenDaysAgo).first<any>(),
      
      env.DB_LOGS.prepare(`
        SELECT COUNT(*) as count FROM profile_views 
        WHERE talent_id = ? AND viewed_at > ?
      `).bind(talentId, thirtyDaysAgo).first<any>(),

      env.DB_LOGS.prepare(`
        SELECT COUNT(*) as count FROM profile_views 
        WHERE talent_id = ?
      `).bind(talentId).first<any>()
    ]);

    const v7d = views7d?.count || 0;
    const v30d = views30d?.count || 0;
    const vAll = viewsAllTime?.count || 0;

    // Calculate score (simple formula: 40% recent, 30% monthly, 30% all-time)
    const score = (v7d * 0.4) + (v30d * 0.3) + (vAll * 0.3);

    // Get rank tier based on 7-day views
    let rankTier = 'emerging';
    const allTalentsTop7d = await env.DB_LOGS.prepare(`
      SELECT talent_id, COUNT(*) as view_count
      FROM profile_views
      WHERE viewed_at > ?
      GROUP BY talent_id
      ORDER BY view_count DESC
      LIMIT 100
    `).bind(sevenDaysAgo).all<any>();

    const talentRank = allTalentsTop7d.results.findIndex(t => t.talent_id === talentId) + 1;

    if (talentRank <= Math.ceil(allTalentsTop7d.results.length * 0.01)) {
      rankTier = 'top_1';
    } else if (talentRank <= Math.ceil(allTalentsTop7d.results.length * 0.05)) {
      rankTier = 'top_5';
    } else if (talentRank <= Math.ceil(allTalentsTop7d.results.length * 0.1)) {
      rankTier = 'top_10';
    } else if (talentRank <= Math.ceil(allTalentsTop7d.results.length * 0.25)) {
      rankTier = 'top_25';
    } else if (talentRank <= Math.ceil(allTalentsTop7d.results.length * 0.5)) {
      rankTier = 'mid';
    }

    // Upsert talent analytics
    const now_iso = new Date().toISOString();
    const analyticsId = `analytics_${talentId}`;

    await env.DB_CORE.prepare(`
      INSERT INTO talent_analytics (id, talent_id, views_7d, views_30d, views_all_time, rank_tier, score, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(talent_id) DO UPDATE SET 
        views_7d = ?,
        views_30d = ?,
        views_all_time = ?,
        rank_tier = ?,
        score = ?,
        last_updated = ?
    `).bind(
      analyticsId, talentId, v7d, v30d, vAll, rankTier, score, now_iso,
      v7d, v30d, vAll, rankTier, score, now_iso
    ).run();

  } catch (error) {
  }
}

/**
 * GET /api/v1/talents/:id/analytics
 * Get talent profile analytics
 */
app.get('/talents/:id/analytics', async (c) => {
  const talentId = c.req.param('id');

  try {
    // Get talent analytics
    const analytics = await c.env.DB_CORE.prepare(`
      SELECT * FROM talent_analytics WHERE talent_id = ?
    `).bind(talentId).first<any>();

    if (!analytics) {
      return c.json({
        status: 'success',
        data: {
          views_7d: 0,
          views_30d: 0,
          views_all_time: 0,
          rank_tier: 'emerging',
          score: 0,
          message: 'No analytics data yet'
        }
      });
    }

    // Get percentage rank
    const allTalents = await c.env.DB_CORE.prepare(`
      SELECT COUNT(*) as total FROM talent_analytics
    `).first<any>();

    // Get rank position
    const betterThanCount = await c.env.DB_CORE.prepare(`
      SELECT COUNT(*) as count FROM talent_analytics
      WHERE score > ? AND talent_id != ?
    `).bind(analytics.score, talentId).first<any>();

    const percentile = Math.round(
      ((allTalents.total - betterThanCount.count) / allTalents.total) * 100
    );

    return c.json({
      status: 'success',
      data: {
        ...analytics,
        percentile,
        insights: {
          trend_7d: 'trending_up' // Could be calculated from historical data
        }
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch analytics' }, 500);
  }
});

/**
 * GET /api/v1/dashboard/talent/analytics
 * Get talent's own analytics dashboard
 */
app.get('/dashboard/talent/analytics', async (c) => {
  const userId = c.get('userId');

  try {
    // Get talent ID from user
    const talent = await c.env.DB_CORE.prepare(
      'SELECT id, name FROM talents WHERE user_id = ?'
    ).bind(userId).first<any>();

    if (!talent) {
      return c.json({ error: 'Talent profile not found' }, 404);
    }

    // Get analytics
    const analytics = await c.env.DB_CORE.prepare(`
      SELECT 
        views_7d,
        views_30d,
        views_all_time,
        rank_tier,
        score
      FROM talent_analytics
      WHERE talent_id = ?
    `).bind(talent.id).first<any>();

    // Get daily breakdown for 7-day chart
    const dailyViews = await c.env.DB_LOGS.prepare(`
      SELECT 
        DATE(viewed_at) as date,
        COUNT(*) as views
      FROM profile_views
      WHERE talent_id = ?
      AND viewed_at > datetime('now', '-7 days')
      GROUP BY DATE(viewed_at)
      ORDER BY date DESC
    `).bind(talent.id).all<any>();

    // Get top referrers (if available from tracking)
    const topReferrers = await c.env.DB_LOGS.prepare(`
      SELECT user_agent, COUNT(*) as count
      FROM profile_views
      WHERE talent_id = ?
      AND viewed_at > datetime('now', '-30 days')
      GROUP BY user_agent
      ORDER BY count DESC
      LIMIT 5
    `).bind(talent.id).all<any>();

    return c.json({
      status: 'success',
      data: {
        talentName: talent.name,
        overview: analytics || {
          views_7d: 0,
          views_30d: 0,
          views_all_time: 0,
          rank_tier: 'emerging',
          score: 0
        },
        dailyBreakdown: dailyViews.results,
        stats: {
          avgViewsPerDay: analytics ? Math.round(analytics.views_7d / 7) : 0,
          growthRate: analytics ? `${Math.round((analytics.views_7d / analytics.views_30d) * 100)}%` : 'N/A'
        }
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch analytics' }, 500);
  }
});

/**
 * GET /api/v1/rankings
 * Get talent rankings and leaderboard
 */
app.get('/rankings', async (c) => {
  try {
    const period = c.req.query('period') || '7d'; // 7d, 30d, alltime
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const category = c.req.query('category') || '';

    let query = `
      SELECT 
        ta.talent_id,
        t.name,
        t.category,
        t.profile_picture_url,
        ta.views_7d,
        ta.views_30d,
        ta.views_all_time,
        ta.rank_tier,
        ta.score,
        ROW_NUMBER() OVER (ORDER BY ta.score DESC) as rank
      FROM talent_analytics ta
      JOIN talents t ON ta.talent_id = t.id
      WHERE t.profile_visible = true
    `;

    let params: any[] = [];

    if (category) {
      query += ` AND t.category = ?`;
      params.push(category);
    }

    query += ` ORDER BY ta.score DESC LIMIT ?`;
    params.push(limit);

    const rankings = await c.env.DB_CORE.prepare(query)
      .bind(...params)
      .all<any>();

    return c.json({
      status: 'success',
      data: {
        period,
        category: category || 'all',
        rankings: rankings.results
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch rankings' }, 500);
  }
});

export default app;
