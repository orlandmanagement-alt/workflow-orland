/**
 * Analytics Types - Dashboard data structures
 */

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface MetricTrend {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
}

export interface ExportRequest {
  reportType: 'analytics' | 'custom' | 'financial';
  dateRange: DateRange;
  format: 'csv' | 'pdf' | 'xlsx';
  filters?: Record<string, any>;
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  fileSize?: number;
  fileName: string;
}

export interface CustomReportFormData {
  name: string;
  description: string;
  metrics: string[];
  dimensions: string[];
  dateRange: DateRange;
  filters: Record<string, any>;
}

// Admin Dashboard Types
export interface AdminDashboard {
  totalRevenue: { count: number; trend: MetricTrend };
  totalUsers: { count: number; trend: MetricTrend };
  activeProjects: { count: number; trend: MetricTrend };
  platformMetrics: {
    successRate: number;
    avgProjectValue: number;
    topAgencies: Array<{ name: string; count: number }>;
    topTalents: Array<{ name: string; count: number }>;
    anomalies: Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string }>;
  };
}

// Agency Dashboard Types
export interface AgencyDashboard {
  talentRoster: Array<{
    id: string;
    name: string;
    activeBookings: number;
    monthlyEarnings: number;
  }>;
  bookingStats: {
    total: number;
    completed: number;
    pending: number;
    earnings: number;
  };
  revenueBreakdown: Array<{ category: string; value: number; color?: string }>;
  timeSeriesData: Array<{ date: string; bookings: number; revenue: number }>;
}

// Talent Dashboard Types
export interface TalentDashboard {
  profileStats: {
    views: number;
    applications: number;
    bookingRate: number;
  };
  earnings: {
    thisMonth: number;
    lastMonth: number;
    totalEarned: number;
  };
  bookingHistory: Array<{
    projectName: string;
    status: string;
    date: string;
    amount: number;
  }>;
  skillsMetrics: Array<{ skill: string; demand: number; avgRate: number }>;
}

// Client Dashboard Types
export interface ClientDashboard {
  projectMetrics: {
    total: number;
    active: number;
    completed: number;
    budget: number;
  };
  talentMetrics: {
    hired: number;
    favorites: number;
    avgRating: number;
  };
  spendAnalysis: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  recentProjects: Array<{
    name: string;
    status: string;
    talentCount: number;
    budget: number;
  }>;
}

// Hook Return Types
export interface UseAdminDashboardReturn {
  data: AdminDashboard | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseAgencyDashboardReturn {
  data: AgencyDashboard | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseTalentDashboardReturn {
  data: TalentDashboard | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseClientDashboardReturn {
  data: ClientDashboard | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseExportReturn {
  startExport: (request: ExportRequest) => void;
  exportJob: ExportJob | null;
  loading: boolean;
  error: string | null;
}

export interface UseCustomReportsReturn {
  reports: Array<{ id: string; name: string; lastRun?: string }>;
  loading: boolean;
  createReport: (data: CustomReportFormData) => void;
  deleteReport: (id: string) => void;
}
