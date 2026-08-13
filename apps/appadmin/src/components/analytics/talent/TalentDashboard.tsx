/**
 * Talent Dashboard - Talent-specific analytics
 */

import React from 'react';
import type { TalentDashboard as TalentDashboardType } from '../../types/analytics';
import { MetricCard, TrendIndicator } from '../common/AnalyticsCommon';

interface TalentDashboardProps {
  metrics: TalentDashboardType;
  onRefresh: () => void;
}

export default function TalentDashboard({
  metrics,
  onRefresh,
}: TalentDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="Profile Views" value={metrics?.profileStats?.views || 0} />
        <MetricCard label="Applications" value={metrics?.profileStats?.applications || 0} />
        <MetricCard
          label="Booking Rate"
          value={`${metrics?.profileStats?.bookingRate || 0}%`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="This Month" value={`$${metrics?.earnings?.thisMonth || 0}`} />
        <MetricCard label="Last Month" value={`$${metrics?.earnings?.lastMonth || 0}`} />
        <MetricCard label="Total Earned" value={`$${metrics?.earnings?.totalEarned || 0}`} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Booking History</h3>
        <div className="space-y-2">
          {metrics?.bookingHistory?.length ? (
            metrics.bookingHistory.map((booking: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between items-center p-2 border-b"
              >
                <div>
                  <p className="font-medium">{booking.projectName}</p>
                  <p className="text-sm text-gray-500">{booking.date}</p>
                </div>
                <p className="font-semibold">${booking.amount}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No bookings yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
