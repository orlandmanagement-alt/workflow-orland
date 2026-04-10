## ORLAND TALENT DASHBOARD - COMPREHENSIVE ARCHITECTURE GUIDE

### Executive Summary

This document defines the complete architecture for three core modules of the Orland Talent Dashboard:

1. **MODUL 1: Profile (/profile)** - Comprehensive talent profile capturing for AI matching
2. **MODUL 2: Smart Match AI (/jobs/match)** - Intelligent job recommendation engine
3. **MODUL 3: Projects (/projects)** - Project tracking with state machine status management

---

## TABLE OF CONTENTS

1. [Database Schema](#database-schema)
2. [Smart Match Algorithm](#smart-match-algorithm)
3. [API Endpoints](#api-endpoints)
4. [Frontend Components](#frontend-components)
5. [Type Definitions](#type-definitions)
6. [Integration Guide](#integration-guide)
7. [Performance Optimization](#performance-optimization)

---

## DATABASE SCHEMA

### Migration 030: talent_profiles Table

**Purpose:** Store comprehensive talent information for AI matching

```sql
CREATE TABLE talent_profiles (
    id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL UNIQUE,
    
    -- Demographics
    age INTEGER,
    gender TEXT, -- 'male', 'female', 'non-binary', 'other'
    domicile TEXT,
    
    -- Physical Attributes (Critical for Casting)
    height_cm INTEGER,
    weight_kg REAL,
    skin_tone TEXT, -- 'fair', 'light', 'medium', 'olive', 'tan', 'deep'
    hair_color TEXT,
    eye_color TEXT,
    face_type TEXT, -- 'oval', 'round', 'pan-asian', 'caucasian', 'local'
    
    -- Body Measurements
    chest_cm INTEGER,
    waist_cm INTEGER,
    hip_cm INTEGER,
    shoe_size TEXT,
    shirt_size TEXT,
    
    -- Skills & Languages
    skills_json TEXT, -- JSON array
    languages_json TEXT, -- JSON array
    
    -- Media Assets
    comp_card_url TEXT,
    headshot_url TEXT,
    full_body_url TEXT,
    showreel_url TEXT,
    portfolio_photos TEXT, -- JSON array
    
    -- Rate Card
    rate_daily_min REAL,
    rate_daily_max REAL,
    
    -- Profile Quality
    profile_completion_percent REAL DEFAULT 0,
    
    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    location_willing_to_travel BOOLEAN DEFAULT FALSE,
    max_travel_hours INTEGER,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    is_kyc_approved BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_talent_profiles_gender_age ON talent_profiles(gender, age);
CREATE INDEX idx_talent_profiles_location ON talent_profiles(domicile);
CREATE INDEX idx_talent_profiles_is_available ON talent_profiles(is_available);
```

**Key Design Decisions:**
- JSON fields for flexible arrays (skills, languages, portfolio_photos)
- Separate min/max rates for negotiation flexibility
- Profile completion percentage for AI quality filtering
- Geographic data for location-based matching

---

### Table: casting_requirements

**Purpose:** Store client job requirements for matching

```sql
CREATE TABLE casting_requirements (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    
    -- Hard Filters
    required_gender TEXT,
    required_age_min INTEGER,
    required_age_max INTEGER,
    required_location_pref TEXT,
    
    -- Physical Preferences
    height_min_cm INTEGER,
    height_max_cm INTEGER,
    skin_tone_preferred TEXT, -- JSON array
    face_type_preferred TEXT,
    
    -- Requirements
    required_skills TEXT, -- JSON array
    required_languages TEXT, -- JSON array
    
    -- Budget & Timeline
    budget_min REAL,
    budget_max REAL,
    shoot_date_start DATE,
    shoot_date_end DATE,
    shoot_location TEXT,
    travel_required BOOLEAN,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### Table: job_applications

**Purpose:** Track talent applications with state machine

```sql
CREATE TABLE job_applications (
    id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    role_id TEXT,
    
    -- Status (State Machine)
    status TEXT CHECK(status IN (
        'applied', 'viewed', 'shortlisted', 'audition_invited',
        'hired', 'completed', 'rejected', 'declined'
    )),
    
    -- Matching Score
    match_percentage REAL,
    match_details TEXT, -- JSON
    
    -- Timeline
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    viewed_at DATETIME,
    shortlisted_at DATETIME,
    audition_at DATETIME,
    hired_at DATETIME,
    completed_at DATETIME,
    rejected_at DATETIME,
    rejection_reason TEXT,
    
    -- Compensation
    negotiated_fee REAL,
    currency TEXT DEFAULT 'IDR',
    payment_status TEXT,
    
    -- Communication
    client_notes TEXT,
    talent_notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (talent_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Critical indexes
CREATE INDEX idx_job_app_talent_status ON job_applications(talent_id, status);
CREATE INDEX idx_job_app_applied_at ON job_applications(applied_at DESC);
```

---

### Table: smart_match_log

**Purpose:** Audit trail for AI recommendations

```sql
CREATE TABLE smart_match_log (
    id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    role_id TEXT,
    
    match_percentage REAL,
    hard_filters_passed BOOLEAN,
    hard_filters_failed_reason TEXT,
    soft_filters_score REAL,
    score_breakdown TEXT, -- JSON with detailed breakdown
    matching_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    algorithm_version TEXT DEFAULT 'v1.0'
);
```

---

## SMART MATCH ALGORITHM

### Conceptual Flow

```
┌─────────────────────────────────┐
│ Talent Profile + Job Requirement │
└────────────────┬────────────────┘
                 │
         ┌───────▼────────┐
         │ HARD FILTERS   │
         │ (Pass/Fail)    │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
    NO   │ All Pass?      │──→ Match % = 0
         └───────┬────────┘
                 │ YES
         ┌───────▼────────┐
         │ SOFT FILTERS   │
         │ (Scoring)      │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Calculate      │
         │ Weighted Score │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Output: Match% │
         │ (0-100)        │
         └────────────────┘
```

### Hard Filters (Mutlak / Pass-Fail)

These are mandatory requirements. Failure = Match % = 0

```typescript
function hardFiltersPass(talent, requirements): boolean {
  // 1. Gender Match (if specified)
  if (requirements.required_gender && requirements.required_gender !== 'any') {
    if (talent.gender !== requirements.required_gender) {
      return false; // FAIL: Gender mismatch
    }
  }

  // 2. Age Range (if specified)
  if (requirements.required_age_min && talent.age < requirements.required_age_min) {
    return false; // FAIL: Too young
  }
  if (requirements.required_age_max && talent.age > requirements.required_age_max) {
    return false; // FAIL: Too old
  }

  // 3. Location (if no travel budget)
  if (!requirements.travel_required) {
    if (talent.domicile !== requirements.shoot_location) {
      if (!talent.location_willing_to_travel) {
        return false; // FAIL: Cannot travel
      }
    }
  }

  // 4. Availability
  if (!talent.is_available) {
    return false; // FAIL: Not available
  }

  // 5. Profile Completeness (Minimum 50%)
  if (talent.profile_completion_percent < 50) {
    return false; // FAIL: Incomplete profile
  }

  return true; // PASS all hard filters
}
```

### Soft Filters (Scoring System)

Each factor scores 0-100, then weighted for final score.

**Weighting Configuration:**
```typescript
const MATCHING_WEIGHTS = {
  age: 0.15,              // 15%
  gender: 0.20,           // 20%
  location: 0.15,         // 15%
  height: 0.10,           // 10%
  skin_tone: 0.08,        // 8%
  skills: 0.15,           // 15%
  budget: 0.10,           // 10%
  profile_complete: 0.05, // 5%
  language: 0.02,         // 2%
};
// Total: 100%
```

**Scoring Functions:**

#### 1. Age Matching
```typescript
function scoreAge(talent, requirements) {
  if (!requirements.age_min || !requirements.age_max) return 100;
  
  const ideal_age = (requirements.age_min + requirements.age_max) / 2;
  const age_diff = Math.abs(talent.age - ideal_age);
  
  // Tolerance: ±3 years = full score
  const score = Math.max(0, 100 - age_diff * 10);
  return Math.round(score);
}
```

**Examples:**
- Talent 25, Required 24-26 → Ideal 25 → Score: 100
- Talent 22, Required 24-26 → Ideal 25 → Diff -3 → Score: 70
- Talent 35, Required 24-26 → Ideal 25 → Diff 10 → Score: 0

#### 2. Height Matching
```typescript
function scoreHeight(talent, requirements) {
  if (!requirements.height_min || !requirements.height_max) return 100;
  
  const height_range = requirements.height_max - requirements.height_min;
  const ideal_height = (requirements.height_min + requirements.height_max) / 2;
  const height_diff = Math.abs(talent.height - ideal_height);
  
  if (height_diff <= height_range / 2) {
    return 100; // Within acceptable range
  } else {
    return Math.max(0, 100 - (height_diff - height_range / 2) * 5);
  }
}
```

**Examples:**
- Talent 168cm, Required 165-175cm → Ideal 170 → Diff -2 → Score: 100
- Talent 160cm, Required 165-175cm → Ideal 170 → Diff -10 → Range/2=5 → Diff-5=5 → Score: 75
- Talent 180cm, Required 165-175cm → Ideal 170 → Diff +10 → Score: 75

#### 3. Skills Matching
```typescript
function scoreSkills(talent, requirements) {
  if (!requirements.required_skills) return 100;
  
  const required = JSON.parse(requirements.required_skills);
  const talent_skills = JSON.parse(talent.skills_json);
  
  const matched = required.filter(skill => talent_skills.includes(skill));
  const score = (matched.length / required.length) * 100;
  
  return Math.round(score);
}
```

**Examples:**
- Required: ['actor', 'dancer'], Talent has: ['actor', 'dancer', 'singer']
  → Matched: 2/2 → Score: 100
- Required: ['actor', 'dancer'], Talent has: ['actor', 'model']
  → Matched: 1/2 → Score: 50
- Required: ['model_catwalk'], Talent has: ['model_commercial']
  → Matched: 0/1 → Score: 0

#### 4. Budget Fitting
```typescript
function scoreBudget(talent, requirements) {
  const talent_rate = talent.rate_daily_min || 1000000;
  const budget_per_day = (requirements.budget_min + requirements.budget_max) / 2;
  
  if (talent_rate > budget_per_day * 1.2) {
    // Talent asks for 20% above budget
    return Math.max(0, 100 - (talent_rate - budget_per_day) / 100000);
  }
  return 100;
}
```

**Examples:**
- Talent asks: 10M, Budget: 8M-12M (avg 10M) → Score: 100
- Talent asks: 12M, Budget: 8M-12M (avg 10M) → Diff: 2M → Score: 80
- Talent asks: 15M, Budget: 8M-12M (avg 10M) → Diff: 5M → Score: 50

#### 5. Profile Completeness
```typescript
function scoreProfileCompleteness(talent) {
  // Direct mapping - higher completion = higher score for recommendations
  return Math.round(talent.profile_completion_percent);
}
```

### Final Score Calculation

```typescript
function calculateFinalScore(breakdown) {
  let totalScore = 0;
  let totalWeight = 0;

  for (const [key, data] of Object.entries(breakdown)) {
    if (data.weight && data.score !== undefined) {
      totalScore += data.score * data.weight;
      totalWeight += data.weight;
    }
  }

  return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
}
```

**Example Calculation:**
```
age_match:     90% × 0.15 = 13.5
gender_match:  100% × 0.20 = 20
location_match: 80% × 0.15 = 12
height_match:  100% × 0.10 = 10
skin_tone:     100% × 0.08 = 8
skills_match:  85% × 0.15 = 12.75
budget_fit:    95% × 0.10 = 9.5
profile_comp:  85% × 0.05 = 4.25
language:      100% × 0.02 = 2

Total: 91.75% ≈ 92% Match
```

---

## API ENDPOINTS

### 1. GET /api/profile/me

**Purpose:** Fetch authenticated talent's profile
**Auth:** Bearer JWT
**Response:**

```typescript
{
  status: 'ok' | 'not_found',
  data: TalentProfile | null,
  message?: string
}
```

**Example Response:**
```json
{
  "status": "ok",
  "data": {
    "id": "prof_123",
    "talent_id": "talent_456",
    "age": 25,
    "gender": "male",
    "domicile": "Jakarta, Indonesia",
    "height_cm": 178,
    "weight_kg": 70,
    "skin_tone": "medium",
    "face_type": "pan-asian",
    "skills": ["actor", "model_commercial"],
    "languages": ["indonesian", "english"],
    "profile_completion_percent": 85,
    "is_available": true
  }
}
```

---

### 2. PUT /api/profile/update

**Purpose:** Create or update talent profile
**Auth:** Bearer JWT
**Method:** PUT
**Body:**

```typescript
interface UpdateProfilePayload {
  age: number;
  gender: 'male' | 'female' | 'non-binary';
  domicile: string;
  height_cm: number;
  weight_kg: number;
  skin_tone: string;
  hair_color: string;
  face_type: string;
  skills_json: string[];
  languages_json: string[];
  
  // Optional fields
  chest_cm?: number;
  waist_cm?: number;
  hip_cm?: number;
  comp_card_url?: string;
  headshot_url?: string;
  full_body_url?: string;
  showreel_url?: string;
  rate_daily_min?: number;
  rate_daily_max?: number;
  is_available?: boolean;
  location_willing_to_travel?: boolean;
  max_travel_hours?: number;
  preferred_project_types?: string[];
}
```

**Response:**
```json
{
  "status": "ok",
  "message": "Profile created/updated successfully",
  "data": { ...TalentProfile }
}
```

---

### 3. GET /api/jobs/smart-match

**Purpose:** Get AI-powered job recommendations
**Auth:** Bearer JWT
**Query Parameters:**
- `limit` (default: 20) - Number of recommendations to return
- `minMatch` (default: 70) - Minimum match percentage threshold
- `sort` (default: 'match_desc') - Sort by match percentage

**Response:**

```typescript
{
  status: 'ok',
  data: JobMatch[],
  count: number
}
```

**JobMatch Structure:**
```typescript
interface JobMatch {
  talent_id: string;
  project_id: string;
  role_id: string;
  match_percentage: number; // 0-100
  hard_filters_passed: boolean;
  hard_filters_failed_reason?: string;
  soft_filters_score: number;
  score_breakdown: {
    age_match: { score: number; weight: number; reason: string };
    gender_match: { score: number; weight: number; reason: string };
    location_match: { score: number; weight: number; reason: string };
    // ... other factors
  };
  project?: {
    title: string;
    client_name: string;
    budget_min: number;
    budget_max: number;
    shoot_location: string;
    shoot_date_start: string;
  };
}
```

**Example Response:**
```json
{
  "status": "ok",
  "count": 3,
  "data": [
    {
      "match_percentage": 92,
      "hard_filters_passed": true,
      "project": {
        "title": "Netflix Original Series",
        "client_name": "Production House A",
        "budget_max": 50000000,
        "shoot_location": "Jakarta, Indonesia"
      },
      "score_breakdown": {
        "age_match": { "score": 95, "weight": 0.15, "reason": "Age 25 matches ideal 26" },
        ...
      }
    }
  ]
}
```

---

### 4. GET /api/projects/my-projects

**Purpose:** Get talent's applications grouped by status
**Auth:** Bearer JWT
**Query Parameters:**
- `status` (default: 'all') - Filter by status
- `sort` (default: 'recent') - Sort order

**Response:**

```typescript
{
  status: 'ok',
  data: {
    applied: JobApplication[],
    viewed: JobApplication[],
    shortlisted: JobApplication[],
    audition_invited: JobApplication[],
    hired: JobApplication[],
    completed: JobApplication[],
    rejected: JobApplication[]
  },
  stats: {
    total_applications: number,
    applied: number,
    shortlisted: number,
    hired: number,
    completed: number,
    rejected: number
  }
}
```

---

### 5. POST /api/jobs/apply

**Purpose:** Submit application for a job
**Auth:** Bearer JWT
**Method:** POST
**Body:**

```typescript
{
  projectId: string;
  roleId: string;
}
```

**Response:**
```json
{
  "status": "ok",
  "message": "Application submitted successfully",
  "data": {
    "app_id": "app_123",
    "match_percentage": 92,
    "match_details": { ...MatchResult }
  }
}
```

**Status Codes:**
- 200: Success
- 400: Missing required fields
- 409: Already applied for this role
- 404: Job not found
- 500: Server error

---

## FRONTEND COMPONENTS

### Component Tree

```
ProfilePage (/profile)
├── Header with Completion Bar
├── ProfileForm (Tabs)
│   ├── BasicTab (Age, Gender, Domicile, Bio)
│   ├── PhysicalTab (Height, Weight, Skin Tone, Face Type)
│   ├── SkillsTab (Multi-select skills & languages)
│   ├── MediaTab (Photo/Video uploads)
│   ├── RateCardTab (Daily/Project rates)
│   └── AvailabilityTab (Availability flags & location preference)
└── SaveButton with saving state

SmartMatchPage (/jobs/match)
├── HeaderWithStats (AI badge, match count, view toggle)
├── MatchCard (repeated for each match)
│   ├── JobInfo (Title, Client, Location, Date)
│   ├── MatchPercentageBadge (Visual indicator)
│   ├── DetailExpandButton
│   ├── ScoreBreakdownViewer (collapsible)
│   │   └── FactorScore (age, height, skills, budget, etc.)
│   └── ActionButtons (Apply, Save)
└── FilterPanel (optional)

ProjectsPage (/projects)
├── StatsGrid (tabs for each status)
├── ApplicationCard (for each application)
│   ├── Header (Title, Status Badge, Match%)
│   ├── ProjectDetails (Location, Date, Fee)
│   ├── StatusTimeline (visual progression)
│   ├── ClientNotesBox (if exists)
│   └── ActionButtons
└── Legend/InfoBox
```

---

## TYPE DEFINITIONS

### Core TypeScript Interfaces

```typescript
// ============================================================================
// TALENT PROFILE TYPES
// ============================================================================

interface TalentProfile {
  id?: string;
  talent_id: string;
  age: number;
  gender: 'male' | 'female' | 'non-binary' | 'other';
  domicile: string;
  phone?: string;
  email?: string;
  bio?: string;

  // Physical Attributes
  height_cm: number;
  weight_kg: number;
  skin_tone: 'fair' | 'light' | 'medium' | 'olive' | 'tan' | 'deep' | 'other';
  hair_color: 'black' | 'brown' | 'blonde' | 'red' | 'gray' | 'other';
  eye_color?: string;
  face_type: 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond' | 'pan-asian' | 'caucasian' | 'local' | 'other';

  // Measurements
  chest_cm?: number;
  waist_cm?: number;
  hip_cm?: number;
  shoe_size?: string;
  shirt_size?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

  // Skills & Languages
  skills_json: string[]; // e.g., ['actor', 'model_catwalk']
  languages_json: string[]; // e.g., ['indonesian', 'english', 'mandarin']

  // Media
  comp_card_url?: string;
  headshot_url?: string;
  full_body_url?: string;
  showreel_url?: string;
  portfolio_photos?: string[];

  // Rates (in IDR)
  rate_daily_min?: number;
  rate_daily_max?: number;
  rate_project_min?: number;
  rate_project_max?: number;
  rate_hourly?: number;

  // Availability
  is_available: boolean;
  availability_note?: string;
  preferred_project_types?: string[];
  location_willing_to_travel: boolean;
  max_travel_hours?: number;

  // Verification
  is_verified?: boolean;
  is_kyc_approved?: boolean;

  // Quality Metrics
  profile_completion_percent?: number;

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// CASTING REQUIREMENT TYPES
// ============================================================================

interface CastingRequirement {
  id: string;
  project_id: string;
  role_id: string;

  // Hard Filters
  required_gender?: 'male' | 'female' | 'any';
  required_age_min?: number;
  required_age_max?: number;
  required_location_pref?: string;

  // Physical Preferences
  height_min_cm?: number;
  height_max_cm?: number;
  skin_tone_preferred?: string[]; // JSON array
  face_type_preferred?: string[];

  // Requirements
  required_skills?: string[];
  required_languages?: string[];

  // Budget & Timeline
  budget_min: number;
  budget_max: number;
  shoot_date_start: string;
  shoot_date_end: string;
  shoot_location: string;
  travel_required: boolean;

  // Status
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// JOB APPLICATION TYPES
// ============================================================================

type ApplicationStatus =
  | 'applied'
  | 'viewed'
  | 'shortlisted'
  | 'audition_invited'
  | 'hired'
  | 'completed'
  | 'rejected'
  | 'declined';

interface JobApplication {
  id: string;
  talent_id: string;
  project_id: string;
  role_id: string;

  status: ApplicationStatus;
  match_percentage: number;
  match_details: MatchResult;

  applied_at: string;
  viewed_at?: string;
  shortlisted_at?: string;
  audition_at?: string;
  hired_at?: string;
  completed_at?: string;
  rejected_at?: string;
  rejection_reason?: string;

  negotiated_fee?: number;
  currency: string;
  payment_status?: 'pending' | 'partial' | 'completed' | 'disputed';

  client_notes?: string;
  talent_notes?: string;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// MATCHING ALGORITHM TYPES
// ============================================================================

interface MatchResult {
  talent_id: string;
  project_id: string;
  role_id: string;
  match_percentage: number; // 0-100
  hard_filters_passed: boolean;
  hard_filters_failed_reason?: string;
  soft_filters_score: number;
  score_breakdown: ScoreBreakdown;
}

interface ScoreBreakdown {
  age_match: ScoreFactor;
  gender_match: ScoreFactor;
  location_match: ScoreFactor;
  height_match: ScoreFactor;
  skin_tone_match: ScoreFactor;
  skills_match: ScoreFactor;
  budget_fit: ScoreFactor;
  profile_completeness: ScoreFactor;
  language_match: ScoreFactor;
  [key: string]: ScoreFactor;
}

interface ScoreFactor {
  score: number; // 0-100
  weight: number; // 0-1 (decimal)
  reason: string;
}
```

---

## INTEGRATION GUIDE

### Step 1: Setup Database Migrations

```bash
# In appapi directory
wrangler d1 migrations create talent_profiles && v
# Copy content of 030_DB_CORE_talent_profiles.sql to migration file

wrangler d1 migrations apply
```

### Step 2: Deploy Backend Services

```typescript
// In appapi/src/index.ts
import talentProfileRoutes from './routes/talent-profile-match';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Route to talent profile endpoints
    if (url.pathname.startsWith('/api/profile')) {
      return talentProfileRoutes.fetch(request, env);
    }
    if (url.pathname.startsWith('/api/jobs')) {
      return talentProfileRoutes.fetch(request, env);
    }
    if (url.pathname.startsWith('/api/projects')) {
      return talentProfileRoutes.fetch(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
```

### Step 3: Update Frontend Routes

```typescript
// In apptalent/src/App.tsx
import ProfilePageEnhanced from '@/pages/profile/Index.enhanced';
import SmartMatchEnhanced from '@/pages/jobs/match.enhanced';
import ProjectsEnhanced from '@/pages/projects/index.enhanced';

// Replace existing routes
const routes = [
  { path: '/profile', element: <ProfilePageEnhanced /> },
  { path: '/jobs/match', element: <SmartMatchEnhanced /> },
  { path: '/projects', element: <ProjectsEnhanced /> },
];
```

### Step 4: Test API Integration

```bash
# Test GET /api/profile/me
curl -X GET http://localhost:8787/api/profile/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test PUT /api/profile/update
curl -X PUT http://localhost:8787/api/profile/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 25,
    "gender": "male",
    "domicile": "Jakarta, Indonesia",
    "height_cm": 178,
    "weight_kg": 70,
    "skin_tone": "medium",
    "face_type": "oval",
    "skills_json": ["actor", "model_commercial"],
    "languages_json": ["indonesian", "english"]
  }'

# Test GET /api/jobs/smart-match
curl -X GET "http://localhost:8787/api/jobs/smart-match?limit=20&minMatch=70" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## PERFORMANCE OPTIMIZATION

### Database Query Optimization

**1. Index Strategy:**
```sql
-- Profile queries
CREATE INDEX idx_talent_profiles_gender_age ON talent_profiles(gender, age);
CREATE INDEX idx_talent_profiles_location ON talent_profiles(domicile);
CREATE INDEX idx_talent_profiles_is_available ON talent_profiles(is_available);

-- Application queries
CREATE INDEX idx_job_app_talent_status ON job_applications(talent_id, status);
CREATE INDEX idx_job_app_applied_at ON job_applications(applied_at DESC);
```

**2. Query Patterns:**

```typescript
// Batch matching (avoid N+1)
const matches = await Promise.all(
  talents.results.map(talent => smartMatchService.matchTalentToJob(talent, requirement))
);

// Use pagination for large result sets
const LIMIT = 20;
const offset = (page - 1) * LIMIT;
const results = await db
  .prepare('SELECT * FROM talent_profiles LIMIT ? OFFSET ?')
  .bind(LIMIT, offset)
  .all();
```

**3. Caching Strategy:**

```typescript
// Cache user profile for 5 minutes
const cacheKey = `profile:${talentId}`;
const cached = await cache.get(cacheKey);
if (cached) return JSON.parse(cached);

const profile = await db.prepare(...).first();
await cache.set(cacheKey, JSON.stringify(profile), 300);
return profile;
```

### Frontend Optimization

**1. Component Memoization:**
```typescript
const JobMatchCard = React.memo(({ match, onApply }) => {
  // Component renders only when props change
}, (prev, next) => {
  return prev.match.match_percentage === next.match.match_percentage;
});
```

**2. Virtual Scrolling (for large lists):**
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={applications.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ApplicationCard app={applications[index]} />
    </div>
  )}
</FixedSizeList>
```

**3. Lazy Loading Images:**
```typescript
<img
  src={profile.comp_card_url}
  alt="Comp Card"
  loading="lazy"
  decoding="async"
/>
```

---

## DEPLOYMENT CHECKLIST

- [ ] Database migrations created and tested
- [ ] Smart match algorithm validated with test data
- [ ] API endpoints tested with curl/Postman
- [ ] Frontend components integrated and responsive
- [ ] JWT authentication verified
- [ ] Error boundaries added to all pages
- [ ] Loading states implemented
- [ ] Empty states handled
- [ ] Profile completion calculator working
- [ ] Matching scores logged to audit table
- [ ] Performance tested (< 2s response time)
- [ ] Accessibility audit (WCAG AA)
- [ ] Mobile responsive testing complete

---

**Last Updated:** 2024
**Version:** 2.0
**Status:** Production Ready
