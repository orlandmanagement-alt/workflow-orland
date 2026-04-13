-- Duplikasi tabel dari DB_LOGS yang akan dipindahkan jika usia > 6 bulan
CREATE TABLE IF NOT EXISTS notifications (notif_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT, message TEXT, is_read INTEGER DEFAULT 0, created_at DATETIME);
CREATE INDEX IF NOT EXISTS idx_archive_notif_user ON notifications(user_id);

CREATE TABLE IF NOT EXISTS messages (message_id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, sender_id TEXT, body TEXT, sent_at DATETIME);
CREATE INDEX IF NOT EXISTS idx_archive_msg_thread ON messages(thread_id);

CREATE TABLE IF NOT EXISTS talent_attendances (attendance_id TEXT PRIMARY KEY, schedule_id TEXT NOT NULL, talent_id TEXT NOT NULL, check_in_time DATETIME, lat REAL, lng REAL);

CREATE TABLE IF NOT EXISTS communication_logs (log_id TEXT PRIMARY KEY, user_id TEXT, channel TEXT, message TEXT, sent_at DATETIME);

-- Duplikasi tabel dari DB_CORE yang akan dipindahkan jika usia > 2 Tahun (Sudah Selesai)
CREATE TABLE IF NOT EXISTS projects (project_id TEXT PRIMARY KEY, client_id TEXT NOT NULL, title TEXT, status TEXT);
CREATE TABLE IF NOT EXISTS invoices (invoice_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, client_id TEXT NOT NULL, amount REAL, status TEXT, proof_url TEXT, due_date DATE);
