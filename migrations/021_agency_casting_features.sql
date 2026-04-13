-- Migration: Add Agency & Casting Features
-- Date: 2026-04-09
-- Purpose: Support Agency Recruitment and Casting Call Workflows

-- ===== AGENCY MANAGEMENT =====

-- Add agency fields to talents table
ALTER TABLE talents ADD COLUMN agency_id TEXT;
ALTER TABLE talents ADD COLUMN invited_by_user_id TEXT;
ALTER TABLE talents ADD COLUMN invited_at DATETIME;

-- Add agency fields to clients table (for agency type clients)
ALTER TABLE clients ADD COLUMN logo_url TEXT;
ALTER TABLE clients ADD COLUMN is_agency INTEGER DEFAULT 0;

-- Track agency invitations (for invitation links)
CREATE TABLE IF NOT EXISTS agency_invitations (
  invitation_id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  invite_link_token TEXT UNIQUE NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  max_uses INTEGER DEFAULT -1,
  current_uses INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  FOREIGN KEY (agency_id) REFERENCES clients(client_id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- ===== CASTING FEATURES =====

-- Extend live_casting_boards table
ALTER TABLE live_casting_boards ADD COLUMN guest_link_token TEXT UNIQUE;
ALTER TABLE live_casting_boards ADD COLUMN allow_guest_submissions INTEGER DEFAULT 1;
ALTER TABLE live_casting_boards ADD COLUMN guest_questions JSON;

-- Track guest submissions (for live casting)
CREATE TABLE IF NOT EXISTS casting_guest_submissions (
  submission_id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  is_account_created INTEGER DEFAULT 0,
  audition_data JSON,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  converted_user_id TEXT,
  FOREIGN KEY (board_id) REFERENCES live_casting_boards(board_id),
  FOREIGN KEY (converted_user_id) REFERENCES users(id)
);

-- Link talent to guest submission (for conversion tracking)
ALTER TABLE talents ADD COLUMN converted_from_submission_id TEXT;

-- Indexes for performance
CREATE INDEX idx_talents_agency ON talents(agency_id);
CREATE INDEX idx_talents_invited_at ON talents(invited_at);
CREATE INDEX idx_agency_invitations_token ON agency_invitations(invite_link_token);
CREATE INDEX idx_agency_invitations_status ON agency_invitations(status);
CREATE INDEX idx_casting_guest_email ON casting_guest_submissions(guest_email);
CREATE INDEX idx_casting_guest_board ON casting_guest_submissions(board_id);
