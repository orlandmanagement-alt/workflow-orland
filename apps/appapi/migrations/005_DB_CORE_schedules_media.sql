CREATE TABLE IF NOT EXISTS talent_schedules (schedule_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, booking_id TEXT, activity_type TEXT, start_time DATETIME, end_time DATETIME, location_name TEXT);
CREATE INDEX IF NOT EXISTS idx_schedules_talent_id ON talent_schedules(talent_id);
CREATE INDEX IF NOT EXISTS idx_schedules_booking_id ON talent_schedules(booking_id);

CREATE TABLE IF NOT EXISTS schedule_qrs (qr_id TEXT PRIMARY KEY, schedule_id TEXT NOT NULL, qr_hash TEXT, expires_at DATETIME);
CREATE INDEX IF NOT EXISTS idx_qr_schedule_id ON schedule_qrs(schedule_id);

CREATE TABLE IF NOT EXISTS talent_media (media_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, media_url TEXT, media_type TEXT, is_primary INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_media_talent_id ON talent_media(talent_id);
