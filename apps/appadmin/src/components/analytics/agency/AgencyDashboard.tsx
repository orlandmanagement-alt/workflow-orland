/**
 * Mission 5: Analytics Dashboard - Agency Dashboard
 * 
 * Purpose: Performance metrics for agencies
 */

import React from 'react';
import { BarChart3, Users, DollarSign, TrendingUp } from 'lucide-react';
import { MetricCard, TrendIndicator } from '../common/AnalyticsCommon';
import type { AgencyDashboard as AgencyDashboardType } from '../../types/analytics';

interface AgencyDashboardProps {
  metrics: AgencyDashboardType;
  onRefresh: () => void;
}

export default function AgencyDashboard({
  metrics,
  onRefresh,
}: AgencyDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Performance Overview</h2>
          <p className="text-gray-600 text-sm mt-1">
            Your agency's performance metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            label="Portfolio Views"
            value={metrics.metrics.portfolioViews.value.toLocaleString()}
            trend={metrics.metrics.portfolioViews}
            icon={<BarChart3 size={32} />}
            color="blue"
          />
          <MetricCard
            label="Bookings"
            value={metrics.metrics.bookings.value.toLocaleString()}
            trend={metrics.metrics.bookings}
            icon={<TrendingUp size={32} />}
            color="green"
          />
          <MetricCard
            label="Total Revenue"
            value={formatCurrency(metrics.metrics.revenue.value)}
            trend={metrics.metrics.revenue}
            icon={<DollarSign size={32} />}
            color="purple"
          />
        </div>
      </section>

      {/* Talent Roster */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Talents</h2>
          <p className="text-gray-600 text-sm mt-1">
            Top performers in your agency ({metrics.metrics.talentRosterSize} active)
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {metrics.topTalents && metrics.topTalents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Views
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {metrics.topTalents.map((talent) => (
                    <tr key={talent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {talent.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {talent.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 font-medium">
                        {talent.bookings}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {talent.profileViews.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 font-medium">
                        {formatCurrency(talent.revenue)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className="inline-flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                          ★ {talent.avgRating.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-600">
              No talent data available
            </div>
          )}
        </div>
      </section>

      {/* Client Retention */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Client Retention</h2>
          <p className="text-gray-600 text-sm mt-1">
            Client engagement metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Total Unique Clients</p>
              <p className="text-4xl font-bold text-gray-900">
                {metrics.clientRetention.uniqueClients}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Repeat Clients</p>
              <p className="text-4xl font-bold text-gray-900">
                {metrics.clientRetention.repeatClients}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {(
                  (metrics.clientRetention.repeatClients /
                    metrics.clientRetention.uniqueClients) *
                  100
                ).toFixed(1)}
                % retention rate
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rating & Quality */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quality Metrics</h2>
          <p className="text-gray-600 text-sm mt-1">
            Agency performance and satisfaction
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard
            label="Average Talent Rating"
            value={metrics.metrics.avgTalentRating.value.toFixed(1)}
            trend={metrics.metrics.avgTalentRating}
            color="yellow"
          />
          <MetricCard
            label="Client Retention Rate"
            value={`${metrics.metrics.clientRetention.value.toFixed(1)}%`}
            color="green"
          />
        </div>
      </section>
    </div>
  );
}
