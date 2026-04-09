/**
 * Mission 5: Custom Report Builder
 * 
 * Purpose: UI for creating and managing custom reports
 */

import React, { useState } from 'react';
import { Plus, X, Save, Eye, Trash2, Clock } from 'lucide-react';
import { useCustomReports, useExport } from '../hooks/useAnalytics';
import { CustomReportFormData, DateRange } from '../types/analytics';

// Available metrics for different dashboard types
const AVAILABLE_METRICS = {
  talent: [
    { id: 'views', label: 'Profile Views' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'revenue', label: 'Total Earnings' },
    { id: 'rating', label: 'Average Rating' },
    { id: 'completionRate', label: 'Completion Rate' },
    { id: 'responseTime', label: 'Response Time' },
  ],
  agency: [
    { id: 'portfolioViews', label: 'Portfolio Views' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'revenue', label: 'Total Revenue' },
    { id: 'avgTalentRating', label: 'Avg Talent Rating' },
    { id: 'clientRetention', label: 'Client Retention' },
    { id: 'talentRosterSize', label: 'Talent Roster Size' },
  ],
  client: [
    { id: 'totalSpent', label: 'Total Spent' },
    { id: 'bookingsCount', label: 'Bookings' },
    { id: 'avgBookingValue', label: 'Average Booking Value' },
    { id: 'repeatTalentRate', label: 'Repeat Talent Rate' },
    { id: 'churnRisk', label: 'Churn Risk' },
  ],
  admin: [
    { id: 'totalUsers', label: 'Total Users' },
    { id: 'activeUsers', label: 'Active Users' },
    { id: 'totalBookings', label: 'Total Bookings' },
    { id: 'totalRevenue', label: 'Total Revenue' },
    { id: 'platformFees', label: 'Platform Fees' },
    { id: 'conversionRate', label: 'Conversion Rate' },
  ],
};

const AVAILABLE_DIMENSIONS = [
  { id: 'date', label: 'Date' },
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
  { id: 'category', label: 'Category' },
  { id: 'status', label: 'Status' },
  { id: 'tier', label: 'Tier' },
];

const CHART_TYPES = [
  { id: 'line', label: 'Line Chart' },
  { id: 'bar', label: 'Bar Chart' },
  { id: 'pie', label: 'Pie Chart' },
  { id: 'heatmap', label: 'Heatmap' },
];

const SCHEDULE_OPTIONS = [
  { id: 'once', label: 'One Time', disabled: false },
  { id: 'daily', label: 'Daily', disabled: false },
  { id: 'weekly', label: 'Weekly', disabled: false },
  { id: 'monthly', label: 'Monthly', disabled: false },
];

// ============================================================================
// CUSTOM REPORT BUILDER COMPONENT
// ============================================================================

interface CustomReportBuilderProps {
  dashboardType: 'talent' | 'agency' | 'client' | 'admin';
  onReportCreated?: (reportId: string) => void;
}

export default function CustomReportBuilder({
  dashboardType,
  onReportCreated,
}: CustomReportBuilderProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [formData, setFormData] = useState<CustomReportFormData>({
    reportName: '',
    dashboardType,
    selectedMetrics: [],
    selectedDimensions: [],
    chartType: 'line',
    filters: {},
    sortOrder: [],
  });
  const [previewActive, setPreviewActive] = useState(false);

  const { reports, createReport, loading } = useCustomReports();
  const { startExport, exportJob } = useExport();

  const handleMetricToggle = (metricId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedMetrics: prev.selectedMetrics.includes(metricId)
        ? prev.selectedMetrics.filter((m) => m !== metricId)
        : [...prev.selectedMetrics, metricId],
    }));
  };

  const handleDimensionToggle = (dimensionId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedDimensions: prev.selectedDimensions.includes(dimensionId)
        ? prev.selectedDimensions.filter((d) => d !== dimensionId)
        : [...prev.selectedDimensions, dimensionId],
    }));
  };

  const handleSaveReport = async () => {
    if (!formData.reportName.trim()) {
      alert('Please enter a report name');
      return;
    }

    if (formData.selectedMetrics.length === 0) {
      alert('Please select at least one metric');
      return;
    }

    try {
      await createReport(formData);
      setFormData({
        reportName: '',
        dashboardType,
        selectedMetrics: [],
        selectedDimensions: [],
        chartType: 'line',
        filters: {},
        sortOrder: [],
      });
      setShowBuilder(false);
      onReportCreated?.();
    } catch (error) {
      console.error('Failed to create report:', error);
      alert('Failed to create report');
    }
  };

  const handleExportReport = async (reportId: string) => {
    try {
      const report = reports.find((r) => r.id === reportId);
      if (!report) return;

      await startExport({
        dashboardType,
        format: 'pdf',
        dateRangeStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        dateRangeEnd: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const metrics = AVAILABLE_METRICS[dashboardType] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Reports</h2>
          <p className="text-gray-600 text-sm mt-1">
            Create and manage personalized reports
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          New Report
        </button>
      </div>

      {/* Report List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.length > 0 ? (
          reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                  {report.report_name}
                </h3>
                <button
                  onClick={() =>
                    // Delete report - would need a delete function
                    console.log('Delete', report.id)
                  }
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {report.dashboard_type}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Views:</strong> {report.view_count}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Created:</strong>{' '}
                  {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewActive(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                >
                  <Eye size={16} />
                  Preview
                </button>
                <button
                  onClick={() => handleExportReport(report.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Save size={16} />
                  Export
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-600 mb-4">No custom reports yet</p>
            <button
              onClick={() => setShowBuilder(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Create First Report
            </button>
          </div>
        )}
      </div>

      {/* Builder Modal */}
      {showBuilder && (
        <ReportBuilderModal
          dashboardType={dashboardType}
          formData={formData}
          onFormChange={setFormData}
          onSave={handleSaveReport}
          onClose={() => setShowBuilder(false)}
          loading={loading}
        />
      )}
    </div>
  );
}

// ============================================================================
// REPORT BUILDER MODAL COMPONENT
// ============================================================================

interface ReportBuilderModalProps {
  dashboardType: string;
  formData: CustomReportFormData;
  onFormChange: (data: CustomReportFormData) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

function ReportBuilderModal({
  dashboardType,
  formData,
  onFormChange,
  onSave,
  onClose,
  loading,
}: ReportBuilderModalProps) {
  const metrics = AVAILABLE_METRICS[dashboardType as keyof typeof AVAILABLE_METRICS] || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Create Custom Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Report Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Name *
            </label>
            <input
              type="text"
              value={formData.reportName}
              onChange={(e) =>
                onFormChange({ ...formData, reportName: e.target.value })
              }
              placeholder="e.g., Monthly Revenue Analysis"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Metrics Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Metrics * ({formData.selectedMetrics.length} selected)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {metrics.map((metric) => (
                <label
                  key={metric.id}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedMetrics.includes(metric.id)}
                    onChange={() => handleMetricToggle(metric.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{metric.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dimensions Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Group By Dimensions ({formData.selectedDimensions.length} selected)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_DIMENSIONS.map((dimension) => (
                <label
                  key={dimension.id}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedDimensions.includes(dimension.id)}
                    onChange={() => handleDimensionToggle(dimension.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{dimension.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Chart Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chart Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CHART_TYPES.map((chart) => (
                <label
                  key={chart.id}
                  className={`p-3 border rounded-lg cursor-pointer text-center transition ${
                    formData.chartType === chart.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="chartType"
                    value={chart.id}
                    checked={formData.chartType === chart.id}
                    onChange={(e) =>
                      onFormChange({
                        ...formData,
                        chartType: e.target.value as any,
                      })
                    }
                    className="sr-only"
                  />
                  <span className="text-sm">{chart.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Schedule (Optional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SCHEDULE_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={`p-3 border rounded-lg cursor-pointer text-center text-sm ${
                    formData.scheduleFrequency === option.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="schedule"
                    value={option.id}
                    checked={formData.scheduleFrequency === option.id}
                    onChange={(e) =>
                      onFormChange({
                        ...formData,
                        scheduleFrequency: e.target.value as any,
                      })
                    }
                    disabled={option.disabled}
                    className="sr-only"
                  />
                  <Clock size={16} className="mx-auto mb-1" />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function handleMetricToggle(metricId: string) {
  // Implementation in component
}

function handleDimensionToggle(dimensionId: string) {
  // Implementation in component
}
