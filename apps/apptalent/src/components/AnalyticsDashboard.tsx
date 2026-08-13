import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';
import { LineChart, BarChart, PieChart } from '@/components/charts';

type PeriodType = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface AnalyticsData {
  bookingsCount: number;
  bookingsCountChange: number;
  avgRating: number;
  ratingChange: number;
  earningsTotal: number;
  earningsTrend: number[];
  completionRate: number;
  completionRateChange: number;
  topCategories: Array<{ category: string; count: number }>;
  recentProjects: Array<{
    projectId: string;
    title: string;
    status: string;
    earnings: number;
  }>;
}

export const AnalyticsDashboard: React.FC = () => {
  const { api } = useApi();
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
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
    return <LoadingSpinner message="Loading your analytics..." />;
  }

  if (error) {
    return <ErrorAlert title="Analytics Error" message={error} />;
  }

  if (!data) {
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header & Period Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Analytics</h1>
          <p className="text-slate-600 mt-1">
            Performance metrics for {period} period
          </p>
        </div>

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

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bookings Card */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-slate-700">Bookings</h3>
            <span
              className={`text-sm font-medium ${
                data.bookingsCountChange >= 0
                  ? 'text-emerald-600'
                  : 'text-red-600'
              }`}
            >
              {data.bookingsCountChange >= 0 ? '+' : ''}
              {data.bookingsCountChange}%
            </span>
          </div>
          <p className="text-4xl font-bold text-slate-900">
            {data.bookingsCount}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {data.bookingsCountChange >= 0 ? 'Increase' : 'Decrease'} vs last
            period
          </p>
        </Card>

        {/* Rating Card */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-slate-700">Avg Rating</h3>
            <span
              className={`text-sm font-medium ${
                data.ratingChange >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {data.ratingChange >= 0 ? '+' : ''}
              {data.ratingChange.toFixed(1)}
            </span>
          </div>
          <p className="text-4xl font-bold text-slate-900">
            {data.avgRating.toFixed(1)}
          </p>
          <div className="flex gap-0.5 mt-2">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={i < Math.floor(data.avgRating) ? '⭐' : '☆'}
              />
            ))}
          </div>
        </Card>

        {/* Earnings Card */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-700 mb-2">Total Earnings</h3>
          <p className="text-4xl font-bold text-slate-900">
            ${data.earningsTotal.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-2">This {period}</p>
        </Card>

        {/* Completion Rate Card */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-slate-700">Completion Rate</h3>
            <span
              className={`text-sm font-medium ${
                data.completionRateChange >= 0
                  ? 'text-emerald-600'
                  : 'text-red-600'
              }`}
            >
              {data.completionRateChange >= 0 ? '+' : ''}
              {data.completionRateChange}%
            </span>
          </div>
          <p className="text-4xl font-bold text-slate-900">
            {Math.round(data.completionRate)}%
          </p>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div
              className="bg-emerald-500 h-2 rounded-full"
              style={{ width: `${data.completionRate}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Trend Chart */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-4">Earnings Trend</h3>
          <LineChart
            data={data.earningsTrend}
            height={300}
            label="Earnings ($)"
          />
        </Card>

        {/* Top Categories */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-4">Top Categories</h3>
          <BarChart
            data={data.topCategories}
            height={300}
            xKey="category"
            yKey="count"
          />
        </Card>
      </div>

      {/* Recent Projects */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-900 mb-4">Recent Projects</h3>
        <div className="space-y-3">
          {data.recentProjects.length > 0 ? (
            data.recentProjects.map((project) => (
              <div
                key={project.projectId}
                className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {project.title}
                  </p>
                  <p className="text-sm text-slate-500">{project.status}</p>
                </div>
                <p className="font-bold text-slate-900">
                  ${project.earnings.toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No recent projects</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
