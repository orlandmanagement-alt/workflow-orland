export interface PublicInvite {
  recommendation_id: string;
  invite_token: string;
  project_id: string;
  project_title: string;
  project_description?: string;
  budget?: number;
  deadline?: Date | string;
  company_name: string;
  logo_url?: string;
  match_score: number;
  reason_text?: string;
  expires_at: Date | string;
  is_expired: boolean;
}

export interface Recommendation {
  recommendation_id: string;
  talent_id: string;
  project_id: string;
  agency_id: string;
  created_by_id: string;
  invite_token: string;
  invite_method: 'link' | 'email' | 'sms' | 'manual';
  status: 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  match_score: number;
  reason_text?: string;
  created_at: Date | string;
  expires_at: Date | string;
  viewed_at?: Date | string | null;
  responded_at?: Date | string | null;
  updated_at: Date | string;
  metadata?: Record<string, any>;
}

export interface RecommendationClaim {
  claim_id: string;
  recommendation_id: string;
  new_user_id?: string;
  claimed_at?: Date | string | null;
  redirect_to_project: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreateRecommendationRequest {
  talent_id: string;
  project_id: string;
  agency_id: string;
  created_by_id: string;
  invite_method?: 'link' | 'email' | 'sms' | 'manual';
  match_score?: number;
  reason_text?: string;
  expires_in_days?: number;
  metadata?: Record<string, any>;
}

export interface BulkCreateRecommendationsRequest {
  project_id: string;
  talent_ids: string[];
  expires_in_days?: number;
  notify_method?: 'email' | 'sms' | 'none';
  match_scores?: Record<string, number>;
  custom_messages?: Record<string, string>;
}

export interface InviteListParams {
  talent_id?: string;
  project_id?: string;
  agency_id?: string;
  status?: string;
  skip?: number;
  take?: number;
  sort?: 'created_at' | 'expires_at' | 'match_score';
  order?: 'asc' | 'desc';
}

export interface InviteListResponse {
  data: Recommendation[];
  total: number;
  skip: number;
  take: number;
}

export interface AcceptInviteResponse {
  success: boolean;
  message: string;
  redirectUrl?: string;
}
