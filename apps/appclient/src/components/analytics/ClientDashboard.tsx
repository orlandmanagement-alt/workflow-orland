/**
 * Mission 5: Analytics Dashboard - Client Dashboard
 * 
 * Purpose: Spending and booking analytics for clients
 */

import React from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { MetricCard } from '../common/AnalyticsCommon';
import { ClientDashboard as ClientDashboardType } from '../../types/analytics';

interface ClientDashboardProps {
  metrics: ClientDashboardType;
  onRefresh: () => void;
}

export default function ClientDashboard({
  metrics,
  onRefresh,
}: ClientDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getChurnRiskColor = (risk: number) => {
    if (risk < 30) return 'text-green-600 bg-green-50';
    if (risk < 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getChurnRiskLabel = (risk: number) => {
    if (risk < 30) return 'Low';
    if (risk < 60) return 'Medium';
    return 'High';
  };

  return (
    <div className="space-y-8">
      {/* Spending Overview */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Spending Overview</h2>
          <p className="text-gray-600 text-sm mt-1">
            Your spending and booking activity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            label="Total Spent"
            value={formatCurrency(metrics.metrics.totalSpent.value)}
            trend={metrics.metrics.totalSpent}
            icon={<DollarSign size={32} />}
            color="green"
          />
          <MetricCard
            label="Total Bookings"
            value={metrics.metrics.bookingsCount.value.toLocaleString()}
            trend={metrics.metrics.bookingsCount}
            icon={<ShoppingCart size={32} />}
            color="blue"
          />
          <MetricCard
            label="Average Booking Value"
            value={formatCurrency(metrics.metrics.avgBookingValue.value)}
            icon={<TrendingUp size={32} />}
            color="purple"
          />
        </div>
      </section>

      {/* Engagement Metrics */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Engagement Metrics</h2>
          <p className="text-gray-600 text-sm mt-1">
            Repeat bookings and talent preferences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard
            label="Repeat Talent Rate"
            value={`${metrics.metrics.repeatTalentRate.value.toFixed(1)}%`}
            icon={<Users size={32} />}
            color="blue"
          />

          {/* Churn Risk */}
          <div className={`rounded-lg p-6 border border-gray-200 ${getChurnRiskColor(metrics.metrics.churnRisk)}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium">Churn Risk</p>
                <p className="text-3xl font-bold mt-2">
                  {getChurnRiskLabel(metrics.metrics.churnRisk)}
                </p>
                <p className="text-sm mt-2 opacity-75">
                  Based on activity level and booking trends
                </p>
              </div>
              <div className="text-4xl font-bold opacity-20">
                {metrics.metrics.churnRisk.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Favorite Talents */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Favorite Talents</h2>
          <p className="text-gray-600 text-sm mt-1">
            Your most frequently booked talents
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {metrics.favoriteTalents && metrics.favoriteTalents.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {metrics.favoriteTalents.map((talent) => (
                <div key={talent.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{talent.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Hired {talent.timesHired} time
                        {talent.timesHired !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end text-sm">
                        {'★'.repeat(Math.floor(talent.avgRating))}
                        <span className="text-gray-600">
                          {talent.avgRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-600">
              No favorite talents yet. Start by booking some talents!
            </div>
          )}
        </div>
      </section>

      {/* Recent Bookings */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Bookings</h2>
          <p className="text-gray-600 text-sm mt-1">
            Your latest projects and transactions
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {metrics.recentBookings && metrics.recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Talent
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {metrics.recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {booking.talentName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(booking.bookingValue)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                            booking.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800'
                                : booking.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {booking.rating ? (
                          <span className="text-sm font-medium text-yellow-600">
                            {'★'.repeat(Math.floor(booking.rating))}
                            {booking.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-600">
              No bookings yet
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
