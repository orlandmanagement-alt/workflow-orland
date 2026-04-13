-- Migration 027: Enhance Existing Tables with Analytics Fields
-- Purpose: Add analytics tracking fields and views to existing core tables
-- Date: January 2026

-- ============================================================================
-- ALTER TALENTS TABLE
-- ============================================================================
ALTER TABLE talents ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;
ALTER TABLE talents ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0;
ALTER TABLE talents ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE talents ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3, 2);
ALTER TABLE talents ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE talents ADD COLUMN IF NOT EXISTS last_booking_date DATETIME;
ALTER TABLE talents ADD COLUMN IF NOT EXISTS booking_completion_rate DECIMAL(5, 2);
ALTER TABLE talents ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER; -- avg response to inquiry
ALTER TABLE talents ADD COLUMN IF NOT EXISTS profile_completeness DECIMAL(5, 2) DEFAULT 0; -- 0-100%
ALTER TABLE talents ADD COLUMN IF NOT EXISTS last_analytics_update DATETIME DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_talents_total_views 
  ON talents(total_views DESC);
CREATE INDEX IF NOT EXISTS idx_talents_avg_rating 
  ON talents(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_talents_total_earnings 
  ON talents(total_earnings DESC);

-- ============================================================================
-- ALTER AGENCIES TABLE
-- ============================================================================
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS talent_roster_size INTEGER DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3, 2);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS last_booking_date DATETIME;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS booking_completion_rate DECIMAL(5, 2);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS client_count INTEGER DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS clients_retained_percentage DECIMAL(5, 2);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS last_analytics_update DATETIME DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_agencies_total_revenue 
  ON agencies(total_revenue DESC);
CREATE INDEX IF NOT EXISTS idx_agencies_total_bookings 
  ON agencies(total_bookings DESC);
CREATE INDEX IF NOT EXISTS idx_agencies_rating 
  ON agencies(avg_rating DESC);

-- ============================================================================
-- ALTER CLIENTS TABLE
-- ============================================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_spent DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avg_booking_value DECIMAL(12, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS repeat_talent_rate DECIMAL(5, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bookings_completed INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bookings_cancelled INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cancellation_rate DECIMAL(5, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_booking_date DATETIME;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS days_since_activity INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(15, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_analytics_update DATETIME DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_clients_total_spent 
  ON clients(total_spent DESC);
CREATE INDEX IF NOT EXISTS idx_clients_lifetime_value 
  ON clients(lifetime_value DESC);
CREATE INDEX IF NOT EXISTS idx_clients_activity 
  ON clients(last_booking_date DESC);

-- ============================================================================
-- ALTER BOOKINGS TABLE
-- ============================================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_value DECIMAL(12, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS net_payout DECIMAL(12, 2); -- talent take-home
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completion_tracked_at DATETIME;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completion_duration_days INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completion_on_time BOOLEAN;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rating_given BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS dispute_status TEXT; -- 'none', 'raised', 'resolved'
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_feedback TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_value 
  ON bookings(booking_value DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_completion 
  ON bookings(completion_tracked_at DESC);

-- ============================================================================
-- ALTER TALENT_ANALYTICS TABLE (if exists, add new fields)
-- ============================================================================
ALTER TABLE talent_analytics ADD COLUMN IF NOT EXISTS unique_viewers INTEGER DEFAULT 0;
ALTER TABLE talent_analytics ADD COLUMN IF NOT EXISTS inquiry_to_booking_rate DECIMAL(5, 2);
ALTER TABLE talent_analytics ADD COLUMN IF NOT EXISTS booking_acceptance_rate DECIMAL(5, 2);
ALTER TABLE talent_analytics ADD COLUMN IF NOT EXISTS hourly_rate_avg DECIMAL(12, 2);
ALTER TABLE talent_analytics ADD COLUMN IF NOT EXISTS projects_in_progress INTEGER DEFAULT 0;
ALTER TABLE talent_analytics ADD COLUMN IF NOT EXISTS repeat_client_count INTEGER DEFAULT 0;
ALTER TABLE talent_analytics ADD COLUMN IF NOT EXISTS refund_requests INTEGER DEFAULT 0;
ALTER TABLE talent_analytics ADD COLUMN IF NOT EXISTS refund_issues_resolved BOOLEAN;

-- ============================================================================
-- CREATE ANALYTICAL VIEWS
-- ============================================================================

-- View: Talent Performance Snapshot
CREATE VIEW IF NOT EXISTS vw_talent_performance AS
SELECT 
  t.id,
  t.user_id,
  t.name,
  t.category,
  t.total_views,
  t.total_bookings,
  t.total_earnings,
  t.avg_rating,
  t.rating_count,
  t.booking_completion_rate,
  CASE 
    WHEN t.avg_rating >= 4.8 THEN 'Platinum'
    WHEN t.avg_rating >= 4.5 THEN 'Gold'
    WHEN t.avg_rating >= 4.0 THEN 'Silver'
    ELSE 'Bronze'
  END as tier,
  DATEDIFF(day, t.last_booking_date, GETDATE()) as days_since_last_booking,
  t.profile_completeness,
  t.updated_at
FROM talents t
WHERE t.status = 'active';

-- View: Agency Performance Snapshot
CREATE VIEW IF NOT EXISTS vw_agency_performance AS
SELECT 
  a.id,
  a.user_id,
  a.name,
  a.total_views,
  a.total_bookings,
  a.total_revenue,
  a.talent_roster_size,
  a.avg_rating,
  a.client_count,
  a.booking_completion_rate,
  DATEDIFF(day, a.last_booking_date, GETDATE()) as days_since_last_booking,
  a.clients_retained_percentage,
  a.updated_at
FROM agencies a
WHERE a.status = 'active';

-- View: Client Spending Summary
CREATE VIEW IF NOT EXISTS vw_client_spending AS
SELECT 
  c.id,
  c.user_id,
  c.company_name,
  c.total_spent,
  c.total_bookings,
  c.avg_booking_value,
  c.bookings_completed,
  c.cancellation_rate,
  c.lifetime_value,
  DATEDIFF(day, c.last_booking_date, GETDATE()) as days_since_activity,
  c.total_spent / NULLIF(c.total_bookings, 0) as avg_spend_per_booking,
  c.updated_at
FROM clients c
WHERE c.status = 'active';

-- View: Booking Funnel Metrics
CREATE VIEW IF NOT EXISTS vw_booking_funnel AS
SELECT 
  DATE(b.created_at) as booking_date,
  COUNT(*) as total_requests,
  SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
  SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
  ROUND(100.0 * SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) / COUNT(*), 2) as confirmation_rate,
  ROUND(100.0 * SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as completion_rate
FROM bookings b
GROUP BY DATE(b.created_at);

-- View: Revenue Summary
CREATE VIEW IF NOT EXISTS vw_revenue_daily AS
SELECT 
  DATE(b.created_at) as revenue_date,
  COUNT(*) as transactions,
  SUM(b.booking_value) as gross_revenue,
  SUM(b.platform_fee) as platform_fees,
  SUM(b.net_payout) as talent_payouts,
  AVG(b.booking_value) as avg_transaction,
  SUM(CASE WHEN b.status = 'completed' THEN b.booking_value ELSE 0 END) as completed_revenue
FROM bookings b
GROUP BY DATE(b.created_at);

-- View: User Growth Metrics
CREATE VIEW IF NOT EXISTS vw_user_growth AS
SELECT 
  DATE(u.created_at) as signup_date,
  COUNT(*) as new_signups,
  SUM(CASE WHEN u.user_type = 'talent' THEN 1 ELSE 0 END) as new_talents,
  SUM(CASE WHEN u.user_type = 'agency' THEN 1 ELSE 0 END) as new_agencies,
  SUM(CASE WHEN u.user_type = 'client' THEN 1 ELSE 0 END) as new_clients
FROM users u
WHERE u.is_active = 1
GROUP BY DATE(u.created_at);

-- View: Top Performing Talents (Last 30 days)
CREATE VIEW IF NOT EXISTS vw_top_talents_30days AS
SELECT 
  t.id,
  t.name,
  COUNT(DISTINCT b.id) as bookings_30days,
  SUM(b.booking_value) as revenue_30days,
  AVG(br.rating) as avg_rating,
  COUNT(DISTINCT b.client_id) as unique_clients,
  t.avg_rating as overall_rating
FROM talents t
LEFT JOIN bookings b ON t.id = b.talent_id 
  AND b.created_at >= DATEADD(day, -30, GETDATE())
LEFT JOIN booking_reviews br ON b.id = br.booking_id
GROUP BY t.id, t.name, t.avg_rating
ORDER BY revenue_30days DESC;

-- View: Market Health Indicators
CREATE VIEW IF NOT EXISTS vw_market_health AS
SELECT 
  (SELECT COUNT(DISTINCT id) FROM talents WHERE status = 'active') as active_talents,
  (SELECT COUNT(DISTINCT id) FROM agencies WHERE status = 'active') as active_agencies,
  (SELECT COUNT(DISTINCT id) FROM clients WHERE status = 'active') as active_clients,
  (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND created_at >= DATEADD(day, -30, GETDATE())) as completed_bookings_30days,
  (SELECT SUM(booking_value) FROM bookings WHERE status = 'completed' AND created_at >= DATEADD(day, -30, GETDATE())) as revenue_30days,
  (SELECT AVG(booking_value) FROM bookings WHERE created_at >= DATEADD(day, -30, GETDATE())) as avg_booking_value_30days;

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- Enhanced 5 existing tables and created 7 analytical views:
--
-- Table Enhancements:
-- 1. talents - Added 9 analytics fields (views, bookings, earnings, ratings, etc.)
-- 2. agencies - Added 10 analytics fields (revenue, roster, completion rate, etc.)
-- 3. clients - Added 11 analytics fields (spending, bookings, churn indicators, etc.)
-- 4. bookings - Added 9 analytics fields (value, fees, completion tracking, disputes, etc.)
-- 5. talent_analytics - Added 8 additional tracking fields
--
-- New Analytical Views:
-- 1. vw_talent_performance - Talent rankings and tier classification
-- 2. vw_agency_performance - Agency metrics and performance
-- 3. vw_client_spending - Client financial metrics
-- 4. vw_booking_funnel - Booking conversion rates
-- 5. vw_revenue_daily - Daily revenue summary
-- 6. vw_user_growth - User acquisition tracking
-- 7. vw_top_talents_30days - High performers (30-day window)
-- 8. vw_market_health - Platform-wide health indicators
--
-- Key additions:
-- - Denormalized aggregate fields for query performance
-- - Indexes on frequently filtered/sorted fields
-- - Views for common dashboard queries
-- - Support for tier classification and churn detection
-- ============================================================================
