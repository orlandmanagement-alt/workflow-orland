-- Enhanced Messages Table with read status, attachments, and moderation
CREATE TABLE IF NOT EXISTS messages_v2 (
  message_id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL, -- 'client' | 'talent' | 'admin'
  recipient_id TEXT NOT NULL,
  body TEXT NOT NULL,
  attachment_url TEXT,
  attachment_type TEXT, -- 'image' | 'pdf' | 'video' | 'other'
  is_read INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  deleted_by TEXT,
  deleted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_msg_v2_thread_id ON messages_v2(thread_id);
CREATE INDEX IF NOT EXISTS idx_msg_v2_sender_id ON messages_v2(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_v2_recipient_id ON messages_v2(recipient_id);
CREATE INDEX IF NOT EXISTS idx_msg_v2_is_read ON messages_v2(is_read);
CREATE INDEX IF NOT EXISTS idx_msg_v2_created_at ON messages_v2(created_at);

-- Message Threads (conversations between client and talent)
CREATE TABLE IF NOT EXISTS message_threads_v2 (
  thread_id TEXT PRIMARY KEY,
  project_id TEXT,
  client_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  subject TEXT,
  is_archived INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_message_at DATETIME,
  message_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_threads_v2_client ON message_threads_v2(client_id);
CREATE INDEX IF NOT EXISTS idx_threads_v2_talent ON message_threads_v2(talent_id);
CREATE INDEX IF NOT EXISTS idx_threads_v2_project ON message_threads_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_threads_v2_is_archived ON message_threads_v2(is_archived);

-- Chat Moderation & Admin Management
CREATE TABLE IF NOT EXISTS chat_moderation (
  moderation_id TEXT PRIMARY KEY,
  message_id TEXT,
  thread_id TEXT NOT NULL,
  flagged_by TEXT,
  reason TEXT, -- 'spam' | 'abuse' | 'inappropriate' | 'manual_deletion'
  action_taken TEXT, -- 'flagged' | 'deleted' | 'suspended'
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mod_thread_id ON chat_moderation(thread_id);
CREATE INDEX IF NOT EXISTS idx_mod_flagged_by ON chat_moderation(flagged_by);
CREATE INDEX IF NOT EXISTS idx_mod_action ON chat_moderation(action_taken);
