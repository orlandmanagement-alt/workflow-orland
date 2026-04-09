# Database Migration - Talent Agency & Casting Call Features

## Migration: Add Agency Profile Features

```sql
-- Add logo columns to agencies table
ALTER TABLE agencies ADD COLUMN logo_url TEXT;
ALTER TABLE agencies ADD COLUMN logo_s3_key TEXT;
ALTER TABLE agencies ADD COLUMN contact_email TEXT;
ALTER TABLE agencies ADD COLUMN website TEXT;
ALTER TABLE agencies ADD COLUMN city TEXT;
ALTER TABLE agencies ADD COLUMN country TEXT;
ALTER TABLE agencies ADD COLUMN talent_count INT DEFAULT 0;

-- Create agency invite tokens table
CREATE TABLE IF NOT EXISTS agency_invite_tokens (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (agency_id) REFERENCES agencies(agency_id)
);

-- Add agency_id to talents table (if not exists)
ALTER TABLE talents ADD COLUMN agency_id TEXT;
ALTER TABLE talents ADD FOREIGN KEY (agency_id) REFERENCES agencies(agency_id);

-- Create index for faster lookups
CREATE INDEX idx_agency_invite_tokens_agency ON agency_invite_tokens(agency_id);
CREATE INDEX idx_agency_invite_tokens_email ON agency_invite_tokens(email);
CREATE INDEX idx_talents_agency ON talents(agency_id);
```

---

## Migration: Add Casting Call Features

```sql
-- Extend projects table for casting
ALTER TABLE projects ADD COLUMN casting_link_token TEXT;
ALTER TABLE projects ADD COLUMN casting_form_fields JSON;
ALTER TABLE projects ADD COLUMN is_casting_open BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN casting_deadline TIMESTAMP;
ALTER TABLE projects ADD COLUMN banner_url TEXT;

-- Create casting guest cast table (for DB_LOGS)
CREATE TABLE IF NOT EXISTS casting_guest_cast (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role_preference TEXT DEFAULT 'all', -- figurant | extras | warga_desa | prajurit | all
  answers JSON,
  attachments JSON,
  converted_to_user_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(project_id),
  FOREIGN KEY (converted_to_user_id) REFERENCES users(id)
);

-- Create casting guest tokens for editable links
CREATE TABLE IF NOT EXISTS casting_guest_tokens (
  id TEXT PRIMARY KEY,
  cast_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'edit_profile' | 'convert_account'
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY (cast_id) REFERENCES casting_guest_cast(id)
);

-- Create live_casting_boards if not exists (for existing code compat)
CREATE TABLE IF NOT EXISTS live_casting_boards (
  board_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT,
  allow_guest_submissions BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'Active', -- Active | Closed | Archived
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- Create candidates list
CREATE TABLE IF NOT EXISTS live_board_candidates (
  candidate_id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  guest_name TEXT,
  guest_phone TEXT,
  guest_email TEXT,
  status TEXT DEFAULT 'Waiting', -- Waiting | Called | Selected | Rejected
  call_time TIMESTAMP,
  created_at TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES live_casting_boards(board_id)
);

-- Create indexes
CREATE INDEX idx_casting_guest_cast_project ON casting_guest_cast(project_id);
CREATE INDEX idx_casting_guest_cast_email ON casting_guest_cast(email);
CREATE INDEX idx_casting_guest_tokens_cast ON casting_guest_tokens(cast_id);
CREATE INDEX idx_live_board_candidates_board ON live_board_candidates(board_id);
```

---

## Migration: Update users table for agency/casting roles

```sql
-- Add agency_id to users (optional, for direct agency admin association)
ALTER TABLE users ADD COLUMN agency_id TEXT;
ALTER TABLE users ADD FOREIGN KEY (agency_id) REFERENCES agencies(agency_id);

-- Ensure role has correct values
-- Values: 'talent', 'client', 'agency', 'admin', 'super_admin', 'casting_director'
```

---

## Database Views (Optional - for easier queries)

```sql
-- View: Agency with talent count
CREATE VIEW IF NOT EXISTS agency_profiles_v AS
SELECT 
  a.agency_id,
  a.name,
  a.logo_url,
  a.contact_email,
  COUNT(t.talent_id) AS talent_count
FROM agencies a
LEFT JOIN talents t ON t.agency_id = a.agency_id
GROUP BY a.agency_id;

-- View: Active casting calls
CREATE VIEW IF NOT EXISTS active_casting_calls_v AS
SELECT 
  p.project_id,
  p.title,
  p.description,
  COUNT(gc.id) AS guest_registrations,
  p.casting_deadline,
  p.is_casting_open
FROM projects p
LEFT JOIN casting_guest_cast gc ON gc.project_id = p.project_id
WHERE p.is_casting_open = TRUE
GROUP BY p.project_id;
```

---

## Data Migration Script (if needed)

```sql
-- Backfill agency_id for existing talents (if any)
UPDATE talents
SET agency_id = (
  SELECT c.client_id 
  FROM clients c 
  WHERE c.is_agency = 1 
  LIMIT 1
)
WHERE agency_id IS NULL;

-- Set default agency logo (placeholder)
UPDATE agencies
SET logo_url = CONCAT('https://cdn.orlandmanagement.com/placeholder/agency-', LOWER(REPLACE(name, ' ', '-')), '.png')
WHERE logo_url IS NULL;
```

---

## Rollback Plan

If any migration fails:

```sql
-- Rollback casting tables
DROP TABLE IF EXISTS casting_guest_tokens;
DROP TABLE IF EXISTS casting_guest_cast;
DROP TABLE IF EXISTS live_board_candidates;
DROP TABLE IF EXISTS live_casting_boards;

-- Rollback agency tables
DROP TABLE IF EXISTS agency_invite_tokens;

-- Rollback columns
ALTER TABLE agencies DROP COLUMN IF EXISTS logo_url;
ALTER TABLE agencies DROP COLUMN IF EXISTS logo_s3_key;
ALTER TABLE projects DROP COLUMN IF EXISTS casting_link_token;
ALTER TABLE projects DROP COLUMN IF EXISTS casting_form_fields;
```

