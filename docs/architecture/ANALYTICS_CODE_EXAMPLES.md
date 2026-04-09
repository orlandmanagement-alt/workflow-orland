# Analytics System - Code Examples & Implementation Templates

**Purpose:** Quick-start reference with code templates for developers implementing the analytics system.  
**Date:** January 2026

---

## Table of Contents

1. [Backend Services](#backend-services)
2. [API Handlers](#api-handlers)
3. [Frontend Hooks](#frontend-hooks)
4. [React Components](#react-components)
5. [Data Models & Types](#data-models--types)

---

## Backend Services

### MetricsCalculator.ts

```typescript
// apps/appapi/src/services/MetricsCalculator.ts

import { Database } from '@cloudflare/workers-types';
import { cache } from './cache';

export interface MetricsResult {
  views: number;
  bookings: number;
  revenue: number;
  avgRating: number;
  completionRate: number;
  trendPercentage: number;
}

export class MetricsCalculator {
  constructor(private db: Database) {}

  /**
   * Calculate talent metrics for a date range
   */
  async calculateTalentMetrics(
    talentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MetricsResult> {
    const cacheKey = `talent:${talentId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    // Check cache first
    const cached = await cache.get<MetricsResult>(cacheKey);
    if (cached) return cached;

    // Query aggregated data
    const hourlyData = await this.db
      .prepare(`
        SELECT 
          SUM(metric_value) as total_views
        FROM analytics_aggregation_hourly
        WHERE entity_type = 'talent'
          AND entity_id = ?
          AND metric_type = 'views'
          AND hour_timestamp BETWEEN ? AND ?
      `)
      .bind(talentId, startDate.toISOString(), endDate.toISOString())
      .first<{ total_views: number }>();

    const bookingData = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as count,
          SUM(gross_value) as total_revenue
        FROM bookings
        WHERE talent_id = ?
          AND created_at BETWEEN ? AND ?
          AND completion_status = 'completed'
      `)
      .bind(talentId, startDate.toISOString(), endDate.toISOString())
      .first<{ count: number; total_revenue: number }>();

    const ratingData = await this.db
      .prepare(`
        SELECT AVG(rating) as avg_rating
        FROM reviews
        WHERE talent_id = ? AND created_at BETWEEN ? AND ?
      `)
      .bind(talentId, startDate.toISOString(), endDate.toISOString())
      .first<{ avg_rating: number }>();

    const result: MetricsResult = {
      views: hourlyData?.total_views || 0,
      bookings: bookingData?.count || 0,
      revenue: bookingData?.total_revenue || 0,
      avgRating: ratingData?.avg_rating || 0,
      completionRate: await this.calculateCompletionRate(talentId, startDate, endDate),
      trendPercentage: await this.calculateTrend(talentId, startDate, endDate)
    };

    // Cache for 1 hour
    await cache.set(cacheKey, result, 3600);
    
    return result;
  }

  /**
   * Calculate booking completion rate
   */
  private async calculateCompletionRate(
    talentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await this.db
      .prepare(`
        SELECT 
          COUNT(CASE WHEN completion_status = 'completed' THEN 1 END) as completed,
          COUNT(*) as total
        FROM bookings
        WHERE talent_id = ? AND created_at BETWEEN ? AND ?
      `)
      .bind(talentId, startDate.toISOString(), endDate.toISOString())
      .first<{ completed: number; total: number }>();

    if (!result || result.total === 0) return 0;
    return (result.completed / result.total) * 100;
  }

  /**
   * Calculate percentage change vs previous period
   */
  private async calculateTrend(
    talentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const periodLength = (endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60;
    const prevStartDate = new Date(startDate.getTime() - periodLength * 60 * 60 * 1000);

    const currentViews = await this.db
      .prepare(`
        SELECT SUM(metric_value) as total FROM analytics_aggregation_hourly
        WHERE entity_type = 'talent' AND entity_id = ? 
          AND metric_type = 'views' AND hour_timestamp BETWEEN ? AND ?
      `)
      .bind(talentId, startDate.toISOString(), endDate.toISOString())
      .first<{ total: number }>();

    const prevViews = await this.db
      .prepare(`
        SELECT SUM(metric_value) as total FROM analytics_aggregation_hourly
        WHERE entity_type = 'talent' AND entity_id = ? 
          AND metric_type = 'views' AND hour_timestamp BETWEEN ? AND ?
      `)
      .bind(talentId, prevStartDate.toISOString(), startDate.toISOString())
      .first<{ total: number }>();

    const current = currentViews?.total || 0;
    const prev = prevViews?.total || 0;

    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  }
}
```

### ExportService.ts

```typescript
// apps/appapi/src/services/ExportService.ts

import { Database } from '@cloudflare/workers-types';
import * as R2 from './r2-storage';

export interface ExportOptions {
  userId: string;
  dashboardType: 'talent' | 'agency' | 'client' | 'admin';
  format: 'pdf' | 'csv' | 'excel';
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
}

export class ExportService {
  constructor(private db: Database, private r2: R2.R2Client) {}

  /**
   * Start an export job and return job ID
   */
  async startExport(options: ExportOptions): Promise<string> {
    const jobId = this.generateJobId();

    // Create job record
    await this.db
      .prepare(`
        INSERT INTO analytics_export_jobs 
        (id, user_id, dashboard_type, export_format, date_range_start, date_range_end, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `)
      .bind(
        jobId,
        options.userId,
        options.dashboardType,
        options.format,
        options.dateRangeStart?.toISOString().split('T')[0],
        options.dateRangeEnd?.toISOString().split('T')[0]
      )
      .run();

    // Queue export job (depends on your job queue system)
    // This example uses a simple HTTP POST to a worker
    await this.queueExportJob(jobId, options);

    return jobId;
  }

  /**
   * Queue export job for processing
   */
  private async queueExportJob(jobId: string, options: ExportOptions): Promise<void> {
    // Implementation depends on your job queue system
    // Could use: Bull, RabbitMQ, Cloudflare Workers, or simple database polling
    
    // Example: POST to a separate worker
    await fetch('https://worker.example.com/process-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, ...options })
    });
  }

  /**
   * Check export job status
   */
  async checkJobStatus(jobId: string): Promise<ExportJobStatus> {
    const job = await this.db
      .prepare(`
        SELECT id, status, progress, file_url, error_message, completed_at
        FROM analytics_export_jobs
        WHERE id = ?
      `)
      .bind(jobId)
      .first();

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress || 0,
      fileUrl: job.file_url,
      errorMessage: job.error_message,
      completedAt: job.completed_at
    };
  }

  /**
   * Process export and upload to storage
   */
  async processExport(jobId: string): Promise<void> {
    try {
      // Update status
      await this.updateJobStatus(jobId, 'processing');

      // Get job details
      const job = await this.db
        .prepare('SELECT * FROM analytics_export_jobs WHERE id = ?')
        .bind(jobId)
        .first();

      let fileBuffer: Buffer;
      let fileName: string;

      // Generate export based on format
      if (job.export_format === 'pdf') {
        fileBuffer = await this.generatePDF(job);
        fileName = `export-${jobId}.pdf`;
      } else if (job.export_format === 'csv') {
        fileBuffer = await this.generateCSV(job);
        fileName = `export-${jobId}.csv`;
      } else if (job.export_format === 'excel') {
        fileBuffer = await this.generateExcel(job);
        fileName = `export-${jobId}.xlsx`;
      }

      // Upload to R2
      const fileUrl = await this.r2.uploadFile(fileName, fileBuffer);

      // Update job record
      await this.db
        .prepare(`
          UPDATE analytics_export_jobs
          SET status = 'complete', file_url = ?, file_size = ?, completed_at = NOW()
          WHERE id = ?
        `)
        .bind(fileUrl, fileBuffer.length, jobId)
        .run();

    } catch (error) {
      await this.updateJobStatus(jobId, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Generate PDF report
   */
  private async generatePDF(job: any): Promise<Buffer> {
    // Implement PDF generation
    // Use: PDFKit, pdf-lib, or html2pdf
    throw new Error('Implement PDF generation');
  }

  /**
   * Generate CSV export
   */
  private async generateCSV(job: any): Promise<Buffer> {
    // Implement CSV generation
    throw new Error('Implement CSV generation');
  }

  /**
   * Generate Excel export
   */
  private async generateExcel(job: any): Promise<Buffer> {
    // Implement Excel generation (using xlsx library)
    throw new Error('Implement Excel generation');
  }

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    const query = errorMessage
      ? `UPDATE analytics_export_jobs SET status = ?, error_message = ? WHERE id = ?`
      : `UPDATE analytics_export_jobs SET status = ? WHERE id = ?`;

    const params = errorMessage ? [status, errorMessage, jobId] : [status, jobId];

    await this.db.prepare(query).bind(...params).run();
  }

  private generateJobId(): string {
    return `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export interface ExportJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  progress: number;
  fileUrl?: string;
  errorMessage?: string;
  completedAt?: string;
}
```

### analyticsAggregator.ts (Workers)

```typescript
// apps/appapi/src/workers/analyticsAggregator.ts

import { Router } from 'itty-router';
import { Database } from '@cloudflare/workers-types';

export interface Env {
  DB: Database;
}

const router = Router();

/**
 * Hourly aggregation - triggered every hour
 */
router.post('/aggregate/hourly', async (req, env: Env) => {
  const db = env.DB;

  try {
    console.log('Starting hourly aggregation...');

    // Get current hour
    const now = new Date();
    const hour = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours());
    const dateKey = hour.toISOString().split('.')[0];

    // Aggregate views
    await aggregateViews(db, hour, dateKey);
    await aggregateBookings(db, hour, dateKey);
    await aggregateRevenue(db, hour, dateKey);

    console.log('Hourly aggregation completed');
    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('Aggregation error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Daily aggregation - triggered once per day at 00:00 UTC
 */
router.post('/aggregate/daily', async (req, env: Env) => {
  const db = env.DB;

  try {
    console.log('Starting daily aggregation...');

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const dateKey = yesterday.toISOString().split('T')[0];

    // Create daily snapshots
    await createTalentDailySnapshots(db, dateKey);
    await createAgencyDailySnapshots(db, dateKey);
    await createClientDailySnapshots(db, dateKey);
    
    // Calculate retention
    await calculateCohortRetention(db, dateKey);
    
    // Generate KPIs
    await generateDailyKPIs(db, dateKey);

    console.log('Daily aggregation completed');
    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('Daily aggregation error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

/**
 * Aggregate views from events into hourly buckets
 */
async function aggregateViews(db: Database, hour: Date, dateKey: string): Promise<void> {
  // This is pseudo-code - actual implementation depends on your event tracking
  
  const startOfHour = new Date(hour);
  const endOfHour = new Date(hour.getTime() + 60 * 60 * 1000);

  // Get view events for this hour (from events table or stream)
  const viewEvents = await db
    .prepare(`
      SELECT profile_id as entity_id, COUNT(*) as view_count
      FROM profile_views
      WHERE viewed_at BETWEEN ? AND ?
      GROUP BY profile_id
    `)
    .bind(startOfHour.toISOString(), endOfHour.toISOString())
    .all();

  // Insert aggregated data
  for (const event of viewEvents.results) {
    const id = `agg-${dateKey}-view-${event.entity_id}`;
    
    await db
      .prepare(`
        INSERT INTO analytics_aggregation_hourly 
        (id, metric_type, entity_type, entity_id, metric_value, hour_timestamp, date_key)
        VALUES (?, 'views', 'talent', ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET metric_value = metric_value + excluded.metric_value
      `)
      .bind(id, event.entity_id, event.view_count, startOfHour.toISOString(), dateKey)
      .run();
  }
}

/**
 * Create talent daily snapshots from hourly data
 */
async function createTalentDailySnapshots(db: Database, dateKey: string): Promise<void> {
  const talents = await db
    .prepare(`
      SELECT DISTINCT entity_id FROM analytics_aggregation_hourly
      WHERE entity_type = 'talent' AND DATE(date_key) = ?
    `)
    .bind(dateKey)
    .all();

  for (const talent of talents.results) {
    const talentId = talent.entity_id;

    // Sum metrics for the day
    const metrics = await db
      .prepare(`
        SELECT 
          SUM(CASE WHEN metric_type = 'views' THEN metric_value ELSE 0 END) as views,
          SUM(CASE WHEN metric_type = 'bookings' THEN metric_value ELSE 0 END) as bookings,
          SUM(CASE WHEN metric_type = 'revenue' THEN metric_value ELSE 0 END) as revenue
        FROM analytics_aggregation_hourly
        WHERE entity_type = 'talent' 
          AND entity_id = ? 
          AND DATE(date_key) = ?
      `)
      .bind(talentId, dateKey)
      .first<{ views: number; bookings: number; revenue: number }>();

    const id = `daily-${dateKey}-talent-${talentId}`;
    
    // Get additional metrics from core tables
    const bookingMetrics = await db
      .prepare(`
        SELECT 
          COUNT(CASE WHEN completion_status = 'completed' THEN 1 END) as completed,
          COUNT(*) as total
        FROM bookings
        WHERE talent_id = ? AND DATE(created_at) = ?
      `)
      .bind(talentId, dateKey)
      .first<{ completed: number; total: number }>();

    const completionRate = bookingMetrics.total > 0 
      ? (bookingMetrics.completed / bookingMetrics.total) * 100 
      : 0;

    // Insert daily snapshot
    await db
      .prepare(`
        INSERT INTO analytics_talent_daily 
        (id, talent_id, metric_date, profile_views, bookings_received, revenue_earned, booking_completion_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        talentId,
        dateKey,
        metrics.views || 0,
        metrics.bookings || 0,
        metrics.revenue || 0,
        completionRate
      )
      .run();
  }
}

// Additional aggregation functions...
async function aggregateBookings(db: Database, hour: Date, dateKey: string): Promise<void> {
  // Implementation
}

async function aggregateRevenue(db: Database, hour: Date, dateKey: string): Promise<void> {
  // Implementation
}

async function createAgencyDailySnapshots(db: Database, dateKey: string): Promise<void> {
  // Implementation
}

async function createClientDailySnapshots(db: Database, dateKey: string): Promise<void> {
  // Implementation
}

async function calculateCohortRetention(db: Database, dateKey: string): Promise<void> {
  // Implementation
}

async function generateDailyKPIs(db: Database, dateKey: string): Promise<void> {
  // Implementation
}

export default router;
```

---

## API Handlers

### analyticsHandler.ts

```typescript
// apps/appapi/src/handlers/analyticsHandler.ts

import { Router, json } from 'itty-router';
import { MetricsCalculator } from '../services/MetricsCalculator';
import { Database } from '@cloudflare/workers-types';

export interface Env {
  DB: Database;
}

export function createAnalyticsRouter(env: Env) {
  const router = Router({ base: '/api/v1/analytics' });
  const calculator = new MetricsCalculator(env.DB);

  /**
   * GET /api/v1/analytics/talent/dashboard
   */
  router.get('/talent/dashboard', async (req) => {
    const { userId } = req.query as any;
    const { startDate, endDate } = req.query as any;

    if (!userId) {
      return json({ error: 'userId required' }, { status: 400 });
    }

    try {
      const start = startDate ? new Date(startDate) : getDaysAgo(30);
      const end = endDate ? new Date(endDate) : new Date();

      const metrics = await calculator.calculateTalentMetrics(userId, start, end);

      // Get recent bookings
      const bookings = await env.DB
        .prepare(`
          SELECT id, client_id, gross_value, created_at, completion_status
          FROM bookings
          WHERE talent_id = ? AND created_at BETWEEN ? AND ?
          ORDER BY created_at DESC
          LIMIT 10
        `)
        .bind(userId, start.toISOString(), end.toISOString())
        .all();

      return json({
        success: true,
        data: {
          metrics,
          recentBookings: bookings.results
        }
      });

    } catch (error) {
      return json({ error: error.message }, { status: 500 });
    }
  });

  /**
   * GET /api/v1/analytics/admin/platform
   */
  router.get('/admin/platform', async (req) => {
    // Verify admin role
    const user = (req as any).user;
    if (user?.userType !== 'admin') {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
      const kpi = await env.DB
        .prepare(`
          SELECT * FROM analytics_kpi_daily
          WHERE kpi_date = DATE('now')
          LIMIT 1
        `)
        .first();

      return json({
        success: true,
        data: {
          overview: kpi || {},
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      return json({ error: error.message }, { status: 500 });
    }
  });

  router.all('*', () => json({ error: 'Not found' }, { status: 404 }));

  return router;
}

function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}
```

---

## Frontend Hooks

### useAdminDashboard.ts

```typescript
// apps/appadmin/src/hooks/useAdminDashboard.ts

import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../services/analytics.api';

export interface DashboardMetrics {
  users: MetricData;
  revenue: MetricData;
  bookings: MetricData;
  activeUsers: MetricData;
}

export interface MetricData {
  value: number | string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export function useAdminDashboard(dateRange?: DateRange) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await analyticsAPI.getAdminDashboard(dateRange);

      setMetrics(response.metrics);
      setData(response);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Fetch on mount and when dateRange changes
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Optional: Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  return {
    metrics,
    data,
    loading,
    error,
    refetch: fetchDashboard
  };
}
```

### useExport.ts

```typescript
// apps/appadmin/src/hooks/useExport.ts

import { useState, useCallback } from 'react';
import { exportAPI } from '../services/export.api';

export interface ExportJob {
  jobId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  progress: number;
  fileUrl?: string;
  errorMessage?: string;
}

export function useExport() {
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startExport = useCallback(async (options: {
    dashboardType: string;
    format: 'pdf' | 'csv' | 'excel';
    dateRangeStart: string;
    dateRangeEnd: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const job = await exportAPI.startExport(options);
      setExportJob(job);

      return job;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async (jobId: string) => {
    try {
      const status = await exportAPI.checkExportStatus(jobId);
      setExportJob(status);
      return status;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Status check failed';
      setError(message);
      throw err;
    }
  }, []);

  const pollUntilComplete = useCallback(async (jobId: string, intervalMs = 2000) => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const status = await checkStatus(jobId);

          if (status.status === 'complete') {
            clearInterval(interval);
            resolve(status);
          } else if (status.status === 'failed') {
            clearInterval(interval);
            reject(new Error(status.errorMessage || 'Export failed'));
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, intervalMs);
    });
  }, [checkStatus]);

  return {
    exportJob,
    loading,
    error,
    startExport,
    checkStatus,
    pollUntilComplete
  };
}
```

---

## React Components

### AnalyticsDashboard.tsx

```typescript
// apps/appadmin/src/components/analytics/AnalyticsDashboard.tsx

import React, { useState } from 'react';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { useTalentDashboard } from '../../hooks/useTalentDashboard';
import { useAgencyDashboard } from '../../hooks/useAgencyDashboard';
import { useClientDashboard } from '../../hooks/useClientDashboard';
import DateRangeSelector from './DateRangeSelector';
import ExportDialog from './ExportDialog';
import MetricCard from './MetricCard';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  userType?: 'talent' | 'agency' | 'client' | 'admin';
  userId?: string;
}

export default function AnalyticsDashboard({ userType: propUserType, userId: propUserId }: Props) {
  const { user } = useAuth();
  const userType = propUserType || user?.userType || 'talent';
  const userId = propUserId || user?.id;

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [exportOpen, setExportOpen] = useState(false);

  // Select hook based on user type
  const dashboardHook = 
    userType === 'admin' ? useAdminDashboard :
    userType === 'talent' ? useTalentDashboard :
    userType === 'agency' ? useAgencyDashboard :
    useClientDashboard;

  const { metrics, loading, error, refetch } = dashboardHook(dateRange);

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  return (
    <div className="analytics-dashboard space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="space-x-3">
          <button onClick={refetch} className="btn btn-secondary">
            Refresh
          </button>
          <button onClick={() => setExportOpen(true)} className="btn btn-primary">
            Export Report
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector dateRange={dateRange} onDateRangeChange={setDateRange} />

      {/* Metrics Cards */}
      {loading ? (
        <div className="skeleton-loader">Loading metrics...</div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderMetricsForUserType(userType, metrics)}
        </div>
      ) : null}

      {/* Export Dialog */}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        dashboardType={userType}
      />
    </div>
  );
}

function renderMetricsForUserType(userType: string, metrics: any) {
  const common = [
    { label: 'Revenue', value: metrics.revenue?.value, trend: metrics.revenue?.trend },
    { label: 'Bookings', value: metrics.bookings?.value, trend: metrics.bookings?.trend }
  ];

  if (userType === 'admin') {
    return [
      ...common,
      { label: 'Total Users', value: metrics.users?.value, trend: metrics.users?.trend },
      { label: 'Active Users (30d)', value: metrics.activeUsers?.value }
    ].map((m, i) => <MetricCard key={i} {...m} />);
  }

  // Similar for other user types
  return common.map((m, i) => <MetricCard key={i} {...m} />);
}
```

### ExportDialog.tsx

```typescript
// apps/appadmin/src/components/analytics/ExportDialog.tsx

import React, { useState, useEffect } from 'react';
import { useExport } from '../../hooks/useExport';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardType: string;
}

export default function ExportDialog({ open, onOpenChange, dashboardType }: Props) {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { exportJob, loading, startExport, pollUntilComplete } = useExport();

  const handleExport = async () => {
    try {
      const job = await startExport({
        dashboardType,
        format,
        dateRangeStart: dateRange.startDate,
        dateRangeEnd: dateRange.endDate
      });

      // Poll until complete
      const completed = await pollUntilComplete(job.jobId);
      
      if (completed.fileUrl) {
        // Open download
        window.open(completed.fileUrl, '_blank');
        onOpenChange(false);
      }

    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={() => onOpenChange(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Export Report</h2>

        {/* Format Selection */}
        <div className="form-group">
          <label>Format</label>
          <select value={format} onChange={e => setFormat(e.target.value as any)}>
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Progress */}
        {exportJob && (
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${exportJob.progress}%` }}>
              {exportJob.progress}%
            </div>
            <p>{exportJob.status}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="modal-actions">
          <button onClick={() => onOpenChange(false)} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleExport} disabled={loading} className="btn btn-primary">
            {loading ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### MetricCard.tsx

```typescript
// apps/appadmin/src/components/analytics/MetricCard.tsx

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
  icon?: React.ReactNode;
  color?: string;
}

export default function MetricCard({
  label,
  value,
  trend = 'stable',
  changePercent = 0,
  icon,
  color = 'blue'
}: Props) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="text-green-500" />;
      case 'down': return <TrendingDown className="text-red-500" />;
      default: return <Minus className="text-gray-500" />;
    }
  };

  return (
    <div className={`metric-card bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>

      {changePercent !== 0 && (
        <div className="flex items-center gap-1 mt-4 text-sm">
          {getTrendIcon()}
          <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
            {trend === 'up' ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
```

---

## Data Models & Types

### types.ts

```typescript
// apps/appadmin/src/types/analytics.ts

export interface MetricValue {
  value: number | string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface TalentDashboardData {
  metrics: {
    views: MetricValue;
    bookings: MetricValue;
    revenue: MetricValue;
    avgRating: number;
    completionRate: number;
  };
  recentBookings: Booking[];
  recentReviews: Review[];
}

export interface AgencyDashboardData {
  metrics: {
    portfolioViews: MetricValue;
    bookings: MetricValue;
    revenue: MetricValue;
    avgTalentRating: number;
    clientRetention: number;
    talentRosterSize: number;
  };
  topTalents: TalentMetric[];
  clientRetention: {
    uniqueClients: number;
    repeatClients: number;
  };
}

export interface ClientDashboardData {
  metrics: {
    totalSpent: MetricValue;
    bookingsCount: MetricValue;
    avgBookingValue: MetricValue;
    repeatTalentRate: number;
    churnRisk: number;
  };
  favoriteTalents: Talent[];
  recentBookings: Booking[];
}

export interface AdminDashboardData {
  overview: {
    totalUsers: number;
    activeUsers30Days: number;
    totalBookings: number;
    totalRevenue: number;
    platformFees: number;
    avgBookingValue: number;
  };
  trends: TrendData;
  distribution: DistributionData;
}

export interface Booking {
  id: string;
  talentId?: string;
  clientId?: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Talent {
  id: string;
  name: string;
  avgRating: number;
  totalBookings: number;
  earnings: number;
}

export interface TalentMetric extends Talent {
  revenue: number;
}

export interface TrendData {
  [key: string]: number[];
}

export interface DistributionData {
  [key: string]: { label: string; value: number }[];
}
```

---

## Summary

These code templates provide a complete starting point for implementing the analytics system. Key sections covered:

1. **Backend Services** - MetricsCalculator, ExportService, Aggregator worker
2. **API Handlers** - Analytics endpoint implementations
3. **Frontend Hooks** - React hooks for dashboard data and exports
4. **Components** - Reusable React components for dashboards and UI
5. **TypeScript Types** - Shared type definitions

Each section is self-contained and can be implemented incrementally. Start with the database schema, then implement backend services, followed by frontend components.

---

**Implementation Guide:**  
→ Week 1: Database + Backend services  
→ Week 2: API handlers + Frontend hooks  
→ Week 3: React components + Integration  
→ Week 4: Testing + Deployment  

---

**Created:** January 15, 2026
