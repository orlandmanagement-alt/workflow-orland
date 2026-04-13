-- ===============================================
-- ORLAND MANAGEMENT - DB_CORE SCHEMA MIGRATION
-- Drop and Recreate All Tables (Clean Slate)
-- ===============================================

-- WARNING: THIS WILL DELETE ALL DATA
DROP TABLE IF EXISTS talent_experiences;
DROP TABLE IF EXISTS talent_certifications;
DROP TABLE IF EXISTS talent_bank_accounts;
DROP TABLE IF EXISTS talent_rate_cards;
DROP TABLE IF EXISTS talent_internal_notes;
DROP TABLE IF EXISTS client_members;
DROP TABLE IF EXISTS project_roles;
DROP TABLE IF EXISTS project_talents;
DROP TABLE IF EXISTS audition_medias;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS payouts;
DROP TABLE IF EXISTS financial_splits;
DROP TABLE IF EXISTS talent_schedules;
DROP TABLE IF EXISTS schedule_qrs;
DROP TABLE IF EXISTS talent_media;
DROP TABLE IF EXISTS kol_briefs;
DROP TABLE IF EXISTS kol_content_drafts;
DROP TABLE IF EXISTS kol_tracking_links;
DROP TABLE IF EXISTS wo_rundowns;
DROP TABLE IF EXISTS wo_song_lists;
DROP TABLE IF EXISTS wo_floorplans;
DROP TABLE IF EXISTS eo_technical_riders;
DROP TABLE IF EXISTS eo_hospitality_riders;
DROP TABLE IF EXISTS eo_gate_passes;
DROP TABLE IF EXISTS eo_stages;
DROP TABLE IF EXISTS kyc_documents;
DROP TABLE IF EXISTS kyb_documents;
DROP TABLE IF EXISTS kyb_verifications;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS master_categories;
DROP TABLE IF EXISTS master_skills;
DROP TABLE IF EXISTS dispute_tickets;
DROP TABLE IF EXISTS project_evaluations;
DROP TABLE IF EXISTS project_usage_rights;
DROP TABLE IF EXISTS project_logistics;
DROP TABLE IF EXISTS vehicle_routes;
DROP TABLE IF EXISTS casting_rooms;
DROP TABLE IF EXISTS casting_room_recordings;
DROP TABLE IF EXISTS casting_calls;
DROP TABLE IF EXISTS casting_submissions;
DROP TABLE IF EXISTS casting_voting_links;
DROP TABLE IF EXISTS casting_guest_submissions;
DROP TABLE IF EXISTS casting_guest_cast;
DROP TABLE IF EXISTS casting_guest_tokens;
DROP TABLE IF EXISTS live_casting_boards;
DROP TABLE IF EXISTS live_board_candidates;
DROP TABLE IF EXISTS agency_inventories;
DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS talent_disciplinary;
DROP TABLE IF EXISTS client_webhooks;
DROP TABLE IF EXISTS legal_documents;
DROP TABLE IF EXISTS ph_scripts;
DROP TABLE IF EXISTS ph_call_sheets;
DROP TABLE IF EXISTS brand_budgets;
DROP TABLE IF EXISTS agency_talents;
DROP TABLE IF EXISTS agency_resources;
DROP TABLE IF EXISTS agency_invitations;
DROP TABLE IF EXISTS event_infrastructures;
DROP TABLE IF EXISTS infrastructure_requests;
DROP TABLE IF EXISTS project_verifications;
DROP TABLE IF EXISTS project_escrows;
DROP TABLE IF EXISTS academy_courses;
DROP TABLE IF EXISTS academy_enrollments;
DROP TABLE IF EXISTS talent_taxes;
DROP TABLE IF EXISTS talents;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS agencies;

-- ===============================================
-- 1. CORE TALENT MANAGEMENT
-- ===============================================

CREATE TABLE talents (
  talent_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  category TEXT,
  gender TEXT,
  height INTEGER,
  weight INTEGER,
  birth_date TEXT,
  base_rate REAL DEFAULT 0,
  kyc_status TEXT DEFAULT 'Pending',
  bio TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  headshot TEXT,
  side_view TEXT,
  full_height TEXT,
  instagram TEXT,
  tiktok TEXT,
  twitter TEXT,
  phone TEXT,
  email TEXT,
  showreels TEXT DEFAULT '[]',
  audios TEXT DEFAULT '[]',
  additional_photos TEXT DEFAULT '[]',
  interests TEXT DEFAULT '[]',
  skills TEXT DEFAULT '[]',
  union_affiliation TEXT,
  eye_color TEXT,
  hair_color TEXT,
  hip_size TEXT,
  chest_bust TEXT,
  body_type TEXT,
  specific_characteristics TEXT,
  tattoos TEXT,
  piercings TEXT,
  ethnicity TEXT,
  location TEXT,
  agency_id TEXT,
  invited_by_user_id TEXT,
  invited_at DATETIME,
  converted_from_submission_id TEXT
);

CREATE TABLE talent_experiences (
  exp_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  title TEXT,
  year INTEGER,
  month TEXT,
  description TEXT,
  company TEXT,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE
);

CREATE TABLE talent_certifications (
  cert_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  cert_name TEXT,
  issued_by TEXT,
  year INTEGER,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE
);

CREATE TABLE talent_bank_accounts (
  account_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE
);

CREATE TABLE talent_rate_cards (
  rate_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  service_name TEXT,
  amount REAL,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE
);

CREATE TABLE talent_internal_notes (
  note_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  author_user_id TEXT,
  note_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE
);

CREATE TABLE talent_media (
  media_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  is_primary INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE
);

CREATE TABLE talent_schedules (
  schedule_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  booking_id TEXT,
  activity_type TEXT,
  start_time DATETIME,
  end_time DATETIME,
  location_name TEXT,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE
);

CREATE TABLE schedule_qrs (
  qr_id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  qr_hash TEXT,
  expires_at DATETIME,
  FOREIGN KEY(schedule_id) REFERENCES talent_schedules(schedule_id) ON DELETE CASCADE
);

CREATE TABLE talent_taxes (
  tax_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  npwp TEXT,
  tax_rate REAL,
  year INTEGER,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE
);

CREATE TABLE talent_disciplinary (
  sp_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  issuer_user_id TEXT,
  reason TEXT,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE
);

-- ===============================================
-- 2. AGENCY MANAGEMENT
-- ===============================================

CREATE TABLE agencies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  agency_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  logo_url TEXT,
  logo_s3_key TEXT,
  contact_email TEXT,
  website TEXT,
  city TEXT,
  country TEXT,
  talent_count INT DEFAULT 0
);

CREATE TABLE agency_talents (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE,
  UNIQUE(agency_id, talent_id)
);

CREATE TABLE agency_invitations (
  invitation_id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  invite_link_token TEXT UNIQUE NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  max_uses INTEGER DEFAULT -1,
  current_uses INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

CREATE TABLE agency_inventories (
  item_id TEXT PRIMARY KEY,
  item_name TEXT,
  category TEXT,
  quantity INTEGER
);

CREATE TABLE inventory_transactions (
  transaction_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  checkout_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  checkin_date DATETIME,
  status TEXT,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE,
  FOREIGN KEY(item_id) REFERENCES agency_inventories(item_id) ON DELETE CASCADE
);

CREATE TABLE agency_resources (
  resource_id TEXT PRIMARY KEY,
  title TEXT,
  file_url TEXT
);

-- ===============================================
-- 3. CLIENT & PROJECT MANAGEMENT
-- ===============================================

CREATE TABLE clients (
  client_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  company_name TEXT,
  client_type TEXT,
  npwp_number TEXT,
  is_active INTEGER DEFAULT 1,
  logo_url TEXT,
  is_agency INTEGER DEFAULT 0
);

CREATE TABLE client_members (
  member_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

CREATE TABLE client_webhooks (
  webhook_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  endpoint_url TEXT,
  event_type TEXT,
  FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

CREATE TABLE client_shared_notes (
  note_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  content TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  project_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  title TEXT,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'Draft',
  moodboards TEXT DEFAULT '[]',
  budget_total INTEGER DEFAULT 0,
  casting_link_token TEXT,
  casting_form_fields JSON,
  is_casting_open BOOLEAN DEFAULT FALSE,
  casting_deadline TIMESTAMP,
  banner_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

CREATE TABLE project_roles (
  role_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  role_name TEXT NOT NULL,
  quantity_needed INTEGER DEFAULT 1,
  budget_per_talent REAL,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE project_talents (
  booking_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  status TEXT DEFAULT 'Shortlisted',
  contract_signed INTEGER DEFAULT 0,
  review_rating REAL,
  review_notes TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE
);

CREATE TABLE project_usage_rights (
  right_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  duration_months INTEGER,
  region TEXT,
  fee REAL,
  FOREIGN KEY(booking_id) REFERENCES project_talents(booking_id) ON DELETE CASCADE
);

CREATE TABLE project_logistics (
  logistic_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  item_type TEXT,
  details TEXT,
  voucher_url TEXT,
  FOREIGN KEY(booking_id) REFERENCES project_talents(booking_id) ON DELETE CASCADE
);

CREATE TABLE project_evaluations (
  eval_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  feedback TEXT,
  rating INTEGER,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE project_verifications (
  verification_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  status TEXT,
  notes TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE project_escrows (
  escrow_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE,
  amount_held REAL,
  status TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- ===============================================
-- 4. FINANCIAL MANAGEMENT
-- ===============================================

CREATE TABLE invoices (
  invoice_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  amount REAL,
  status TEXT DEFAULT 'Unpaid',
  proof_url TEXT,
  due_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
  FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

CREATE TABLE payouts (
  payout_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  amount REAL,
  status TEXT DEFAULT 'Pending',
  processed_at DATETIME,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE,
  FOREIGN KEY(booking_id) REFERENCES project_talents(booking_id) ON DELETE CASCADE
);

CREATE TABLE financial_splits (
  split_id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  agency_amount REAL,
  talent_amount REAL,
  FOREIGN KEY(invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE
);

CREATE TABLE brand_budgets (
  budget_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  max_budget REAL,
  current_spend REAL,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- ===============================================
-- 5. AUDITION & MEDIA MANAGEMENT
-- ===============================================

CREATE TABLE audition_medias (
  media_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  file_url TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(booking_id) REFERENCES project_talents(booking_id) ON DELETE CASCADE
);

-- ===============================================
-- 6. KOL (KEY OPINION LEADER) MANAGEMENT
-- ===============================================

CREATE TABLE kol_briefs (
  brief_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  content TEXT,
  guidelines JSON,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE kol_content_drafts (
  draft_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  video_url TEXT,
  status TEXT DEFAULT 'Pending Review',
  feedback TEXT,
  FOREIGN KEY(booking_id) REFERENCES project_talents(booking_id) ON DELETE CASCADE
);

CREATE TABLE kol_tracking_links (
  link_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  url TEXT,
  clicks INTEGER DEFAULT 0,
  FOREIGN KEY(booking_id) REFERENCES project_talents(booking_id) ON DELETE CASCADE
);

-- ===============================================
-- 7. WORK ORDER (WO) MANAGEMENT
-- ===============================================

CREATE TABLE wo_rundowns (
  rundown_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  timeline JSON,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE wo_song_lists (
  list_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  must_play JSON,
  do_not_play JSON,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE wo_floorplans (
  plan_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  image_url TEXT,
  details JSON,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- ===============================================
-- 8. EVENT OPERATIONS (EO) MANAGEMENT
-- ===============================================

CREATE TABLE eo_technical_riders (
  rider_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  requirements JSON,
  is_approved INTEGER DEFAULT 0,
  FOREIGN KEY(booking_id) REFERENCES project_talents(booking_id) ON DELETE CASCADE
);

CREATE TABLE eo_hospitality_riders (
  rider_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  requirements JSON,
  is_approved INTEGER DEFAULT 0,
  FOREIGN KEY(booking_id) REFERENCES project_talents(booking_id) ON DELETE CASCADE
);

CREATE TABLE eo_gate_passes (
  pass_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  qr_data TEXT,
  scanned_at DATETIME,
  FOREIGN KEY(booking_id) REFERENCES project_talents(booking_id) ON DELETE CASCADE
);

CREATE TABLE eo_stages (
  stage_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  stage_name TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- ===============================================
-- 9. COMPLIANCE & VERIFICATION
-- ===============================================

CREATE TABLE kyc_documents (
  doc_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  id_card_url TEXT,
  selfie_url TEXT,
  verified_at DATETIME,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE
);

CREATE TABLE kyb_documents (
  doc_id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  doc_url TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kyb_verifications (
  verification_id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  status TEXT,
  verified_at DATETIME
);

-- ===============================================
-- 10. MASTER DATA
-- ===============================================

CREATE TABLE master_categories (
  category_id TEXT PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE
);

CREATE TABLE master_skills (
  skill_id TEXT PRIMARY KEY,
  skill_name TEXT NOT NULL UNIQUE
);

CREATE TABLE vendors (
  vendor_id TEXT PRIMARY KEY,
  name TEXT,
  service_type TEXT,
  kyb_status TEXT DEFAULT 'Pending'
);

-- ===============================================
-- 11. CASTING (LIVE BOARD & GUEST REGISTRATION)
-- ===============================================

CREATE TABLE live_casting_boards (
  board_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT,
  allow_guest_submissions BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'Active',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE live_board_candidates (
  candidate_id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  guest_name TEXT,
  guest_phone TEXT,
  guest_email TEXT,
  status TEXT DEFAULT 'Waiting',
  call_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(board_id) REFERENCES live_casting_boards(board_id) ON DELETE CASCADE
);

CREATE TABLE casting_rooms (
  room_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  meeting_link TEXT,
  scheduled_at DATETIME,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE casting_room_recordings (
  recording_id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  video_url TEXT,
  FOREIGN KEY(room_id) REFERENCES casting_rooms(room_id) ON DELETE CASCADE
);

-- NEW: Casting Call & Guest Registration
CREATE TABLE casting_calls (
  call_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  description TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE casting_submissions (
  sub_id TEXT PRIMARY KEY,
  call_id TEXT NOT NULL,
  applicant_name TEXT,
  portfolio_url TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(call_id) REFERENCES casting_calls(call_id) ON DELETE CASCADE
);

CREATE TABLE casting_voting_links (
  link_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  url_hash TEXT,
  expires_at DATETIME,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- NEW: Guest Cast System (untuk Scenario 2 - Casting Call)
CREATE TABLE casting_guest_cast (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role_preference TEXT DEFAULT 'all',
  answers JSON,
  attachments JSON,
  converted_to_user_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE casting_guest_tokens (
  id TEXT PRIMARY KEY,
  cast_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY(cast_id) REFERENCES casting_guest_cast(id) ON DELETE CASCADE
);

CREATE TABLE casting_guest_submissions (
  submission_id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  is_account_created INTEGER DEFAULT 0,
  audition_data JSON,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  converted_user_id TEXT,
  FOREIGN KEY(board_id) REFERENCES live_casting_boards(board_id) ON DELETE CASCADE
);

-- ===============================================
-- 12. PRODUCTION MANAGEMENT
-- ===============================================

CREATE TABLE ph_scripts (
  script_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  file_url TEXT,
  breakdown_data JSON,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE ph_call_sheets (
  sheet_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  call_time DATETIME,
  details JSON,
  FOREIGN KEY(booking_id) REFERENCES project_talents(booking_id) ON DELETE CASCADE
);

CREATE TABLE legal_documents (
  doc_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  doc_type TEXT,
  file_url TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- ===============================================
-- 13. DISPUTE & RESOLUTION
-- ===============================================

CREATE TABLE dispute_tickets (
  ticket_id TEXT PRIMARY KEY,
  reporter_user_id TEXT NOT NULL,
  project_id TEXT,
  issue TEXT,
  status TEXT DEFAULT 'Open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- ===============================================
-- 14. LOGISTICS & INFRASTRUCTURE
-- ===============================================

CREATE TABLE vehicle_routes (
  route_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  driver_name TEXT,
  waypoints JSON,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE event_infrastructures (
  infra_id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  price REAL
);

CREATE TABLE infrastructure_requests (
  request_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  details JSON,
  status TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- ===============================================
-- 15. LEARNING & DEVELOPMENT
-- ===============================================

CREATE TABLE academy_courses (
  course_id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE academy_enrollments (
  enrollment_id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(talent_id) REFERENCES talents(talent_id) ON DELETE CASCADE,
  FOREIGN KEY(course_id) REFERENCES academy_courses(course_id) ON DELETE CASCADE
);

-- ===============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX idx_talents_user_id ON talents(user_id);
CREATE INDEX idx_talents_agency_id ON talents(agency_id);
CREATE INDEX idx_talents_kyc_status ON talents(kyc_status);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_talents_project_id ON project_talents(project_id);
CREATE INDEX idx_project_talents_talent_id ON project_talents(talent_id);
CREATE INDEX idx_talent_schedules_talent_id ON talent_schedules(talent_id);
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_payouts_talent_id ON payouts(talent_id);
CREATE INDEX idx_agency_talents_agency_id ON agency_talents(agency_id);
CREATE INDEX idx_live_board_candidates_board_id ON live_board_candidates(board_id);
CREATE INDEX idx_casting_guest_cast_project_id ON casting_guest_cast(project_id);
CREATE INDEX idx_casting_guest_cast_email ON casting_guest_cast(email);

-- ===============================================
-- MIGRATION COMPLETE
-- ===============================================
