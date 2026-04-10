-- Migration: 031_DB_CLIENT_PROJECT_CASCADE.sql
-- Purpose: Enhanced project creation workflow with proper cascading and transaction support
-- Date: April 2026

-- ===== TABLE: client_projects (Extension) =====
-- Enhanced version with workflow state & auto-generated tokens
CREATE TABLE IF NOT EXISTS client_projects (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  
  -- Budget & Timeline
  budget_total REAL NOT NULL,
  budget_currency TEXT DEFAULT 'IDR',
  casting_deadline TEXT NOT NULL,
  project_start_date TEXT,
  
  -- Casting Configuration
  is_casting_open BOOLEAN DEFAULT FALSE,
  casting_link_token TEXT UNIQUE,
  casting_visibility TEXT CHECK(casting_visibility IN ('private', 'public', 'link-only')) DEFAULT 'private',
  allow_guest_submissions BOOLEAN DEFAULT FALSE,
  
  -- Status Workflow
  status TEXT CHECK(status IN ('draft', 'active', 'paused', 'completed', 'cancelled')) DEFAULT 'draft',
  published_at TEXT,
  
  -- Audit
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (client_id) REFERENCES sso_users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_client_projects_client_id ON client_projects(client_id);
CREATE INDEX idx_client_projects_status ON client_projects(status);
CREATE INDEX idx_client_projects_casting_token ON client_projects(casting_link_token);

-- ===== TABLE: project_roles (Casting Breakdown) =====
-- Dynamic roles per project with budget allocation
CREATE TABLE IF NOT EXISTS project_roles (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  
  -- Role Description
  role_name TEXT NOT NULL,
  role_description TEXT,
  quantity_needed INTEGER NOT NULL CHECK(quantity_needed > 0),
  
  -- Budget Per Role
  budget_per_talent REAL NOT NULL,
  total_budget_allocated REAL GENERATED ALWAYS AS (budget_per_talent * quantity_needed) STORED,
  
  -- Requirements (Flexible)
  gender_requirement TEXT CHECK(gender_requirement IN ('any', 'male', 'female', 'other')),
  age_min INTEGER,
  age_max INTEGER,
  height_min_cm REAL,
  height_max_cm REAL,
  
  -- Nice-to-haves (JSON for flexibility)
  preferred_skills JSON,
  preferred_appearance JSON,
  
  -- Status
  status TEXT CHECK(status IN ('active', 'filled', 'cancelled')) DEFAULT 'active',
  positions_filled INTEGER DEFAULT 0,
  
  -- Audit
  display_order INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES client_projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_roles_project_id ON project_roles(project_id);
CREATE INDEX idx_project_roles_status ON project_roles(status);

-- ===== TABLE: live_casting_boards (Enhanced) =====
-- Represents a public or private casting opportunity
CREATE TABLE IF NOT EXISTS live_casting_boards (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  
  -- Access Control
  board_type TEXT CHECK(board_type IN ('private', 'public', 'link-only')) DEFAULT 'private',
  access_token TEXT UNIQUE,
  allow_guest_submissions BOOLEAN DEFAULT FALSE,
  
  -- Casting Config
  casting_director_name TEXT,
  casting_director_email TEXT,
  guest_questions JSON,
  
  -- Timeline
  opened_at TEXT,
  expires_at TEXT,
  
  -- Status
  status TEXT CHECK(status IN ('draft', 'active', 'closed', 'archived')) DEFAULT 'draft',
  
  -- Audit
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES client_projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_live_casting_boards_project_id ON live_casting_boards(project_id);
CREATE INDEX idx_live_casting_boards_token ON live_casting_boards(access_token);

-- ===== TABLE: job_applications (Application Tracking) =====
-- Tracks talent submissions to project roles
CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY,
  project_role_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  
  -- Application State Machine
  status TEXT CHECK(status IN ('applied', 'shortlisted', 'hired', 'completed', 'rejected', 'withdrawn')) DEFAULT 'applied',
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  hired_at TEXT,
  
  -- Match Score (from AI)
  match_score REAL,
  match_metadata JSON,
  
  -- Notes from Client
  client_notes TEXT,
  
  -- Financial
  agreed_fee REAL,
  fee_currency TEXT DEFAULT 'IDR',
  
  -- Audit
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_role_id) REFERENCES project_roles(id) ON DELETE CASCADE,
  FOREIGN KEY (talent_id) REFERENCES sso_users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES sso_users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_job_applications_talent_id ON job_applications(talent_id);
CREATE INDEX idx_job_applications_project_role_id ON job_applications(project_role_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_client_id ON job_applications(client_id);

-- ===== TABLE: ph_production_logistics (Optional Step 4) =====
-- For production house to upload scripts, rundowns, etc
CREATE TABLE IF NOT EXISTS ph_production_logistics (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  
  -- File References
  script_url TEXT,
  storyboard_url TEXT,
  rundown_url TEXT,
  call_sheet_url TEXT,
  
  -- Metadata
  script_pages INTEGER,
  production_notes TEXT,
  
  -- Audit
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES client_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES sso_users(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_ph_production_logistics_project_id ON ph_production_logistics(project_id);

-- ===== TABLE: project_draft_state (Auto-save for Wizard) =====
-- Stores intermediate wizard state before final commit
CREATE TABLE IF NOT EXISTS project_draft_state (
  id TEXT PRIMARY KEY,
  project_id TEXT UNIQUE,
  client_id TEXT NOT NULL,
  
  -- Step-by-step JSON state
  step_1_data JSON,
  step_2_data JSON,
  step_3_data JSON,
  step_4_data JSON,
  
  -- Progress tracking
  current_step INTEGER DEFAULT 1,
  last_completed_step INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  
  FOREIGN KEY (project_id) REFERENCES client_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES sso_users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_project_draft_state_client_id ON project_draft_state(client_id);

-- ===== TRIGGERS for Audit & Auto-update =====

-- Auto-update project updated_at when roles change
CREATE TRIGGER tr_project_roles_update
AFTER UPDATE ON project_roles
BEGIN
  UPDATE client_projects 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.project_id;
END;

-- Auto-update project updated_at when applications change
CREATE TRIGGER tr_job_applications_update
AFTER UPDATE ON job_applications
BEGIN
  UPDATE client_projects 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id IN (
    SELECT project_id FROM project_roles WHERE id = NEW.project_role_id
  );
END;

-- Validation: Ensure total role budget doesn't exceed project budget
-- (Note: SQLite doesn't support dynamic checks, implement in application layer)

-- ===== VIEWS for Common Queries =====

-- View: Project Overview with Stats
CREATE VIEW IF NOT EXISTS v_project_stats AS
SELECT 
  p.id,
  p.title,
  p.budget_total,
  COUNT(DISTINCT pr.id) as roles_count,
  SUM(pr.total_budget_allocated) as budgeted_amount,
  COUNT(DISTINCT ja.id) as total_applications,
  SUM(CASE WHEN ja.status = 'hired' THEN 1 ELSE 0 END) as hired_count,
  p.status,
  p.created_at
FROM client_projects p
LEFT JOIN project_roles pr ON p.id = pr.project_id
LEFT JOIN job_applications ja ON pr.id = ja.project_role_id
GROUP BY p.id;

-- View: Role Applicant Summary
CREATE VIEW IF NOT EXISTS v_role_applicants AS
SELECT 
  pr.id as role_id,
  pr.project_id,
  pr.role_name,
  pr.quantity_needed,
  COUNT(DISTINCT ja.id) as applicant_count,
  SUM(CASE WHEN ja.status = 'hired' THEN 1 ELSE 0 END) as hired_count,
  SUM(CASE WHEN ja.status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted_count
FROM project_roles pr
LEFT JOIN job_applications ja ON pr.id = ja.project_role_id
WHERE pr.status = 'active'
GROUP BY pr.id;

-- ===== STORED PROCEDURES (Compatibility Layer) =====
-- Note: SQLite doesn't support stored procedures, but we'll document the patterns

-- Pattern 1: Validate Project Budget
-- Before committing roles, check: SUM(roles.total_budget_allocated) <= projects.budget_total

-- Pattern 2: Auto-generate Casting Token
-- Token length: 32 chars, format: `cast_${project_id}_${random32}`

-- Pattern 3: Publish Project (Transaction Pattern)
-- BEGIN TRANSACTION
--   1. Update projects SET status = 'active', published_at = NOW()
--   2. Create live_casting_boards record if needed
--   3. Notify talents via notifications table
-- COMMIT on success, ROLLBACK on error

PRAGMA foreign_keys = ON;
