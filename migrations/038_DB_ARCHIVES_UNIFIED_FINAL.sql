-- ============================================================================
-- 038_DB_ARCHIVES_UNIFIED_FINAL.sql
-- Target DB: DB_ARCHIVES
-- Purpose : Cold storage for historical and soft-deleted records
-- ============================================================================

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS archived_projects (
  archive_id TEXT PRIMARY KEY,
  original_project_id TEXT NOT NULL,
  client_id TEXT,
  title TEXT,
  status TEXT,
  project_payload_json TEXT NOT NULL,
  archived_reason TEXT,
  archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS archived_job_applications (
  archive_id TEXT PRIMARY KEY,
  original_job_application_id TEXT NOT NULL,
  original_project_id TEXT,
  talent_id TEXT,
  status TEXT,
  payload_json TEXT NOT NULL,
  archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS archived_contracts (
  archive_id TEXT PRIMARY KEY,
  original_contract_id TEXT NOT NULL,
  client_id TEXT,
  talent_id TEXT,
  contract_status TEXT,
  payload_json TEXT NOT NULL,
  archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS archived_financials (
  archive_id TEXT PRIMARY KEY,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  client_id TEXT,
  talent_id TEXT,
  amount REAL,
  payload_json TEXT NOT NULL,
  archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS soft_deleted_entities (
  archive_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  deleted_by_user_id TEXT,
  delete_reason TEXT,
  entity_payload_json TEXT NOT NULL,
  deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS archive_jobs (
  job_id TEXT PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at DATETIME,
  finished_at DATETIME,
  rows_moved INTEGER DEFAULT 0,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_arch_projects_original ON archived_projects(original_project_id);
CREATE INDEX IF NOT EXISTS idx_arch_job_apps_original ON archived_job_applications(original_job_application_id);
CREATE INDEX IF NOT EXISTS idx_arch_contracts_original ON archived_contracts(original_contract_id);
CREATE INDEX IF NOT EXISTS idx_arch_soft_deleted_entity ON soft_deleted_entities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_arch_jobs_status ON archive_jobs(status, started_at);
