-- ===============================================
-- ORLAND MANAGEMENT - DB_SSO SCHEMA MIGRATION
-- Single Sign-On (Auth) Database
-- Separate from DB_CORE for security/performance
-- ===============================================

-- WARNING: THIS WILL DELETE ALL AUTH DATA
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS otp_codes;
DROP TABLE IF EXISTS pin_codes;
DROP TABLE IF EXISTS account_lockouts;
DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS users;

-- ===============================================
-- 1. CORE USER MANAGEMENT
-- ===============================================

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('talent', 'client', 'admin', 'agency')),
  is_active INTEGER DEFAULT 1,
  email_verified INTEGER DEFAULT 0,
  email_verified_at DATETIME,
  phone_verified INTEGER DEFAULT 0,
  phone_verified_at DATETIME,
  pin_required INTEGER DEFAULT 0,
  pin_hash TEXT,
  pin_salt TEXT,
  profile_completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  last_login_ip TEXT,
  two_factor_enabled INTEGER DEFAULT 0,
  two_factor_method TEXT
);

-- ===============================================
-- 2. SESSION & TOKEN MANAGEMENT
-- ===============================================

CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sid_token TEXT,
  token_hash TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===============================================
-- 3. AUTHENTICATION METHODS
-- ===============================================

CREATE TABLE otp_codes (
  otp_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  method TEXT CHECK (method IN ('email', 'sms')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE pin_codes (
  pin_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE password_reset_tokens (
  token_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  ip_address TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===============================================
-- 4. SECURITY & ABUSE PREVENTION
-- ===============================================

CREATE TABLE login_attempts (
  attempt_id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  method TEXT CHECK (method IN ('password', 'otp', 'pin')),
  success INTEGER DEFAULT 0,
  failure_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE account_lockouts (
  lockout_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  reason TEXT,
  failed_attempts INTEGER,
  locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  unlocks_at DATETIME NOT NULL,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===============================================
-- 5. ROLE-BASED ACCESS CONTROL (RBAC)
-- ===============================================

CREATE TABLE roles (
  role_id TEXT PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  permission_id TEXT PRIMARY KEY,
  permission_name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  role_permission_id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY(permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

CREATE TABLE user_roles (
  user_role_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id)
);

-- ===============================================
-- DEFAULT ROLES
-- ===============================================

INSERT OR IGNORE INTO roles (role_id, role_name, description, is_system) VALUES
  ('talent', 'Talent', 'Talent user', 1),
  ('client', 'Client', 'Client/Brand user', 1),
  ('agency', 'Agency', 'Talent Agency user', 1),
  ('admin', 'Admin', 'System Administrator', 1),
  ('super_admin', 'Super Admin', 'Super Administrator', 1);

-- ===============================================
-- DEFAULT PERMISSIONS
-- ===============================================

INSERT OR IGNORE INTO permissions (permission_id, permission_name, description) VALUES
  ('manage_talents', 'Manage Talents', 'Can manage talent profiles'),
  ('manage_projects', 'Manage Projects', 'Can create and manage projects'),
  ('manage_bookings', 'Manage Bookings', 'Can manage bookings and offers'),
  ('manage_invoices', 'Manage Invoices', 'Can manage financial documents'),
  ('manage_users', 'Manage Users', 'Can manage user accounts'),
  ('view_analytics', 'View Analytics', 'Can access analytics dashboard'),
  ('manage_system', 'Manage System', 'Can access system settings');

-- ===============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_sid_token ON sessions(sid_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX idx_otp_codes_email ON otp_codes(email);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);
CREATE INDEX idx_account_lockouts_user_id ON account_lockouts(user_id);
CREATE INDEX idx_account_lockouts_unlocks_at ON account_lockouts(unlocks_at);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- ===============================================
-- MIGRATION COMPLETE
-- ===============================================
