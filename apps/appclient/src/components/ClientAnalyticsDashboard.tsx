import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';

type PeriodType = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface ClientAnalyticsData {
  activeProjects: number;
  projectsThisPeriod: number;
  totalBooked: number;
  bookingAcceptanceRate: number;
  totalSpent: number;
  averageProjectCost: number;
  costPerBooking: number;
  topTalentCategories: Array<{ category: string; count: number }>;
  recentBookings: Array<{
    bookingId: string;
    talentName: string;
    projectTitle: string;
    status: string;
    amount: number;
  }>;
}

export const ClientAnalyticsDashboard: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [data, setData] = useState<ClientAnalyticsData | null>(null);
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
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  if (!data) {
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <div className="flex gap-2">
          {(['weekly', 'monthly', 'quarterly', 'yearly'] as PeriodType[]).map(
            (p) => (
              <Button
  key={p}
  onClick={() => setPeriod(p)}
  variant={period === p ? 'primary' : 'secondary'}
  className="capitalize"
>
                {p}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold text-slate-700">Active Projects</h3>
          <p className="text-4xl font-bold text-slate-900 mt-2">
            {data.activeProjects}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {data.projectsThisPeriod} this period
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-700">Talent Booked</h3>
          <p className="text-4xl font-bold text-slate-900 mt-2">
            {data.totalBooked}
          </p>
          <p className="text-xs text-slate-500 mt-2">This {period}</p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-700">Total Spent</h3>
          <p className="text-4xl font-bold text-slate-900 mt-2">
            ${data.totalSpent.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Avg. ${Math.round(data.costPerBooking)} per booking
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-700">Acceptance Rate</h3>
          <p className="text-4xl font-bold text-slate-900 mt-2">
            {Math.round(data.bookingAcceptanceRate)}%
          </p>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${data.bookingAcceptanceRate}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-900 mb-4">Recent Bookings</h3>
        <div className="space-y-3">
          {data.recentBookings.length > 0 ? (
            data.recentBookings.map((booking) => (
              <div
                key={booking.bookingId}
                className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {booking.talentName} - {booking.projectTitle}
                  </p>
                  <p className="text-sm text-slate-500">{booking.status}</p>
                </div>
                <p className="font-bold text-slate-900">
                  ${booking.amount.toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No recent bookings</p>
          )}
        </div>
      </Card>

      {/* Top Categories */}
      {data.topTalentCategories.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-4">
            Most Booked Categories
          </h3>
          <div className="space-y-2">
            {data.topTalentCategories.map((cat) => (
              <div
                key={cat.category}
                className="flex justify-between items-center"
              >
                <span className="text-slate-700">{cat.category}</span>
                <span className="font-bold text-slate-900">{cat.count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ClientAnalyticsDashboard;
