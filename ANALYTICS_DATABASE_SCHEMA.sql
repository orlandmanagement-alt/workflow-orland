-- ============================================================================
-- MIGRATION 025: DB_ANALYTICS_core
-- Database: Analytics Core Tables
-- Purpose: Foundation tables for analytics aggregation and reporting
-- ============================================================================

-- ============================================================================
-- TABLE: analytics_aggregation_hourly
-- Purpose: Real-time hourly metrics aggregation for fast dashboard queries
-- ============================================================================
CREATE TABLE analytics_aggregation_hourly (
  id TEXT PRIMARY KEY,
  metric_type TEXT NOT NULL,           -- 'views', 'bookings', 'revenue', 'completion'
  entity_type TEXT NOT NULL,           -- 'talent', 'agency', 'client', 'platform'
  entity_id TEXT NOT NULL,             -- talent_id, agency_id, client_id, or 'platform'
  metric_value REAL NOT NULL,          -- Count or revenue amount
  hour_timestamp DATETIME NOT NULL,    -- Start of hour, e.g., 2026-01-15 14:00:00
  date_key TEXT NOT NULL,              -- 'YYYY-MM-DD HH:00' for indexing
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_hourly_entity ON analytics_aggregation_hourly(entity_type, entity_id);
CREATE INDEX idx_analytics_hourly_composite ON analytics_aggregation_hourly(date_key, entity_type, entity_id, metric_type);
CREATE INDEX idx_analytics_hourly_timestamp ON analytics_aggregation_hourly(hour_timestamp DESC);

-- ============================================================================
-- TABLE: analytics_kpi_daily
-- Purpose: Daily platform-wide KPI snapshots for trend analysis
-- ============================================================================
CREATE TABLE analytics_kpi_daily (
  id TEXT PRIMARY KEY,
  kpi_date DATE NOT NULL,              -- e.g., 2026-01-15
  total_users INTEGER,                 -- All registered users
  active_users_30d INTEGER,            -- Users with activity in last 30 days
  active_users_7d INTEGER,             -- Users with activity in last 7 days
  total_talents INTEGER,
  total_agencies INTEGER,
  total_clients INTEGER,
  total_bookings BIGINT,               -- Cumulative
  total_bookings_today INTEGER,        -- Daily
  total_revenue REAL,                  -- Cumulative
  total_revenue_today REAL,            -- Daily
  platform_fees_today REAL,            -- Daily
  avg_booking_value REAL,
  new_users_today INTEGER,             -- Daily signups
  churn_rate REAL,                     -- Percentage
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_kpi_date ON analytics_kpi_daily(kpi_date DESC);

-- ============================================================================
-- TABLE: analytics_cohort
-- Purpose: User cohort analysis and retention tracking
-- ============================================================================
CREATE TABLE analytics_cohort (
  id TEXT PRIMARY KEY,
  cohort_date DATE NOT NULL,           -- Week/Month user joined
  cohort_size INTEGER NOT NULL,        -- Number of users in cohort
  cohort_type TEXT,                    -- 'weekly', 'monthly'
  entity_type TEXT NOT NULL,           -- 'talent', 'agency', 'client'
  
  -- Retention metrics (percentage of original cohort still active)
  retention_week_0 REAL,               -- 0% to 100%
  retention_week_1 REAL,
  retention_week_2 REAL,
  retention_week_4 REAL,
  retention_week_8 REAL,
  retention_month_1 REAL,
  retention_month_3 REAL,
  retention_month_6 REAL,
  retention_month_12 REAL,
  
  -- Revenue metrics
  avg_revenue_per_user REAL,
  total_revenue REAL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_cohort_date ON analytics_cohort(cohort_date DESC);
CREATE INDEX idx_analytics_cohort_entity ON analytics_cohort(entity_type);

-- ============================================================================
-- TABLE: analytics_export_jobs
-- Purpose: Track asynchronous export (PDF, CSV, Excel) generation jobs
-- ============================================================================
CREATE TABLE analytics_export_jobs (
  id TEXT PRIMARY KEY,                 -- UUID for job tracking
  user_id TEXT NOT NULL,               -- User requesting export
  dashboard_type TEXT NOT NULL,        -- 'talent', 'agency', 'client', 'admin'
  export_format TEXT NOT NULL,         -- 'pdf', 'csv', 'excel'
  date_range_start DATE,
  date_range_end DATE,
  status TEXT DEFAULT 'pending',       -- 'pending', 'processing', 'complete', 'failed'
  progress INTEGER DEFAULT 0,          -- 0-100 percentage
  file_url TEXT,                       -- S3/R2 URL when complete
  file_size INTEGER,                   -- Bytes
  error_message TEXT,                  -- If failed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME
);

CREATE INDEX idx_analytics_export_user ON analytics_export_jobs(user_id);
CREATE INDEX idx_analytics_export_status ON analytics_export_jobs(status);
CREATE INDEX idx_analytics_export_created ON analytics_export_jobs(created_at DESC);

-- ============================================================================
-- TABLE: analytics_custom_reports
-- Purpose: User-created saved reports with scheduling
-- ============================================================================
CREATE TABLE analytics_custom_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  report_name TEXT NOT NULL,
  dashboard_type TEXT NOT NULL,        -- 'talent', 'agency', 'client', 'admin'
  description TEXT,
  
  -- Report configuration (JSON)
  selected_metrics TEXT NOT NULL,      -- JSON array of metric keys
  selected_dimensions TEXT,            -- JSON array of dimension keys
  chart_type TEXT,                     -- 'line', 'bar', 'pie', 'table'
  filters TEXT,                        -- JSON object of filters
  
  -- Scheduling
  schedule_frequency TEXT,             -- 'once', 'daily', 'weekly', 'monthly'
  schedule_time DATETIME,
  recipient_emails TEXT,               -- JSON array of email addresses
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  last_viewed_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_custom_reports_user ON analytics_custom_reports(user_id);
CREATE INDEX idx_analytics_custom_reports_created ON analytics_custom_reports(created_at DESC);

-- ============================================================================
-- TABLE: analytics_metrics_cache
-- Purpose: Cache calculated metrics to reduce query load
-- ============================================================================
CREATE TABLE analytics_metrics_cache (
  id TEXT PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,      -- e.g., 'talent:123:month:2026-01'
  entity_type TEXT NOT NULL,           -- 'talent', 'agency', 'client', 'platform'
  entity_id TEXT,
  time_period TEXT,                    -- 'hour', 'day', 'week', 'month', 'year'
  
  metrics_data TEXT NOT NULL,          -- JSON object with all metrics
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,        -- TTL for cache eviction
  hit_count INTEGER DEFAULT 0          -- Track cache effectiveness
);

CREATE INDEX idx_analytics_cache_expires ON analytics_metrics_cache(expires_at);
CREATE INDEX idx_analytics_cache_entity ON analytics_metrics_cache(entity_type, entity_id);


-- ============================================================================
-- MIGRATION 026: DB_ANALYTICS_dimensions
-- Database: Analytics Dimension and Summary Tables
-- Purpose: Pre-calculated summaries for fast dashboard performance
-- ============================================================================

-- ============================================================================
-- TABLE: analytics_time_dimension
-- Purpose: Dimension table for time-based queries (star schema)
-- ============================================================================
CREATE TABLE analytics_time_dimension (
  date_key TEXT PRIMARY KEY,           -- YYYY-MM-DD
  full_date DATE NOT NULL UNIQUE,
  year INTEGER,
  month INTEGER,
  day INTEGER,
  week INTEGER,
  day_of_week INTEGER,                 -- 1 = Monday, 7 = Sunday
  quarter INTEGER,
  is_weekend BOOLEAN,
  week_start_date DATE,
  month_start_date DATE,
  quarter_start_date DATE,
  year_start_date DATE
);

CREATE INDEX idx_time_dimension_date ON analytics_time_dimension(full_date DESC);
CREATE INDEX idx_time_dimension_month ON analytics_time_dimension(year, month);

-- ============================================================================
-- TABLE: analytics_entity_dimension
-- Purpose: Denormalized entity data for dimension joins
-- ============================================================================
CREATE TABLE analytics_entity_dimension (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,           -- 'talent', 'agency', 'client'
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  tier TEXT,                           -- 'premium', 'standard', 'basic'
  category TEXT,                       -- e.g., 'influencer', 'model', 'photographer'
  status TEXT,                         -- 'active', 'inactive', 'suspended'
  created_date DATE,
  is_verified BOOLEAN,
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_entity_dimension_composite ON analytics_entity_dimension(entity_type, entity_id);

-- ============================================================================
-- TABLE: analytics_talent_daily
-- Purpose: Daily aggregation of talent metrics
-- ============================================================================
CREATE TABLE analytics_talent_daily (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  metric_date DATE NOT NULL,
  
  -- Activity metrics
  profile_views INTEGER DEFAULT 0,
  bookings_received INTEGER DEFAULT 0,
  bookings_completed INTEGER DEFAULT 0,
  booking_completion_rate REAL,        -- 0-100
  
  -- Financial metrics
  revenue_earned REAL DEFAULT 0,
  platform_fees REAL DEFAULT 0,
  net_earnings REAL DEFAULT 0,
  
  -- Quality metrics
  avg_rating REAL,
  new_reviews INTEGER DEFAULT 0,
  response_time_avg_minutes REAL,
  
  -- Engagement
  profile_updates INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_talent_daily_date ON analytics_talent_daily(metric_date DESC);
CREATE INDEX idx_analytics_talent_daily_talent ON analytics_talent_daily(talent_id, metric_date DESC);

-- ============================================================================
-- TABLE: analytics_agency_daily
-- Purpose: Daily aggregation of agency metrics
-- ============================================================================
CREATE TABLE analytics_agency_daily (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  metric_date DATE NOT NULL,
  
  -- Portfolio metrics
  portfolio_views INTEGER DEFAULT 0,
  talent_roster_size INTEGER,
  
  -- Booking metrics
  bookings_received INTEGER DEFAULT 0,
  bookings_completed INTEGER DEFAULT 0,
  
  -- Financial metrics
  revenue_generated REAL DEFAULT 0,
  platform_fees_paid REAL DEFAULT 0,
  net_revenue REAL DEFAULT 0,
  
  -- Quality metrics
  avg_talent_rating REAL,
  client_satisfaction REAL,
  
  -- Client metrics
  unique_clients INTEGER DEFAULT 0,
  repeat_client_count INTEGER DEFAULT 0,
  repeat_client_percentage REAL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_agency_daily_date ON analytics_agency_daily(metric_date DESC);
CREATE INDEX idx_analytics_agency_daily_agency ON analytics_agency_daily(agency_id, metric_date DESC);

-- ============================================================================
-- TABLE: analytics_client_daily
-- Purpose: Daily aggregation of client metrics
-- ============================================================================
CREATE TABLE analytics_client_daily (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  metric_date DATE NOT NULL,
  
  -- Spending metrics
  total_spent_to_date REAL,
  daily_spend REAL DEFAULT 0,
  
  -- Booking metrics
  active_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  total_bookings_ever INTEGER,
  
  -- Behavior metrics
  favorite_talents INTEGER DEFAULT 0,
  repeat_talent_percentage REAL,
  
  -- Risk metrics
  churn_risk_score REAL,               -- 0-100, higher = more risk
  days_since_last_booking INTEGER,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_client_daily_date ON analytics_client_daily(metric_date DESC);
CREATE INDEX idx_analytics_client_daily_client ON analytics_client_daily(client_id, metric_date DESC);

-- ============================================================================
-- TABLE: analytics_funnel_daily
-- Purpose: Track booking and payment funnel metrics
-- ============================================================================
CREATE TABLE analytics_funnel_daily (
  id TEXT PRIMARY KEY,
  metric_date DATE NOT NULL,
  
  -- Funnel stages
  profile_views_total INTEGER,
  profile_to_booking_clicks INTEGER,
  booking_requests_sent INTEGER,
  booking_requests_accepted INTEGER,
  bookings_paid INTEGER,
  bookings_completed INTEGER,
  
  -- Conversion rates
  view_to_request_rate REAL,           -- %
  request_to_accepted_rate REAL,       -- %
  accepted_to_paid_rate REAL,          -- %
  paid_to_completed_rate REAL,         -- %
  
  -- Value metrics
  avg_booking_value_completed REAL,
  total_revenue REAL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_funnel_date ON analytics_funnel_daily(metric_date DESC);

-- ============================================================================
-- TABLE: analytics_revenue_summary
-- Purpose: Revenue aggregations by various dimensions
-- ============================================================================
CREATE TABLE analytics_revenue_summary (
  id TEXT PRIMARY KEY,
  summary_date DATE NOT NULL,
  summary_period TEXT,                 -- 'daily', 'weekly', 'monthly'
  
  -- Breakdown dimensions
  breakdown_type TEXT,                 -- 'by_talent', 'by_agency', 'by_client', 'by_tier'
  breakdown_value TEXT,                -- talent_id, agency_id, client_id, tier_name
  
  -- Revenue
  gross_revenue REAL DEFAULT 0,
  platform_fees REAL DEFAULT 0,
  net_revenue REAL DEFAULT 0,
  
  -- Booking context
  booking_count INTEGER DEFAULT 0,
  avg_booking_value REAL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_revenue_summary_date ON analytics_revenue_summary(summary_date DESC);
CREATE INDEX idx_analytics_revenue_summary_breakdown ON analytics_revenue_summary(breakdown_type, breakdown_value);

-- ============================================================================
-- TABLE: analytics_user_journey
-- Purpose: Track user progression and churn indicators
-- ============================================================================
CREATE TABLE analytics_user_journey (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,           -- 'talent', 'agency', 'client'
  
  -- Key dates
  signup_date DATE NOT NULL,
  first_action_date DATE,              -- First booking, view, message
  last_action_date DATE,
  
  -- Status
  current_status TEXT,                 -- 'active', 'inactive', 'churned'
  
  -- Lifecycle stage
  lifecycle_stage TEXT,                -- 'new', 'active', 'at_risk', 'churned'
  
  -- Metrics
  days_since_signup INTEGER,
  days_active INTEGER,
  session_count INTEGER,
  last_session_date DATE,
  
  -- Churn prediction
  churn_probability REAL,              -- 0-1
  churn_reason TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_user_journey_user ON analytics_user_journey(user_id, entity_type);
CREATE INDEX idx_analytics_user_journey_status ON analytics_user_journey(current_status);
CREATE INDEX idx_analytics_user_journey_lifecycle ON analytics_user_journey(lifecycle_stage);


-- ============================================================================
-- MIGRATION 027: DB_CORE_analytics_fields
-- Database: Add analytics fields to core tables
-- Purpose: Denormalize frequently-accessed analytics data
-- ============================================================================

-- ============================================================================
-- TABLE: talents (additions)
-- Add denormalized analytics fields for faster queries
-- ============================================================================
ALTER TABLE talents ADD COLUMN total_views INTEGER DEFAULT 0;
ALTER TABLE talents ADD COLUMN total_bookings INTEGER DEFAULT 0;
ALTER TABLE talents ADD COLUMN completed_bookings INTEGER DEFAULT 0;
ALTER TABLE talents ADD COLUMN total_earnings REAL DEFAULT 0;
ALTER TABLE talents ADD COLUMN avg_rating REAL;
ALTER TABLE talents ADD COLUMN review_count INTEGER DEFAULT 0;
ALTER TABLE talents ADD COLUMN response_time_minutes REAL;
ALTER TABLE talents ADD COLUMN last_active_at DATETIME;
ALTER TABLE talents ADD COLUMN profile_completion_percent INTEGER DEFAULT 0;

CREATE INDEX idx_talents_total_views ON talents(total_views DESC);
CREATE INDEX idx_talents_avg_rating ON talents(avg_rating DESC);
CREATE INDEX idx_talents_total_earnings ON talents(total_earnings DESC);

-- ============================================================================
-- TABLE: agencies (additions)
-- Add denormalized analytics fields for faster queries
-- ============================================================================
ALTER TABLE agencies ADD COLUMN total_views INTEGER DEFAULT 0;
ALTER TABLE agencies ADD COLUMN total_bookings INTEGER DEFAULT 0;
ALTER TABLE agencies ADD COLUMN total_revenue REAL DEFAULT 0;
ALTER TABLE agencies ADD COLUMN avg_talent_rating REAL;
ALTER TABLE agencies ADD COLUMN talent_roster_size INTEGER DEFAULT 0;
ALTER TABLE agencies ADD COLUMN unique_clients INTEGER DEFAULT 0;
ALTER TABLE agencies ADD COLUMN client_retention_rate REAL;
ALTER TABLE agencies ADD COLUMN last_active_at DATETIME;

CREATE INDEX idx_agencies_total_revenue ON agencies(total_revenue DESC);
CREATE INDEX idx_agencies_avg_talent_rating ON agencies(avg_talent_rating DESC);
CREATE INDEX idx_agencies_client_count ON agencies(unique_clients DESC);

-- ============================================================================
-- TABLE: clients (additions)
-- Add denormalized analytics fields for faster queries
-- ============================================================================
ALTER TABLE clients ADD COLUMN total_spent REAL DEFAULT 0;
ALTER TABLE clients ADD COLUMN total_bookings INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN completed_bookings INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN avg_booking_value REAL;
ALTER TABLE clients ADD COLUMN unique_talents_hired INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN repeat_talent_percentage REAL;
ALTER TABLE clients ADD COLUMN churn_risk_score REAL DEFAULT 0;
ALTER TABLE clients ADD COLUMN days_since_last_booking INTEGER;
ALTER TABLE clients ADD COLUMN last_active_at DATETIME;

CREATE INDEX idx_clients_total_spent ON clients(total_spent DESC);
CREATE INDEX idx_clients_churn_risk ON clients(churn_risk_score DESC);
CREATE INDEX idx_clients_last_active ON clients(last_active_at DESC);

-- ============================================================================
-- TABLE: bookings (additions)
-- Add analytics-specific fields for aggregation
-- ============================================================================
ALTER TABLE bookings ADD COLUMN gross_value REAL;              -- Before fees
ALTER TABLE bookings ADD COLUMN platform_fee REAL;            -- Platform cut
ALTER TABLE bookings ADD COLUMN net_value REAL;               -- After fees
ALTER TABLE bookings ADD COLUMN completion_status TEXT;       -- 'pending', 'completed', 'cancelled'
ALTER TABLE bookings ADD COLUMN is_repeat_client BOOLEAN;     -- Was this client used before?
ALTER TABLE bookings ADD COLUMN days_to_complete INTEGER;     -- Duration
ALTER TABLE bookings ADD COLUMN client_satisfaction_score REAL; -- 1-5 star rating
ALTER TABLE bookings ADD COLUMN dispute_flag BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_bookings_completion_status ON bookings(completion_status);
CREATE INDEX idx_bookings_gross_value ON bookings(gross_value DESC);
CREATE INDEX idx_bookings_created_date ON bookings(DATE(created_at) DESC);

-- ============================================================================
-- Sample Data Loading (Demo Only)
-- ============================================================================
-- Uncomment to load sample data for testing dashboards

-- INSERT INTO analytics_time_dimension 
-- (date_key, full_date, year, month, day, week, day_of_week, quarter)
-- VALUES
-- ('2026-01-15', '2026-01-15', 2026, 1, 15, 3, 4, 1),
-- ('2026-01-14', '2026-01-14', 2026, 1, 14, 3, 3, 1);

-- INSERT INTO analytics_aggregation_hourly 
-- (id, metric_type, entity_type, entity_id, metric_value, hour_timestamp, date_key)
-- VALUES
-- ('agg-001', 'views', 'talent', 'talent-123', 45, '2026-01-15 14:00:00', '2026-01-15 14:00'),
-- ('agg-002', 'bookings', 'talent', 'talent-123', 3, '2026-01-15 14:00:00', '2026-01-15 14:00'),
-- ('agg-003', 'revenue', 'talent', 'talent-123', 1500.00, '2026-01-15 14:00:00', '2026-01-15 14:00');

-- ============================================================================
-- End of Analytics Schema
-- ============================================================================
