CREATE TABLE IF NOT EXISTS talent_social_accounts (account_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, platform TEXT, username TEXT);
CREATE INDEX IF NOT EXISTS idx_social_talent_id ON talent_social_accounts(talent_id);

CREATE TABLE IF NOT EXISTS social_metrics_history (metric_id TEXT PRIMARY KEY, account_id TEXT NOT NULL, followers INTEGER, recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_metrics_account_id ON social_metrics_history(account_id);
