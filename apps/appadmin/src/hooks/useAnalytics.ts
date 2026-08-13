/**
 * Mission 5: Analytics Dashboard - React Hooks
 * 
 * Purpose: Custom hooks for dashboard data fetching and state management
 */

import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import type {
  DashboardMetrics,
  TalentDashboard,
  AgencyDashboard,
  ClientDashboard,
  AdminDashboard,
  ExportRequest,
  ExportJob,
  DateRange,
  UseDashboardReturn,
  UseChartDataReturn,
  UseExportReturn,
} from '../types/analytics';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

/**
 * Hook: useTalentDashboard
 * Fetch talent dashboard data
 */
export function useTalentDashboard(
  talentId?: string,
  dateRange?: DateRange
): UseDashboardReturn & { data: TalentDashboard | null } {
  const [data, setData] = useState<TalentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!talentId) {
      setError('No talent ID provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange) {
        params.set('startDate', dateRange.startDate);
        params.set('endDate', dateRange.endDate);
      }

      const response = await axios.get(
        `${API_BASE_URL}/analytics/talent/dashboard?${params}`,
        {
          withCredentials: true,
        }
      );

      setData(response.data);
    } catch (err) {
      const error = err as AxiosError;
      setError(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [talentId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    metrics: data ? (data as any) : null,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook: useAgencyDashboard
 * Fetch agency dashboard data
 */
export function useAgencyDashboard(
  agencyId?: string,
  dateRange?: DateRange
): UseDashboardReturn & { data: AgencyDashboard | null } {
  const [data, setData] = useState<AgencyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!agencyId) {
      setError('No agency ID provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange) {
        params.set('startDate', dateRange.startDate);
        params.set('endDate', dateRange.endDate);
      }

      const response = await axios.get(
        `${API_BASE_URL}/analytics/agency/dashboard?${params}`,
        {
          withCredentials: true,
        }
      );

      setData(response.data);
    } catch (err) {
      const error = err as AxiosError;
      setError(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [agencyId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    metrics: data ? (data as any) : null,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook: useClientDashboard
 * Fetch client dashboard data
 */
export function useClientDashboard(
  clientId?: string,
  dateRange?: DateRange
): UseDashboardReturn & { data: ClientDashboard | null } {
  const [data, setData] = useState<ClientDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!clientId) {
      setError('No client ID provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange) {
        params.set('startDate', dateRange.startDate);
        params.set('endDate', dateRange.endDate);
      }

      const response = await axios.get(
        `${API_BASE_URL}/analytics/client/dashboard?${params}`,
        {
          withCredentials: true,
        }
      );

      setData(response.data);
    } catch (err) {
      const error = err as AxiosError;
      setError(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [clientId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    metrics: data ? (data as any) : null,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook: useAdminDashboard
 * Fetch admin dashboard data
 */
export function useAdminDashboard(
  dateRange?: DateRange
): UseDashboardReturn & { data: AdminDashboard | null } {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange) {
        params.set('startDate', dateRange.startDate);
        params.set('endDate', dateRange.endDate);
      }

      const response = await axios.get(
        `${API_BASE_URL}/analytics/admin/platform?${params}`,
        {
          withCredentials: true,
        }
      );

      setData(response.data);
    } catch (err) {
      const error = err as AxiosError;
      setError(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    metrics: data,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// DATA HOOKS
// ============================================================================

/**
 * Hook: useChartData
 * Fetch chart data for a specific metric
 */
export function useChartData(
  endpoint: string,
  dateRange?: DateRange
): UseChartDataReturn {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange) {
        params.set('startDate', dateRange.startDate);
        params.set('endDate', dateRange.endDate);
      }

      const response = await axios.get(
        `${API_BASE_URL}${endpoint}?${params}`,
        {
          withCredentials: true,
        }
      );

      setData(response.data);
    } catch (err) {
      const error = err as AxiosError;
      setError(error.message || 'Failed to fetch chart data');
    } finally {
      setLoading(false);
    }
  }, [endpoint, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
  };
}

/**
 * Hook: useTalentPerformance
 * Fetch talent performance metrics
 */
export function useTalentPerformance(agencyId: string, dateRange?: DateRange) {
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange) {
        params.set('startDate', dateRange.startDate);
        params.set('endDate', dateRange.endDate);
      }
      params.set('period', 'month');

      const response = await axios.get(
        `${API_BASE_URL}/analytics/agency/talents/performance?${params}`,
        {
          withCredentials: true,
        }
      );

      setTalents(response.data.talents || []);
    } catch (err) {
      const error = err as AxiosError;
      setError(error.message || 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  }, [agencyId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    talents,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook: useClientSpending
 * Fetch client spending data
 */
export function useClientSpending(clientId: string, dateRange?: DateRange) {
  const [spending, setSpending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange) {
        params.set('startDate', dateRange.startDate);
        params.set('endDate', dateRange.endDate);
      }

      const response = await axios.get(
        `${API_BASE_URL}/analytics/client/spending?${params}`,
        {
          withCredentials: true,
        }
      );

      setSpending(response.data.spending || []);
    } catch (err) {
      const error = err as AxiosError;
      setError(error.message || 'Failed to fetch spending data');
    } finally {
      setLoading(false);
    }
  }, [clientId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    spending,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook: useTalentEarnings
 * Fetch talent earnings data
 */
export function useTalentEarnings(talentId: string, dateRange?: DateRange) {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange) {
        params.set('startDate', dateRange.startDate);
        params.set('endDate', dateRange.endDate);
      }

      const response = await axios.get(
        `${API_BASE_URL}/analytics/talent/earnings?${params}`,
        {
          withCredentials: true,
        }
      );

      setEarnings(response.data.earnings || []);
    } catch (err) {
      const error = err as AxiosError;
      setError(error.message || 'Failed to fetch earnings data');
    } finally {
      setLoading(false);
    }
  }, [talentId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    earnings,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// EXPORT HOOKS
// ============================================================================

/**
 * Hook: useExport
 * Manage analytics export functionality
 */
export function useExport(): UseExportReturn {
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startExport = useCallback(async (request: ExportRequest) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        request.format === 'pdf'
          ? '/analytics/export/pdf'
          : request.format === 'csv'
            ? '/analytics/export/csv'
            : '/analytics/export/excel';

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, request, {
        withCredentials: true,
      });

      setExportJob(response.data);
    } catch (err) {
      const error = err as AxiosError;
      setError(error.message || 'Failed to start export');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async (jobId: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/analytics/export/jobs/${jobId}`,
        {
          withCredentials: true,
        }
      );

      setExportJob(response.data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      setError(error.message || 'Failed to check export status');
      return null;
    }
  }, []);

  return {
    exportJob,
    loading,
    error,
    startExport,
    checkStatus,
  };
}

// ============================================================================
// CUSTOM REPORTS HOOKS
// ============================================================================

/**
 * Hook: useCustomReports
 * Manage custom reports
 */
export function useCustomReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_BASE_URL}/analytics/custom-reports`,
        {
          withCredentials: true,
        }
      );

      setReports(response.data.reports || []);
    } catch (err) {
      const error = err as AxiosError;
      setError(error.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, []);

  const createReport = useCallback(async (reportData: any) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/analytics/custom-reports`,
        reportData,
        {
          withCredentials: true,
        }
      );

      await fetchReports(); // Refresh list
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      throw error;
    }
  }, [fetchReports]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    createReport,
    refetch: fetchReports,
  };
}
