/**
 * Mission 5: Analytics Dashboard - Admin Dashboard
 * 
 * Purpose: Platform-wide analytics and KPIs for administrators
 */

import React from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, ShoppingCart, AlertTriangle } from 'lucide-react';
import { MetricCard, TrendIndicator } from '../common/AnalyticsCommon';
import type { AdminDashboard as AdminDashboardType } from '../../types/analytics';

interface AdminDashboardProps {
  metrics: AdminDashboardType;
  onRefresh: () => void;
}

export default function AdminDashboard({
  metrics,
  onRefresh,
}: AdminDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
          <p className="text-gray-600 text-sm mt-1">
            Platform-wide performance metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            label="Total Users"
            value={metrics.overview.totalUsers.toLocaleString()}
            icon={<Users size={32} />}
            color="blue"
          />
          <MetricCard
            label="Active Users (30d)"
            value={metrics.overview.activeUsers30Days.toLocaleString()}
            icon={<Users size={32} />}
            color="green"
          />
          <MetricCard
            label="Total Bookings"
            value={metrics.overview.totalBookings.toLocaleString()}
            trend={{
              value: metrics.trends.bookingsTrend.value,
              trend: metrics.trends.bookingsTrend.trend,
              changePercent: metrics.trends.bookingsTrend.changePercent,
            }}
            icon={<ShoppingCart size={32} />}
            color="purple"
          />
        </div>
      </section>

      {/* Revenue Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Revenue</h2>
          <p className="text-gray-600 text-sm mt-1">
            Financial performance and platform earnings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            label="Total Revenue"
            value={formatCurrency(metrics.overview.totalRevenue)}
            trend={{
              value: metrics.trends.revenueTrend.value,
              trend: metrics.trends.revenueTrend.trend,
              changePercent: metrics.trends.revenueTrend.changePercent,
            }}
            icon={<DollarSign size={32} />}
            color="green"
          />
          <MetricCard
            label="Platform Fees"
            value={formatCurrency(metrics.overview.platformFees)}
            icon={<BarChart3 size={32} />}
            color="orange"
          />
          <MetricCard
            label="Avg Booking Value"
            value={formatCurrency(metrics.overview.avgBookingValue)}
            icon={<TrendingUp size={32} />}
            color="purple"
          />
        </div>
      </section>

      {/* Distribution Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">User Distribution</h2>
          <p className="text-gray-600 text-sm mt-1">
            Active users by type and tier
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By User Type */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">By User Type</h3>
            <div className="space-y-3">
              {Object.entries(metrics.distribution.byUserType).map(
                ([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-gray-600 capitalize">{type}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (count /
                                Object.values(
                                  metrics.distribution.byUserType
                                ).reduce((a, b) => a + b, 0)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 w-20 text-right">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* By Tier */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Talent Tiers</h3>
            <div className="space-y-3">
              {Object.entries(metrics.distribution.byTier).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <span className="text-gray-600">{tier}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          tier === 'Platinum'
                            ? 'bg-yellow-400'
                            : tier === 'Gold'
                              ? 'bg-yellow-500'
                              : tier === 'Silver'
                                ? 'bg-gray-400'
                                : 'bg-orange-400'
                        }`}
                        style={{
                          width: `${
                            (count /
                              Object.values(metrics.distribution.byTier).reduce(
                                (a, b) => a + b,
                                0
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="font-semibold text-gray-900 w-20 text-right">
                      {count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Conversion Funnel */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Conversion Metrics</h2>
          <p className="text-gray-600 text-sm mt-1">
            User journey performance
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">New Users</p>
                <p className="text-sm text-gray-600">
                  Total signups this period
                </p>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {(metrics.trends.newUsersTrend.value || 0).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Booking Conversion</p>
                <p className="text-sm text-gray-600">
                  Of active users making bookings
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">
                  {(metrics.trends.conversionRateTrend.value || 0).toFixed(1)}%
                </div>
                <TrendIndicator
                  trend={metrics.trends.conversionRateTrend.trend}
                  changePercent={
                    metrics.trends.conversionRateTrend.changePercent
                  }
                  showLabel={false}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Average Booking Value</p>
                <p className="text-sm text-gray-600">
                  Year-over-year performance
                </p>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics.overview.avgBookingValue)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Performers */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Agencies */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Top Agencies</h2>
            <p className="text-gray-600 text-sm mt-1">
              Best performing agencies by revenue
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {metrics.topAgencies && metrics.topAgencies.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {metrics.topAgencies.slice(0, 5).map((agency, idx) => (
                  <div key={agency.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          #{idx + 1} {agency.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {agency.talentCount} talents
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatCurrency(agency.revenue)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {agency.bookings} bookings
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-yellow-600">
                      <span>★</span>
                      <span>{agency.avgRating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-600">
                No agency data available
              </div>
            )}
          </div>
        </div>

        {/* Top Talents */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Top Talents</h2>
            <p className="text-gray-600 text-sm mt-1">
              Most booked talents by revenue
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {metrics.topTalents && metrics.topTalents.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {metrics.topTalents.slice(0, 5).map((talent, idx) => (
                  <div key={talent.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          #{idx + 1} {talent.name}
                        </p>
                        <p className="text-sm text-gray-600">{talent.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatCurrency(talent.revenue)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {talent.bookings} bookings
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-yellow-600">
                      <span>★</span>
                      <span>{talent.avgRating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-600">
                No talent data available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Anomalies & Alerts */}
      {metrics.anomalies && metrics.anomalies.length > 0 && (
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={28} className="text-red-600" />
              System Alerts
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Detected anomalies requiring attention
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {metrics.anomalies.map((anomaly, idx) => (
                <div
                  key={idx}
                  className={`p-4 ${
                    anomaly.severity === 'high'
                      ? 'bg-red-50'
                      : anomaly.severity === 'medium'
                        ? 'bg-yellow-50'
                        : 'bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={20}
                      className={
                        anomaly.severity === 'high'
                          ? 'text-red-600'
                          : anomaly.severity === 'medium'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                      }
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {anomaly.metricType} - {anomaly.entityType}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Deviation: {anomaly.deviation.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Detected at {new Date(anomaly.detectedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      anomaly.severity === 'high'
                        ? 'bg-red-200 text-red-800'
                        : anomaly.severity === 'medium'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-blue-200 text-blue-800'
                    }`}>
                      {anomaly.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
