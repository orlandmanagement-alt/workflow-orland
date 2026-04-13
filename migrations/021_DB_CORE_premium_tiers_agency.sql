-- MISSION 1: Premium Tiers, Agency Role, and Secure Feature Gating
-- Database Schema Updates

-- 1. Add account_tier to users table
ALTER TABLE users ADD COLUMN account_tier TEXT DEFAULT 'free' CHECK(account_tier IN ('free', 'premium'));

-- 2. Add agency_id to talents table
ALTER TABLE talents ADD COLUMN agency_id UUID;
ALTER TABLE talents ADD CONSTRAINT fk_talents_agency FOREIGN KEY(agency_id) REFERENCES agencies(id);

-- 3. Add image_url to credits table
ALTER TABLE credits ADD COLUMN image_url TEXT;

-- 4. Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid(),
  user_id UUID NOT NULL,
  agency_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Create agency_talents junction table (for many-to-many if needed)
-- Note: If using agency_id in talents table, this is optional
CREATE TABLE IF NOT EXISTS agency_talents (
  id UUID PRIMARY KEY DEFAULT uuid(),
  agency_id UUID NOT NULL,
  talent_id UUID NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  UNIQUE(agency_id, talent_id)
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_talents_agency_id ON talents(agency_id);
CREATE INDEX IF NOT EXISTS idx_agencies_user_id ON agencies(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_talents_agency ON agency_talents(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_talents_talent ON agency_talents(talent_id);
