CREATE TABLE IF NOT EXISTS kol_briefs (brief_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, content TEXT, guidelines JSON);
CREATE INDEX IF NOT EXISTS idx_briefs_project_id ON kol_briefs(project_id);

CREATE TABLE IF NOT EXISTS kol_content_drafts (draft_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, video_url TEXT, status TEXT DEFAULT 'Pending Review', feedback TEXT);
CREATE INDEX IF NOT EXISTS idx_drafts_booking_id ON kol_content_drafts(booking_id);

CREATE TABLE IF NOT EXISTS kol_tracking_links (link_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, url TEXT, clicks INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_links_booking_id ON kol_tracking_links(booking_id);

CREATE TABLE IF NOT EXISTS wo_rundowns (rundown_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, timeline JSON);
CREATE INDEX IF NOT EXISTS idx_rundowns_project_id ON wo_rundowns(project_id);

CREATE TABLE IF NOT EXISTS wo_song_lists (list_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, must_play JSON, do_not_play JSON);
CREATE INDEX IF NOT EXISTS idx_songs_project_id ON wo_song_lists(project_id);

CREATE TABLE IF NOT EXISTS eo_technical_riders (rider_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, requirements JSON, is_approved INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_techrider_booking_id ON eo_technical_riders(booking_id);

CREATE TABLE IF NOT EXISTS eo_hospitality_riders (rider_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, requirements JSON, is_approved INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_hosprider_booking_id ON eo_hospitality_riders(booking_id);
