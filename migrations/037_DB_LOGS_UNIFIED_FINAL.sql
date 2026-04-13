-- ============================================================================
-- 037_DB_LOGS_UNIFIED_FINAL.sql
-- Target DB: DB_LOGS
-- Purpose : High-write audit, API logs, notifications, messaging, webhooks
-- ============================================================================

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS audit_trails (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  before_json TEXT,
  after_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'info',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_request_logs (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  user_id TEXT,
  method TEXT,
  path TEXT,
  status_code INTEGER,
  latency_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  metadata_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_errors (
  id TEXT PRIMARY KEY,
  service_name TEXT,
  error_type TEXT,
  message TEXT,
  stack_trace TEXT,
  context_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications_v2 (
  notif_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  notif_type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  priority TEXT DEFAULT 'medium',
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME
);

CREATE TABLE IF NOT EXISTS notification_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  channels_json TEXT DEFAULT '[]',
  muted_types_json TEXT DEFAULT '[]',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id TEXT PRIMARY KEY,
  notif_id TEXT,
  user_id TEXT,
  channel TEXT,
  delivery_status TEXT,
  provider_response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message_threads_v2 (
  thread_id TEXT PRIMARY KEY,
  project_id TEXT,
  participant_ids_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS messages_v2 (
  message_id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  recipient_id TEXT,
  body TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_moderation (
  id TEXT PRIMARY KEY,
  message_id TEXT,
  thread_id TEXT,
  moderation_status TEXT,
  reason TEXT,
  score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  endpoint_url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  secret_hash TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY,
  webhook_id TEXT,
  event_type TEXT,
  payload_json TEXT,
  http_status INTEGER,
  response_body TEXT,
  latency_ms INTEGER,
  delivered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_queue (
  id TEXT PRIMARY KEY,
  webhook_id TEXT,
  event_type TEXT,
  payload_json TEXT,
  attempt_count INTEGER DEFAULT 0,
  next_retry_at DATETIME,
  status TEXT DEFAULT 'queued',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_audit_actor ON audit_trails(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_logs_audit_entity ON audit_trails(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_logs_api_path ON api_request_logs(path);
CREATE INDEX IF NOT EXISTS idx_logs_api_created_at ON api_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_security_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_notifications_user ON notifications_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_notifications_unread ON notifications_v2(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_logs_messages_thread ON messages_v2(thread_id);
CREATE INDEX IF NOT EXISTS idx_logs_webhook_queue_status ON webhook_queue(status, next_retry_at);
