-- MISSION 2: Bulk Operations, Agency Roles, and Premium Tiers
-- Database Schema Updates for Drag-and-Drop Sorting and View Tracking

-- 1. Add account_tier and role to users table (if not already present)
ALTER TABLE users ADD COLUMN account_tier TEXT DEFAULT 'free' CHECK(account_tier IN ('free', 'premium'));
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'talent' CHECK(role IN ('admin', 'agency', 'talent', 'client'));

-- 2. Add agency_id to talents table (if not already present)
ALTER TABLE talents ADD COLUMN agency_id UUID;

-- 3. Add sort_order and view_count to media table
ALTER TABLE media ADD COLUMN sort_order INTEGER DEFAULT 0;
ALTER TABLE media ADD COLUMN view_count INTEGER DEFAULT 0;

-- 4. Add sort_order and view_count to assets table (videos)
ALTER TABLE assets ADD COLUMN sort_order INTEGER DEFAULT 0;
ALTER TABLE assets ADD COLUMN view_count INTEGER DEFAULT 0;

-- 5. Create agencies table (if not already present)
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid(),
  user_id UUID NOT NULL,
  agency_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Create indexes for sorting queries
CREATE INDEX IF NOT EXISTS idx_media_sort_order ON media(talent_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_assets_sort_order ON assets(talent_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_assets_view_count ON assets(talent_id, view_count DESC);
