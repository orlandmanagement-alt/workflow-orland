CREATE TABLE IF NOT EXISTS kyc_verifications (verification_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, liveness_score REAL, status TEXT);
CREATE INDEX IF NOT EXISTS idx_kycver_talent_id ON kyc_verifications(talent_id);
