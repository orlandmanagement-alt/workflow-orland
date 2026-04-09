-- Migration 024: Phase 2 Scale-Up - Availability & Calendar
-- Creates availability calendar for talents

CREATE TABLE IF NOT EXISTS availability (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('booked', 'unavailable', 'available')) DEFAULT 'booked',
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (talent_id) REFERENCES talents(id)
);

CREATE TABLE IF NOT EXISTS talent_analytics (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL UNIQUE,
  views_7d INTEGER DEFAULT 0,
  views_30d INTEGER DEFAULT 0,
  views_all_time INTEGER DEFAULT 0,
  rank_tier TEXT CHECK (rank_tier IN ('top_1', 'top_5', 'top_10', 'top_25', 'mid', 'emerging')) DEFAULT 'emerging',
  score FLOAT DEFAULT 0.0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (talent_id) REFERENCES talents(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_availability_talent_id ON availability(talent_id);
CREATE INDEX IF NOT EXISTS idx_availability_dates ON availability(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_availability_status ON availability(status);
CREATE INDEX IF NOT EXISTS idx_talent_analytics_talent_id ON talent_analytics(talent_id);
CREATE INDEX IF NOT EXISTS idx_talent_analytics_rank_tier ON talent_analytics(rank_tier);
CREATE INDEX IF NOT EXISTS idx_talent_analytics_score ON talent_analytics(score DESC);
