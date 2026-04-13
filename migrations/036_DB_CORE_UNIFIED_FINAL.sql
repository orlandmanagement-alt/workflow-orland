-- ============================================================================
-- 036_DB_CORE_UNIFIED_FINAL.sql
-- Target DB: DB_CORE
-- Purpose : Core business entities (talents, agencies, clients, projects, finance)
-- NOTE    : No cross-DB FK to DB_SSO. user_id is logical reference only.
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS agencies (
  id TEXT PRIMARY KEY DEFAULT ('agency_' || lower(hex(randomblob(8)))),
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company_name TEXT,
  company_registration TEXT,
  tax_id TEXT,
  business_type TEXT,
  logo_url TEXT,
  website TEXT,
  city TEXT,
  country TEXT,
  custom_domain TEXT,
  white_label_enabled INTEGER DEFAULT 0,
  total_managed_talents INTEGER DEFAULT 0,
  active_impersonations INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  kyc_status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS clients (
  client_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  company_name TEXT,
  client_type TEXT,
  npwp_number TEXT,
  is_active INTEGER DEFAULT 1,
  logo_url TEXT,
  is_agency INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_members (
  member_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS talents (
  id TEXT PRIMARY KEY DEFAULT ('talent_' || lower(hex(randomblob(8)))),
  user_id TEXT NOT NULL UNIQUE,
  agency_id TEXT,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT,
  can_login_independently INTEGER DEFAULT 1,
  email_verified INTEGER DEFAULT 0,
  portfolio_edit_lock INTEGER DEFAULT 0,
  price_negotiation_lock INTEGER DEFAULT 0,
  schedule_auto_sync INTEGER DEFAULT 1,
  kyc_status TEXT DEFAULT 'pending',
  profile_status TEXT DEFAULT 'draft',
  last_modified_by TEXT DEFAULT 'self',
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS talent_profiles (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL UNIQUE,
  age INTEGER,
  gender TEXT,
  domicile TEXT,
  phone TEXT,
  bio TEXT,
  height_cm INTEGER,
  weight_kg REAL,
  skin_tone TEXT,
  hair_color TEXT,
  eye_color TEXT,
  face_type TEXT,
  chest_cm INTEGER,
  waist_cm INTEGER,
  hip_cm INTEGER,
  skills_json TEXT,
  languages_json TEXT,
  comp_card_url TEXT,
  headshot_url TEXT,
  full_body_url TEXT,
  showreel_url TEXT,
  portfolio_photos TEXT,
  rate_daily_min REAL,
  rate_daily_max REAL,
  rate_project_min REAL,
  rate_project_max REAL,
  preferred_currency TEXT DEFAULT 'IDR',
  profile_completion_percent REAL DEFAULT 0,
  profile_quality_score REAL DEFAULT 0,
  is_available INTEGER DEFAULT 1,
  location_willing_to_travel INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  budget_total REAL NOT NULL DEFAULT 0,
  budget_currency TEXT DEFAULT 'IDR',
  casting_deadline TEXT,
  project_start_date TEXT,
  is_casting_open INTEGER DEFAULT 0,
  casting_link_token TEXT UNIQUE,
  casting_visibility TEXT DEFAULT 'private',
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_roles (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  role_name TEXT NOT NULL,
  role_description TEXT,
  quantity_needed INTEGER NOT NULL DEFAULT 1,
  budget_per_talent REAL NOT NULL DEFAULT 0,
  gender_requirement TEXT,
  age_min INTEGER,
  age_max INTEGER,
  preferred_skills TEXT,
  status TEXT DEFAULT 'active',
  positions_filled INTEGER DEFAULT 0,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY,
  project_role_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  status TEXT DEFAULT 'applied',
  match_percentage REAL,
  match_details TEXT,
  agreed_fee REAL,
  fee_currency TEXT DEFAULT 'IDR',
  contract_signed INTEGER DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  hired_at TEXT,
  bulk_submission_item_id TEXT,
  FOREIGN KEY(project_role_id) REFERENCES project_roles(id) ON DELETE CASCADE,
  FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  job_application_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  fee INTEGER NOT NULL,
  signature_talent TEXT,
  signature_client TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(job_application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
  FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  invoice_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  contract_id TEXT,
  amount REAL,
  status TEXT DEFAULT 'Unpaid',
  proof_url TEXT,
  due_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  FOREIGN KEY(contract_id) REFERENCES contracts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payouts (
  payout_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  job_application_id TEXT NOT NULL,
  amount REAL,
  status TEXT DEFAULT 'Pending',
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  FOREIGN KEY(job_application_id) REFERENCES job_applications(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agency_bulk_submissions (
  id TEXT PRIMARY KEY DEFAULT ('batch_' || lower(hex(randomblob(8)))),
  agency_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  total_talents INTEGER NOT NULL,
  status TEXT DEFAULT 'draft',
  total_proposed_revenue REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bulk_submission_items (
  id TEXT PRIMARY KEY DEFAULT ('bsi_' || lower(hex(randomblob(8)))),
  batch_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  role_id TEXT,
  proposed_amount REAL NOT NULL,
  item_status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(batch_id) REFERENCES agency_bulk_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  FOREIGN KEY(role_id) REFERENCES project_roles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id TEXT PRIMARY KEY DEFAULT ('imp_' || lower(hex(randomblob(8)))),
  agency_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  status TEXT DEFAULT 'active',
  FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kyc_documents (
  doc_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  id_card_url TEXT,
  selfie_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kyb_documents (
  doc_id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  doc_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kyb_verifications (
  verification_id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  status TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS master_categories (
  category_id TEXT PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS master_skills (
  skill_id TEXT PRIMARY KEY,
  skill_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS vendors (
  vendor_id TEXT PRIMARY KEY,
  name TEXT,
  service_type TEXT,
  kyb_status TEXT DEFAULT 'Pending'
);

CREATE INDEX IF NOT EXISTS idx_core_talents_agency_id ON talents(agency_id);
CREATE INDEX IF NOT EXISTS idx_core_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_core_job_applications_talent_id ON job_applications(talent_id);
CREATE INDEX IF NOT EXISTS idx_core_job_applications_role_id ON job_applications(project_role_id);
CREATE INDEX IF NOT EXISTS idx_core_impersonation_status ON impersonation_sessions(status);
