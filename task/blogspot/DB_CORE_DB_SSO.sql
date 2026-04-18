// ==========================================
// DB_CORE = core_database
// ==========================================

CREATE TABLE _cf_KV (
    key TEXT PRIMARY KEY,
    value BLOB
) WITHOUT ROWID;

CREATE TABLE talents (
    id TEXT PRIMARY KEY,
    fullname TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE talent_profiles (
    id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL UNIQUE,
    age INTEGER,
    gender TEXT,
    domicile TEXT,
    phone TEXT,
    bio TEXT,
    height_cm INTEGER,
    weight_kg REAL,
    skin_tone TEXT,
    hair_color TEXT,
    eye_color TEXT,
    face_type TEXT,
    chest_cm INTEGER,
    waist_cm INTEGER,
    hip_cm INTEGER,
    social_media_json TEXT DEFAULT '{}',
    interested_in_json TEXT DEFAULT '[]',
    skills_json TEXT DEFAULT '[]',
    languages_json TEXT DEFAULT '[]',
    assets_json TEXT DEFAULT '{"youtube":[], "audio":[]}',
    specific_characteristics_json TEXT DEFAULT '[]',
    tattoos_json TEXT DEFAULT '[]',
    piercings_json TEXT DEFAULT '[]',
    comp_card_url TEXT,
    headshot_url TEXT,
    full_body_url TEXT,
    showreel_url TEXT,
    portfolio_photos TEXT,
    rate_daily_min REAL,
    rate_daily_max REAL,
    rate_project_min REAL,
    rate_project_max REAL,
    preferred_currency TEXT DEFAULT 'IDR',
    profile_completion_percent REAL DEFAULT 0,
    profile_quality_score REAL DEFAULT 0,
    is_available INTEGER DEFAULT 1,
    location_willing_to_travel INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    dob TEXT,
    side_view_url TEXT,
    FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE TABLE talent_credits (
    id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL,
    title TEXT NOT NULL,
    credit_type TEXT,
    role TEXT,
    year TEXT,
    company TEXT,
    description TEXT,
    photo_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE TABLE talent_additional_photos (
    id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE TABLE clients (
    client_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    logo_url TEXT,
    is_agency INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agency_invitations (
    invitation_id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    invite_link_token TEXT UNIQUE NOT NULL,
    created_by_user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    max_uses INTEGER DEFAULT -1,
    current_uses INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active'
);

CREATE TABLE agency_talents (
    agency_talent_id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    talent_id TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agency_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY(talent_id) REFERENCES talents(id) ON DELETE CASCADE,
    UNIQUE(agency_id, talent_id)
);

CREATE TABLE agency_bulk_submissions (
    id TEXT PRIMARY KEY,
    agencyId TEXT NOT NULL,
    projectId TEXT NOT NULL,
    totalTalents INTEGER DEFAULT 0,
    submittedTalents INTEGER DEFAULT 0,
    approvedCount INTEGER DEFAULT 0,
    rejectedCount INTEGER DEFAULT 0,
    totalProposedRevenue REAL DEFAULT 0,
    totalAgencyFee REAL DEFAULT 0,
    totalTalentPayment REAL DEFAULT 0,
    status TEXT DEFAULT 'submitted',
    createdAt INTEGER,
    submittedAt INTEGER,
    notes TEXT,
    submittedBy TEXT
);

CREATE TABLE bulk_submission_items (
    id TEXT PRIMARY KEY,
    batchId TEXT NOT NULL,
    talentId TEXT NOT NULL,
    agencyTalentId TEXT NOT NULL,
    roleName TEXT,
    roleId TEXT,
    matchPercentage REAL,
    matchBreakdown TEXT,
    serviceName TEXT,
    proposedAmount REAL,
    commissionPercent REAL,
    agencyFee REAL,
    talentPayment REAL,
    itemStatus TEXT DEFAULT 'pending',
    createdProjectTalentId TEXT,
    createdAt INTEGER,
    submittedAt INTEGER,
    FOREIGN KEY(batchId) REFERENCES agency_bulk_submissions(id) ON DELETE CASCADE
);

CREATE TABLE project_talents (
    booking_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    talent_id TEXT NOT NULL,
    agency_id TEXT,
    proposed_rate REAL,
    status TEXT DEFAULT 'shortlisted',
    created_at DATETIME,
    bulk_submission_item_id TEXT
);

CREATE TABLE client_shortlists (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    talent_id TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, talent_id)
);

CREATE TABLE talent_experiences (
    experience_id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT,
    year TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    project_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Draft',
    budget_total REAL DEFAULT 0,
    moodboards TEXT DEFAULT '[]',
    casting_form_fields TEXT DEFAULT '{}',
    is_casting_open INTEGER DEFAULT 0,
    casting_deadline DATETIME,
    banner_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_roles (
    role_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    role_name TEXT NOT NULL,
    quantity_needed INTEGER DEFAULT 1,
    budget_per_talent REAL DEFAULT 0,
    FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE inbox_threads (
    thread_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    talent_id TEXT NOT NULL,
    agency_id TEXT,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(project_id)
);

CREATE TABLE inbox_messages (
    message_id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    message_text TEXT NOT NULL,
    is_system_message INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(thread_id) REFERENCES inbox_threads(thread_id) ON DELETE CASCADE
);

CREATE TABLE project_bookings (
    booking_id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    talent_id TEXT NOT NULL,
    agreed_rate REAL NOT NULL,
    status TEXT DEFAULT 'pending_talent_approval',
    contract_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

// ==========================================
// DB_SSO = sso_database
// ==========================================

CREATE TABLE _cf_KV (
    key TEXT PRIMARY KEY,
    value BLOB
) WITHOUT ROWID;

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
    two_factor_method TEXT,
    client_type TEXT DEFAULT NULL
);

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



// ==========================================
// NEW ADD DB_CORE = core_database
// ==========================================

-- 1. Tabel Syarat Casting Proyek (Digunakan oleh algoritma Smart Match)
CREATE TABLE casting_requirements (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    required_gender TEXT,
    required_age_min INTEGER DEFAULT 0,
    required_age_max INTEGER DEFAULT 99,
    height_min_cm INTEGER DEFAULT 0,
    height_max_cm INTEGER DEFAULT 300,
    required_skills TEXT DEFAULT '[]',
    required_languages TEXT DEFAULT '[]',
    budget_min REAL DEFAULT 0,
    budget_max REAL DEFAULT 0,
    shoot_date_start DATETIME,
    shoot_date_end DATETIME,
    required_location_pref TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- 2. Tabel Rincian Finansial (Digunakan saat Agensi melakukan Bulk Submit)
CREATE TABLE financial_splits (
    split_id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    agency_fee REAL DEFAULT 0,
    talent_payment REAL DEFAULT 0,
    created_at INTEGER,
    FOREIGN KEY(booking_id) REFERENCES project_talents(booking_id) ON DELETE CASCADE
);

-- 3. Tabel Sesi Impersonation (Keamanan Agensi saat menyamar jadi Talent)
CREATE TABLE impersonation_sessions (
    id TEXT PRIMARY KEY,
    agencyId TEXT NOT NULL,
    talentId TEXT NOT NULL,
    tokenHash TEXT NOT NULL,
    createdAt INTEGER,
    expiresAt INTEGER,
    status TEXT DEFAULT 'active'
);

-- 4. Tabel Pembatasan Limit Impersonation (Rate Limit)
CREATE TABLE impersonation_rate_limit (
    id TEXT PRIMARY KEY, 
    agencyId TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    ipAddress TEXT
);

-- 5. Tabel Audit Log Impersonation (Jejak Rekam Agensi)
CREATE TABLE impersonation_audit_log (
    id TEXT PRIMARY KEY,
    agencyId TEXT NOT NULL,
    agencyUserId TEXT NOT NULL,
    talentId TEXT NOT NULL,
    action TEXT,
    reason TEXT,
    ipAddress TEXT,
    timestamp INTEGER
);

CREATE TABLE agency_invitations (
    invitation_id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    invite_link_token TEXT UNIQUE NOT NULL,
    created_by_user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    max_uses INTEGER DEFAULT -1,
    current_uses INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' -- (Bisa berisi: 'active', 'completed', 'revoked')
);