CREATE TABLE IF NOT EXISTS talents (talent_id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, full_name TEXT, category TEXT, base_rate REAL, kyc_status TEXT DEFAULT 'Pending', bio TEXT, is_active INTEGER DEFAULT 1);
CREATE INDEX IF NOT EXISTS idx_talents_category ON talents(category);

CREATE TABLE IF NOT EXISTS talent_experiences (exp_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, title TEXT, year INTEGER, description TEXT);
CREATE INDEX IF NOT EXISTS idx_exp_talent_id ON talent_experiences(talent_id);

CREATE TABLE IF NOT EXISTS talent_certifications (cert_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, cert_name TEXT, issued_by TEXT, year INTEGER);
CREATE INDEX IF NOT EXISTS idx_certs_talent_id ON talent_certifications(talent_id);

CREATE TABLE IF NOT EXISTS talent_bank_accounts (account_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, bank_name TEXT, account_number TEXT, account_name TEXT);
CREATE INDEX IF NOT EXISTS idx_bank_talent_id ON talent_bank_accounts(talent_id);

CREATE TABLE IF NOT EXISTS talent_rate_cards (rate_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, service_name TEXT, amount REAL);
CREATE INDEX IF NOT EXISTS idx_rate_cards_talent_id ON talent_rate_cards(talent_id);

CREATE TABLE IF NOT EXISTS talent_internal_notes (note_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, author_user_id TEXT, note_text TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_notes_talent_id ON talent_internal_notes(talent_id);
