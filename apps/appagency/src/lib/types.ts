// Type Definitions
// File: apps/appagency/src/lib/types.ts

export interface User {
  id: string
  email: string
  name: string
  role: 'agency' | 'talent' | 'admin'
  company?: string
  phone?: string
  address?: string
  avatar?: string
}

export interface Talent {
  id: string
  name: string
  email: string
  category: TalentCategory
  location: string
  bio: string
  bookings: number
  rating: number
  commission: number
  status: 'active' | 'pending_review' | 'draft' | 'archived'
  portfolio_locked: boolean
  price_locked: boolean
  independent_login: boolean
  last_updated: string
  created_at: string
}

export type TalentCategory =
  | 'content_creator'
  | 'influencer'
  | 'model'
  | 'actor'
  | 'musician'
  | 'photographer'
  | 'videographer'
  | 'other'

export interface Inquiry {
  id: string
  talent_id: string
  talent_name: string
  client_name: string
  project_name: string
  message: string
  budget: number
  status: 'new' | 'replied' | 'negotiating' | 'declined' | 'accepted'
  created_at: string
  updated_at: string
}

export interface InquiryDetail extends Inquiry {
  client_email: string
  client_phone: string
  talent_rate_min: number
  talent_rate_max: number
  agency_commission_percent: number
  agency_commission_amount: number
}

export interface DashboardStats {
  total_talents: number
  active_talents: number
  new_inquiries: number
  commission_this_month: number
  total_revenue: number
  total_bookings: number
  avg_rating: number
  response_rate: number
}

export interface TopTalent {
  name: string
  bookings: number
  rating: number
  commission: number
}

export interface ActivityLog {
  id: string
  action: string
  actor_id: string
  actor_name: string
  target_type: 'talent' | 'inquiry' | 'agency'
  target_id: string
  changes?: Record<string, unknown>
  created_at: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  switchToTalent: (talentId: string) => void
  clearImpersonation: () => void
  currentViewAs?: {
    talentId: string
    talentName: string
    exitUrl?: string
  }
}
