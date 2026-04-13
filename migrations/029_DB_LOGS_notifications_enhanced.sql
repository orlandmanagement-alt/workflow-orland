-- Enhanced Notifications System
CREATE TABLE IF NOT EXISTS notifications_v2 (
  notif_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  notif_type TEXT NOT NULL, -- 'message' | 'project' | 'talent' | 'booking' | 'payment' | 'approval' | 'system'
  title TEXT,
  message TEXT,
  related_entity_id TEXT, -- project_id | talent_id | booking_id | message_id, etc
  related_entity_type TEXT, -- 'project' | 'talent' | 'booking' | 'message', etc
  is_read INTEGER DEFAULT 0,
  action_url TEXT, -- Deep link untuk notifikasi
  priority TEXT DEFAULT 'normal', -- 'urgent' | 'normal' | 'info'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_notif_v2_user_id ON notifications_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_v2_type ON notifications_v2(notif_type);
CREATE INDEX IF NOT EXISTS idx_notif_v2_is_read ON notifications_v2(is_read);
CREATE INDEX IF NOT EXISTS idx_notif_v2_created_at ON notifications_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_notif_v2_priority ON notifications_v2(priority);

-- User Notification Preferences/Settings
CREATE TABLE IF NOT EXISTS notification_settings (
  setting_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  -- Message Notifications
  msg_enabled INTEGER DEFAULT 1,
  msg_via_email INTEGER DEFAULT 1,
  msg_via_push INTEGER DEFAULT 1,
  msg_sound INTEGER DEFAULT 1,
  -- Project Notifications
  project_enabled INTEGER DEFAULT 1,
  project_updates INTEGER DEFAULT 1,
  project_assignments INTEGER DEFAULT 1,
  project_via_email INTEGER DEFAULT 1,
  project_via_push INTEGER DEFAULT 1,
  -- Talent/Request Notifications
  talent_request_enabled INTEGER DEFAULT 1,
  talent_approval_enabled INTEGER DEFAULT 1,
  talent_via_email INTEGER DEFAULT 1,
  talent_via_push INTEGER DEFAULT 1,
  -- Payment/Finance Notifications
  payment_enabled INTEGER DEFAULT 1,
  invoice_enabled INTEGER DEFAULT 1,
  payment_via_email INTEGER DEFAULT 1,
  payment_via_push INTEGER DEFAULT 1,
  -- Booking Notifications
  booking_enabled INTEGER DEFAULT 1,
  booking_via_email INTEGER DEFAULT 1,
  booking_via_push INTEGER DEFAULT 1,
  -- System Notifications
  system_enabled INTEGER DEFAULT 1,
  system_urgent_only INTEGER DEFAULT 0,
  -- Schedule Notifications (reminder sebelum jadwal)
  schedule_reminder_24h INTEGER DEFAULT 1,
  schedule_reminder_1h INTEGER DEFAULT 1,
  schedule_via_email INTEGER DEFAULT 0,
  schedule_via_push INTEGER DEFAULT 1,
  schedule_via_sms INTEGER DEFAULT 0,
  -- General Settings
  quiet_hours_enabled INTEGER DEFAULT 0,
  quiet_hours_start TEXT, -- 'HH:MM' format
  quiet_hours_end TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_settings_user ON notification_settings(user_id);

-- Notification Log (untuk audit dan analytics)
CREATE TABLE IF NOT EXISTS notification_logs (
  log_id TEXT PRIMARY KEY,
  notif_id TEXT,
  user_id TEXT NOT NULL,
  sent_via TEXT, -- 'push' | 'email' | 'in_app' | 'sms'
  delivery_status TEXT DEFAULT 'pending', -- 'pending' | 'sent' | 'delivered' | 'failed'
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME,
  read_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_notif_log_user ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_log_sent_via ON notification_logs(sent_via);
CREATE INDEX IF NOT EXISTS idx_notif_log_status ON notification_logs(delivery_status);
