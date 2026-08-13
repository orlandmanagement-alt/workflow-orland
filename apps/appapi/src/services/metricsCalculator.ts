/**
 * Mission 5: Analytics Metrics Calculator
 * 
 * Purpose: Calculate advanced analytics metrics and KPIs
 * Used by: Dashboard APIs, reports, and aggregation workers
 */

export interface MetricsResult {
  value: number;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
  previousPeriod?: number;
}

export interface DashboardMetrics {
  overview: OverviewMetrics;
  trends: TrendMetrics;
  distribution: DistributionMetrics;
  comparison: ComparisonMetrics;
}

export interface OverviewMetrics {
  totalUsers: number;
  activeUsers30Days: number;
  totalBookings: number;
  totalRevenue: number;
  platformFees: number;
  avgBookingValue: number;
}

export interface TrendMetrics {
  bookingsTrend: MetricsResult;
  revenueTrend: MetricsResult;
  newUsersTrend: MetricsResult;
  conversionRateTrend: MetricsResult;
}

export interface DistributionMetrics {
  byUserType: { [key: string]: number };
  byCategory: { [key: string]: number };
  byStatus: { [key: string]: number };
  byTier: { [key: string]: number };
}

export interface ComparisonMetrics {
  weekOverWeek: { [key: string]: number };
  monthOverMonth: { [key: string]: number };
  yearOverYear: { [key: string]: number };
}

// ============================================================================
// METRICS CALCULATOR
// ============================================================================

export class MetricsCalculator {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Calculate talent performance metrics
   */
  async calculateTalentMetrics(
    talentId: string,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<{
    views: MetricsResult;
    bookings: MetricsResult;
    revenue: MetricsResult;
    rating: MetricsResult;
    completionRate: MetricsResult;
    responseTime: MetricsResult;
  }> {
    const dayOffset = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const previousOffset = dayOffset * 2;

    const currentQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN metric_type = 'views' THEN metric_value ELSE 0 END), 0) as views,
        COALESCE(SUM(CASE WHEN metric_type = 'bookings' THEN metric_value ELSE 0 END), 0) as bookings,
        COALESCE(SUM(CASE WHEN metric_type = 'revenue' THEN metric_value ELSE 0 END), 0) as revenue
      FROM analytics_aggregation_hourly
      WHERE entity_id = ? 
        AND entity_type = 'talent'
        AND hour_timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const previousQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN metric_type = 'views' THEN metric_value ELSE 0 END), 0) as views,
        COALESCE(SUM(CASE WHEN metric_type = 'bookings' THEN metric_value ELSE 0 END), 0) as bookings,
        COALESCE(SUM(CASE WHEN metric_type = 'revenue' THEN metric_value ELSE 0 END), 0) as revenue
      FROM analytics_aggregation_hourly
      WHERE entity_id = ? 
        AND entity_type = 'talent'
        AND hour_timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND hour_timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const current = await this.db.prepare(currentQuery).get(talentId, dayOffset);
    const previous = await this.db.prepare(previousQuery).get(
      talentId,
      previousOffset,
      dayOffset
    );

    const talentQuery = `
      SELECT 
        avg_rating,
        booking_completion_rate,
        response_time_minutes
      FROM talents
      WHERE id = ?
    `;

    const talent = await this.db.prepare(talentQuery).get(talentId);

    return {
      views: this.calculateTrend(current.views, previous.views),
      bookings: this.calculateTrend(current.bookings, previous.bookings),
      revenue: this.calculateTrend(current.revenue, previous.revenue),
      rating: {
        value: talent?.avg_rating || 0,
      },
      completionRate: {
        value: talent?.booking_completion_rate || 0,
      },
      responseTime: {
        value: talent?.response_time_minutes || 0,
      },
    };
  }

  /**
   * Calculate agency performance metrics
   */
  async calculateAgencyMetrics(
    agencyId: string,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<{
    portfolioViews: MetricsResult;
    bookings: MetricsResult;
    revenue: MetricsResult;
    avgTalentRating: MetricsResult;
    clientRetention: MetricsResult;
    talentRosterSize: number;
  }> {
    const dayOffset = period === 'day' ? 1 : period === 'week' ? 7 : 30;

    const query = `
      SELECT 
        SUM(total_profile_views) as total_views,
        SUM(bookings_completed) as bookings,
        SUM(revenue_total) as revenue,
        AVG(avg_rating) as avg_rating,
        AVG(clients_retained_percentage) as client_retention,
        (SELECT COUNT(*) FROM talents WHERE agency_id = ? AND status = 'active') as roster_size
      FROM analytics_agency_daily
      WHERE agency_id = ?
        AND metric_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;

    const result = await this.db.prepare(query).get(agencyId, agencyId, dayOffset);

    return {
      portfolioViews: { value: result?.total_views || 0 },
      bookings: { value: result?.bookings || 0 },
      revenue: { value: result?.revenue || 0 },
      avgTalentRating: { value: result?.avg_rating || 0 },
      clientRetention: { value: result?.client_retention || 0 },
      talentRosterSize: result?.roster_size || 0,
    };
  }

  /**
   * Calculate client spending metrics
   */
  async calculateClientMetrics(
    clientId: string,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<{
    totalSpent: MetricsResult;
    bookingsCount: MetricsResult;
    avgBookingValue: MetricsResult;
    repeatTalentRate: MetricsResult;
    churnRisk: number; // 0-100
  }> {
    const dayOffset = period === 'day' ? 1 : period === 'week' ? 7 : 30;

    const query = `
      SELECT 
        SUM(amount_spent) as total_spent,
        SUM(bookings_completed) as bookings,
        AVG(avg_booking_value) as avg_value,
        AVG(repeat_talent_rate) as repeat_rate,
        MAX(days_since_activity) as days_inactive
      FROM analytics_client_daily
      WHERE client_id = ?
        AND metric_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;

    const result = await this.db.prepare(query).get(clientId, dayOffset);

    // Calculate churn risk based on inactivity
    let churnRisk = 0;
    if (result?.days_inactive) {
      if (result.days_inactive > 90) churnRisk = 90;
      else if (result.days_inactive > 60) churnRisk = 70;
      else if (result.days_inactive > 30) churnRisk = 40;
      else if (result.days_inactive > 14) churnRisk = 20;
    }

    return {
      totalSpent: { value: result?.total_spent || 0 },
      bookingsCount: { value: result?.bookings || 0 },
      avgBookingValue: { value: result?.avg_value || 0 },
      repeatTalentRate: { value: result?.repeat_rate || 0 },
      churnRisk,
    };
  }

  /**
   * Calculate platform-wide KPIs
   */
  async calculatePlatformKPIs(
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<DashboardMetrics> {
    const dayOffset = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const compareOffset = dayOffset * 2;

    // Current period
    const currentQuery = `
      SELECT 
        talent_views_total,
        bookings_total,
        revenue_total,
        platform_users_active,
        new_users_total
      FROM analytics_kpi_daily
      WHERE kpi_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY kpi_date DESC
      LIMIT 1
    `;

    const current = await this.db.prepare(currentQuery).get(dayOffset);

    // Previous period for comparison
    const previousQuery = `
      SELECT 
        bookings_total,
        revenue_total,
        new_users_total
      FROM analytics_kpi_daily
      WHERE kpi_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND kpi_date < DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY kpi_date DESC
      LIMIT 1
    `;

    const previous = await this.db.prepare(previousQuery).get(
      compareOffset,
      dayOffset
    );

    // Conversion rate
    const conversionQuery = `
      SELECT 
        (SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as rate
      FROM bookings
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const conversion = await this.db.prepare(conversionQuery).get(dayOffset);

    // Distribution by user type
    const distributionQuery = `
      SELECT 
        user_type,
        COUNT(*) as count
      FROM users
      WHERE is_active = 1
      GROUP BY user_type
    `;

    const distributions = await this.db.prepare(distributionQuery).all();
    const byUserType: { [key: string]: number } = {};
    distributions.forEach((d: any) => {
      byUserType[d.user_type] = d.count;
    });

    // By tier distribution
    const tierQuery = `
      SELECT 
        CASE 
          WHEN avg_rating >= 4.8 THEN 'Platinum'
          WHEN avg_rating >= 4.5 THEN 'Gold'
          WHEN avg_rating >= 4.0 THEN 'Silver'
          ELSE 'Bronze'
        END as tier,
        COUNT(*) as count
      FROM talents
      WHERE status = 'active'
      GROUP BY tier
    `;

    const tiers = await this.db.prepare(tierQuery).all();
    const byTier: { [key: string]: number } = {};
    tiers.forEach((t: any) => {
      byTier[t.tier] = t.count;
    });

    return {
      overview: {
        totalUsers: this.sumUserTypes(byUserType),
        activeUsers30Days: current?.platform_users_active || 0,
        totalBookings: current?.bookings_total || 0,
        totalRevenue: current?.revenue_total || 0,
        platformFees: (current?.revenue_total || 0) * 0.2, // Assuming 20% take
        avgBookingValue: (current?.revenue_total || 0) / Math.max(current?.bookings_total || 1, 1),
      },
      trends: {
        bookingsTrend: this.calculateTrend(
          current?.bookings_total || 0,
          previous?.bookings_total || 0
        ),
        revenueTrend: this.calculateTrend(
          current?.revenue_total || 0,
          previous?.revenue_total || 0
        ),
        newUsersTrend: this.calculateTrend(
          current?.new_users_total || 0,
          previous?.new_users_total || 0
        ),
        conversionRateTrend: {
          value: conversion?.rate || 0,
        },
      },
      distribution: {
        byUserType,
        byCategory: {}, // Would need category breakdown
        byStatus: {}, // Would need status breakdown
        byTier,
      },
      comparison: {
        weekOverWeek: {},
        monthOverMonth: {},
        yearOverYear: {},
      },
    };
  }

  /**
   * Calculate retention cohorts
   */
  async calculateRetention(
    cohortType: 'signup' | 'first_booking' | 'first_payment',
    lookbackDays: number = 90
  ): Promise<Array<{ cohortDate: string; retention: { [key: number]: number } }>> {
    const query = `
      SELECT 
        cohort_date,
        users_count,
        retention_day_0,
        retention_day_1,
        retention_day_7,
        retention_day_14,
        retention_day_30,
        retention_day_60,
        retention_day_90
      FROM analytics_cohort
      WHERE cohort_type = ?
        AND cohort_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY cohort_date DESC
    `;

    const results = await this.db.prepare(query).all(cohortType, lookbackDays);

    return results.map((row: any) => ({
      cohortDate: row.cohort_date,
      retention: {
        0: row.retention_day_0 || 100,
        1: row.retention_day_1 || 0,
        7: row.retention_day_7 || 0,
        14: row.retention_day_14 || 0,
        30: row.retention_day_30 || 0,
        60: row.retention_day_60 || 0,
        90: row.retention_day_90 || 0,
      },
    }));
  }

  /**
   * Calculate revenue breakdown
   */
  async calculateRevenueBreakdown(
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<{
    totalRevenue: number;
    bySource: { [key: string]: number };
    byGeography: { [key: string]: number };
    byCurrency: { [key: string]: number };
  }> {
    const dayOffset = period === 'day' ? 1 : period === 'week' ? 7 : 30;

    const query = `
      SELECT 
        revenue_usd,
        revenue_eur,
        revenue_gbp,
        revenue_from_agency_fees,
        revenue_from_talent_fees,
        revenue_from_escrow_interest,
        revenue_from_premium
      FROM analytics_revenue_summary
      WHERE summary_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY summary_date DESC
      LIMIT 1
    `;

    const result = await this.db.prepare(query).get(dayOffset);

    const totalRevenue =
      (result?.revenue_usd || 0) +
      (result?.revenue_eur || 0) +
      (result?.revenue_gbp || 0);

    return {
      totalRevenue,
      bySource: {
        agencyFees: result?.revenue_from_agency_fees || 0,
        talentFees: result?.revenue_from_talent_fees || 0,
        escrowInterest: result?.revenue_from_escrow_interest || 0,
        premium: result?.revenue_from_premium || 0,
      },
      byGeography: {}, // Would need geography breakdown
      byCurrency: {
        USD: result?.revenue_usd || 0,
        EUR: result?.revenue_eur || 0,
        GBP: result?.revenue_gbp || 0,
      },
    };
  }

  /**
   * Detect anomalies in recent metrics
   */
  async detectAnomalies(
    severity: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<
    Array<{
      metricType: string;
      entityType: string;
      severity: string;
      deviation: number;
      detectedAt: string;
    }>
  > {
    const severityFilter = severity === 'high' ? ['high'] : severity === 'medium' ? ['high', 'medium'] : ['high', 'medium', 'low'];

    const query = `
      SELECT 
        metric_type,
        entity_type,
        severity,
        ABS(((actual_value - expected_value) / expected_value) * 100) as deviation,
        detected_at
      FROM analytics_anomalies
      WHERE reviewed = 0
        AND severity IN (${severityFilter.map(() => '?').join(',')})
        AND detected_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY severity DESC, detected_at DESC
    `;

    return await this.db.prepare(query).all(...severityFilter);
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  private calculateTrend(
    current: number,
    previous: number
  ): MetricsResult {
    if (previous === 0) {
      return {
        value: current,
        trend: current > 0 ? 'up' : 'stable',
        changePercent: 0,
        previousPeriod: 0,
      };
    }

    const changePercent = ((current - previous) / previous) * 100;
    const trend: 'up' | 'down' | 'stable' =
      changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable';

    return {
      value: current,
      trend,
      changePercent: Math.round(changePercent * 100) / 100,
      previousPeriod: previous,
    };
  }

  private sumUserTypes(byType: { [key: string]: number }): number {
    return Object.values(byType).reduce((a, b) => a + b, 0);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const createMetricsCalculator = (db: any) => new MetricsCalculator(db);
