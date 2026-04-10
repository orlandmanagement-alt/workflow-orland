-- ============================================================================
-- Multi-Talent Submission System - Database Migration
-- File: apps/appapi/migrations/034_DB_CORE_multi_talent_submission.sql
-- Purpose: Create tables for bulk talent submissions and impersonation tracking
-- Version: 1.0
-- Date: April 2026
-- ============================================================================

-- ============================================================================
-- 1. BULK SUBMISSION TRACKING - Main batch record
-- ============================================================================

CREATE TABLE IF NOT EXISTS agency_bulk_submissions (
  id TEXT PRIMARY KEY DEFAULT ('batch_' || lower(hex(randomblob(8)))),
  agencyId TEXT NOT NULL,
  projectId TEXT NOT NULL,
  
  -- Submission Metadata
  totalTalents INTEGER NOT NULL,
  submittedTalents INTEGER DEFAULT 0,
  approvedCount INTEGER DEFAULT 0,
  rejectedCount INTEGER DEFAULT 0,
  
  -- Financial Summary
  totalProposedRevenue REAL DEFAULT 0,
  totalAgencyFee REAL DEFAULT 0,
  totalTalentPayment REAL DEFAULT 0,
  
  -- Status Tracking
  status TEXT DEFAULT 'draft' CHECK(status IN (
    'draft', 'submitted', 'partially_approved', 'all_approved', 
    'all_rejected', 'cancelled'
  )),
  
  -- Timestamps
  createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  submittedAt INTEGER,
  completedAt INTEGER,
  
  -- Metadata & Notes
  notes TEXT,
  submittedBy TEXT,
  
  -- Foreign Keys
  FOREIGN KEY (agencyId) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY (projectId) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_bulk_submissions_agency_project ON agency_bulk_submissions(agencyId, projectId);
CREATE INDEX IF NOT EXISTS idx_bulk_submissions_status ON agency_bulk_submissions(status);
CREATE INDEX IF NOT EXISTS idx_bulk_submissions_createdAt ON agency_bulk_submissions(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_bulk_submissions_submittedAt ON agency_bulk_submissions(submittedAt DESC);

-- ============================================================================
-- 2. BULK SUBMISSION ITEMS - Individual talent submissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS bulk_submission_items (
  id TEXT PRIMARY KEY DEFAULT ('bsi_' || lower(hex(randomblob(8)))),
  batchId TEXT NOT NULL,
  talentId TEXT NOT NULL,
  agencyTalentId TEXT NOT NULL,
  
  -- Submission Details
  roleName TEXT NOT NULL,
  roleId TEXT,
  matchPercentage REAL DEFAULT 0,
  matchBreakdown TEXT, -- JSON: {height: 15, skills: 18, ...}
  
  -- Pricing Details
  serviceName TEXT NOT NULL,
  proposedAmount REAL NOT NULL,
  commissionPercent REAL DEFAULT 15.0,
  agencyFee REAL NOT NULL,
  talentPayment REAL NOT NULL,
  
  -- Status & Feedback
  itemStatus TEXT DEFAULT 'pending' CHECK(itemStatus IN (
    'pending', 'approved', 'rejected', 'negotiating', 'withdrawn'
  )),
  clientFeedback TEXT,
  
  -- Link to Created Booking
  createdProjectTalentId TEXT,
  
  -- Timestamps
  createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  submittedAt INTEGER,
  respondedAt INTEGER,
  
  -- Foreign Keys
  FOREIGN KEY (batchId) REFERENCES agency_bulk_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (talentId) REFERENCES talents(talent_id) ON DELETE CASCADE,
  FOREIGN KEY (agencyTalentId) REFERENCES agency_talents(id) ON DELETE CASCADE,
  FOREIGN KEY (roleId) REFERENCES project_roles(role_id) ON DELETE SET NULL,
  FOREIGN KEY (createdProjectTalentId) REFERENCES project_talents(booking_id) ON DELETE SET NULL
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_bulk_items_batch ON bulk_submission_items(batchId);
CREATE INDEX IF NOT EXISTS idx_bulk_items_talent ON bulk_submission_items(talentId);
CREATE INDEX IF NOT EXISTS idx_bulk_items_status ON bulk_submission_items(itemStatus);
CREATE INDEX IF NOT EXISTS idx_bulk_items_agency_talent ON bulk_submission_items(agencyTalentId);
CREATE INDEX IF NOT EXISTS idx_bulk_items_created_project_talent ON bulk_submission_items(createdProjectTalentId);

-- ============================================================================
-- 3. IMPERSONATION SESSIONS - Agency impersonating talent
-- ============================================================================

CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id TEXT PRIMARY KEY DEFAULT ('imp_' || lower(hex(randomblob(8)))),
  agencyId TEXT NOT NULL,
  talentId TEXT NOT NULL,
  
  -- Token Management
  tokenHash TEXT NOT NULL UNIQUE, -- SHA256 hash of token (for security)
  
  -- Session Timing
  createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  expiresAt INTEGER NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'revoked')),
  revokedAt INTEGER,
  revokedReason TEXT,
  
  -- Foreign Keys
  FOREIGN KEY (agencyId) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY (talentId) REFERENCES managed_talents(id) ON DELETE CASCADE,
  
  -- Constraints
  CHECK (expiresAt > createdAt)
);

-- Indexes for session lookup
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_agencyId ON impersonation_sessions(agencyId);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_talentId ON impersonation_sessions(talentId);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_expiresAt ON impersonation_sessions(expiresAt);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_status ON impersonation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_tokenHash ON impersonation_sessions(tokenHash);

-- ============================================================================
-- 4. IMPERSONATION AUDIT LOG - Tracking all impersonation activity
-- ============================================================================

CREATE TABLE IF NOT EXISTS impersonation_audit_log (
  id TEXT PRIMARY KEY DEFAULT ('audit_' || lower(hex(randomblob(8)))),
  agencyId TEXT NOT NULL,
  agencyUserId TEXT NOT NULL,
  talentId TEXT NOT NULL,
  
  -- Request Context
  ipAddress TEXT NOT NULL,
  userAgent TEXT,
  
  -- Audit Fields
  action TEXT NOT NULL CHECK(action IN (
    'impersonate_start', 'impersonate_end', 'impersonate_revoked', 
    'impersonate_profile_edit', 'impersonate_media_upload'
  )),
  reason TEXT,
  
  -- Changes Made (optional)
  changesData TEXT, -- JSON: {fields_changed: [...]}
  
  -- Metadata
  timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  
  -- Foreign Keys
  FOREIGN KEY (agencyId) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY (talentId) REFERENCES managed_talents(id) ON DELETE CASCADE
);

-- Indexes for audit trail queries
CREATE INDEX IF NOT EXISTS idx_impersonation_audit_agencyId ON impersonation_audit_log(agencyId);
CREATE INDEX IF NOT EXISTS idx_impersonation_audit_talentId ON impersonation_audit_log(talentId);
CREATE INDEX IF NOT EXISTS idx_impersonation_audit_timestamp ON impersonation_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_impersonation_audit_action ON impersonation_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_impersonation_audit_agencyUserId ON impersonation_audit_log(agencyUserId);

-- ============================================================================
-- 5. IMPERSONATION RATE LIMITING - Prevent abuse
-- ============================================================================

CREATE TABLE IF NOT EXISTS impersonation_rate_limit (
  id TEXT PRIMARY KEY DEFAULT ('rl_' || lower(hex(randomblob(8)))),
  agencyId TEXT NOT NULL,
  
  -- Rate Limit Window: 15 minutes
  timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  attemptCount INTEGER DEFAULT 1,
  
  -- Context
  ipAddress TEXT,
  
  -- Foreign Keys
  FOREIGN KEY (agencyId) REFERENCES agencies(id) ON DELETE CASCADE
);

-- Index for rate limit checks
CREATE INDEX IF NOT EXISTS idx_impersonation_rate_limit_agencyId_timestamp ON impersonation_rate_limit(agencyId, timestamp DESC);

-- ============================================================================
-- 6. ENHANCE: project_talentS - Link to bulk submission batch
-- ============================================================================

ALTER TABLE project_talents ADD COLUMN IF NOT EXISTS bulk_submission_item_id TEXT REFERENCES bulk_submission_items(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_project_talents_bulk_item ON project_talents(bulk_submission_item_id);

-- ============================================================================
-- 7. TRIGGERS - Auto-update and cleanup
-- ============================================================================

-- Auto-update submission status based on item statuses
CREATE TRIGGER IF NOT EXISTS update_bulk_submission_status_on_item_change
AFTER UPDATE ON bulk_submission_items
FOR EACH ROW
WHEN NEW.itemStatus != OLD.itemStatus
BEGIN
  -- Count statuses
  UPDATE agency_bulk_submissions
  SET 
    approvedCount = (SELECT COUNT(*) FROM bulk_submission_items WHERE batchId = NEW.batchId AND itemStatus = 'approved'),
    rejectedCount = (SELECT COUNT(*) FROM bulk_submission_items WHERE batchId = NEW.batchId AND itemStatus = 'rejected'),
    status = CASE
      WHEN (SELECT COUNT(*) FROM bulk_submission_items WHERE batchId = NEW.batchId AND itemStatus IN ('approved', 'rejected', 'withdrawn')) = totalTalents
      THEN CASE
        WHEN (SELECT COUNT(*) FROM bulk_submission_items WHERE batchId = NEW.batchId AND itemStatus = 'rejected') = totalTalents
        THEN 'all_rejected'
        WHEN (SELECT COUNT(*) FROM bulk_submission_items WHERE batchId = NEW.batchId AND itemStatus = 'approved') = totalTalents
        THEN 'all_approved'
        ELSE 'partially_approved'
      END
      ELSE status
    END
  WHERE id = NEW.batchId;
END;

-- Auto-expire impersonation sessions
CREATE TRIGGER IF NOT EXISTS cleanup_expired_impersonations
AFTER INSERT ON impersonation_sessions
FOR EACH ROW
WHEN NEW.expiresAt <= strftime('%s', 'now') * 1000
BEGIN
  UPDATE impersonation_sessions SET status = 'expired'
  WHERE id = NEW.id;
END;

-- Clean up old rate limit records (older than 1 hour)
CREATE TRIGGER IF NOT EXISTS cleanup_old_rate_limits
AFTER INSERT ON impersonation_rate_limit
WHEN (SELECT COUNT(*) FROM impersonation_rate_limit WHERE agencyId = NEW.agencyId AND timestamp > NEW.timestamp - 3600000) > 5
BEGIN
  DELETE FROM impersonation_rate_limit 
  WHERE agencyId = NEW.agencyId AND timestamp < NEW.timestamp - 3600000;
END;

-- ============================================================================
-- 8. VIEWS - Useful queries for reporting
-- ============================================================================

-- View: Bulk Submission Status Overview
CREATE VIEW IF NOT EXISTS v_bulk_submission_summary AS
SELECT 
  abs.id as batch_id,
  abs.agencyId,
  abs.projectId,
  abs.totalTalents,
  abs.approvedCount,
  abs.rejectedCount,
  (abs.totalTalents - abs.approvedCount - abs.rejectedCount) as pendingCount,
  abs.status,
  abs.totalProposedRevenue,
  abs.totalAgencyFee,
  abs.totalTalentPayment,
  abs.submittedAt,
  COUNT(DISTINCT bsi.talentId) as uniqueTalents
FROM agency_bulk_submissions abs
LEFT JOIN bulk_submission_items bsi ON abs.id = bsi.batchId
GROUP BY abs.id;

-- View: Impersonation Activity
CREATE VIEW IF NOT EXISTS v_impersonation_activity AS
SELECT 
  ial.id,
  ial.agencyId,
  ial.talentId,
  ial.action,
  ial.timestamp,
  ial.ipAddress,
  COUNT(*) OVER (PARTITION BY ial.agencyId ORDER BY ial.timestamp) as cumulative_actions
FROM impersonation_audit_log ial
WHERE ial.timestamp > (strftime('%s', 'now') * 1000 - 86400000); -- Last 24 hours

-- ============================================================================
-- 9. SEEDING DEFAULT DATA (Optional)
-- ============================================================================

-- Insert default commission percentages (if needed)
-- These can be configured per agency
INSERT OR IGNORE INTO agency_bulk_submissions (id) 
VALUES ('_template_');

-- Delete template
DELETE FROM agency_bulk_submissions WHERE id = '_template_';

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

/*
MIGRATION CHECKLIST:
- [ ] Backup existing production database
- [ ] Run migration on staging environment first
- [ ] Test all endpoints listed below
- [ ] Verify performance on indexed columns
- [ ] Run on production
- [ ] Monitor audit logs for any issues

ENDPOINTS AFFECTED:
- GET /api/agency/roster?project_id={id}
- POST /api/agency/projects/apply-bulk
- GET /api/agency/submissions
- GET /api/agency/submissions/{batchId}/details
- POST /api/agency/impersonate/start
- POST /api/agency/impersonate/revoke/{sessionId}

PERFORMANCE NOTES:
- Indexes created on high-query columns (status, createdAt, batchId)
- Trigger for auto-cleanup of expired sessions added
- Rate limiting table has auto-cleanup to prevent growth
- View created for quick status checks

BACKWARD COMPATIBILITY:
- Existing project_talents records not affected
- New bulk_submission_item_id column optional
- No breaking changes to existing schema
*/
