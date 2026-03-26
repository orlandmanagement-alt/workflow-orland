CREATE TABLE IF NOT EXISTS notifications (notif_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT, message TEXT, is_read INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_notif_user_id ON notifications(user_id);

CREATE TABLE IF NOT EXISTS message_threads (thread_id TEXT PRIMARY KEY, project_id TEXT);

CREATE TABLE IF NOT EXISTS messages (message_id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, sender_id TEXT, body TEXT, sent_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_msg_thread_id ON messages(thread_id);
