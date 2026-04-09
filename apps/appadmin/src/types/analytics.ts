/**
 * Mission 5: Analytics Dashboard - Types & Interfaces
 * 
 * Purpose: TypeScript interfaces for all dashboard components
 */

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardMetrics {
  overview: {
    totalUsers: number;
    activeUsers30Days: number;
    totalBookings: number;
    totalRevenue: number;
    platformFees: number;
    avgBookingValue: number;
  };
  trends: {
    bookingsTrend: MetricTrend;
    revenueTrend: MetricTrend;
    newUsersTrend: MetricTrend;
    conversionRateTrend: MetricTrend;
  };
  distribution: {
    byUserType: Record<string, number>;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    byTier: Record<string, number>;
  };
  comparison: {
    weekOverWeek: Record<string, number>;
    monthOverMonth: Record<string, number>;
    yearOverYear: Record<string, number>;
  };
}

export interface MetricTrend {
  value: number;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
  previousPeriod?: number;
}

export interface TalentDashboard {
  metrics: {
    views: MetricTrend;
    bookings: MetricTrend;
    revenue: MetricTrend;
    rating: MetricTrend;
    completionRate: MetricTrend;
    responseTime: MetricTrend;
  };
  recentBookings: Booking[];
  recentReviews: Review[];
  revenue: number;
}

export interface AgencyDashboard {
  metrics: {
    portfolioViews: MetricTrend;
    bookings: MetricTrend;
    revenue: MetricTrend;
    avgTalentRating: MetricTrend;
    clientRetention: MetricTrend;
    talentRosterSize: number;
  };
  topTalents: TalentPerformance[];
  clientRetention: {
    uniqueClients: number;
    repeatClients: number;
  };
}

export interface ClientDashboard {
  metrics: {
    totalSpent: MetricTrend;
    bookingsCount: MetricTrend;
    avgBookingValue: MetricTrend;
    repeatTalentRate: MetricTrend;
    churnRisk: number;
  };
  favoriteTalents: TalentProfile[];
  recentBookings: Booking[];
}

export interface AdminDashboard extends DashboardMetrics {
  topAgencies: AgencyPerformance[];
  topTalents: TalentPerformance[];
  anomalies: Anomaly[];
}

// ============================================================================
// ENTITY TYPES
// ============================================================================

export interface Booking {
  id: string;
  talentId?: string;
  talentName?: string;
  clientId?: string;
  bookingValue: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  rating?: number;
}

export interface Review {
  rating: number;
  feedback: string;
  createdAt: string;
  talentId?: string;
  talentName?: string;
}

export interface TalentPerformance {
  id: string;
  name: string;
  category: string;
  avgRating: number;
  bookings: number;
  profileViews: number;
  revenue: number;
  uniqueClients: number;
}

export interface TalentProfile {
  id: string;
  name: string;
  timesHired: number;
  avgRating: number;
}

export interface AgencyPerformance {
  id: string;
  name: string;
  totalViews: number;
  bookings: number;
  revenue: number;
  avgRating: number;
  talentCount: number;
}

export interface Anomaly {
  metricType: string;
  entityType: string;
  severity: 'low' | 'medium' | 'high';
  deviation: number;
  detectedAt: string;
}

// ============================================================================
// CHART TYPES
// ============================================================================

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  type?: 'line' | 'bar' | 'pie';
}

export interface ChartConfig {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: {
    legend?: any;
    tooltip?: any;
    title?: any;
  };
  scales?: {
    x?: any;
    y?: any;
  };
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface FilterOptions {
  dateRange: DateRange;
  category?: string;
  status?: string;
  tier?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface ExportRequest {
  dashboardType: 'talent' | 'agency' | 'client' | 'admin' | string;
  format: 'pdf' | 'csv' | 'excel';
  dateRangeStart: string;
  dateRangeEnd: string;
  includeMetrics?: string[];
  includeCharts?: boolean;
}

export interface ExportJob {
  id: string;
  userId: string;
  format: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  progress: number;
  fileUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface DashboardProps {
  userId: string;
  userType: 'talent' | 'agency' | 'client' | 'admin';
  dateRange?: DateRange;
  onExport?: (request: ExportRequest) => Promise<void>;
}

export interface MetricCardProps {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
  icon?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow';
  onClick?: () => void;
}

export interface ChartProps {
  title: string;
  data: ChartData;
  config?: ChartConfig;
  height?: number;
  loading?: boolean;
  error?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pageSize?: number;
  sortable?: boolean;
  filterable?: boolean;
  onSort?: (field: keyof T, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
}

export interface Column<T> {
  key: keyof T;
  title: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseDashboardReturn {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseChartDataReturn {
  data: ChartData | null;
  loading: boolean;
  error: string | null;
}

export interface UseExportReturn {
  exportJob: ExportJob | null;
  loading: boolean;
  error: string | null;
  startExport: (request: ExportRequest) => Promise<void>;
  checkStatus: (jobId: string) => Promise<ExportJob | null>;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface ExportFormData {
  dashboardType: string;
  format: 'pdf' | 'csv' | 'excel';
  dateRangeStart: string;
  dateRangeEnd: string;
  includeMetrics: string[];
  includeCharts: boolean;
  emailNotification?: boolean;
  recipientEmail?: string;
}

export interface CustomReportFormData {
  reportName: string;
  dashboardType: string;
  selectedMetrics: string[];
  selectedDimensions: string[];
  chartType: 'line' | 'bar' | 'pie' | 'heatmap';
  filters: Record<string, any>;
  sortOrder: { field: string; direction: 'asc' | 'desc' }[];
  scheduleFrequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  scheduleTime?: string;
}
