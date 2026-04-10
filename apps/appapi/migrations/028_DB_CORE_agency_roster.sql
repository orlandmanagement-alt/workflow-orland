-- Agency Roster & Impersonation Database Schema
-- File: apps/appapi/migrations/028_DB_CORE_agency_roster.sql

-- ============================================
-- AGENCY ACCOUNT MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS agencies (
  id TEXT PRIMARY KEY DEFAULT ('agency_' || lower(hex(randomblob(8)))),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  
  -- Company Information
  companyName TEXT NOT NULL,
  companyRegistration TEXT,
  taxId TEXT,
  businessType TEXT, -- 'talent_agency', 'production_house', 'creator_collective'
  
  -- Agency Statistics
  totalManagedTalents INTEGER DEFAULT 0,
  totalVerifiedTalents INTEGER DEFAULT 0,
  totalArchivedTalents INTEGER DEFAULT 0,
  activeImpersonations INTEGER DEFAULT 0,
  
  -- Account Status
  status TEXT DEFAULT 'active', -- 'active', 'suspended', 'archived'
  emailVerified BOOLEAN DEFAULT 0,
  kycStatus TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  
  -- Metadata
  role TEXT DEFAULT 'agency',
  lastLoginAt INTEGER,
  lastModifiedAt INTEGER,
  createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  
  CHECK (email LIKE '%@%.%'),
  CHECK (role = 'agency')
);

CREATE INDEX idx_agencies_email ON agencies(email);
CREATE INDEX idx_agencies_status ON agencies(status);
CREATE INDEX idx_agencies_companyName ON agencies(companyName);

-- ============================================
-- MANAGED TALENT PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS managed_talents (
  id TEXT PRIMARY KEY DEFAULT ('talent_' || lower(hex(randomblob(8)))),
  agencyId TEXT NOT NULL,
  
  -- Identity
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  
  -- Authentication
  passwordHash TEXT,
  tempPasswordHash TEXT,
  passwordResetToken TEXT,
  passwordResetExpiresAt INTEGER,
  
  -- Role & Privileges
  role TEXT DEFAULT 'talent',
  canLoginIndependently BOOLEAN DEFAULT 0,
  
  -- Profile Status
  profileStatus TEXT DEFAULT 'draft', -- 'draft', 'pending_review', 'active', 'archived'
  
  -- Portfolio & Negotiation Locks
  -- Agency can override these settings to prevent talent modifications
  portfolioEditLock BOOLEAN DEFAULT 0,
  priceNegotiationLock BOOLEAN DEFAULT 0,
  scheduleAutoSync BOOLEAN DEFAULT 1,
  
  -- Modification Tracking
  lastModifiedBy TEXT DEFAULT 'agency', -- 'agency' or 'self'
  lastModifiedAt INTEGER,
  lastModifiedByUserId TEXT,
  
  -- Metadata
  emailVerified BOOLEAN DEFAULT 0,
  lastLoginAt INTEGER,
  createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  
  -- Soft Delete
  deletedAt INTEGER,
  
  FOREIGN KEY (agencyId) REFERENCES agencies(id) ON DELETE CASCADE,
  CHECK (role = 'talent')
);

CREATE INDEX idx_managed_talents_agencyId ON managed_talents(agencyId);
CREATE INDEX idx_managed_talents_email ON managed_talents(email);
CREATE INDEX idx_managed_talents_profileStatus ON managed_talents(profileStatus);
CREATE INDEX idx_managed_talents_deletedAt ON managed_talents(deletedAt);

-- ============================================
-- IMPERSONATION SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id TEXT PRIMARY KEY DEFAULT ('imp_' || lower(hex(randomblob(8)))),
  agencyId TEXT NOT NULL,
  talentId TEXT NOT NULL,
  
  -- Token Management
  tokenHash TEXT NOT NULL UNIQUE, -- SHA256 hash of token
  
  -- Session Timing
  createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  expiresAt INTEGER NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'revoked'
  revokedAt INTEGER,
  revokedReason TEXT,
  
  FOREIGN KEY (agencyId) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY (talentId) REFERENCES managed_talents(id) ON DELETE CASCADE,
  CHECK (expiresAt > createdAt)
);

CREATE INDEX idx_impersonation_sessions_agencyId ON impersonation_sessions(agencyId);
CREATE INDEX idx_impersonation_sessions_talentId ON impersonation_sessions(talentId);
CREATE INDEX idx_impersonation_sessions_expiresAt ON impersonation_sessions(expiresAt);
CREATE INDEX idx_impersonation_sessions_status ON impersonation_sessions(status);

-- ============================================
-- IMPERSONATION AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS impersonation_audit_log (
  id TEXT PRIMARY KEY DEFAULT ('audit_' || lower(hex(randomblob(8)))),
  agencyId TEXT NOT NULL,
  agencyUserId TEXT NOT NULL,
  talentId TEXT NOT NULL,
  
  -- Request Context
  ipAddress TEXT NOT NULL,
  userAgent TEXT,
  
  -- Audit Fields
  action TEXT DEFAULT 'impersonate_start', -- 'impersonate_start', 'impersonate_end', 'impersonate_revoked'
  reason TEXT,
  
  -- Metadata
  timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  
  FOREIGN KEY (agencyId) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY (talentId) REFERENCES managed_talents(id) ON DELETE CASCADE
);

CREATE INDEX idx_impersonation_audit_agencyId ON impersonation_audit_log(agencyId);
CREATE INDEX idx_impersonation_audit_talentId ON impersonation_audit_log(talentId);
CREATE INDEX idx_impersonation_audit_timestamp ON impersonation_audit_log(timestamp);
CREATE INDEX idx_impersonation_audit_action ON impersonation_audit_log(action);

-- ============================================
-- AGENCY-PORTFOLIO SYNC SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS agency_portfolio_sync (
  id TEXT PRIMARY KEY DEFAULT ('sync_' || lower(hex(randomblob(8)))),
  agencyId TEXT NOT NULL,
  talentId TEXT NOT NULL,
  
  -- Sync Flags
  syncPortfolioItems BOOLEAN DEFAULT 1,
  syncRates BOOLEAN DEFAULT 1,
  syncAvailability BOOLEAN DEFAULT 1,
  
  -- Override Rules
  overridePrice BOOLEAN DEFAULT 0,
  overridePriceValue REAL,
  overridePriceCurrency TEXT DEFAULT 'IDR',
  
  overrideSchedule BOOLEAN DEFAULT 0,
  maxBookingsPerMonth INTEGER,
  
  -- Auto-Sync Rules
  autoApproveClientRequests BOOLEAN DEFAULT 0,
  autoRejectLowBudget BOOLEAN DEFAULT 0,
  minBudgetThreshold REAL,
  
  lastModifiedAt INTEGER,
  createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  
  FOREIGN KEY (agencyId) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY (talentId) REFERENCES managed_talents(id) ON DELETE CASCADE,
  UNIQUE (agencyId, talentId)
);

CREATE INDEX idx_agency_portfolio_sync_agencyId ON agency_portfolio_sync(agencyId);
CREATE INDEX idx_agency_portfolio_sync_talentId ON agency_portfolio_sync(talentId);

-- ============================================
-- TALENT-AGENCY RELATIONSHIP TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS talent_agency_relationships (
  id TEXT PRIMARY KEY DEFAULT ('rel_' || lower(hex(randomblob(8)))),
  
  -- For managed talents
  managedTalentId TEXT,
  agencyId TEXT,
  relationshipType TEXT DEFAULT 'managed', -- 'managed', 'represented', 'associated'
  
  -- Payment & Earnings
  agencyCommissionPercent REAL DEFAULT 15.0,
  talentEarningsPercent REAL DEFAULT 85.0,
  
  -- Status
  status TEXT DEFAULT 'active',
  
  -- Dates
  startDate INTEGER,
  endDate INTEGER,
  createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  
  FOREIGN KEY (managedTalentId) REFERENCES managed_talents(id) ON DELETE CASCADE,
  FOREIGN KEY (agencyId) REFERENCES agencies(id) ON DELETE CASCADE,
  UNIQUE (managedTalentId, agencyId)
);

CREATE INDEX idx_talent_agency_relationships_managedTalentId ON talent_agency_relationships(managedTalentId);
CREATE INDEX idx_talent_agency_relationships_agencyId ON talent_agency_relationships(agencyId);
CREATE INDEX idx_talent_agency_relationships_relationshipType ON talent_agency_relationships(relationshipType);

-- ============================================
-- RATE LIMITING FOR IMPERSONATION
-- ============================================

CREATE TABLE IF NOT EXISTS impersonation_rate_limit (
  id TEXT PRIMARY KEY DEFAULT ('rl_' || lower(hex(randomblob(8)))),
  agencyId TEXT NOT NULL,
  
  -- Rate Limit Window: 15 minutes
  timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  attemptCount INTEGER DEFAULT 0,
  
  -- Context
  ipAddress TEXT,
  
  FOREIGN KEY (agencyId) REFERENCES agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_impersonation_rate_limit_agencyId ON impersonation_rate_limit(agencyId);
CREATE INDEX idx_impersonation_rate_limit_timestamp ON impersonation_rate_limit(timestamp);

-- ============================================
-- CREATION/MODIFICATION TRIGGERS
-- ============================================

-- Auto-update lastModifiedAt when agencies table is updated
CREATE TRIGGER update_agencies_lastModifiedAt
AFTER UPDATE ON agencies
BEGIN
  UPDATE agencies SET lastModifiedAt = strftime('%s', 'now') * 1000
  WHERE id = NEW.id;
END;

-- Auto-update lastModifiedAt when managed_talents table is updated
CREATE TRIGGER update_managed_talents_lastModifiedAt
AFTER UPDATE ON managed_talents
BEGIN
  UPDATE managed_talents SET lastModifiedAt = strftime('%s', 'now') * 1000
  WHERE id = NEW.id;
END;

-- Auto-update agency statistics when talent created/deleted
CREATE TRIGGER increment_agency_talent_count_on_create
AFTER INSERT ON managed_talents
WHEN NEW.deletedAt IS NULL AND NEW.profileStatus != 'archived'
BEGIN
  UPDATE agencies SET totalManagedTalents = totalManagedTalents + 1
  WHERE id = NEW.agencyId;
END;

CREATE TRIGGER decrement_agency_talent_count_on_delete
AFTER UPDATE ON managed_talents
WHEN NEW.deletedAt IS NOT NULL AND OLD.deletedAt IS NULL
BEGIN
  UPDATE agencies SET totalManagedTalents = totalManagedTalents - 1
  WHERE id = OLD.agencyId;
END;

-- Auto-expire impersonation sessions
CREATE TRIGGER cleanup_expired_impersonations
AFTER UPDATE ON impersonation_sessions
WHEN NEW.expiresAt <= strftime('%s', 'now') * 1000 AND NEW.status = 'active'
BEGIN
  UPDATE impersonation_sessions SET status = 'expired'
  WHERE id = NEW.id;
END;
