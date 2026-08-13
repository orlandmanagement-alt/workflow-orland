/**
 * Mission 5: Analytics API Handlers
 * 
 * Purpose: HTTP endpoints for analytics dashboards and reporting
 * Routes: /api/v1/analytics/*
 * Methods: All dashboards, exports, custom reports
 */

import { Router } from 'itty-router';
import type { IRequest } from 'itty-router';
import { MetricsCalculator } from '../services/metricsCalculator';
import { ExportService } from '../services/exportService';

// ============================================================================
// TYPES
// ============================================================================

interface AnalyticsRequest extends IRequest {
  user?: {
    id: string;
    userType: 'talent' | 'agency' | 'client' | 'admin';
  };
  db?: any;
}

// ============================================================================
// ANALYTICS ROUTER
// ============================================================================

export function createAnalyticsRouter(db: any) {
  const router = Router<AnalyticsRequest>();

  // =========================================================================
  // TALENT DASHBOARD ENDPOINTS
  // =========================================================================

  /**
   * GET /api/v1/analytics/talent/dashboard
   * Get talent's personal dashboard
   */
  router.get('/talent/dashboard', async (req: AnalyticsRequest) => {
    try {
      if (req.user?.userType !== 'talent') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
        });
      }

      const talentId = await getTalentIdFromUserId(db, req.user.id);
      const calculator = new MetricsCalculator(db);

      const [metrics, revenue, retention] = await Promise.all([
        calculator.calculateTalentMetrics(talentId, 'month'),
        calculator.calculateRevenueBreakdown('month'),
        calculator.calculateRetention('first_booking', 30),
      ]);

      // Get recent bookings
      const bookingsQuery = `
        SELECT id, client_id, booking_value, status, created_at
        FROM bookings
        WHERE talent_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const recentBookings = await db.prepare(bookingsQuery).all(talentId);

      // Get recent reviews
      const reviewsQuery = `
        SELECT br.rating, br.feedback, br.created_at
        FROM booking_reviews br
        LEFT JOIN bookings b ON br.booking_id = b.id
        WHERE b.talent_id = ?
        ORDER BY br.created_at DESC
        LIMIT 5
      `;
      const recentReviews = await db.prepare(reviewsQuery).all(talentId);

      return new Response(
        JSON.stringify({
          metrics,
          recentBookings,
          recentReviews,
          revenue: revenue.totalRevenue,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  /**
   * GET /api/v1/analytics/talent/earnings
   * Get detailed earnings breakdown
   */
  router.get('/talent/earnings', async (req: AnalyticsRequest) => {
    try {
      const talentId = await getTalentIdFromUserId(db, req.user.id);

      const query = `
        SELECT 
          DATE(completed_at) as date,
          COUNT(*) as booking_count,
          SUM(booking_value) as gross_revenue,
          SUM(platform_fee) as fees,
          SUM(net_payout) as net_earnings
        FROM bookings
        WHERE talent_id = ?
          AND status = 'completed'
          AND completed_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        GROUP BY DATE(completed_at)
        ORDER BY date DESC
      `;

      const earnings = await db.prepare(query).all(talentId);

      return new Response(JSON.stringify({ earnings }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  // =========================================================================
  // AGENCY DASHBOARD ENDPOINTS
  // =========================================================================

  /**
   * GET /api/v1/analytics/agency/dashboard
   * Get agency dashboard
   */
  router.get('/agency/dashboard', async (req: AnalyticsRequest) => {
    try {
      if (req.user?.userType !== 'agency') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
        });
      }

      const agencyId = await getAgencyIdFromUserId(db, req.user.id);
      const calculator = new MetricsCalculator(db);

      const metrics = await calculator.calculateAgencyMetrics(agencyId, 'month');

      // Get top performing talents
      const talentsQuery = `
        SELECT 
          t.id,
          t.user_id,
          COUNT(b.id) as bookings_count,
          SUM(b.booking_value) as total_revenue,
          AVG(br.rating) as avg_rating
        FROM talents t
        LEFT JOIN bookings b ON t.id = b.talent_id
        LEFT JOIN booking_reviews br ON b.id = br.booking_id
        WHERE t.agency_id = ?
          AND t.status = 'active'
          AND b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY t.id, t.user_id
        ORDER BY total_revenue DESC
        LIMIT 10
      `;

      const topTalents = await db.prepare(talentsQuery).all(agencyId);

      // Merge names from DB_SSO
      let ssoUsersMap: Record<string, string> = {};
      if (topTalents.length > 0) {
        const _userIds = topTalents.map(t => `'${t.user_id}'`).join(',');
        const { results: users } = await c.env.DB_SSO.prepare(
          `SELECT id, first_name || ' ' || last_name as full_name FROM users WHERE id IN (${_userIds})`
        ).all<any>();
        ssoUsersMap = (users || []).reduce((acc, user) => ({ ...acc, [user.id]: user.full_name }), {});
      }
      for (const t of topTalents) {
        t.name = ssoUsersMap[t.user_id] || 'Unknown Talent';
        delete t.user_id; // Clean up
      }

      // Get client retention
      const clientsQuery = `
        SELECT 
          COUNT(DISTINCT b.client_id) as unique_clients,
          COUNT(DISTINCT CASE WHEN repeat_hires > 1 THEN b.client_id END) as repeat_clients
        FROM (
          SELECT 
            b.client_id,
            COUNT(*) as repeat_hires
          FROM bookings b
          LEFT JOIN talents t ON b.talent_id = t.id
          WHERE t.agency_id = ?
            AND b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY b.client_id
        ) counts
      `;

      const clientData = await db.prepare(clientsQuery).get(agencyId);

      return new Response(
        JSON.stringify({
          metrics,
          topTalents,
          clientRetention: clientData,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  /**
   * GET /api/v1/analytics/agency/talents/performance
   * Get all talents' performance metrics
   */
  router.get('/agency/talents/performance', async (req: AnalyticsRequest) => {
    try {
      const agencyId = await getAgencyIdFromUserId(db, req.user.id);
      const { period = 'month' } = req.query;

      const query = `
        SELECT 
          t.id,
          t.user_id,
          t.category,
          t.avg_rating,
          COUNT(DISTINCT b.id) as bookings,
          COUNT(DISTINCT tv.id) as profile_views,
          SUM(b.booking_value) as revenue,
          COUNT(DISTINCT b.client_id) as unique_clients
        FROM talents t
        LEFT JOIN bookings b ON t.id = b.talent_id 
          AND b.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        LEFT JOIN talent_views tv ON t.id = tv.talent_id 
          AND tv.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        WHERE t.agency_id = ?
          AND t.status = 'active'
        GROUP BY t.id, t.user_id, t.category, t.avg_rating
        ORDER BY revenue DESC
      `;

      const days = period === 'month' ? 30 : period === 'year' ? 365 : 7;
      const metrics = await db.prepare(query).all(days, days, agencyId);

      // Merge names from DB_SSO
      let ssoUsersMap: Record<string, string> = {};
      if (metrics.length > 0) {
        const _userIds = metrics.map(t => `'${t.user_id}'`).join(',');
        // This handler might not have direct access to c.env.DB_SSO because it uses `db`.
        // Wait, I need to check how DB_SSO is accessible.
        // Assuming c is not accessible. I will need to check the imports or scope of this router.

      const dayOffset = period === 'week' ? 7 : period === 'day' ? 1 : 30;
      const talents = await db
        .prepare(query)
        .all(dayOffset, dayOffset, agencyId);

      return new Response(JSON.stringify({ talents }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  // =========================================================================
  // CLIENT DASHBOARD ENDPOINTS
  // =========================================================================

  /**
   * GET /api/v1/analytics/client/dashboard
   * Get client dashboard
   */
  router.get('/client/dashboard', async (req: AnalyticsRequest) => {
    try {
      if (req.user?.userType !== 'client') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
        });
      }

      const clientId = await getClientIdFromUserId(db, req.user.id);
      const calculator = new MetricsCalculator(db);

      const metrics = await calculator.calculateClientMetrics(clientId, 'month');

      // Get favorite talents (repeat hires)
      const talentsQuery = `
        SELECT 
          t.id,
          t.name,
          COUNT(b.id) as times_hired,
          AVG(br.rating) as avg_rating
        FROM talents t
        LEFT JOIN bookings b ON t.id = b.talent_id AND b.client_id = ?
        LEFT JOIN booking_reviews br ON b.id = br.booking_id
        WHERE b.id IS NOT NULL
        GROUP BY t.id, t.name
        ORDER BY times_hired DESC
        LIMIT 10
      `;

      const favoriteTalents = await db.prepare(talentsQuery).all(clientId);

      // Get recent bookings
      const bookingsQuery = `
        SELECT 
          b.id,
          b.talent_id,
          t.name as talent_name,
          b.booking_value,
          b.status,
          b.created_at,
          br.rating
        FROM bookings b
        LEFT JOIN talents t ON b.talent_id = t.id
        LEFT JOIN booking_reviews br ON b.id = br.booking_id
        WHERE b.client_id = ?
        ORDER BY b.created_at DESC
        LIMIT 10
      `;

      const recentBookings = await db.prepare(bookingsQuery).all(clientId);

      return new Response(
        JSON.stringify({
          metrics,
          favoriteTalents,
          recentBookings,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  /**
   * GET /api/v1/analytics/client/spending
   * Get client spending breakdown
   */
  router.get('/client/spending', async (req: AnalyticsRequest) => {
    try {
      const clientId = await getClientIdFromUserId(db, req.user.id);

      const query = `
        SELECT 
          DATE_FORMAT(b.completed_at, '%Y-%m') as month,
          COUNT(*) as booking_count,
          SUM(b.booking_value) as total_spent,
          AVG(b.booking_value) as avg_booking,
          MIN(b.booking_value) as min_booking,
          MAX(b.booking_value) as max_booking
        FROM bookings b
        WHERE b.client_id = ?
          AND b.status = 'completed'
          AND b.completed_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(b.completed_at, '%Y-%m')
        ORDER BY month DESC
      `;

      const spending = await db.prepare(query).all(clientId);

      return new Response(JSON.stringify({ spending }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  // =========================================================================
  // ADMIN DASHBOARD ENDPOINTS
  // =========================================================================

  /**
   * GET /api/v1/analytics/admin/platform
   * Get platform-wide analytics
   */
  router.get('/admin/platform', async (req: AnalyticsRequest) => {
    try {
      // Check admin auth
      if (req.user?.userType !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
        });
      }

      const calculator = new MetricsCalculator(db);
      const metrics = await calculator.calculatePlatformKPIs('month');

      return new Response(JSON.stringify(metrics), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  /**
   * GET /api/v1/analytics/admin/revenue
   * Get platform revenue breakdown
   */
  router.get('/admin/revenue', async (req: AnalyticsRequest) => {
    try {
      if (req.user?.userType !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
        });
      }

      const calculator = new MetricsCalculator(db);
      const revenue = await calculator.calculateRevenueBreakdown('month');

      return new Response(JSON.stringify(revenue), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  /**
   * GET /api/v1/analytics/admin/anomalies
   * Get detected anomalies
   */
  router.get('/admin/anomalies', async (req: AnalyticsRequest) => {
    try {
      if (req.user?.userType !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
        });
      }

      const calculator = new MetricsCalculator(db);
      const severity = (req.query.severity as string) || 'medium';
      const anomalies = await calculator.detectAnomalies(
        severity as 'high' | 'medium' | 'low'
      );

      return new Response(JSON.stringify({ anomalies }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  // =========================================================================
  // EXPORT ENDPOINTS
  // =========================================================================

  /**
   * POST /api/v1/analytics/export/pdf
   * Generate PDF report
   */
  router.post('/export/pdf', async (req: AnalyticsRequest) => {
    try {
      const body = await req.json();
      const { dashboardType, dateRangeStart, dateRangeEnd } = body;

      const exportService = new ExportService(db);
      const jobId = await exportService.createExportJob(req.user.id, 'pdf', {
        dashboardType,
        dateRangeStart,
        dateRangeEnd,
      });

      // Queue background job
      // (implementation depends on your job queue system)

      return new Response(JSON.stringify({ jobId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  /**
   * POST /api/v1/analytics/export/csv
   * Generate CSV export
   */
  router.post('/export/csv', async (req: AnalyticsRequest) => {
    try {
      const body = await req.json();
      const { table, filters, dateRangeStart, dateRangeEnd } = body;

      const exportService = new ExportService(db);
      const jobId = await exportService.createExportJob(req.user.id, 'csv', {
        table,
        filters,
        dateRangeStart,
        dateRangeEnd,
      });

      return new Response(JSON.stringify({ jobId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  /**
   * GET /api/v1/analytics/export/jobs/:id
   * Get export job status
   */
  router.get('/export/jobs/:id', async (req: AnalyticsRequest) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          id,
          status,
          progress,
          file_url,
          created_at,
          completed_at,
          error_message
        FROM analytics_export_jobs
        WHERE id = ? AND user_id = ?
      `;

      const job = await db.prepare(query).get(id, req.user.id);

      if (!job) {
        return new Response(JSON.stringify({ error: 'Job not found' }), {
          status: 404,
        });
      }

      return new Response(JSON.stringify(job), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  // =========================================================================
  // CUSTOM REPORTS ENDPOINTS
  // =========================================================================

  /**
   * GET /api/v1/analytics/custom-reports
   * List user's custom reports
   */
  router.get('/custom-reports', async (req: AnalyticsRequest) => {
    try {
      const query = `
        SELECT 
          id,
          report_name,
          dashboard_type,
          view_count,
          created_at
        FROM analytics_custom_reports
        WHERE user_id = ?
        ORDER BY created_at DESC
      `;

      const reports = await db.prepare(query).all(req.user.id);

      return new Response(JSON.stringify({ reports }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  /**
   * POST /api/v1/analytics/custom-reports
   * Create custom report
   */
  router.post('/custom-reports', async (req: AnalyticsRequest) => {
    try {
      const body = await req.json();
      const reportId = generateId();

      const query = `
        INSERT INTO analytics_custom_reports 
        (id, user_id, report_name, dashboard_type, selected_metrics, filters, chart_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await db.prepare(query).run(
        reportId,
        req.user.id,
        body.reportName,
        body.dashboardType,
        JSON.stringify(body.selectedMetrics),
        JSON.stringify(body.filters),
        body.chartType
      );

      return new Response(JSON.stringify({ reportId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  });

  return router;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getTalentIdFromUserId(db: any, userId: string): Promise<string> {
  const result = await db
    .prepare('SELECT id FROM talents WHERE user_id = ?')
    .get(userId);
  return result?.id;
}

async function getAgencyIdFromUserId(db: any, userId: string): Promise<string> {
  const result = await db
    .prepare('SELECT id FROM agencies WHERE user_id = ?')
    .get(userId);
  return result?.id;
}

async function getClientIdFromUserId(db: any, userId: string): Promise<string> {
  const result = await db
    .prepare('SELECT id FROM clients WHERE user_id = ?')
    .get(userId);
  return result?.id;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export { createAnalyticsRouter as analyticsRouter, generateId };
