/**
 * Leaderboard Service with KV Caching
 * Purpose: Fast talent rankings with caching using Cloudflare KV
 */

import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

export interface TalentRanking {
  rank: number;
  talent_id: string;
  name: string;
  category: string;
  rating: number;
  booking_count: number;
  completion_rate: number;
  monthly_bookings: number;
  estimated_earnings: number;
  profile_image: string;
  verification_badge: boolean;
}

export interface LeaderboardCategory {
  category: string;
  period: 'all_time' | 'monthly' | 'weekly';
  rankings: TalentRanking[];
  updated_at: string;
  cache_ttl: number;
}

export class LeaderboardService {
  private db: D1Database;
  private cache: KVNamespace;

  constructor(db: D1Database, cache: KVNamespace) {
    this.db = db;
    this.cache = cache;
  }

  /**
   * Get top talents overall (with caching)
   */
  async getTopTalents(
    limit: number = 20,
    offset: number = 0,
    period: 'all_time' | 'monthly' | 'weekly' = 'all_time'
  ): Promise<TalentRanking[]> {
    const cacheKey = `leaderboard:top-talents:${period}:${limit}:${offset}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey, 'json');
    if (cached) {
      return cached as TalentRanking[];
    }

    // Query database
    const rankings = await this.queryTalentRankings(period, limit, offset);
    
    // Cache for 1 hour
    await this.cache.put(cacheKey, JSON.stringify(rankings), {
      expirationTtl: 3600,
    });

    return rankings;
  }

  /**
   * Get top talents by category (with caching)
   */
  async getTopTalentsByCategory(
    category: string,
    limit: number = 20,
    period: 'all_time' | 'monthly' | 'weekly' = 'all_time'
  ): Promise<TalentRanking[]> {
    const cacheKey = `leaderboard:category:${category}:${period}:${limit}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey, 'json');
    if (cached) {
      return cached as TalentRanking[];
    }

    // Query database
    const rankings = await this.queryTalentRankingsByCategory(
      category,
      period,
      limit
    );
    
    // Cache for 1 hour
    await this.cache.put(cacheKey, JSON.stringify(rankings), {
      expirationTtl: 3600,
    });

    return rankings;
  }

  /**
   * Get all category leaderboards
   */
  async getAllCategoryLeaderboards(
    limit: number = 10,
    period: 'all_time' | 'monthly' | 'weekly' = 'all_time'
  ): Promise<LeaderboardCategory[]> {
    const cacheKey = `leaderboard:all-categories:${period}:${limit}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey, 'json');
    if (cached) {
      return cached as LeaderboardCategory[];
    }

    // Get unique categories
    const categories = await this.db
      .prepare(`SELECT DISTINCT category FROM talents WHERE profile_visible = true`)
      .all<any>();

    // Fetch rankings for each category
    const leaderboards: LeaderboardCategory[] = [];
    for (const row of categories.results || []) {
      const rankings = await this.queryTalentRankingsByCategory(
        row.category,
        period,
        limit
      );

      leaderboards.push({
        category: row.category,
        period,
        rankings,
        updated_at: new Date().toISOString(),
        cache_ttl: 3600,
      });
    }

    // Cache for 2 hours
    await this.cache.put(cacheKey, JSON.stringify(leaderboards), {
      expirationTtl: 7200,
    });

    return leaderboards;
  }

  /**
   * Get talent's rank in category
   */
  async getTalentRank(
    talentId: string,
    category?: string,
    period: 'all_time' | 'monthly' | 'weekly' = 'all_time'
  ): Promise<{ rank: number; percentile: number } | null> {
    const cacheKey = `leaderboard:talent-rank:${talentId}:${category || 'all'}:${period}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey, 'json');
    if (cached) {
      return cached as { rank: number; percentile: number };
    }

    // Query database
    let query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY ${this.getPeriodSortColumn(period)} DESC) as rank,
        talent_id
      FROM (
        SELECT
          t.talent_id,
          ${this.getPeriodMetricColumn(period)} as metric
        FROM talents t
        LEFT JOIN bookings b ON t.talent_id = b.talent_id
        ${category ? 'WHERE t.category = ?' : 'WHERE t.profile_visible = true'}
        GROUP BY t.talent_id
      ) ranked
    `;

    const params = category ? [category] : [];
    const result = await this.db.prepare(query).bind(...params).all<any>();

    // Find talent's rank
    const talentRank = result.results?.find(
      (r: any) => r.talent_id === talentId
    );

    if (!talentRank) {
      return null;
    }

    const totalTalents = result.results?.length || 1;
    const percentile = Math.round((talentRank.rank / totalTalents) * 100);

    const rankData = { rank: talentRank.rank, percentile };

    // Cache for 30 minutes
    await this.cache.put(cacheKey, JSON.stringify(rankData), {
      expirationTtl: 1800,
    });

    return rankData;
  }

  /**
   * Invalidate cache when talent data changes
   */
  async invalidateCache(talentId?: string, category?: string): Promise<void> {
    const keysToDelete: string[] = [];

    // Invalidate talent-specific caches
    if (talentId) {
      keysToDelete.push(`leaderboard:talent-rank:${talentId}:all:all_time`);
      keysToDelete.push(`leaderboard:talent-rank:${talentId}:all:monthly`);
      keysToDelete.push(`leaderboard:talent-rank:${talentId}:all:weekly`);
      if (category) {
        keysToDelete.push(`leaderboard:talent-rank:${talentId}:${category}:all_time`);
        keysToDelete.push(`leaderboard:talent-rank:${talentId}:${category}:monthly`);
        keysToDelete.push(`leaderboard:talent-rank:${talentId}:${category}:weekly`);
      }
    }

    // Invalidate category leaderboards
    if (category) {
      keysToDelete.push(`leaderboard:category:${category}:all_time:20`);
      keysToDelete.push(`leaderboard:category:${category}:monthly:20`);
      keysToDelete.push(`leaderboard:category:${category}:weekly:20`);
    } else {
      // Invalidate all caches if full refresh
      keysToDelete.push(`leaderboard:top-talents:all_time:20:0`);
      keysToDelete.push(`leaderboard:top-talents:monthly:20:0`);
      keysToDelete.push(`leaderboard:top-talents:weekly:20:0`);
      keysToDelete.push(`leaderboard:all-categories:all_time:10`);
      keysToDelete.push(`leaderboard:all-categories:monthly:10`);
      keysToDelete.push(`leaderboard:all-categories:weekly:10`);
    }

    // Delete cache keys in parallel
    await Promise.all(
      keysToDelete.map((key) => this.cache.delete(key).catch(() => {}))
    );
  }

  /**
   * Get trending talents (rising stars)
   */
  async getTrendingTalents(limit: number = 10): Promise<TalentRanking[]> {
    const cacheKey = `leaderboard:trending:${limit}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey, 'json');
    if (cached) {
      return cached as TalentRanking[];
    }

    // Get talents with most bookings in last 30 days
    const trending = await this.db.prepare(`
      SELECT
        t.talent_id,
        t.name,
        t.category,
        ROUND(AVG(b.rating), 2) as rating,
        COUNT(b.booking_id) as booking_count,
        ROUND(100.0 * SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 0) as completion_rate,
        0 as monthly_bookings,
        0 as estimated_earnings,
        t.profile_image,
        t.verification_badge
      FROM talents t
      LEFT JOIN bookings b ON t.talent_id = b.talent_id
      WHERE t.profile_visible = true
      AND b.created_at > datetime('now', '-30 days')
      GROUP BY t.talent_id
      ORDER BY booking_count DESC, rating DESC
      LIMIT ?
    `).bind(limit).all<any>();

    const rankings = (trending.results || []).map((r: any, idx: number) => ({
      rank: idx + 1,
      talent_id: r.talent_id,
      name: r.name,
      category: r.category,
      rating: r.rating || 0,
      booking_count: r.booking_count || 0,
      completion_rate: r.completion_rate || 0,
      monthly_bookings: r.booking_count || 0,
      estimated_earnings: 0,
      profile_image: r.profile_image || '',
      verification_badge: r.verification_badge || false,
    }));

    // Cache for 30 minutes (trending changes more frequently)
    await this.cache.put(cacheKey, JSON.stringify(rankings), {
      expirationTtl: 1800,
    });

    return rankings;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async queryTalentRankings(
    period: 'all_time' | 'monthly' | 'weekly',
    limit: number,
    offset: number
  ): Promise<TalentRanking[]> {
    const results = await this.db.prepare(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY ${this.getPeriodSortColumn(
          period
        )} DESC) as rank,
        t.talent_id,
        t.name,
        COALESCE(t.category, 'Other') as category,
        ROUND(AVG(b.rating), 2) as rating,
        COUNT(DISTINCT b.booking_id) as booking_count,
        ROUND(100.0 * SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 0) as completion_rate,
        COALESCE(SUM(CASE WHEN b.created_at > datetime('now', '-30 days') THEN 1 ELSE 0 END), 0) as monthly_bookings,
        0 as estimated_earnings,
        t.profile_image,
        COALESCE(t.verification_badge, false) as verification_badge
      FROM talents t
      LEFT JOIN bookings b ON t.talent_id = b.talent_id
      WHERE t.profile_visible = true
      GROUP BY t.talent_id
      ORDER BY ${this.getPeriodSortColumn(period)} DESC
      LIMIT ?
      OFFSET ?
    `).bind(limit, offset).all<any>();

    return (results.results || []).map((r: any) => ({
      rank: r.rank,
      talent_id: r.talent_id,
      name: r.name,
      category: r.category,
      rating: r.rating || 0,
      booking_count: r.booking_count || 0,
      completion_rate: r.completion_rate || 0,
      monthly_bookings: r.monthly_bookings || 0,
      estimated_earnings: r.estimated_earnings || 0,
      profile_image: r.profile_image || '',
      verification_badge: r.verification_badge || false,
    }));
  }

  private async queryTalentRankingsByCategory(
    category: string,
    period: 'all_time' | 'monthly' | 'weekly',
    limit: number
  ): Promise<TalentRanking[]> {
    const results = await this.db.prepare(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY ${this.getPeriodSortColumn(
          period
        )} DESC) as rank,
        t.talent_id,
        t.name,
        t.category,
        ROUND(AVG(b.rating), 2) as rating,
        COUNT(DISTINCT b.booking_id) as booking_count,
        ROUND(100.0 * SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 0) as completion_rate,
        COALESCE(SUM(CASE WHEN b.created_at > datetime('now', '-30 days') THEN 1 ELSE 0 END), 0) as monthly_bookings,
        0 as estimated_earnings,
        t.profile_image,
        COALESCE(t.verification_badge, false) as verification_badge
      FROM talents t
      LEFT JOIN bookings b ON t.talent_id = b.talent_id
      WHERE t.profile_visible = true
      AND t.category = ?
      GROUP BY t.talent_id
      ORDER BY ${this.getPeriodSortColumn(period)} DESC
      LIMIT ?
    `).bind(category, limit).all<any>();

    return (results.results || []).map((r: any) => ({
      rank: r.rank,
      talent_id: r.talent_id,
      name: r.name,
      category: r.category,
      rating: r.rating || 0,
      booking_count: r.booking_count || 0,
      completion_rate: r.completion_rate || 0,
      monthly_bookings: r.monthly_bookings || 0,
      estimated_earnings: r.estimated_earnings || 0,
      profile_image: r.profile_image || '',
      verification_badge: r.verification_badge || false,
    }));
  }

  private getPeriodSortColumn(period: string): string {
    switch (period) {
      case 'weekly':
        return 'COUNT(CASE WHEN b.created_at > datetime("now", "-7 days") THEN 1 END)';
      case 'monthly':
        return 'COUNT(CASE WHEN b.created_at > datetime("now", "-30 days") THEN 1 END)';
      default:
        return 'COUNT(DISTINCT b.booking_id)';
    }
  }

  private getPeriodMetricColumn(period: string): string {
    switch (period) {
      case 'weekly':
        return 'COUNT(CASE WHEN b.created_at > datetime("now", "-7 days") THEN 1 END)';
      case 'monthly':
        return 'COUNT(CASE WHEN b.created_at > datetime("now", "-30 days") THEN 1 END)';
      default:
        return 'COUNT(b.booking_id)';
    }
  }
}

export default LeaderboardService;
