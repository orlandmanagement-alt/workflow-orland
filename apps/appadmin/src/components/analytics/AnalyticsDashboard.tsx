/**
 * Mission 5: Analytics Dashboard - Main Component
 * 
 * Purpose: Main dashboard component with dashboard type routing
 */

import React, { useState } from 'react';
import { Calendar, Download, RefreshCw, AlertCircle } from 'lucide-react';
import {
  useAdminDashboard,
  useAgencyDashboard,
  useTalentDashboard,
  useClientDashboard,
  useExport,
} from '../hooks/useAnalytics';
import { DateRange, ExportRequest } from '../types/analytics';
import AdminDashboard from './admin/AdminDashboard';
import AgencyDashboard from './agency/AgencyDashboard';
import TalentDashboard from './talent/TalentDashboard';
import ClientDashboard from './client/ClientDashboard';
import ExportDialog from './common/ExportDialog';
import DateRangeSelector from './common/DateRangeSelector';

interface AnalyticsDashboardProps {
  userType: 'talent' | 'agency' | 'client' | 'admin';
  userId: string;
}

export default function AnalyticsDashboard({
  userType,
  userId,
}: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [showExportDialog, setShowExportDialog] = useState(false);

  // Fetch appropriate dashboard data based on user type
  const adminDashboard = useAdminDashboard(dateRange);
  const agencyDashboard = useAgencyDashboard(userId, dateRange);
  const talentDashboard = useTalentDashboard(userId, dateRange);
  const clientDashboard = useClientDashboard(userId, dateRange);
  const { startExport, exportJob, loading: exportLoading } = useExport();

  // Select the appropriate dashboard data based on user type
  let currentDashboard, refetch;

  switch (userType) {
    case 'admin':
      currentDashboard = adminDashboard;
      refetch = adminDashboard.refetch;
      break;
    case 'agency':
      currentDashboard = agencyDashboard;
      refetch = agencyDashboard.refetch;
      break;
    case 'talent':
      currentDashboard = talentDashboard;
      refetch = talentDashboard.refetch;
      break;
    case 'client':
      currentDashboard = clientDashboard;
      refetch = clientDashboard.refetch;
      break;
    default:
      currentDashboard = adminDashboard;
      refetch = adminDashboard.refetch;
  }

  const handleExport = async (request: ExportRequest) => {
    try {
      await startExport(request);
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getDashboardTitle = () => {
    switch (userType) {
      case 'admin':
        return 'Platform Analytics';
      case 'agency':
        return 'Agency Dashboard';
      case 'talent':
        return 'Talent Analytics';
      case 'client':
        return 'Client Dashboard';
      default:
        return 'Analytics Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getDashboardTitle()}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Real-time analytics and insights
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Date Range Selector */}
              <DateRangeSelector
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />

              {/* Refresh Button */}
              <button
                onClick={() => refetch()}
                disabled={currentDashboard.loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                title="Refresh dashboard data"
              >
                <RefreshCw
                  size={18}
                  className={currentDashboard.loading ? 'animate-spin' : ''}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Export Button */}
              <button
                onClick={() => setShowExportDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {currentDashboard.loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {currentDashboard.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm">{currentDashboard.error}</p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!currentDashboard.loading && currentDashboard.metrics && (
          <>
            {userType === 'admin' && (
              <AdminDashboard
                metrics={currentDashboard.metrics}
                onRefresh={() => refetch()}
              />
            )}
            {userType === 'agency' && (
              <AgencyDashboard
                metrics={currentDashboard.metrics}
                onRefresh={() => refetch()}
              />
            )}
            {userType === 'talent' && (
              <TalentDashboard
                metrics={currentDashboard.metrics}
                onRefresh={() => refetch()}
              />
            )}
            {userType === 'client' && (
              <ClientDashboard
                metrics={currentDashboard.metrics}
                onRefresh={() => refetch()}
              />
            )}
          </>
        )}
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        dashboardType={userType}
        onExport={handleExport}
        loading={exportLoading}
        exportJob={exportJob}
      />
    </div>
  );
}
