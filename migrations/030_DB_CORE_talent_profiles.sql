-- Migration 030: Talent Profile Schema
-- File: apps/appapi/migrations/030_DB_CORE_talent_profiles.sql
-- Purpose: Comprehensive talent profile data structure for AI matching

CREATE TABLE talent_profiles (
    id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL UNIQUE,
    
    -- Demographics
    age INTEGER,
    gender TEXT CHECK(gender IN ('male', 'female', 'non-binary', 'other')),
    domicile TEXT, -- e.g., "Jakarta, Indonesia"
    phone TEXT,
    email TEXT,
    bio TEXT,
    
    -- Physical Attributes (Critical for Casting)
    height_cm INTEGER,
    weight_kg REAL,
    skin_tone TEXT CHECK(skin_tone IN ('fair', 'light', 'medium', 'olive', 'tan', 'deep', 'other')),
    hair_color TEXT CHECK(hair_color IN ('black', 'brown', 'blonde', 'red', 'gray', 'other')),
    eye_color TEXT CHECK(eye_color IN ('black', 'brown', 'blue', 'green', 'hazel', 'other')),
    face_type TEXT CHECK(face_type IN ('oval', 'round', 'square', 'heart', 'oblong', 'diamond', 'pan-asian', 'caucasian', 'local', 'other')),
    
    -- Body Measurements
    chest_cm INTEGER,
    waist_cm INTEGER,
    hip_cm INTEGER,
    shoe_size TEXT,
    shirt_size TEXT CHECK(shirt_size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL')),
    
    -- Skills & Categories (Multi-select)
    skills_json TEXT, -- JSON array: ["actor", "model_catwalk", "model_commercial", "mc", "dancer", "singer", "presenter"]
    languages_json TEXT, -- JSON array: ["indonesian", "english", "mandarin", "japanese"]
    
    -- Media Assets
    comp_card_url TEXT,
    headshot_url TEXT,
    full_body_url TEXT,
    showreel_url TEXT,
    portfolio_photos TEXT, -- JSON array of photo URLs
    
    -- Rate Card (Dasar untuk negosiasi)
    rate_daily_min REAL, -- Minimum daily rate (e.g., 1,000,000)
    rate_daily_max REAL, -- Maximum daily rate
    rate_project_min REAL,
    rate_project_max REAL,
    rate_hourly REAL,
    preferred_currency TEXT DEFAULT 'IDR',
    
    -- Profile Completeness & Quality
    profile_completion_percent REAL DEFAULT 0, -- 0-100
    profile_quality_score REAL DEFAULT 0, -- AI-generated score 0-100
    
    -- Availability & Preferences
    is_available BOOLEAN DEFAULT TRUE,
    availability_note TEXT,
    preferred_project_types TEXT, -- JSON array
    location_willing_to_travel BOOLEAN DEFAULT FALSE,
    max_travel_hours INTEGER, -- Max hours willing to travel
    
    -- Verification Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_kyc_approved BOOLEAN DEFAULT FALSE,
    kyc_document_id TEXT,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_edited_by TEXT,
    
    FOREIGN KEY (talent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes untuk performa query
CREATE INDEX idx_talent_profiles_gender_age ON talent_profiles(gender, age);
CREATE INDEX idx_talent_profiles_height_weight ON talent_profiles(height_cm, weight_cm);
CREATE INDEX idx_talent_profiles_location ON talent_profiles(domicile);
CREATE INDEX idx_talent_profiles_is_available ON talent_profiles(is_available);
CREATE INDEX idx_talent_profiles_completion ON talent_profiles(profile_completion_percent);

-- Trigger untuk auto-update updated_at
CREATE TRIGGER trigger_talent_profiles_updated_at 
AFTER UPDATE ON talent_profiles
FOR EACH ROW
BEGIN
  UPDATE talent_profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger untuk calculate profile_completion_percent
CREATE TRIGGER trigger_talent_profiles_completion 
AFTER UPDATE ON talent_profiles
FOR EACH ROW
BEGIN
  UPDATE talent_profiles 
  SET profile_completion_percent = 
    CASE 
      WHEN 
        age IS NOT NULL AND
        gender IS NOT NULL AND
        domicile IS NOT NULL AND
        height_cm IS NOT NULL AND
        weight_kg IS NOT NULL AND
        face_type IS NOT NULL AND
        hair_color IS NOT NULL AND
        skills_json IS NOT NULL AND
        comp_card_url IS NOT NULL AND
        headshot_url IS NOT NULL AND
        full_body_url IS NOT NULL AND
        rate_daily_min IS NOT NULL
      THEN 100
      ELSE 
        ROUND(
          (
            (CASE WHEN age IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN gender IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN domicile IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN height_cm IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN weight_kg IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN face_type IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN hair_color IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN skills_json IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN comp_card_url IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN headshot_url IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN full_body_url IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN rate_daily_min IS NOT NULL THEN 1 ELSE 0 END)
          ) * 100.0 / 12
        )
    END
  WHERE id = NEW.id;
END;

-- ============================================================================
-- Tabel: casting_requirements (Data klien tentang apa yang mereka butuhkan)
-- ============================================================================
CREATE TABLE casting_requirements (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    
    -- Hard Filters (Mutlak)
    required_gender TEXT, -- NULL = any, atau specific
    required_age_min INTEGER,
    required_age_max INTEGER,
    required_location_pref TEXT, -- e.g., "Jakarta_only" atau "flexible"
    
    -- Physical Preferences
    height_min_cm INTEGER,
    height_max_cm INTEGER,
    skin_tone_preferred TEXT, -- JSON array: ["fair", "medium", "deep"]
    face_type_preferred TEXT, -- JSON array: ["oval", "pan-asian"]
    
    -- Skills & Categories Required
    required_skills TEXT, -- JSON array
    required_languages TEXT, -- JSON array
    
    -- Budget & Logistics
    budget_min REAL,
    budget_max REAL,
    shoot_date_start DATE,
    shoot_date_end DATE,
    shoot_location TEXT,
    travel_required BOOLEAN,
    
    -- Soft Filters & Notes
    special_requirements TEXT,
    preferred_qualities TEXT, -- JSON array: descriptive terms
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_casting_req_project ON casting_requirements(project_id);
CREATE INDEX idx_casting_req_age ON casting_requirements(required_age_min, required_age_max);
CREATE INDEX idx_casting_req_active ON casting_requirements(is_active);

-- ============================================================================
-- Tabel: job_applications (Tracking lamaran talent)
-- ============================================================================
CREATE TABLE job_applications (
    id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    role_id TEXT,
    
    -- Application Status (State Machine)
    status TEXT DEFAULT 'applied' CHECK(status IN (
        'applied', 'viewed', 'shortlisted', 'audition_invited', 
        'hired', 'completed', 'rejected', 'declined'
    )),
    
    -- Matching Score
    match_percentage REAL, -- 0-100
    match_details TEXT, -- JSON: detail breakdown of matching
    
    -- Timeline
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    viewed_at DATETIME,
    shortlisted_at DATETIME,
    audition_at DATETIME,
    hired_at DATETIME,
    completed_at DATETIME,
    rejected_at DATETIME,
    rejection_reason TEXT,
    
    -- Compensation & Payment
    negotiated_fee REAL,
    currency TEXT DEFAULT 'IDR',
    contract_signed BOOLEAN DEFAULT FALSE,
    payment_status TEXT CHECK(payment_status IN ('pending', 'partial', 'completed', 'disputed')),
    
    -- Communication
    last_message_at DATETIME,
    client_notes TEXT,
    talent_notes TEXT,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (talent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Critical indexes untuk dashboard talent
CREATE INDEX idx_job_app_talent_status ON job_applications(talent_id, status);
CREATE INDEX idx_job_app_applied_at ON job_applications(applied_at DESC);
CREATE INDEX idx_job_app_project ON job_applications(project_id);
CREATE INDEX idx_job_app_match_percent ON job_applications(match_percentage DESC);

-- ============================================================================
-- Tabel: smart_match_log (Audit trail untuk AI recommendation)
-- ============================================================================
CREATE TABLE smart_match_log (
    id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    role_id TEXT,
    
    -- Matching Algorithm Details
    match_percentage REAL,
    hard_filters_passed BOOLEAN,
    hard_filters_failed_reason TEXT, -- e.g., "Age out of range"
    soft_filters_score REAL, -- 0-100
    
    -- Detailed Scoring Breakdown
    score_breakdown TEXT, -- JSON with each factor's contribution
    matching_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Algorithm Version
    algorithm_version TEXT DEFAULT 'v1.0',
    
    FOREIGN KEY (talent_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_match_log_talent ON smart_match_log(talent_id);
CREATE INDEX idx_match_log_timestamp ON smart_match_log(matching_timestamp DESC);
