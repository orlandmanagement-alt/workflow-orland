CREATE TABLE IF NOT EXISTS system_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT);
CREATE TABLE IF NOT EXISTS global_blacklists (blacklist_id TEXT PRIMARY KEY, identifier_value TEXT UNIQUE NOT NULL, identifier_type TEXT, reason TEXT);
CREATE INDEX IF NOT EXISTS idx_blacklist_identifier ON global_blacklists(identifier_value);

CREATE TABLE IF NOT EXISTS user_integrations (integration_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, provider TEXT, access_token TEXT);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON user_integrations(user_id);
