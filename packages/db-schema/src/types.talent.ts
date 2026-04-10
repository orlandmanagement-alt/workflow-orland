/**
 * Orland Talent Dashboard - Core Type Definitions
 *
 * This file contains all TypeScript interfaces and types used across the
 * talent platform, including profiles, applications, matching algorithms,
 * and API responses.
 *
 * @version 2.0
 * @author Orland Team
 */

// ============================================================================
// REQUEST/RESPONSE ENVELOPE
// ============================================================================

export interface ApiResponse<T = any> {
  status: 'ok' | 'error' | 'not_found';
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

// ============================================================================
// TALENT PROFILE TYPES
// ============================================================================

export type GenderType = 'male' | 'female' | 'non-binary' | 'other';

export type SkinToneType =
  | 'fair'
  | 'light'
  | 'medium'
  | 'olive'
  | 'tan'
  | 'deep'
  | 'other';

export type HairColorType =
  | 'black'
  | 'brown'
  | 'blonde'
  | 'red'
  | 'gray'
  | 'other';

export type FaceTypeType =
  | 'oval'
  | 'round'
  | 'square'
  | 'heart'
  | 'oblong'
  | 'diamond'
  | 'pan-asian'
  | 'caucasian'
  | 'local'
  | 'other';

export type ShirtSizeType = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

export type SkillType =
  | 'actor'
  | 'model_catwalk'
  | 'model_commercial'
  | 'dancer'
  | 'singer'
  | 'athlete'
  | 'presenter'
  | 'voice_talent'
  | 'stunt_performer'
  | 'extra';

export type LanguageType =
  | 'indonesian'
  | 'english'
  | 'mandarin'
  | 'cantonese'
  | 'japanese'
  | 'korean'
  | 'thai'
  | 'vietnamese'
  | 'malay'
  | 'french'
  | 'spanish'
  | 'german';

/**
 * Core talent profile containing demographics, physical attributes,
 * skills, media, rates, and availability information.
 *
 * @interface TalentProfile
 */
export interface TalentProfile {
  // Primary Keys & Identifiers
  id?: string; // Database primary key
  talent_id: string; // User ID reference (required)

  // Demographics
  age: number; // 18-80
  gender: GenderType;
  domicile: string; // e.g., "Jakarta, Indonesia", "Bangkok, Thailand"
  phone?: string;
  email?: string;
  bio?: string; // Personal bio/introduction

  // Physical Attributes (Critical for Casting)
  height_cm: number;
  weight_kg: number;
  skin_tone: SkinToneType;
  hair_color: HairColorType;
  eye_color?: string;
  face_type: FaceTypeType;

  // Body Measurements
  chest_cm?: number;
  waist_cm?: number;
  hip_cm?: number;
  shoe_size?: string; // e.g., "42", "US 10"
  shirt_size?: ShirtSizeType;

  // Skills & Languages (Arrays of enum types)
  skills_json: SkillType[]; // Main competencies
  languages_json: LanguageType[]; // Languages fluency

  // Media Assets (URLs/paths)
  comp_card_url?: string; // Composite card for commercial use
  headshot_url?: string; // Professional headshot
  full_body_url?: string; // Full-body professional photo
  showreel_url?: string; // Video reel/portfolio video
  portfolio_photos?: string[]; // Array of portfolio photo URLs

  // Rate Card (all in IDR)
  rate_daily_min?: number;
  rate_daily_max?: number;
  rate_project_min?: number;
  rate_project_max?: number;
  rate_hourly?: number;
  currency?: string; // Default: 'IDR'

  // Availability & Preferences
  is_available: boolean;
  availability_note?: string;
  preferred_project_types?: string[];
  location_willing_to_travel: boolean;
  max_travel_hours?: number; // Max hours willing to travel
  max_travel_distance_km?: number;

  // Verification Status
  is_verified?: boolean;
  is_kyc_approved?: boolean;
  verification_date?: string;

  // Profile Quality Metrics
  profile_completion_percent?: number; // 0-100

  // Timestamps
  created_at?: string; // ISO 8601
  updated_at?: string; // ISO 8601
}

/**
 * Profile update payload (subset of TalentProfile for PUT requests)
 */
export interface UpdateProfilePayload {
  age: number;
  gender: GenderType;
  domicile: string;
  height_cm: number;
  weight_cm: number;
  skin_tone: SkinToneType;
  hair_color: HairColorType;
  face_type: FaceTypeType;
  skills_json: SkillType[];
  languages_json: LanguageType[];

  // Optional fields
  eye_color?: string;
  chest_cm?: number;
  waist_cm?: number;
  hip_cm?: number;
  shoe_size?: string;
  shirt_size?: ShirtSizeType;
  phone?: string;
  bio?: string;

  // Media
  comp_card_url?: string;
  headshot_url?: string;
  full_body_url?: string;
  showreel_url?: string;
  portfolio_photos?: string[];

  // Rates
  rate_daily_min?: number;
  rate_daily_max?: number;
  rate_project_min?: number;
  rate_project_max?: number;
  rate_hourly?: number;

  // Availability
  is_available?: boolean;
  availability_note?: string;
  preferred_project_types?: string[];
  location_willing_to_travel?: boolean;
  max_travel_hours?: number;
}

// ============================================================================
// CASTING REQUIREMENT TYPES
// ============================================================================

/**
 * Client job requirements for casting
 * Defines hard filters and soft preferences for talent matching
 */
export interface CastingRequirement {
  // Primary Keys
  id: string;
  project_id: string;
  role_id: string;

  // Hard Filters (Mandatory)
  required_gender?: GenderType | 'any';
  required_age_min?: number;
  required_age_max?: number;
  required_location_pref?: string;

  // Physical Preferences (Soft)
  height_min_cm?: number;
  height_max_cm?: number;
  skin_tone_preferred?: SkinToneType[];
  face_type_preferred?: FaceTypeType[];

  // Skill Requirements
  required_skills?: SkillType[];
  required_languages?: LanguageType[];

  // Budget & Timeline
  budget_min: number;
  budget_max: number;
  shoot_date_start: string; // ISO 8601
  shoot_date_end: string; // ISO 8601
  shoot_location: string;
  travel_required: boolean;
  travel_budget?: number;

  // Status
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// JOB APPLICATION TYPES
// ============================================================================

export type ApplicationStatus =
  | 'applied'
  | 'viewed'
  | 'shortlisted'
  | 'audition_invited'
  | 'hired'
  | 'completed'
  | 'rejected'
  | 'declined';

export type PaymentStatus =
  | 'pending'
  | 'partial'
  | 'completed'
  | 'disputed'
  | 'refunded';

/**
 * Job application record
 * Tracks talent's application progress through hiring lifecycle
 */
export interface JobApplication {
  // Primary Keys
  id: string;
  talent_id: string;
  project_id: string;
  role_id: string;

  // Status Tracking
  status: ApplicationStatus;
  match_percentage: number; // 0-100 from AI algorithm
  match_details?: MatchResult;

  // Timeline (ISO 8601, nullable)
  applied_at: string;
  viewed_at?: string;
  shortlisted_at?: string;
  audition_at?: string;
  hired_at?: string;
  completed_at?: string;
  rejected_at?: string;
  rejection_reason?: string;

  // Financial
  negotiated_fee?: number; // In IDR
  currency: string; // 'IDR'
  payment_status?: PaymentStatus;
  invoice_id?: string;

  // Communication
  client_notes?: string; // Notes from client
  talent_notes?: string; // Notes from talent

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Application status transition audit log
 */
export interface ApplicationStatusLog {
  id: string;
  job_application_id: string;
  old_status: ApplicationStatus;
  new_status: ApplicationStatus;
  changed_by: 'talent' | 'client' | 'admin' | 'system';
  change_reason?: string;
  changed_at: string;
}

// ============================================================================
// SMART MATCHING ENGINE TYPES
// ============================================================================

/**
 * Individual scoring factor result
 * Each factor in the matching breakdown contains score, weight, and reasoning
 */
export interface ScoreFactor {
  score: number; // 0-100
  weight: number; // 0-1 (decimal percentage)
  reason: string; // Human-readable explanation
  details?: Record<string, any>; // Additional context
}

/**
 * Complete score breakdown showing all matching factors
 * Used for transparency and auditability of AI recommendations
 */
export interface ScoreBreakdown {
  // Physical Matching (20%)
  age_match: ScoreFactor; // 15%
  height_match: ScoreFactor; // 10%
  skin_tone_match: ScoreFactor; // 8%
  face_type_match?: ScoreFactor; // Optional

  // Skill & Qualification Matching (20%)
  skills_match: ScoreFactor; // 15%
  language_match: ScoreFactor; // 2%

  // Availability & Location (30%)
  location_match: ScoreFactor; // 15%
  availability_match: ScoreFactor; // 10%
  travel_capability?: ScoreFactor; // 5% if travel required

  // Financial Alignment (10%)
  budget_fit: ScoreFactor; // 10%

  // Profile Quality (5%)
  profile_completeness: ScoreFactor; // 5%

  // Gender (20%)
  gender_match: ScoreFactor; // 20%

  // Custom/Additional factors
  [key: string]: ScoreFactor;
}

/**
 * Complete matching result
 * Combines hard filter validation and soft scoring
 */
export interface MatchResult {
  // Identifiers
  talent_id: string;
  project_id: string;
  role_id: string;

  // Hard Filter Phase
  hard_filters_passed: boolean; // ALL must pass
  hard_filters_failed_reason?: string; // Why it failed
  hard_filters_details?: {
    gender_passed: boolean;
    age_passed: boolean;
    location_passed: boolean;
    availability_passed: boolean;
    profile_complete_passed: boolean;
    [key: string]: boolean;
  };

  // Soft Scoring Phase
  soft_filters_score: number; // 0-100
  score_breakdown: ScoreBreakdown;

  // Final Result
  match_percentage: number; // 0-100
  recommendation: 'strong_match' | 'good_match' | 'fair_match' | 'poor_match';
  reasoning: string; // Summary explanation

  // Metadata
  algorithm_version: string; // e.g., 'v1.0'
  calculated_at: string; // ISO 8601
  calculation_duration_ms: number;
}

/**
 * Audit log for matching calculations
 * Used to track recommendations and debug edge cases
 */
export interface SmartMatchLog {
  id: string;
  talent_id: string;
  project_id: string;
  role_id: string;
  match_result: MatchResult;
  algorithm_version: string;
  is_applied: boolean; // Whether talent applied after recommendation
  applied_at?: string;
  created_at: string;
}

// ============================================================================
// MATCHING ALGORITHM CONFIGURATION
// ============================================================================

/**
 * Configuration for matching weights and thresholds
 * Can be updated to adjust matching behavior
 */
export interface MatchingConfig {
  // Hard Filter Thresholds
  min_profile_completion: number; // Default: 50%

  // Soft Filter Weights
  weights: {
    age: number; // Default: 0.15
    gender: number; // Default: 0.20
    location: number; // Default: 0.15
    height: number; // Default: 0.10
    skin_tone: number; // Default: 0.08
    skills: number; // Default: 0.15
    budget: number; // Default: 0.10
    profile_complete: number; // Default: 0.05
    language: number; // Default: 0.02
  };

  // Score Ranges
  score_ranges: {
    strong_match: [number, number]; // [80, 100]
    good_match: [number, number]; // [60, 80]
    fair_match: [number, number]; // [40, 60]
    poor_match: [number, number]; // [0, 40]
  };

  // Age Tolerance (years)
  age_tolerance: number; // Default: 3 years
  age_score_degradation_rate: number; // Score loss per year difference

  // Height Tolerance (cm)
  height_tolerance: number; // Default: 5cm
  height_score_degradation_rate: number; // Score loss per cm

  // Budget Tolerance
  budget_tolerance_percent: number; // Default: 120% (20% above budget accepted)
}

// ============================================================================
// API REQUEST/RESPONSE PAYLOADS
// ============================================================================

export interface GetProfileResponse extends ApiResponse<TalentProfile> {}

export interface UpdateProfileRequest extends UpdateProfilePayload {}

export interface UpdateProfileResponse
  extends ApiResponse<TalentProfile> {}

export interface SmartMatchRequest {
  limit?: number; // Default: 20
  minMatch?: number; // Default: 70
  sort?: 'match_desc' | 'match_asc' | 'recent'; // Default: 'match_desc'
  skillFilters?: SkillType[];
}

export interface SmartMatchResponse extends ApiResponse<MatchResult[]> {
  count: number;
  nextPage?: number;
}

export interface GetApplicationsRequest {
  status?: ApplicationStatus | 'all'; // Default: 'all'
  sort?: 'recent' | 'oldest' | 'match_highest'; // Default: 'recent'
  limit?: number;
  offset?: number;
}

export interface GetApplicationsResponse extends ApiResponse {
  data: {
    applied: JobApplication[];
    viewed: JobApplication[];
    shortlisted: JobApplication[];
    audition_invited: JobApplication[];
    hired: JobApplication[];
    completed: JobApplication[];
    rejected: JobApplication[];
  };
  stats: {
    total_applications: number;
    applied: number;
    shortlisted: number;
    hired: number;
    completed: number;
    rejected: number;
  };
}

export interface ApplyForJobRequest {
  projectId: string;
  roleId: string;
}

export interface ApplyForJobResponse extends ApiResponse {
  data: {
    app_id: string;
    match_percentage: number;
    match_details: MatchResult;
  };
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
  reason?: string;
}

// ============================================================================
// PAGINATION & LIST RESPONSE TYPES
// ============================================================================

export interface ListMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ListResponse<T> extends ApiResponse {
  data: T[];
  meta: ListMeta;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: ValidationError[]
  ) {
    super(message);
  }
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface JWTPayload {
  sub: string; // User/Talent ID
  email: string;
  aud: string; // Audience
  iss: string; // Issuer
  iat: number; // Issued at
  exp: number; // Expiration
}

// ============================================================================
// HELPER TYPE FUNCTIONS
// ============================================================================

/**
 * Type guard to check if profile is complete enough for matching
 */
export function isProfileComplete(profile: TalentProfile): boolean {
  return (
    Boolean(profile.age) &&
    Boolean(profile.height_cm) &&
    Boolean(profile.gender) &&
    Boolean(profile.domicile) &&
    (profile.skills_json?.length || 0) > 0 &&
    (profile.profile_completion_percent || 0) >= 50
  );
}

/**
 * Type guard for valid application status
 */
export function isValidApplicationStatus(
  status: string
): status is ApplicationStatus {
  const validStatuses: ApplicationStatus[] = [
    'applied',
    'viewed',
    'shortlisted',
    'audition_invited',
    'hired',
    'completed',
    'rejected',
    'declined',
  ];
  return validStatuses.includes(status as ApplicationStatus);
}

/**
 * Helper to calculate recommendation based on match percentage
 */
export function getRecommendation(
  matchPercent: number
): MatchResult['recommendation'] {
  if (matchPercent >= 80) return 'strong_match';
  if (matchPercent >= 60) return 'good_match';
  if (matchPercent >= 40) return 'fair_match';
  return 'poor_match';
}

export default {
  isProfileComplete,
  isValidApplicationStatus,
  getRecommendation,
};
