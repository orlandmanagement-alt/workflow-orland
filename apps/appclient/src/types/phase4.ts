/**
 * Shared Types for Phase 4 Features
 * Used across appclient, apptalent, appadmin
 */

// ============ CONTRACTS & FINTECH ============

export interface Contract {
  id: string
  job_id: string
  talent_id: string
  agency_id: string
  client_id: string
  status: 'draft' | 'pending_signature' | 'signed' | 'completed' | 'cancelled'
  fee: number
  signature_talent: string | null // Base64 image + timestamp
  signature_client: string | null // Base64 image + timestamp
  created_at: string
  updated_at: string
  signed_at: string | null
}

export interface Invoice {
  id: string
  contract_id: string
  amount: number
  status: 'pending' | 'paid' | 'escrow_released'
  payment_url: string
  payment_method: 'xendit' | 'midtrans' | 'bank_transfer'
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface SignatureData {
  image: string // Base64 PNG from canvas
  timestamp: string // ISO string
  signer_type: 'talent' | 'client'
}

export interface RevenueSplit {
  talent: number // 80%
  agency: number // 10%
  platform: number // 10%
}

export interface EscrowSummary {
  total_escrow_held: number
  contracts: Array<{
    contract_id: string
    talent_name: string
    project_name: string
    escrow_amount: number
    status: string
    signatures_needed: string[]
  }>
  ready_to_release: number
}

// ============ AI MATCHING ============

export interface AIMatchRequest {
  prompt: string
}

export interface AIMatchBatchRequest {
  prompts: string[]
}

export interface AIExtractedCriteria {
  gender?: string
  ethnicity?: string
  age_range?: [number, number]
  language?: string
  category?: string
  height?: string
  skills?: string[]
  other_requirements?: string[]
}

export interface AIMatchResult {
  status: 'success' | 'error'
  extracted_criteria: AIExtractedCriteria
  matching_talents: Array<{
    id: string
    name: string
    age: number
    category: string
    match_score: number
    is_premium_unmasked: boolean
  }>
  results_count: number
}

export interface AIMatchBatchResult {
  status: 'success'
  results: Array<{
    prompt: string
    matches: number
    sample_talents: AIMatchResult['matching_talents']
  }>
}

export interface AISuggestion {
  based_on_views: {
    patterns: string[]
    suggested_talents: Array<{
      id: string
      name: string
    }>
  }
  trending_now: Array<{
    id: string
    name: string
    trend_score: number
  }>
}

// ============ ANALYTICS ============

export interface TalentAnalytics {
  views_7d: number
  views_30d: number
  views_all_time: number
  rank_tier: 'emerging' | 'top_25' | 'top_10' | 'top_5' | 'top_1'
  score: number
  percentile?: number
  insights?: {
    trend_7d: string
    avg_daily_views?: number
  }
}

export interface AnalyticsDashboardData {
  talentName: string
  overview: TalentAnalytics
  dailyBreakdown: Array<{
    date: string
    views: number
  }>
  stats: {
    avgViewsPerDay: number
    growthRate: string
  }
}

export interface RankingEntry {
  rank: number
  talent_id: string
  name: string
  category: string
  profile_picture_url: string
  views_7d: number
  views_30d: number
  views_all_time: number
  rank_tier: string
  score: number
}

export interface RankingResponse {
  status: 'success'
  data: {
    period: string
    category: string
    rankings: RankingEntry[]
  }
}

// ============ AVAILABILITY ============

export interface Availability {
  id: string
  talent_id: string
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  status: 'available' | 'booked' | 'unavailable'
  reason?: string
  created_at: string
  updated_at: string
}

export interface AvailabilitySummary {
  talent_name: string
  current_status: 'available' | 'booked' | 'unavailable'
  upcoming_blocks: Array<{
    start_date: string
    end_date: string
    status: string
  }>
  summary: {
    booked_dates: number
    unavailable_dates: number
  }
}

export interface CreateAvailabilityRequest {
  start_date: string
  end_date: string
  status: 'available' | 'booked' | 'unavailable'
  reason?: string
}

// ============ WHITE-LABELING ============

export interface WhiteLabelConfig {
  id: string
  name: string
  custom_domain: string
  watermark_url: string
  primary_color: string
  secondary_color: string
  logo_url: string
  white_label_enabled: boolean
  created_at: string
  updated_at: string
}

export interface WhiteLabelPublicConfig {
  brandName: string
  primaryColor: string
  secondaryColor: string
  logoUrl: string
  watermarkUrl: string
}

export interface WatermarkUploadResponse {
  status: 'success'
  data: {
    url: string
    filename: string
  }
}

// ============ API RESPONSES ============

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data?: T
  message?: string
  error?: string
  code?: string
}

export interface ApiErrorResponse {
  status: 'error'
  message: string
  code?: string
}

// ============ UI STATE ============

export interface LoadingState {
  isLoading: boolean
  error: string | null
  success: boolean
}

export interface FormState<T> {
  data: T
  errors: Record<string, string>
  isDirty: boolean
  isSubmitting: boolean
}

// ============ PAGINATION ============

export interface PaginationParams {
  page: number
  limit: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}
