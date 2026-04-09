/**
 * Client Dashboard - Brand/Client-specific analytics
 */

import React from 'react';
import type { ClientDashboard as ClientDashboardType } from '../../types/analytics';
import { MetricCard } from '../common/AnalyticsCommon';

interface ClientDashboardProps {
  metrics: ClientDashboardType;
  onRefresh: () => void;
}

export default function ClientDashboard({
  metrics,
  onRefresh,
}: ClientDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Total Projects" value={metrics?.projectMetrics?.total || 0} />
        <MetricCard label="Active Projects" value={metrics?.projectMetrics?.active || 0} />
        <MetricCard label="Completed" value={metrics?.projectMetrics?.completed || 0} />
        <MetricCard label="Budget" value={`$${metrics?.projectMetrics?.budget || 0}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="Talents Hired" value={metrics?.talentMetrics?.hired || 0} />
        <MetricCard label="Favorites" value={metrics?.talentMetrics?.favorites || 0} />
        <MetricCard
          label="Avg Rating"
          value={`${(metrics?.talentMetrics?.avgRating || 0).toFixed(1)}/5`}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Projects</h3>
        <div className="space-y-2">
          {metrics?.recentProjects?.length ? (
            metrics.recentProjects.map((project: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between items-center p-2 border-b"
              >
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-gray-500">
                    {project.talentCount} talents • ${project.budget}
                  </p>
                </div>
                <span className="text-sm font-semibold text-green-600">{project.status}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No projects yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
