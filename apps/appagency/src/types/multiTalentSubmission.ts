/**
 * Type definitions for Multi-Talent Submission System
 * File: apps/appagency/src/types/multiTalentSubmission.ts
 * 
 * Used by:
 * - appagency (Agency Dashboard)
 * - appadmin (Admin Dashboard)
 */

// ============================================================================
// TALENT CANDIDATE INTERFACE
// ============================================================================

export interface ProjectRequirements {
  projectId: string
  gender?: 'male' | 'female' | 'non-binary'
  ageMin: number
  ageMax: number
  heightMin: number
  heightMax: number
  requiredSkills: string[]
  requiredLanguages: string[]
  budgetMin: number
  budgetMax: number
  shootDateStart: string
  shootDateEnd: string
  locationPref: 'jakarta_only' | 'flexible' | 'multiple_cities'
  specialRequirements?: string
  preferredQualities?: string[]
}

export interface TalentPhysicalProfile {
  gender: 'male' | 'female' | 'non-binary'
  dateOfBirth: string
  age: number
  height_cm: number
  weight_kg: number
  chest_cm?: number
  waist_cm?: number
  hip_cm?: number
  skin_tone: 'fair' | 'light' | 'medium' | 'olive' | 'tan' | 'deep'
  hair_color: string
  eye_color: string
  face_type: string
  domicile: string
}

export interface TalentCompetencies {
  skills: string[] // ['actor', 'model_catwalk', 'model_commercial', 'mc', 'dancer', 'singer', 'presenter']
  languages: string[] // ['indonesian', 'english', 'mandarin', 'japanese']
  certifications?: string[]
}

export interface TalentRateCard {
  serviceName: string
  dailyRateMin: number
  dailyRateMax: number
  hourlyRate?: number
  projectRate?: number
  baseCurrency: string
}

export interface TalentAvailability {
  status: 'available' | 'partially_available' | 'unavailable'
  conflicts: DateRange[]
  nextFreeDate?: string
}

export interface TalentCandidate {
  // Identity
  id: string
  agencyTalentId: string
  name: string
  email: string
  
  // Profile Data
  profiles: TalentPhysicalProfile & TalentCompetencies
  rateCard: TalentRateCard
  availability: TalentAvailability
  
  // Media
  profilePhoto?: string
  compCardUrl?: string
  
  // Matching Score
  matchScore: number // 0-100
  matchBreakdown: MatchScoreBreakdown
  
  // Profile Quality
  profileQuality: number // 0-100 (completion percentage)
  
  // Pricing (for this submission)
  pricing: {
    serviceName: string
    proposedAmount: number
    agencyMarkupPercent: number
    agencyCommissionPercent: number
    agencyFee: number
    talentPayment: number
    currency: string
  }
}

export interface MatchScoreBreakdown {
  height: number // 0-15 points
  physique: number // 0-15 points
  skills: number // 0-20 points
  languages: number // 0-10 points
  availability: number // 0-15 points
  profileQuality: number // 0-15 points
  rateAlignment: number // 0-10 points
}

export interface IneligibleTalent {
  talentId: string
  name: string
  failureReason: string // e.g., "Gender mismatch", "Age out of range"
  talent?: TalentCandidate
}

export interface FilteredRoster {
  totalRosterCount: number
  eligibleCount: number
  ineligibleCount: number
  candidates: TalentCandidate[]
  ineligibleDetails: IneligibleTalent[]
  requirements: ProjectRequirements
  generatedAt: number // Unix milliseconds
}

// ============================================================================
// BULK SUBMISSION INTERFACES
// ============================================================================

export interface BulkSubmissionItemPayload {
  talentId: string
  agencyTalentId: string
  roleName: string
  roleId: string
  matchScore: number
  matchBreakdown: MatchScoreBreakdown
  pricing: {
    serviceName: string
    proposedAmount: number
    currency: string
    agencyMarkupPercent: number
    agencyCommissionPercent: number
  }
}

export interface BulkSubmissionPayload {
  projectId: string
  batchNotes?: string
  submissions: BulkSubmissionItemPayload[]
}

export interface BulkSubmissionItem {
  itemId: string
  talentId: string
  talentName: string
  agencyTalentId: string
  roleName: string
  roleId?: string
  matchScore: number
  matchBreakdown: MatchScoreBreakdown
  pricing: {
    serviceName: string
    proposedAmount: number
    currency: string
    agencyMarkupPercent: number
    agencyCommissionPercent: number
    agencyFee: number
    talentPayment: number
  }
  status: 'pending' | 'approved' | 'rejected' | 'negotiating'
  clientFeedback?: string
  createdProjectTalentId?: string
  submittedAt?: number
  respondedAt?: number
}

export interface BulkSubmissionResponse {
  batchId: string
  projectId: string
  agencyId: string
  submittedAt: number
  totalSubmissions: number
  submissionStatuses: Array<{
    itemId: string
    talentId: string
    talentName: string
    status: string
    projectTalentId: string
    proposedAmount: number
    agencyFee:number
    talentPayment: number
  }>
  financialSummary: {
    totalProposedRevenue: number
    totalAgencyFee: number
    totalTalentPayment: number
    currency: string
  }
  nextSteps: string[]
}

export interface AgencyBulkSubmission {
  batchId: string
  projectId: string
  projectName: string
  status: 'draft' | 'submitted' | 'partially_approved' | 'all_approved' | 'all_rejected' | 'cancelled'
  submittedAt: number
  totalTalents: number
  approvedCount: number
  rejectedCount: number
  pendingCount: number
  financialSummary: {
    totalProposedRevenue: number
    totalAgencyFee: number
    totalTalentPayment: number
    currency: string
  }
  items: BulkSubmissionItem[]
}

export interface SubmissionMetadata {
  batchId: string
  projectId: string
  total: number
  submissions: AgencyBulkSubmission[]
}

// ============================================================================
// IMPERSONATION INTERFACES
// ============================================================================

export interface ImpersonationStartRequest {
  talentId: string
  reason: 'update_profile' | 'update_comp_card' | 'update_media' | 'other'
}

export interface ImpersonationSession {
  impersonationSessionId: string
  talentId: string
  talentName: string
  impersonationToken: string
  expiresIn: number // seconds
  redirectUrl: string
  createdAt: number
}

export interface ImpersonationAuditLog {
  id: string
  agencyId: string
  agencyUserId: string
  talentId: string
  action: 'impersonate_start' | 'impersonate_end' | 'impersonate_revoked'
  reason?: string
  ipAddress: string
  userAgent?: string
  timestamp: number
}

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

export interface MultiTalentSubmissionState {
  // Project Selection
  selectedProjectId: string | null
  selectedProject?: {
    projectId: string
    projectName: string
    clientName: string
  }
  
  // Roster Filtering
  filteredRoster: FilteredRoster | null
  filterLoading: boolean
  filterError: string | null
  
  // Talent Selection
  selectedTalents: Set<string> // talentIds
  selectedTalentDetails: Map<string, TalentCandidate>
  
  // Pricing Overrides
  pricingOverrides: Map<string, number> // talentId -> proposedAmount
  
  // Submission
  drafts: BulkSubmissionPayload[]
  submissions: AgencyBulkSubmission[]
  submissionLoading: boolean
  submissionError: string | null
  
  // UI
  showRosterModal: boolean
  currentStep: 'project_select' | 'roster_filter' | 'review' | 'confirm'
}

export interface UIFiltersState {
  searchTerm: string
  sortBy: 'match_score' | 'name' | 'rate'
  sortOrder: 'asc' | 'desc'
  showIneligible: boolean
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface APICastingRequirements {
  projectId: string
  gender?: string
  ageMin: number
  ageMax: number
  heightMinCm: number
  heightMaxCm: number
  requiredSkills: string[]
  requiredLanguages: string[]
  budgetMin: number
  budgetMax: number
  shootDateStart: string
  shootDateEnd: string
  locationPref: string
  specialRequirements?: string
}

export interface APIRosterRequest {
  projectId: string
  limit?: number
  offset?: number
}

export interface APIRosterResponse {
  success: boolean
  data: {
    projectId: string
    projectName: string
    totalRosterCount: number
    eligibleCount: number
    ineligibleCount: number
    candidates: TalentCandidate[]
    ineligibleReasons: IneligibleTalent[]
    requirements: APICastingRequirements
  }
  error?: {
    code: string
    message: string
  }
}

export interface APIBulkSubmitResponse {
  success: boolean
  data?: BulkSubmissionResponse
  error?: {
    code: string
    message: string
    details?: Array<{
      index: number
      talentId: string
      error: string
      reason: string
    }>
  }
}

export interface APISubmissionsListResponse {
  success: boolean
  data: {
    total: number
    submissions: AgencyBulkSubmission[]
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface DateRange {
  startDate: string
  endDate: string
}

export interface FinancialSummary {
  totalProposedRevenue: number
  totalAgencyFee: number
  totalTalentPayment: number
  currency: string
  agencyCommissionPercent: number
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface TableSortConfig<T> {
  column: keyof T
  direction: 'asc' | 'desc'
}

export interface PaginationState {
  currentPage: number
  pageSize: number
  totalItems: number
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseMultiTalentSubmissionReturn {
  // State
  state: MultiTalentSubmissionState
  filters: UIFiltersState
  
  // Actions
  selectProject: (projectId: string) => Promise<void>
  filterRoster: (projectId: string) => Promise<void>
  toggleTalentSelection: (talentId: string) => void
  selectAllEligible: () => void
  deselectAll: () => void
  updatePricing: (talentId: string, newPrice: number) => void
  submitBulk: (payload: BulkSubmissionPayload) => Promise<BulkSubmissionResponse>
  trackSubmissions: () => Promise<AgencyBulkSubmission[]>
  
  // UI Helpers
  getSelectedCount: () => number
  getSelectedTotal: () => number
  getFinancialSummary: () => FinancialSummary
  getValidationErrors: () => ValidationError[]
}

export interface UseImpersonationReturn {
  startImpersonation: (talentId: string, reason: string) => Promise<ImpersonationSession>
  revokeImpersonation: (sessionId: string) => Promise<void>
  sessions: Map<string, ImpersonationSession>
  isLoading: boolean
  error: string | null
}
