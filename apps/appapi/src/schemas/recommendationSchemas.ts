import { z } from 'zod';

// Enum schemas
export const InviteMethodEnum = z.enum(['link', 'email', 'sms', 'manual']);
export const RecommendationStatusEnum = z.enum(['sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled']);

// Base recommendation schema
export const RecommendationBaseSchema = z.object({
  talent_id: z.string().uuid(),
  project_id: z.string().uuid(),
  agency_id: z.string().uuid(),
  created_by_id: z.string().uuid(),
  invite_method: InviteMethodEnum.default('link'),
  match_score: z.number().min(0).max(100).default(0),
  reason_text: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).default({}),
});

// Create recommendation request
export const CreateRecommendationSchema = RecommendationBaseSchema.extend({
  expires_in_days: z.number().min(1).max(365).default(30),
});

// Full recommendation with ID
export const RecommendationSchema = RecommendationBaseSchema.extend({
  recommendation_id: z.string().uuid(),
  invite_token: z.string(),
  status: RecommendationStatusEnum,
  created_at: z.coerce.date(),
  expires_at: z.coerce.date(),
  viewed_at: z.coerce.date().nullable(),
  responded_at: z.coerce.date().nullable(),
  updated_at: z.coerce.date(),
});

// Public invite view (what unauthenticated user sees)
export const PublicInviteSchema = z.object({
  recommendation_id: z.string().uuid(),
  invite_token: z.string(),
  project_id: z.string().uuid(),
  project_title: z.string(),
  project_description: z.string().optional(),
  budget: z.number().optional(),
  deadline: z.coerce.date().optional(),
  company_name: z.string(),
  logo_url: z.string().url().optional(),
  match_score: z.number().min(0).max(100),
  reason_text: z.string().optional(),
  expires_at: z.coerce.date(),
  is_expired: z.boolean(),
});

// Accept/reject recommendation
export const RespondRecommendationSchema = z.object({
  accept: z.boolean(),
  message: z.string().optional(),
});

// Recommendation claim (tracks new user linking)
export const RecommendationClaimSchema = z.object({
  claim_id: z.string().uuid(),
  recommendation_id: z.string().uuid(),
  new_user_id: z.string().uuid().nullable(),
  claimed_at: z.coerce.date().nullable(),
  redirect_to_project: z.boolean().default(true),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// List query parameters
export const RecommendationListParamsSchema = z.object({
  talent_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  agency_id: z.string().uuid().optional(),
  status: RecommendationStatusEnum.optional(),
  skip: z.number().min(0).default(0),
  take: z.number().min(1).max(100).default(20),
  sort: z.enum(['created_at', 'expires_at', 'match_score']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Bulk create recommendations (for multi-talent projects)
export const BulkCreateRecommendationsSchema = z.object({
  project_id: z.string().uuid(),
  talent_ids: z.array(z.string().uuid()).min(1).max(50),
  expires_in_days: z.number().min(1).max(365).default(30),
  notify_method: z.enum(['email', 'sms', 'none']).default('none'),
  match_scores: z.record(z.number()).optional(),
  custom_messages: z.record(z.string()).optional(),
});

export type CreateRecommendation = z.infer<typeof CreateRecommendationSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type PublicInvite = z.infer<typeof PublicInviteSchema>;
export type RespondRecommendation = z.infer<typeof RespondRecommendationSchema>;
export type RecommendationClaim = z.infer<typeof RecommendationClaimSchema>;
export type BulkCreateRecommendations = z.infer<typeof BulkCreateRecommendationsSchema>;
