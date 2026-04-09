-- Migration 025: Core Analytics Schema & Aggregation Tables
-- Purpose: Create comprehensive analytics data model for dashboards and reporting
-- Date: January 2026

-- ============================================================================
-- HOURLY METRICS AGGREGATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_aggregation_hourly (
  id TEXT PRIMARY KEY,
  
  -- Metric identification
  metric_type TEXT NOT NULL, -- 'views', 'bookings', 'revenue', 'inquiries'
  entity_type TEXT NOT NULL, -- 'talent', 'agency', 'client', 'platform'
  entity_id TEXT NOT NULL, -- talent_id, agency_id, client_id, or 'platform'
  
  -- Metric value & dimension
  metric_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD', -- for revenue metrics
  
  -- Time dimensions
  hour_timestamp DATETIME NOT NULL,
  date_key TEXT NOT NULL, -- YYYY-MM-DD for easy querying
  hour_of_day INTEGER NOT NULL, -- 0-23
  
  -- Metadata
  source_type TEXT, -- 'booking', 'profile_view', 'message', 'payment'
  data_version INTEGER DEFAULT 1,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  CHECK (metric_value >= 0)
);

CREATE INDEX idx_analytics_hourly_entity 
  ON analytics_aggregation_hourly(entity_type, entity_id);
CREATE INDEX idx_analytics_hourly_metric 
  ON analytics_aggregation_hourly(metric_type);
CREATE INDEX idx_analytics_hourly_timestamp 
  ON analytics_aggregation_hourly(hour_timestamp);
CREATE INDEX idx_analytics_hourly_date_key 
  ON analytics_aggregation_hourly(date_key);
CREATE INDEX idx_analytics_hourly_composite 
  ON analytics_aggregation_hourly(date_key, entity_type, entity_id, metric_type);

-- ============================================================================
-- DAILY KPI SNAPSHOT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_kpi_daily (
  id TEXT PRIMARY KEY,
  
  -- Date reference
  kpi_date DATE NOT NULL UNIQUE,
  
  -- Platform-wide metrics
  talent_views_total INTEGER NOT NULL DEFAULT 0,
  bookings_total INTEGER NOT NULL DEFAULT 0,
  revenue_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  revenue_invoiced DECIMAL(15, 2) NOT NULL DEFAULT 0,
  revenue_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- User metrics
  platform_users_active INTEGER NOT NULL DEFAULT 0,
  new_users_total INTEGER NOT NULL DEFAULT 0,
  new_agencies INTEGER NOT NULL DEFAULT 0,
  new_talents INTEGER NOT NULL DEFAULT 0,
  new_clients INTEGER NOT NULL DEFAULT 0,
  
  -- Booking metrics
  bookings_completed INTEGER NOT NULL DEFAULT 0,
  bookings_cancelled INTEGER NOT NULL DEFAULT 0,
  bookings_avg_value DECIMAL(12, 2),
  
  -- Engagement
  profile_views_total INTEGER NOT NULL DEFAULT 0,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  contracts_signed INTEGER NOT NULL DEFAULT 0,
  
  -- Financial
  escrow_held DECIMAL(15, 2) NOT NULL DEFAULT 0,
  platform_fees_collected DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- Quality metrics
  avg_rating DECIMAL(3, 2),
  dispute_count INTEGER DEFAULT 0,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  CHECK (talent_views_total >= 0),
  CHECK (bookings_total >= 0),
  CHECK (revenue_total >= 0)
);

CREATE INDEX idx_analytics_kpi_date 
  ON analytics_kpi_daily(kpi_date DESC);

-- ============================================================================
-- COHORT ANALYSIS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_cohort (
  id TEXT PRIMARY KEY,
  
  -- Cohort identification
  cohort_date DATE NOT NULL,
  cohort_type TEXT NOT NULL, -- 'signup', 'first_booking', 'first_payment', 'conversion'
  cohort_user_type TEXT NOT NULL, -- 'talent', 'agency', 'client'
  
  -- Cohort metrics
  users_count INTEGER NOT NULL DEFAULT 0,
  
  -- Retention metrics (percentage retained)
  retention_day_0 DECIMAL(5, 2) DEFAULT 100.00,
  retention_day_1 DECIMAL(5, 2),
  retention_day_7 DECIMAL(5, 2),
  retention_day_14 DECIMAL(5, 2),
  retention_day_30 DECIMAL(5, 2),
  retention_day_60 DECIMAL(5, 2),
  retention_day_90 DECIMAL(5, 2),
  retention_day_180 DECIMAL(5, 2),
  
  -- Conversion metrics
  conversion_to_first_action DECIMAL(5, 2),
  conversion_to_payment DECIMAL(5, 2),
  
  -- Lifetime metrics
  avg_ltv DECIMAL(12, 2), -- Average lifetime value
  median_ltv DECIMAL(12, 2),
  max_ltv DECIMAL(12, 2),
  total_ltv DECIMAL(15, 2),
  
  -- Engagement
  avg_sessions INTEGER,
  avg_time_spent_hours DECIMAL(10, 2),
  
  metadata JSON, -- Additional cohort properties
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  CHECK (users_count >= 0),
  CHECK (retention_day_0 >= 0 AND retention_day_0 <= 100)
);

CREATE INDEX idx_analytics_cohort_date 
  ON analytics_cohort(cohort_date DESC);
CREATE INDEX idx_analytics_cohort_type 
  ON analytics_cohort(cohort_type, cohort_user_type);
CREATE INDEX idx_analytics_cohort_user_type 
  ON analytics_cohort(cohort_user_type);

-- ============================================================================
-- EXPORT JOBS TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_export_jobs (
  id TEXT PRIMARY KEY,
  
  -- User info
  user_id TEXT NOT NULL,
  
  -- Report details
  report_type TEXT NOT NULL, -- 'dashboard', 'custom', 'scheduled'
  format TEXT NOT NULL, -- 'pdf', 'csv', 'excel'
  
  -- Date range
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  
  -- Export parameters
  export_params JSON, -- {filters: {}, columns: [], sortBy: []}
  dashboard_type TEXT, -- 'agency', 'client', 'talent', 'admin'
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'complete', 'failed'
  progress INTEGER DEFAULT 0, -- 0-100
  error_message TEXT,
  
  -- File storage
  file_url TEXT,
  file_size_bytes INTEGER,
  
  -- Metadata
  request_started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processing_started_at DATETIME,
  completed_at DATETIME,
  estimated_completion_time INTEGER, -- seconds
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  CHECK (progress >= 0 AND progress <= 100)
);

CREATE INDEX idx_analytics_export_user 
  ON analytics_export_jobs(user_id);
CREATE INDEX idx_analytics_export_status 
  ON analytics_export_jobs(status);
CREATE INDEX idx_analytics_export_created 
  ON analytics_export_jobs(created_at DESC);

-- ============================================================================
-- CUSTOM REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_custom_reports (
  id TEXT PRIMARY KEY,
  
  -- Owner info
  user_id TEXT NOT NULL,
  
  -- Report definition
  report_name TEXT NOT NULL,
  report_description TEXT,
  
  -- Report configuration
  dashboard_type TEXT NOT NULL, -- 'agency', 'client', 'talent', 'admin'
  selected_metrics TEXT NOT NULL, -- JSON array: ['metric1', 'metric2']
  selected_dimensions TEXT, -- JSON array: ['date', 'entity', 'type']
  
  -- Filtering
  filters JSON, -- {dateRange: {}, entityType: [], etc}
  sort_order TEXT, -- JSON: [{field: 'metric', direction: 'desc'}]
  
  -- Chart preferences
  chart_type TEXT, -- 'line', 'bar', 'pie', 'heatmap'
  
  -- Sharing & access
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with TEXT, -- JSON array of user_ids or 'public'
  
  -- Scheduling
  schedule_frequency TEXT, -- 'once', 'daily', 'weekly', 'monthly'
  schedule_day_of_week INTEGER, -- 0-6 for weekly
  schedule_day_of_month INTEGER, -- 1-31 for monthly
  schedule_time TEXT, -- HH:MM format
  report_email_recipients TEXT, -- JSON array of emails
  
  -- Usage tracking
  view_count INTEGER DEFAULT 0,
  last_viewed_at DATETIME,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_analytics_custom_report_user 
  ON analytics_custom_reports(user_id);
CREATE INDEX idx_analytics_custom_report_dashboard 
  ON analytics_custom_reports(dashboard_type);

-- ============================================================================
-- ANALYTICS METRICS CACHE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_metrics_cache (
  id TEXT PRIMARY KEY,
  
  -- Cache key identification
  cache_key TEXT NOT NULL UNIQUE,
  
  -- Associated entities
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  
  -- Cached data
  cached_value JSON NOT NULL,
  data_date_range_start DATE,
  data_date_range_end DATE,
  
  -- Expiration
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  
  CHECK (datetime(expires_at) > datetime(created_at))
);

CREATE INDEX idx_analytics_cache_key 
  ON analytics_metrics_cache(cache_key);
CREATE INDEX idx_analytics_cache_entity 
  ON analytics_metrics_cache(entity_type, entity_id);
CREATE INDEX idx_analytics_cache_expiry 
  ON analytics_metrics_cache(expires_at);

-- ============================================================================
-- ANOMALY DETECTION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_anomalies (
  id TEXT PRIMARY KEY,
  
  -- Anomaly details
  metric_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  
  -- Statistical info
  expected_value DECIMAL(15, 2),
  actual_value DECIMAL(15, 2),
  deviation_percent DECIMAL(6, 2),
  severity TEXT CHECK(severity IN ('low', 'medium', 'high')),
  
  -- Detection
  detected_at DATETIME NOT NULL,
  detection_method TEXT, -- 'std_dev', 'trend', 'seasonal'
  
  -- Resolution
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by TEXT,
  review_notes TEXT,
  marked_as_false_positive BOOLEAN DEFAULT FALSE,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE INDEX idx_analytics_anomaly_entity 
  ON analytics_anomalies(entity_type, entity_id);
CREATE INDEX idx_analytics_anomaly_severity 
  ON analytics_anomalies(severity);
CREATE INDEX idx_analytics_anomaly_reviewed 
  ON analytics_anomalies(reviewed);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Analytics tables should be readable by all users (filtered by business logic)
-- Write access limited to workers and admin processes

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- Created 7 new tables for comprehensive analytics:
-- 1. analytics_aggregation_hourly - Real-time metric aggregation
-- 2. analytics_kpi_daily - Daily snapshot KPIs
-- 3. analytics_cohort - User cohort analysis & retention
-- 4. analytics_export_jobs - Export request tracking
-- 5. analytics_custom_reports - Saved custom reports
-- 6. analytics_metrics_cache - Performance caching layer
-- 7. analytics_anomalies - Anomaly detection records
--
-- Key design decisions:
-- - Hourly aggregation for real-time data (with indexes for fast querying)
-- - Daily snapshots for performance optimization
-- - Separate cache table for expensive calculations
-- - Cohort analysis for retention & LTV metrics
-- - Export job tracking for long-running processes
-- - Custom report definitions with scheduling
-- - Anomaly detection for data quality monitoring
-- ============================================================================
