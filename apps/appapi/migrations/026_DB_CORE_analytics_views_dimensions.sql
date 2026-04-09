-- Migration 026: Analytics Aggregation Views & Time Dimensions
-- Purpose: Create materialized views, time dimensions, and calculation tables for analytics
-- Date: January 2026

-- ============================================================================
-- TIME DIMENSION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_time_dimension (
  date_key TEXT PRIMARY KEY, -- YYYY-MM-DD
  
  full_date DATE NOT NULL,
  
  -- Date parts
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL, -- 1-4
  month INTEGER NOT NULL, -- 1-12
  month_name TEXT NOT NULL,
  week_of_year INTEGER NOT NULL, -- 1-53
  day_of_month INTEGER NOT NULL, -- 1-31
  day_of_week INTEGER NOT NULL, -- 0-6 (0=Sunday)
  day_name TEXT NOT NULL,
  hour_of_day INTEGER, -- 0-23
  
  -- Flags
  is_weekend BOOLEAN DEFAULT FALSE,
  is_holiday BOOLEAN DEFAULT FALSE,
  is_quarter_end BOOLEAN DEFAULT FALSE,
  is_year_end BOOLEAN DEFAULT FALSE,
  
  -- Periods
  week_start_date DATE,
  week_end_date DATE,
  month_start_date DATE,
  month_end_date DATE,
  quarter_start_date DATE,
  quarter_end_date DATE,
  year_start_date DATE,
  year_end_date DATE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_time_year_month 
  ON analytics_time_dimension(year, month);
CREATE INDEX idx_analytics_time_week 
  ON analytics_time_dimension(year, week_of_year);
CREATE INDEX idx_analytics_time_date 
  ON analytics_time_dimension(full_date DESC);

-- ============================================================================
-- ENTITY DIMENSION TABLE (Denormalized for fast joins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_entity_dimension (
  entity_key TEXT PRIMARY KEY, -- 'talent_<id>', 'agency_<id>', 'client_<id>'
  
  -- Entity info
  entity_type TEXT NOT NULL, -- 'talent', 'agency', 'client'
  entity_id TEXT NOT NULL,
  
  -- Denormalized data (refreshed daily)
  entity_name TEXT,
  entity_status TEXT, -- 'active', 'inactive', 'suspended'
  
  -- Category info for talents
  primary_category TEXT,
  skills TEXT, -- JSON array
  
  -- Location
  country TEXT,
  city TEXT,
  timezone TEXT,
  
  -- Tier/Level
  tier_level TEXT, -- 'bronze', 'silver', 'gold', 'platinum'
  rating_avg DECIMAL(3, 2),
  rating_count INTEGER,
  
  -- Metadata
  created_date DATE,
  days_since_creation INTEGER,
  
  -- Refresh tracking
  last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (entity_id) REFERENCES talents(id) OR 
                          REFERENCES agencies(id) OR 
                          REFERENCES clients(id)
);

CREATE INDEX idx_analytics_entity_type 
  ON analytics_entity_dimension(entity_type);
CREATE INDEX idx_analytics_entity_name 
  ON analytics_entity_dimension(entity_name);
CREATE INDEX idx_analytics_entity_tier 
  ON analytics_entity_dimension(tier_level);

-- ============================================================================
-- AGGREGATED DAILY TALENT METRICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_talent_daily (
  id TEXT PRIMARY KEY,
  
  talent_id TEXT NOT NULL,
  metric_date DATE NOT NULL,
  
  -- Views & engagement
  profile_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  contact_requests INTEGER DEFAULT 0,
  
  -- Bookings
  bookings_requested INTEGER DEFAULT 0,
  bookings_confirmed INTEGER DEFAULT 0,
  bookings_completed INTEGER DEFAULT 0,
  
  -- Revenue
  earnings_gross DECIMAL(12, 2) DEFAULT 0,
  earnings_net DECIMAL(12, 2) DEFAULT 0, -- after fees
  invoices_issued INTEGER DEFAULT 0,
  invoices_paid INTEGER DEFAULT 0,
  
  -- Quality
  avg_rating DECIMAL(3, 2),
  new_reviews INTEGER DEFAULT 0,
  complaints INTEGER DEFAULT 0,
  
  -- Market position
  rank_tier TEXT, -- 'bronze', 'silver', 'gold', 'platinum'
  rank_position INTEGER, -- position in tier
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(talent_id, metric_date),
  FOREIGN KEY (talent_id) REFERENCES talents(id),
  CHECK (profile_views >= 0),
  CHECK (bookings_confirmed <= bookings_requested),
  CHECK (earnings_net <= earnings_gross)
);

CREATE INDEX idx_analytics_talent_daily_date 
  ON analytics_talent_daily(metric_date DESC);
CREATE INDEX idx_analytics_talent_daily_talent 
  ON analytics_talent_daily(talent_id);
CREATE INDEX idx_analytics_talent_daily_status 
  ON analytics_talent_daily(rank_tier);

-- ============================================================================
-- AGGREGATED DAILY AGENCY METRICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_agency_daily (
  id TEXT PRIMARY KEY,
  
  agency_id TEXT NOT NULL,
  metric_date DATE NOT NULL,
  
  -- Portfolio metrics
  talent_roster_count INTEGER DEFAULT 0,
  talent_with_views INTEGER DEFAULT 0,
  
  -- Engagement
  total_profile_views INTEGER DEFAULT 0,
  total_messages_received INTEGER DEFAULT 0,
  contact_requests INTEGER DEFAULT 0,
  
  -- Bookings
  bookings_requested INTEGER DEFAULT 0,
  bookings_confirmed INTEGER DEFAULT 0,
  bookings_completed INTEGER DEFAULT 0,
  bookings_avg_value DECIMAL(12, 2),
  
  -- Revenue
  revenue_total DECIMAL(15, 2) DEFAULT 0,
  revenue_commission DECIMAL(15, 2) DEFAULT 0,
  invoices_issued INTEGER DEFAULT 0,
  invoices_paid INTEGER DEFAULT 0,
  
  -- Quality
  avg_rating DECIMAL(3, 2),
  complaints INTEGER DEFAULT 0,
  
  -- Growth
  new_talents_added INTEGER DEFAULT 0,
  new_clients INTEGER DEFAULT 0,
  churn_talents INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(agency_id, metric_date),
  FOREIGN KEY (agency_id) REFERENCES agencies(id),
  CHECK (talent_with_views <= talent_roster_count),
  CHECK (bookings_completed <= bookings_confirmed)
);

CREATE INDEX idx_analytics_agency_daily_date 
  ON analytics_agency_daily(metric_date DESC);
CREATE INDEX idx_analytics_agency_daily_agency 
  ON analytics_agency_daily(agency_id);

-- ============================================================================
-- AGGREGATED DAILY CLIENT METRICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_client_daily (
  id TEXT PRIMARY KEY,
  
  client_id TEXT NOT NULL,
  metric_date DATE NOT NULL,
  
  -- Activity
  talents_searched INTEGER DEFAULT 0,
  talents_viewed INTEGER DEFAULT 0,
  talent_inquiries INTEGER DEFAULT 0,
  
  -- Bookings
  bookings_requested INTEGER DEFAULT 0,
  bookings_confirmed INTEGER DEFAULT 0,
  bookings_completed INTEGER DEFAULT 0,
  
  -- Spending
  amount_spent DECIMAL(12, 2) DEFAULT 0,
  amount_in_escrow DECIMAL(12, 2) DEFAULT 0,
  avg_booking_value DECIMAL(12, 2),
  
  -- Engagement
  projects_active INTEGER DEFAULT 0,
  projects_completed INTEGER DEFAULT 0,
  talents_repeat_hire INTEGER DEFAULT 0,
  
  -- Quality
  avg_spend_per_booking DECIMAL(12, 2),
  cancellation_rate DECIMAL(5, 2),
  avg_talent_rating DECIMAL(3, 2),
  
  -- Churn indicators
  days_since_last_booking INTEGER,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(client_id, metric_date),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  CHECK (bookings_completed <= bookings_confirmed),
  CHECK (amount_in_escrow >= 0)
);

CREATE INDEX idx_analytics_client_daily_date 
  ON analytics_client_daily(metric_date DESC);
CREATE INDEX idx_analytics_client_daily_client 
  ON analytics_client_daily(client_id);

-- ============================================================================
-- FUNNEL METRICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_funnel_daily (
  id TEXT PRIMARY KEY,
  
  metric_date DATE NOT NULL,
  
  -- Talent discovery funnel
  talent_profile_views INTEGER DEFAULT 0,
  talent_contact_requests INTEGER DEFAULT 0,
  talent_inquiries_converted_percent DECIMAL(5, 2),
  
  -- Booking funnel
  booking_requests INTEGER DEFAULT 0,
  booking_confirmed INTEGER DEFAULT 0,
  booking_completed INTEGER DEFAULT 0,
  confirmation_rate DECIMAL(5, 2),
  completion_rate DECIMAL(5, 2),
  
  -- Payment funnel
  contracts_signed INTEGER DEFAULT 0,
  payments_released INTEGER DEFAULT 0,
  escrow_released_percent DECIMAL(5, 2),
  disputes_raised INTEGER DEFAULT 0,
  disputes_resolved INTEGER DEFAULT 0,
  dispute_resolution_rate DECIMAL(5, 2),
  
  -- Financial funnel
  gross_booking_value DECIMAL(15, 2) DEFAULT 0,
  net_platform_revenue DECIMAL(15, 2) DEFAULT 0,
  platform_take_rate DECIMAL(5, 2), -- % of GBV
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(metric_date)
);

CREATE INDEX idx_analytics_funnel_date 
  ON analytics_funnel_daily(metric_date DESC);

-- ============================================================================
-- MATERIALIZED VIEW: REVENUE SUMMARY (Refresh hourly/daily)
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_revenue_summary (
  id TEXT PRIMARY KEY,
  
  summary_date DATE NOT NULL,
  summary_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  
  -- Revenue breakdown
  total_gross_booking_value DECIMAL(15, 2) DEFAULT 0,
  total_platform_fees DECIMAL(12, 2) DEFAULT 0,
  total_payouts DECIMAL(15, 2) DEFAULT 0,
  
  -- By source
  revenue_from_agency_fees DECIMAL(12, 2) DEFAULT 0,
  revenue_from_talent_fees DECIMAL(12, 2) DEFAULT 0,
  revenue_from_escrow_interest DECIMAL(12, 2) DEFAULT 0,
  revenue_from_premium DECIMAL(12, 2) DEFAULT 0,
  
  -- Currency breakdown
  revenue_usd DECIMAL(15, 2) DEFAULT 0,
  revenue_eur DECIMAL(15, 2) DEFAULT 0,
  revenue_gbp DECIMAL(15, 2) DEFAULT 0,
  
  -- Status
  pending_payouts DECIMAL(15, 2) DEFAULT 0,
  escrow_held DECIMAL(15, 2) DEFAULT 0,
  
  transactions_count INTEGER DEFAULT 0,
  avg_transaction_value DECIMAL(12, 2),
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(summary_date, summary_type)
);

CREATE INDEX idx_analytics_revenue_date 
  ON analytics_revenue_summary(summary_date DESC);
CREATE INDEX idx_analytics_revenue_type 
  ON analytics_revenue_summary(summary_type);

-- ============================================================================
-- USER JOURNEY TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_user_journey (
  id TEXT PRIMARY KEY,
  
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL, -- 'talent', 'agency', 'client'
  
  -- Timeline
  signup_date DATE,
  first_action_date DATE,
  first_booking_date DATE,
  first_payment_date DATE,
  
  -- Stage tracking
  current_stage TEXT, -- 'registered', 'active', 'booked', 'paid', 'returning'
  stage_progression TEXT, -- JSON array of {stage, date}
  
  -- Conversion tracking
  days_to_first_action INTEGER,
  days_to_first_booking INTEGER,
  days_to_first_payment INTEGER,
  
  -- Activity frequency
  actions_30_days INTEGER,
  actions_90_days INTEGER,
  
  -- Risk indicators
  last_activity_date DATE,
  days_since_activity INTEGER,
  churn_risk_score DECIMAL(3, 2), -- 0-100, higher = higher churn risk
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_analytics_journey_user 
  ON analytics_user_journey(user_id);
CREATE INDEX idx_analytics_journey_stage 
  ON analytics_user_journey(current_stage);
CREATE INDEX idx_analytics_journey_churn 
  ON analytics_user_journey(churn_risk_score DESC);

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- Created 8 new analytical tables for performance & reporting:
-- 1. analytics_time_dimension - Time reference table for fast date filtering
-- 2. analytics_entity_dimension - Denormalized entity data for quick lookups
-- 3. analytics_talent_daily - Daily aggregate metrics per talent
-- 4. analytics_agency_daily - Daily aggregate metrics per agency
-- 5. analytics_client_daily - Daily aggregate metrics per client
-- 6. analytics_funnel_daily - Platform-wide funnel metrics
-- 7. analytics_revenue_summary - Revenue aggregation by period
-- 8. analytics_user_journey - User progression & churn tracking
--
-- Key design decisions:
-- - Time dimension table enables fast date queries without calculations
-- - Entity dimension provides denormalized business data for quick joins
-- - Daily aggregates pre-calculate metrics for dashboard performance
-- - Funnel metrics track conversion rates and drop-off points
-- - Journey table identifies user progression & churn risks
-- - All tables use UTC timestamps and date keys for consistency
-- ============================================================================
