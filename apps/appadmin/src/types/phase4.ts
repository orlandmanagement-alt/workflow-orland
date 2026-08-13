/**
 * Phase 4 Types for Admin
 */

export interface WhiteLabelConfig {
  custom_domain?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  white_label_enabled?: boolean;
  watermark_url?: string;
}

export interface Contract {
  id: string;
  status: string;
}

export interface Invoice {
  id: string;
  status: string;
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
  date: string;
  slots: number;
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
