import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';

type PeriodType = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface AdminAnalyticsData {
  totalGMV: number;
  activeProjects: number;
  activeUsers: number;
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  totalRevenue: number;
  userGrowth: {
    talentSignups: number;
    clientSignups: number;
    agencySignups: number;
  };
  platformHealth: {
    avgApiLatency: number;
    errorRate: number;
    uptime: number;
  };
  topRegions: Array<{
    region: string;
    bookings: number;
    gmv: number;
  }>;
}

export const AdminAnalyticsDashboard: React.FC = () => {
  const { api } = useApi();
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/stats/dashboard/${period}`);
        setData(response.data);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.error || 'Failed to load analytics'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period, api]);

  if (loading) {
    return <LoadingSpinner message="Loading platform analytics..." />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  if (!data) {
    return <div className="text-center py-8">No data available</div>;
  }

  const healthStatus = {
    latency: data.platformHealth.avgApiLatency < 100 ? '✅' : '⚠️',
    errors: data.platformHealth.errorRate < 0.5 ? '✅' : '⚠️',
    uptime: data.platformHealth.uptime > 99.5 ? '✅' : '⚠️',
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Platform Analytics
        </h1>
        <div className="flex gap-2">
          {(['weekly', 'monthly', 'quarterly', 'yearly'] as PeriodType[]).map(
            (p) => (
              <Button
                key={p}
                onClick={() => setPeriod(p)}
                variant={period === p ? 'primary' : 'secondary'}
                size="sm"
                className="capitalize"
              >
                {p}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <h3 className="font-semibold text-slate-700">Total GMV</h3>
          <p className="text-4xl font-bold text-emerald-600 mt-2">
            ${(data.totalGMV / 1000000).toFixed(1)}M
          </p>
          <p className="text-xs text-slate-500 mt-2">Gross Merchandise Value</p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-700">Active Projects</h3>
          <p className="text-4xl font-bold text-slate-900 mt-2">
            {data.activeProjects}
          </p>
          <p className="text-xs text-slate-500 mt-2">In progress</p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-700">Active Users</h3>
          <p className="text-4xl font-bold text-slate-900 mt-2">
            {data.activeUsers.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-2">Last 30 days</p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-700">Total Bookings</h3>
          <p className="text-4xl font-bold text-slate-900 mt-2">
            {data.totalBookings.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-2">All time</p>
        </Card>
      </div>

      {/* Revenue & User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-4">Platform Revenue</h3>
          <p className="text-3xl font-bold text-slate-900">
            ${(data.totalRevenue / 1000).toFixed(1)}K
          </p>
          <p className="text-sm text-slate-500 mt-2">
            This {period}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-4">User Signups</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-700">Talents</span>
              <span className="font-bold">{data.userGrowth.talentSignups}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">Clients</span>
              <span className="font-bold">{data.userGrowth.clientSignups}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">Agencies</span>
              <span className="font-bold">{data.userGrowth.agencySignups}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Platform Health */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-900 mb-4">Platform Health</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl mb-2">{healthStatus.latency}</p>
            <p className="text-sl font-medium text-slate-700">API Latency</p>
            <p className="text-sm text-slate-500 mt-1">
              {data.platformHealth.avgApiLatency.toFixed(0)}ms avg
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl mb-2">{healthStatus.errors}</p>
            <p className="text-sm font-medium text-slate-700">Error Rate</p>
            <p className="text-sm text-slate-500 mt-1">
              {data.platformHealth.errorRate.toFixed(2)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl mb-2">{healthStatus.uptime}</p>
            <p className="text-sm font-medium text-slate-700">Uptime</p>
            <p className="text-sm text-slate-500 mt-1">
              {data.platformHealth.uptime.toFixed(2)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Booking Status Distribution */}
      {Object.keys(data.bookingsByStatus).length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-4">Booking Status</h3>
          <div className="space-y-3">
            {Object.entries(data.bookingsByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-slate-700 capitalize">{status}</span>
                <span className="font-bold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Regions */}
      {data.topRegions.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-4">Top Regions</h3>
          <div className="space-y-3">
            {data.topRegions.map((region) => (
              <div key={region.region} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                <div>
                  <p className="font-medium text-slate-900">{region.region}</p>
                  <p className="text-sm text-slate-500">
                    {region.bookings} bookings
                  </p>
                </div>
                <p className="font-bold text-slate-900">
                  ${(region.gmv / 1000).toFixed(1)}K
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminAnalyticsDashboard;
