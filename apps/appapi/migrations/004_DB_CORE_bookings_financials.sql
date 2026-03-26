CREATE TABLE IF NOT EXISTS project_talents (booking_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, talent_id TEXT NOT NULL, status TEXT DEFAULT 'Shortlisted', contract_signed INTEGER DEFAULT 0, review_rating REAL, review_notes TEXT);
CREATE INDEX IF NOT EXISTS idx_pt_project_id ON project_talents(project_id);
CREATE INDEX IF NOT EXISTS idx_pt_talent_id ON project_talents(talent_id);

CREATE TABLE IF NOT EXISTS audition_medias (media_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, file_url TEXT, uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_audition_booking_id ON audition_medias(booking_id);

CREATE TABLE IF NOT EXISTS invoices (invoice_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, client_id TEXT NOT NULL, amount REAL, status TEXT DEFAULT 'Unpaid', proof_url TEXT, due_date DATE);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);

CREATE TABLE IF NOT EXISTS payouts (payout_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, booking_id TEXT NOT NULL, amount REAL, status TEXT DEFAULT 'Pending', processed_at DATETIME);
CREATE INDEX IF NOT EXISTS idx_payouts_talent_id ON payouts(talent_id);
CREATE INDEX IF NOT EXISTS idx_payouts_booking_id ON payouts(booking_id);

CREATE TABLE IF NOT EXISTS financial_splits (split_id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL, agency_amount REAL, talent_amount REAL);
CREATE INDEX IF NOT EXISTS idx_splits_invoice_id ON financial_splits(invoice_id);
