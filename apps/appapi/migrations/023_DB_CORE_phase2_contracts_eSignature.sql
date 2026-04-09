-- Migration 023: Phase 2 Scale-Up - Contracts & E-Signature
-- Creates contracts, invoices, and agency white-labeling support

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  agency_id TEXT,
  client_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'signed', 'completed')) DEFAULT 'draft',
  fee INTEGER NOT NULL,
  signature_talent TEXT,
  signature_client TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES projects(id),
  FOREIGN KEY (talent_id) REFERENCES talents(id),
  FOREIGN KEY (agency_id) REFERENCES agencies(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'escrow_released')) DEFAULT 'pending',
  payment_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

CREATE TABLE IF NOT EXISTS profile_views (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  viewer_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (talent_id) REFERENCES talents(id)
);

-- Update agencies table for white-labeling
ALTER TABLE agencies ADD COLUMN custom_domain TEXT;
ALTER TABLE agencies ADD COLUMN watermark_url TEXT;
ALTER TABLE agencies ADD COLUMN white_label_enabled BOOLEAN DEFAULT 0;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contracts_talent_id ON contracts(talent_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_agency_id ON contracts(agency_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_profile_views_talent_id ON profile_views(talent_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at DESC);
