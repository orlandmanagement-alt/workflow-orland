CREATE TABLE IF NOT EXISTS talent_attendances (attendance_id TEXT PRIMARY KEY, schedule_id TEXT NOT NULL, talent_id TEXT NOT NULL, check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP, lat REAL, lng REAL);
CREATE INDEX IF NOT EXISTS idx_att_schedule_id ON talent_attendances(schedule_id);
