-- Migration 033: KOL Specialist Workspace Tables
-- Untuk menangani Campaign Briefing, Content Review, dan Performance Tracking

-- ============================================================
-- TABLE: kol_briefs
-- Digital campaign briefing untuk KOL
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_briefs (
  id STRING PRIMARY KEY DEFAULT (hex(randomblob(16))),
  project_id STRING NOT NULL,
  client_user_id STRING NOT NULL, -- KOL Specialist yang membuat brief
  
  -- Campaign info
  campaign_name STRING NOT NULL,
  campaign_description TEXT DEFAULT NULL,
  campaign_objective STRING DEFAULT NULL, -- 'awareness', 'engagement', 'conversion', 'viral'
  
  -- Guidelines stored as JSON object
  -- {
  --   "do_list": ["Mention product 3x", "Use brand colors", "Make 30-60 sec video"],
  --   "dont_list": ["No politics", "No competitor mentions"],
  --   "mandatory_hashtags": ["#BrandName", "#Campaign2026"],
  --   "optional_hashtags": ["#KOL", "#Trending"],
  --   "tone": "casual", "professional", "funny"
  --   "visual_guidelines": ["Use brand kit colors", "Font family: Modern sans-serif"],
  --   "target_audience": "18-35 years old, Urban, Tech-savvy",
  --   "posting_schedule": "Post by April 15, 2026"
  -- }
  guidelines TEXT NOT NULL DEFAULT '{}',
  
  -- Moodboard reference
  moodboard_urls TEXT DEFAULT NULL, -- JSON array of image URLs
  inspiration_links TEXT DEFAULT NULL, -- JSON array of reference links
  
  -- Campaign timeline
  brief_issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submission_deadline DATETIME NOT NULL,
  
  -- Status
  is_active INTEGER DEFAULT 1, -- 0: archived, 1: active
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_kol_brief_project ON kol_briefs(project_id);
CREATE INDEX idx_kol_brief_client ON kol_briefs(client_user_id);
CREATE INDEX idx_kol_brief_deadline ON kol_briefs(submission_deadline);

-- ============================================================
-- TABLE: kol_content_drafts
-- Draft konten dari KOL yang butuh review dari KOL Specialist
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_content_drafts (
  id STRING PRIMARY KEY DEFAULT (hex(randomblob(16))),
  brief_id STRING NOT NULL,
  talent_id STRING NOT NULL,
  project_id STRING NOT NULL,
  
  -- Content submission
  video_url STRING NOT NULL, -- URL ke video di storage
  video_thumbnail_url STRING DEFAULT NULL,
  caption_text TEXT DEFAULT NULL,
  hashtags_used TEXT DEFAULT NULL, -- JSON array
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Content metadata
  video_duration_seconds INTEGER DEFAULT NULL,
  video_platform_source STRING DEFAULT NULL, -- 'native', 'tiktok', 'instagram', 'youtube'
  
  -- Review workflow
  -- Status: 'pending_review' -> 'revision_requested' -> 'approved' OR rejected
  status STRING DEFAULT 'pending_review', -- pending_review, revision_requested, approved, rejected
  reviewed_by STRING DEFAULT NULL, -- KOL Specialist user ID
  reviewed_at DATETIME DEFAULT NULL,
  
  -- If revision requested
  feedback_text TEXT DEFAULT NULL, -- Why revision needed
  revision_count INTEGER DEFAULT 0,
  
  -- Final approval
  approved_at DATETIME DEFAULT NULL,
  
  -- Performance tracking reference
  tracking_link_id STRING DEFAULT NULL, -- Link ke kol_tracking_links untuk measurement
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (brief_id) REFERENCES kol_briefs(id) ON DELETE CASCADE,
  FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tracking_link_id) REFERENCES kol_tracking_links(id) ON DELETE SET NULL
);

CREATE INDEX idx_kol_content_brief ON kol_content_drafts(brief_id);
CREATE INDEX idx_kol_content_talent ON kol_content_drafts(talent_id);
CREATE INDEX idx_kol_content_status ON kol_content_drafts(status);
CREATE INDEX idx_kol_content_reviewed ON kol_content_drafts(reviewed_by);

-- ============================================================
-- TABLE: kol_tracking_links
-- Unique tracking URLs untuk mengukur performa konten setiap KOL
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_tracking_links (
  id STRING PRIMARY KEY DEFAULT (hex(randomblob(16))),
  content_draft_id STRING NOT NULL,
  talent_id STRING NOT NULL,
  project_id STRING NOT NULL,
  
  -- Tracking token
  tracking_token STRING UNIQUE NOT NULL, -- Unique hash untuk URL
  short_url STRING UNIQUE DEFAULT NULL, -- Shortened URL jika pakai bitly/shortener
  
  -- Performance metrics
  total_clicks INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  bounce_rate REAL DEFAULT 0.0,
  
  -- Geo and device analytics (basic)
  top_countries TEXT DEFAULT NULL, -- JSON: [{country: 'ID', clicks: 150}]
  device_breakdown TEXT DEFAULT NULL, -- JSON: {mobile: 60, desktop: 40}
  
  -- Timeline
  link_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  link_activated_at DATETIME DEFAULT NULL,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (content_draft_id) REFERENCES kol_content_drafts(id) ON DELETE CASCADE,
  FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_kol_tracking_token ON kol_tracking_links(tracking_token);
CREATE INDEX idx_kol_tracking_content ON kol_tracking_links(content_draft_id);
CREATE INDEX idx_kol_tracking_talent ON kol_tracking_links(talent_id);

-- ============================================================
-- TABLE: kol_content_review_history
-- Audit trail untuk setiap review/revision
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_content_review_history (
  id STRING PRIMARY KEY DEFAULT (hex(randomblob(16))),
  content_draft_id STRING NOT NULL,
  reviewed_by STRING NOT NULL,
  
  -- Action taken
  action STRING NOT NULL, -- 'submitted', 'revision_requested', 'approved', 'rejected'
  feedback TEXT DEFAULT NULL,
  
  -- Metadata
  action_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (content_draft_id) REFERENCES kol_content_drafts(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_kol_review_history_content ON kol_content_review_history(content_draft_id);
CREATE INDEX idx_kol_review_history_reviewer ON kol_content_review_history(reviewed_by);

-- ============================================================
-- TRIGGER: Auto-update timestamp untuk kol_briefs
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_kol_brief_updated
AFTER UPDATE ON kol_briefs
BEGIN
  UPDATE kol_briefs SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- ============================================================
-- TRIGGER: Auto-update timestamp untuk kol_content_drafts
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_kol_content_updated
AFTER UPDATE ON kol_content_drafts
BEGIN
  UPDATE kol_content_drafts SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- ============================================================
-- TRIGGER: Auto-update timestamp untuk kol_tracking_links
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_kol_tracking_updated
AFTER UPDATE ON kol_tracking_links
BEGIN
  UPDATE kol_tracking_links SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;
