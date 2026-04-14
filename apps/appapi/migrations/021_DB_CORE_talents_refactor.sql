-- Migration: Create core talent tables and enhance talent_profiles
-- This script establishes the foundational tables for talent management,
-- separating concerns for scalability and performance.

-- 1. Create a base `talents` table to bridge AppSSO and DB_CORE
-- This table holds essential identity information not available in the SSO user table.
CREATE TABLE IF NOT EXISTS talents (
  id TEXT PRIMARY KEY, -- Maps to DB_SSO users.id
  fullname TEXT NOT NULL, -- Stored here since DB_SSO cannot be modified
  username TEXT UNIQUE NOT NULL, -- Crucial for Public URL routing (e.g., domain.com/talents/orland-mgt)
  phone TEXT, -- Stored here since DB_SSO cannot be modified
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Modify `talent_profiles` to store new, flexible data structures
-- We are adding JSON columns for data that is either unstructured or has a variable schema.
-- This avoids excessive table joins for simple profile views.
ALTER TABLE talent_profiles ADD COLUMN social_media_json TEXT DEFAULT '{}';
ALTER TABLE talent_profiles ADD COLUMN interested_in_json TEXT DEFAULT '[]';
ALTER TABLE talent_profiles ADD COLUMN skills_json TEXT DEFAULT '[]';
ALTER TABLE talent_profiles ADD COLUMN assets_json TEXT DEFAULT '{"youtube":[], "audio":[]}';
ALTER TABLE talent_profiles ADD COLUMN specific_characteristics_json TEXT DEFAULT '[]';
ALTER TABLE talent_profiles ADD COLUMN tattoos_json TEXT DEFAULT '[]';
ALTER TABLE talent_profiles ADD COLUMN piercings_json TEXT DEFAULT '[]';

-- 3. Create `talent_credits` table
-- A separate table for credits is crucial for performance at scale, avoiding massive JSON parsing.
CREATE TABLE IF NOT EXISTS talent_credits (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  credit_type TEXT, -- e.g., 'Film', 'TV', 'Commercial'
  role TEXT,
  year TEXT,
  company TEXT,
  description TEXT,
  photo_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

-- 4. Create `talent_additional_photos` table
-- Storing photo URLs in a separate table is efficient for querying and managing media.
CREATE TABLE IF NOT EXISTS talent_additional_photos (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

-- 5. INDEXING FOR PERFORMANCE
-- Indexes are critical for fast lookups, especially for public profiles and filtering.
CREATE INDEX IF NOT EXISTS idx_talents_username ON talents(username);
CREATE INDEX IF NOT EXISTS idx_profiles_gender_age ON talent_profiles(gender, age);
CREATE INDEX IF NOT EXISTS idx_credits_talent_id ON talent_credits(talent_id);
CREATE INDEX IF NOT EXISTS idx_photos_talent_id ON talent_additional_photos(talent_id);
