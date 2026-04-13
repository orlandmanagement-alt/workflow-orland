-- Migration 032: Event Operations (EO/WO) Workspace Tables
-- Untuk menangani Hospitality Riders, Technical Riders, Rundown, dan Gate Passes

-- ============================================================
-- TABLE: eo_hospitality_riders
-- Hospitality requirement dari talent (katering, akomodasi, dll)
-- ============================================================
CREATE TABLE IF NOT EXISTS eo_hospitality_riders (
  id STRING PRIMARY KEY DEFAULT (hex(randomblob(16))),
  project_id STRING NOT NULL,
  talent_id STRING NOT NULL,
  
  -- Hospitality requests
  accommodation_required BOOLEAN DEFAULT 0,
  accommodation_type STRING DEFAULT NULL, -- 'hotel_3star', 'hotel_5star', 'not_needed'
  meal_preferences TEXT DEFAULT NULL, -- JSON: vegetarian, halal, allergies
  transportation_required BOOLEAN DEFAULT 0,
  transportation_type STRING DEFAULT NULL, -- 'self_drive', 'taxi_provided', 'flight_business'
  special_requests TEXT DEFAULT NULL, -- Free text
  
  -- Approval status
  is_approved INTEGER DEFAULT 0, -- 0: pending, 1: approved, -1: rejected
  approved_by STRING DEFAULT NULL, -- User ID dari client
  approved_at DATETIME DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_eo_hospitality_project ON eo_hospitality_riders(project_id);
CREATE INDEX idx_eo_hospitality_talent ON eo_hospitality_riders(talent_id);
CREATE INDEX idx_eo_hospitality_status ON eo_hospitality_riders(is_approved);

-- ============================================================
-- TABLE: eo_technical_riders
-- Technical requirement dari talent (mic, lighting, dll)
-- ============================================================
CREATE TABLE IF NOT EXISTS eo_technical_riders (
  id STRING PRIMARY KEY DEFAULT (hex(randomblob(16))),
  project_id STRING NOT NULL,
  talent_id STRING NOT NULL,
  
  -- Technical specifications
  audio_requirements TEXT DEFAULT NULL, -- JSON: [{type: 'wireless_mic', count: 2, frequency: 'UHF'}]
  lighting_requirements TEXT DEFAULT NULL, -- JSON: positioning, intensity
  dressing_room_requirements TEXT DEFAULT NULL, -- JSON: size, amenities
  special_equipment TEXT DEFAULT NULL, -- Keyboard, drums, dll
  technical_notes TEXT DEFAULT NULL, -- Free text
  
  -- Approval status
  is_approved INTEGER DEFAULT 0, -- 0: pending, 1: approved, -1: rejected
  approved_by STRING DEFAULT NULL,
  approved_at DATETIME DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_eo_technical_project ON eo_technical_riders(project_id);
CREATE INDEX idx_eo_technical_talent ON eo_technical_riders(talent_id);
CREATE INDEX idx_eo_technical_status ON eo_technical_riders(is_approved);

-- ============================================================
-- TABLE: wo_rundowns
-- Workflow/Timeline eksekusi event
-- ============================================================
CREATE TABLE IF NOT EXISTS wo_rundowns (
  id STRING PRIMARY KEY DEFAULT (hex(randomblob(16))),
  project_id STRING NOT NULL,
  event_date DATE NOT NULL,
  
  -- Timeline sebagai JSON array
  -- [{
  --   "id": "seg_1",
  --   "segment_name": "Opening Performance",
  --   "start_time": "18:00",
  --   "end_time": "18:15",
  --   "duration_minutes": 15,
  --   "talent_ids": ["talent_123", "talent_456"],
  --   "stage": "main_stage",
  --   "notes": "Include pyrotechnics",
  --   "status": "not_started" | "in_progress" | "completed"
  -- }]
  timeline TEXT NOT NULL DEFAULT '[]',
  
  -- Version control untuk collaboration
  version INTEGER DEFAULT 1,
  last_modified_by STRING NOT NULL,
  
  -- Status
  is_finalized INTEGER DEFAULT 0, -- 0: draft, 1: approved for execution
  finalized_at DATETIME DEFAULT NULL,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (last_modified_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_wo_rundown_project ON wo_rundowns(project_id);
CREATE INDEX idx_wo_rundown_event_date ON wo_rundowns(event_date);
CREATE INDEX idx_wo_rundown_finalized ON wo_rundowns(is_finalized);

-- ============================================================
-- TABLE: eo_gate_passes
-- Access control untuk talent (QR Code)
-- ============================================================
CREATE TABLE IF NOT EXISTS eo_gate_passes (
  id STRING PRIMARY KEY DEFAULT (hex(randomblob(16))),
  project_id STRING NOT NULL,
  talent_id STRING NOT NULL,
  
  -- Pass details
  pass_code STRING UNIQUE NOT NULL, -- Unique token untuk QR code
  pass_type STRING NOT NULL, -- 'performer', 'crew', 'vip_guest', 'stage_crew'
  access_areas TEXT DEFAULT NULL, -- JSON: ['backstage', 'green_room', 'main_stage']
  
  -- Schedule
  check_in_time DATETIME DEFAULT NULL,
  check_out_time DATETIME DEFAULT NULL,
  expected_arrival DATETIME NOT NULL,
  
  -- Scanning analytics
  scanned_at DATETIME DEFAULT NULL,
  scanned_by STRING DEFAULT NULL, -- Gate operator user ID
  is_present INTEGER DEFAULT 0, -- 0: not arrived, 1: present, -1: absent
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  FOREIGN KEY (scanned_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_eo_gate_project ON eo_gate_passes(project_id);
CREATE INDEX idx_eo_gate_talent ON eo_gate_passes(talent_id);
CREATE INDEX idx_eo_gate_pass_code ON eo_gate_passes(pass_code);
CREATE INDEX idx_eo_gate_present ON eo_gate_passes(is_present);

-- ============================================================
-- TRIGGER: Auto-update timestamp untuk eo_hospitality_riders
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_eo_hospitality_updated
AFTER UPDATE ON eo_hospitality_riders
BEGIN
  UPDATE eo_hospitality_riders SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- ============================================================
-- TRIGGER: Auto-update timestamp untuk eo_technical_riders
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_eo_technical_updated
AFTER UPDATE ON eo_technical_riders
BEGIN
  UPDATE eo_technical_riders SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- ============================================================
-- TRIGGER: Auto-update timestamp untuk wo_rundowns
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_wo_rundown_updated
AFTER UPDATE ON wo_rundowns
BEGIN
  UPDATE wo_rundowns SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- ============================================================
-- TRIGGER: Auto-update timestamp untuk eo_gate_passes
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_eo_gate_updated
AFTER UPDATE ON eo_gate_passes
BEGIN
  UPDATE eo_gate_passes SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;
