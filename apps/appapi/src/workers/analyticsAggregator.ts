/**
 * Mission 5: Analytics Aggregation Worker
 * 
 * Purpose: Calculate and aggregate metrics hourly/daily
 * Runs on: Cloudflare Workers or Node.js cron
 * Schedule: Every hour + daily at 00:00 UTC
 */

import type { Database } from 'better-sqlite3';
import type { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// TYPES
// ============================================================================

interface MetricsConfig {
  talentViewsHourly: boolean;
  bookingsHourly: boolean;
  revenueHourly: boolean;
  talentDailySnapshot: boolean;
  agencyDailySnapshot: boolean;
  clientDailySnapshot: boolean;
  funnelMetrics: boolean;
}

interface AggregationResult {
  success: boolean;
  itemsProcessed: number;
  duration: number;
  errors?: string[];
}

interface TalentMetrics {
  talentId: string;
  views: number;
  inquiries: number;
  bookings: number;
  completedBookings: number;
  revenue: number;
  avgRating?: number;
}

// ============================================================================
// ANALYTICS AGGREGATOR - MAIN ORCHESTRATOR
// ============================================================================

export class AnalyticsAggregator {
  private db: any; // D1Database or better-sqlite3
  private config: MetricsConfig;
  private logger: any;

  constructor(db: any, config: Partial<MetricsConfig> = {}) {
    this.db = db;
    this.config = {
      talentViewsHourly: true,
      bookingsHourly: true,
      revenueHourly: true,
      talentDailySnapshot: true,
      agencyDailySnapshot: true,
      clientDailySnapshot: true,
      funnelMetrics: true,
      ...config,
    };
    this.logger = this;
  }

  /**
   * Run hourly aggregation
   * Collects and aggregates raw events into hourly buckets
   */
  async runHourlyAggregation(): Promise<AggregationResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Get the hour timestamp (floor current time to hour)
      const hourTimestamp = this.getHourTimestamp(new Date());
      const dateKey = this.formatDateKey(hourTimestamp);

      // 1. Aggregate talent profile views
      if (this.config.talentViewsHourly) {
        try {
          await this.aggregateTalentViewsHourly(hourTimestamp, dateKey);
        } catch (e) {
          errors.push(`Talent views aggregation failed: ${e}`);
        }
      }

      // 2. Aggregate booking events
      if (this.config.bookingsHourly) {
        try {
          await this.aggregateBookingsHourly(hourTimestamp, dateKey);
        } catch (e) {
          errors.push(`Booking aggregation failed: ${e}`);
        }
      }

      // 3. Aggregate revenue
      if (this.config.revenueHourly) {
        try {
          await this.aggregateRevenueHourly(hourTimestamp, dateKey);
        } catch (e) {
          errors.push(`Revenue aggregation failed: ${e}`);
        }
      }

      // 4. Update cache for real-time dashboards
      await this.refreshDashboardCache();

      return {
        success: errors.length === 0,
        itemsProcessed: 3,
        duration: Date.now() - startTime,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        itemsProcessed: 0,
        duration: Date.now() - startTime,
        errors: [`Hourly aggregation failed: ${error}`],
      };
    }
  }

  /**
   * Run daily aggregation
   * Creates snapshots and calculates daily metrics
   */
  async runDailyAggregation(): Promise<AggregationResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateKey = this.formatDateKey(yesterday);

      // 1. Create daily talent snapshots
      if (this.config.talentDailySnapshot) {
        try {
          await this.createTalentDailySnapshots(yesterday);
        } catch (e) {
          errors.push(`Talent snapshots failed: ${e}`);
        }
      }

      // 2. Create daily agency snapshots
      if (this.config.agencyDailySnapshot) {
        try {
          await this.createAgencyDailySnapshots(yesterday);
        } catch (e) {
          errors.push(`Agency snapshots failed: ${e}`);
        }
      }

      // 3. Create daily client snapshots
      if (this.config.clientDailySnapshot) {
        try {
          await this.createClientDailySnapshots(yesterday);
        } catch (e) {
          errors.push(`Client snapshots failed: ${e}`);
        }
      }

      // 4. Calculate funnel metrics
      if (this.config.funnelMetrics) {
        try {
          await this.calculateFunnelMetrics(yesterday);
        } catch (e) {
          errors.push(`Funnel metrics failed: ${e}`);
        }
      }

      // 5. Update KPI table
      try {
        await this.updateDailyKPIs(yesterday);
      } catch (e) {
        errors.push(`KPI update failed: ${e}`);
      }

      // 6. Calculate cohort retention
      try {
        await this.calculateCohortRetention(yesterday);
      } catch (e) {
        errors.push(`Cohort retention failed: ${e}`);
      }

      // 7. Detect anomalies
      try {
        await this.detectAnomalies(yesterday);
      } catch (e) {
        errors.push(`Anomaly detection failed: ${e}`);
      }

      return {
        success: errors.length === 0,
        itemsProcessed: 7,
        duration: Date.now() - startTime,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        itemsProcessed: 0,
        duration: Date.now() - startTime,
        errors: [`Daily aggregation failed: ${error}`],
      };
    }
  }

  // =========================================================================
  // HOURLY AGGREGATION METHODS
  // =========================================================================

  /**
   * Aggregate talent profile views by hour
   */
  private async aggregateTalentViewsHourly(
    hourTimestamp: Date,
    dateKey: string
  ): Promise<void> {
    const query = `
      INSERT INTO analytics_aggregation_hourly 
      (id, metric_type, entity_type, entity_id, metric_value, hour_timestamp, date_key, source_type, created_at)
      SELECT 
        '${this.generateId()}',
        'views',
        'talent',
        tv.talent_id,
        COUNT(*) as view_count,
        ?,
        ?,
        'profile_view',
        CURRENT_TIMESTAMP
      FROM talent_views tv
      WHERE DATE(tv.created_at) = ? 
        AND HOUR(tv.created_at) = ?
      GROUP BY tv.talent_id
      ON CONFLICT(id) DO NOTHING
    `;

    const hour = hourTimestamp.getHours();
    const date = this.formatDateKey(hourTimestamp).split(' ')[0];

    await this.db.prepare(query).run(hourTimestamp, dateKey, date, hour);
  }

  /**
   * Aggregate bookings by hour
   */
  private async aggregateBookingsHourly(
    hourTimestamp: Date,
    dateKey: string
  ): Promise<void> {
    const query = `
      INSERT INTO analytics_aggregation_hourly 
      (id, metric_type, entity_type, entity_id, metric_value, hour_timestamp, date_key, source_type)
      SELECT 
        '${this.generateId()}',
        'bookings',
        'talent',
        b.talent_id,
        COUNT(*),
        ?,
        ?,
        'booking'
      FROM bookings b
      WHERE DATE(b.created_at) = ? 
        AND HOUR(b.created_at) = ?
      GROUP BY b.talent_id
      ON CONFLICT(id) DO NOTHING
    `;

    const hour = hourTimestamp.getHours();
    const date = this.formatDateKey(hourTimestamp).split(' ')[0];

    await this.db.prepare(query).run(hourTimestamp, dateKey, date, hour);
  }

  /**
   * Aggregate revenue by hour
   */
  private async aggregateRevenueHourly(
    hourTimestamp: Date,
    dateKey: string
  ): Promise<void> {
    const query = `
      INSERT INTO analytics_aggregation_hourly 
      (id, metric_type, entity_type, entity_id, metric_value, hour_timestamp, date_key, currency, source_type)
      SELECT 
        '${this.generateId()}',
        'revenue',
        'talent',
        b.talent_id,
        SUM(b.booking_value),
        ?,
        ?,
        'USD',
        'booking_payment'
      FROM bookings b
      WHERE DATE(b.created_at) = ? 
        AND HOUR(b.created_at) = ?
        AND b.status = 'completed'
      GROUP BY b.talent_id
      ON CONFLICT(id) DO NOTHING
    `;

    const hour = hourTimestamp.getHours();
    const date = this.formatDateKey(hourTimestamp).split(' ')[0];

    await this.db.prepare(query).run(hourTimestamp, dateKey, date, hour);
  }

  // =========================================================================
  // DAILY AGGREGATION METHODS
  // =========================================================================

  /**
   * Create daily talent snapshots
   */
  private async createTalentDailySnapshots(date: Date): Promise<void> {
    const dateStr = this.formatDateKey(date).split(' ')[0];

    const query = `
      INSERT INTO analytics_talent_daily 
      (id, talent_id, metric_date, profile_views, unique_viewers, messages_received, bookings_requested, 
       bookings_confirmed, bookings_completed, earnings_gross, earnings_net, invoices_issued, avg_rating, new_reviews)
      SELECT 
        '${this.generateId()}',
        t.id,
        ?,
        COALESCE(
          (SELECT COUNT(*) FROM talent_views tv WHERE tv.talent_id = t.id AND DATE(tv.created_at) = ?),
          0
        ) as profile_views,
        COALESCE(
          (SELECT COUNT(DISTINCT viewer_id) FROM talent_views tv WHERE tv.talent_id = t.id AND DATE(tv.created_at) = ?),
          0
        ) as unique_viewers,
        COALESCE(
          (SELECT COUNT(*) FROM messages m WHERE m.to_user_id = t.user_id AND DATE(m.created_at) = ?),
          0
        ) as messages_received,
        COALESCE(
          (SELECT COUNT(*) FROM bookings b WHERE b.talent_id = t.id AND DATE(b.created_at) = ? AND b.status IN ('pending', 'requested')),
          0
        ) as bookings_requested,
        COALESCE(
          (SELECT COUNT(*) FROM bookings b WHERE b.talent_id = t.id AND DATE(b.created_at) = ? AND b.status = 'confirmed'),
          0
        ) as bookings_confirmed,
        COALESCE(
          (SELECT COUNT(*) FROM bookings b WHERE b.talent_id = t.id AND DATE(b.completed_at) = ?),
          0
        ) as bookings_completed,
        COALESCE(
          (SELECT SUM(b.booking_value) FROM bookings b WHERE b.talent_id = t.id AND DATE(b.completed_at) = ?),
          0
        ) as earnings_gross,
        COALESCE(
          (SELECT SUM(b.net_payout) FROM bookings b WHERE b.talent_id = t.id AND DATE(b.completed_at) = ?),
          0
        ) as earnings_net,
        COALESCE(
          (SELECT COUNT(*) FROM invoices i WHERE i.talent_id = t.id AND DATE(i.created_at) = ?),
          0
        ) as invoices_issued,
        (SELECT AVG(br.rating) FROM booking_reviews br 
         LEFT JOIN bookings b ON br.booking_id = b.id 
         WHERE b.talent_id = t.id AND DATE(br.created_at) = ?) as avg_rating,
        COALESCE(
          (SELECT COUNT(*) FROM booking_reviews br 
           LEFT JOIN bookings b ON br.booking_id = b.id 
           WHERE b.talent_id = t.id AND DATE(br.created_at) = ?),
          0
        ) as new_reviews
      FROM talents t
      WHERE t.status = 'active'
      ON CONFLICT(talent_id, metric_date) DO UPDATE SET
        profile_views = excluded.profile_views,
        unique_viewers = excluded.unique_viewers,
        bookings_completed = excluded.bookings_completed,
        earnings_gross = excluded.earnings_gross,
        avg_rating = excluded.avg_rating,
        updated_at = CURRENT_TIMESTAMP
    `;

    const params = Array(13).fill(dateStr);
    params.unshift(dateStr); // for the date field itself

    await this.db.prepare(query).run(...params);
  }

  /**
   * Create daily agency snapshots
   */
  private async createAgencyDailySnapshots(date: Date): Promise<void> {
    const dateStr = this.formatDateKey(date).split(' ')[0];

    const query = `
      INSERT INTO analytics_agency_daily 
      (id, agency_id, metric_date, talent_roster_count, total_profile_views, bookings_requested, 
       bookings_confirmed, bookings_completed, revenue_total, invoices_issued, new_clients)
      SELECT 
        '${this.generateId()}',
        a.id,
        ?,
        (SELECT COUNT(*) FROM talents t WHERE t.agency_id = a.id AND t.status = 'active') as talent_count,
        COALESCE(
          (SELECT COUNT(*) FROM talent_views tv 
           LEFT JOIN talents t ON tv.talent_id = t.id 
           WHERE t.agency_id = a.id AND DATE(tv.created_at) = ?),
          0
        ) as total_views,
        COALESCE(
          (SELECT COUNT(*) FROM bookings b 
           LEFT JOIN talents t ON b.talent_id = t.id 
           WHERE t.agency_id = a.id AND DATE(b.created_at) = ? AND b.status IN ('pending', 'requested')),
          0
        ) as bookings_requested,
        COALESCE(
          (SELECT COUNT(*) FROM bookings b 
           LEFT JOIN talents t ON b.talent_id = t.id 
           WHERE t.agency_id = a.id AND DATE(b.created_at) = ? AND b.status = 'confirmed'),
          0
        ) as bookings_confirmed,
        COALESCE(
          (SELECT COUNT(*) FROM bookings b 
           LEFT JOIN talents t ON b.talent_id = t.id 
           WHERE t.agency_id = a.id AND DATE(b.completed_at) = ?),
          0
        ) as bookings_completed,
        COALESCE(
          (SELECT SUM(b.booking_value) FROM bookings b 
           LEFT JOIN talents t ON b.talent_id = t.id 
           WHERE t.agency_id = a.id AND DATE(b.completed_at) = ?),
          0
        ) as revenue_total,
        COALESCE(
          (SELECT COUNT(*) FROM invoices i 
           LEFT JOIN talents t ON i.talent_id = t.id 
           WHERE t.agency_id = a.id AND DATE(i.created_at) = ?),
          0
        ) as invoices_issued,
        COALESCE(
          (SELECT COUNT(DISTINCT b.client_id) FROM bookings b 
           LEFT JOIN talents t ON b.talent_id = t.id 
           WHERE t.agency_id = a.id AND DATE(b.created_at) = ?),
          0
        ) as new_clients
      FROM agencies a
      WHERE a.status = 'active'
      ON CONFLICT(agency_id, metric_date) DO UPDATE SET
        talent_roster_count = excluded.talent_roster_count,
        total_profile_views = excluded.total_profile_views,
        bookings_completed = excluded.bookings_completed,
        revenue_total = excluded.revenue_total,
        updated_at = CURRENT_TIMESTAMP
    `;

    const params = Array(8).fill(dateStr);
    params.unshift(dateStr);

    await this.db.prepare(query).run(...params);
  }

  /**
   * Create daily client snapshots
   */
  private async createClientDailySnapshots(date: Date): Promise<void> {
    const dateStr = this.formatDateKey(date).split(' ')[0];

    const query = `
      INSERT INTO analytics_client_daily 
      (id, client_id, metric_date, talents_searched, talents_viewed, talent_inquiries, 
       bookings_requested, bookings_confirmed, bookings_completed, amount_spent)
      SELECT 
        '${this.generateId()}',
        c.id,
        ?,
        0, -- Would need search_log table
        COALESCE(
          (SELECT COUNT(DISTINCT tv.talent_id) FROM talent_views tv 
           WHERE tv.viewer_id = c.user_id AND DATE(tv.created_at) = ?),
          0
        ) as talents_viewed,
        COALESCE(
          (SELECT COUNT(*) FROM messages m 
           WHERE m.from_user_id = c.user_id AND DATE(m.created_at) = ?),
          0
        ) as talent_inquiries,
        COALESCE(
          (SELECT COUNT(*) FROM bookings b 
           WHERE b.client_id = c.id AND DATE(b.created_at) = ? AND b.status IN ('pending', 'requested')),
          0
        ) as bookings_requested,
        COALESCE(
          (SELECT COUNT(*) FROM bookings b 
           WHERE b.client_id = c.id AND DATE(b.created_at) = ? AND b.status = 'confirmed'),
          0
        ) as bookings_confirmed,
        COALESCE(
          (SELECT COUNT(*) FROM bookings b 
           WHERE b.client_id = c.id AND DATE(b.completed_at) = ?),
          0
        ) as bookings_completed,
        COALESCE(
          (SELECT SUM(b.booking_value) FROM bookings b 
           WHERE b.client_id = c.id AND DATE(b.completed_at) = ?),
          0
        ) as amount_spent
      FROM clients c
      WHERE c.status = 'active'
      ON CONFLICT(client_id, metric_date) DO UPDATE SET
        talents_viewed = excluded.talents_viewed,
        bookings_completed = excluded.bookings_completed,
        amount_spent = excluded.amount_spent,
        updated_at = CURRENT_TIMESTAMP
    `;

    const params = Array(7).fill(dateStr);
    params.unshift(dateStr);

    await this.db.prepare(query).run(...params);
  }

  /**
   * Calculate funnel metrics for the day
   */
  private async calculateFunnelMetrics(date: Date): Promise<void> {
    const dateStr = this.formatDateKey(date).split(' ')[0];

    const query = `
      INSERT INTO analytics_funnel_daily 
      (id, metric_date, talent_profile_views, talent_contact_requests, booking_requests, 
       booking_confirmed, booking_completed, contracts_signed, payments_released, disputes_raised)
      SELECT 
        '${this.generateId()}',
        ?,
        (SELECT COUNT(*) FROM talent_views WHERE DATE(created_at) = ?),
        (SELECT COUNT(*) FROM messages WHERE DATE(created_at) = ? AND message_type = 'inquiry'),
        (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = ? AND status IN ('pending', 'requested')),
        (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = ? AND status = 'confirmed'),
        (SELECT COUNT(*) FROM bookings WHERE DATE(completed_at) = ?),
        (SELECT COUNT(*) FROM contracts WHERE DATE(signed_at) = ?),
        (SELECT COUNT(*) FROM payments WHERE DATE(released_at) = ?),
        (SELECT COUNT(*) FROM disputes WHERE DATE(created_at) = ?)
      ON CONFLICT(metric_date) DO UPDATE SET
        talent_profile_views = excluded.talent_profile_views,
        booking_requests = excluded.booking_requests,
        booking_completed = excluded.booking_completed
    `;

    const params = Array(9).fill(dateStr);
    params.unshift(dateStr);

    await this.db.prepare(query).run(...params);
  }

  /**
   * Update daily KPI snapshot
   */
  private async updateDailyKPIs(date: Date): Promise<void> {
    const dateStr = this.formatDateKey(date).split(' ')[0];

    const query = `
      INSERT INTO analytics_kpi_daily 
      (id, kpi_date, talent_views_total, bookings_total, revenue_total, platform_users_active)
      SELECT 
        '${this.generateId()}',
        ?,
        (SELECT COUNT(*) FROM talent_views WHERE DATE(created_at) = ?),
        (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = ?),
        (SELECT COALESCE(SUM(booking_value), 0) FROM bookings WHERE DATE(completed_at) = ?),
        (SELECT COUNT(DISTINCT id) FROM users WHERE last_active_at >= DATE_SUB(?, INTERVAL 7 DAY))
      ON CONFLICT(kpi_date) DO UPDATE SET
        talent_views_total = excluded.talent_views_total,
        bookings_total = excluded.bookings_total,
        revenue_total = excluded.revenue_total
    `;

    const params = [dateStr, dateStr, dateStr, dateStr, dateStr];

    await this.db.prepare(query).run(...params);
  }

  /**
   * Calculate cohort retention metrics
   */
  private async calculateCohortRetention(date: Date): Promise<void> {
    // Simplified example - would need more complex logic
    const query = `
      SELECT cohort_date, COUNT(DISTINCT user_id) as cohort_size
      FROM users
      WHERE DATE(created_at) = ?
      GROUP BY cohort_date
    `;

    const result = await this.db.prepare(query).all(this.formatDateKey(date));
    // Process cohort data and update retention metrics
  }

  /**
   * Detect anomalies in metrics
   */
  private async detectAnomalies(date: Date): Promise<void> {
    // Calculate standard deviation for key metrics
    // Flag any values > 2 standard deviations from mean
    const query = `
      SELECT 
        metric_type,
        entity_type,
        metric_value,
        (SELECT AVG(metric_value) FROM analytics_aggregation_hourly 
         WHERE metric_type = aah.metric_type AND DATE(hour_timestamp) >= DATE_SUB(?, INTERVAL 30 DAY)
         AND DATE(hour_timestamp) < ?) as avg_value,
        (SELECT STDDEV(metric_value) FROM analytics_aggregation_hourly 
         WHERE metric_type = aah.metric_type AND DATE(hour_timestamp) >= DATE_SUB(?, INTERVAL 30 DAY)
         AND DATE(hour_timestamp) < ?) as std_dev
      FROM analytics_aggregation_hourly aah
      WHERE DATE(hour_timestamp) = ?
    `;

    const dateStr = this.formatDateKey(date).split(' ')[0];
    const results = await this.db.prepare(query).all(dateStr, dateStr, dateStr, dateStr, dateStr);

    // Insert anomalies if detected
    for (const row of results) {
      if (row.std_dev && Math.abs(row.metric_value - row.avg_value) > 2 * row.std_dev) {
        const anomalyId = this.generateId();
        const insertQuery = `
          INSERT INTO analytics_anomalies 
          (id, metric_type, entity_type, entity_id, expected_value, actual_value, severity, detected_at, detection_method)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const deviation = Math.abs(row.metric_value - row.avg_value) / row.std_dev;
        const severity = deviation > 3 ? 'high' : deviation > 2.5 ? 'medium' : 'low';

        await this.db.prepare(insertQuery).run(
          anomalyId,
          row.metric_type,
          row.entity_type,
          row.entity_id,
          row.avg_value,
          row.metric_value,
          severity,
          new Date(),
          'std_dev'
        );
      }
    }
  }

  /**
   * Refresh dashboard cache
   */
  private async refreshDashboardCache(): Promise<void> {
    // Clear expired cache entries
    const deleteQuery = `DELETE FROM analytics_metrics_cache WHERE expires_at < CURRENT_TIMESTAMP`;
    await this.db.prepare(deleteQuery).run();

    // Cache will be recalculated on demand via dashboard APIs
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  private getHourTimestamp(date: Date): Date {
    const ts = new Date(date);
    ts.setMinutes(0, 0, 0);
    return ts;
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// EXPORT FOR CLOUDFLARE WORKER / NODE.js
// ============================================================================

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const { pathname, searchParams } = new URL(request.url);

    if (pathname === '/aggregate/hourly') {
      const db = env.DB;
      const aggregator = new AnalyticsAggregator(db);
      const result = await aggregator.runHourlyAggregation();

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
        status: result.success ? 200 : 500,
      });
    }

    if (pathname === '/aggregate/daily') {
      const db = env.DB;
      const aggregator = new AnalyticsAggregator(db);
      const result = await aggregator.runDailyAggregation();

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
        status: result.success ? 200 : 500,
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  },

  // Scheduled handler for Cloudflare Workers
  async scheduled(event: any, env: any, ctx: any) {
    const db = env.DB;
    const aggregator = new AnalyticsAggregator(db);

    if (event.cron === '0 * * * *') {
      // Hourly at :00
      await aggregator.runHourlyAggregation();
    }

    if (event.cron === '0 0 * * *') {
      // Daily at 00:00
      await aggregator.runDailyAggregation();
    }
  },
};
