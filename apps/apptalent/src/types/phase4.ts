/**
 * Phase4 Types
 */

export interface Contract {
  id: string;
  status: string;
}

export interface Invoice {
  id: string;
  status: string;
}

export interface AIMatchRequest {
  prompt: string;
}

export interface AIMatchResult {
  talentId: string;
  score: number;
}

export interface TalentAnalytics {
  views: number;
  bookings: number;
}

export interface Availability {
  id?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  slots?: number;
  status?: string;
  reason?: string;
}

export interface AvailabilitySummary {
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
}

export interface WhiteLabelConfig {
  custom_domain?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  white_label_enabled?: boolean;
  watermark_url?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  code?: string;
}
