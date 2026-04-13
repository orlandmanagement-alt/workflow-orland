CREATE TABLE IF NOT EXISTS communication_logs (log_id TEXT PRIMARY KEY, user_id TEXT, channel TEXT, message TEXT, sent_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_comms_user_id ON communication_logs(user_id);

CREATE TABLE IF NOT EXISTS talent_brand_safety_logs (log_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, risk_score REAL, findings JSON, scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_safety_talent_id ON talent_brand_safety_logs(talent_id);

CREATE TABLE IF NOT EXISTS kyc_logs (log_id TEXT PRIMARY KEY, nik TEXT, response JSON, checked_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_kyclogs_nik ON kyc_logs(nik);
