/**
 * Mission 5: Analytics Dashboard - Common Components
 * 
 * Purpose: Reusable components for dashboards
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Download,
  X,
  Calendar,
} from 'lucide-react';
import { MetricTrend, DateRange, ExportRequest, ExportJob } from '../types/analytics';

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: MetricTrend;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  onClick?: () => void;
  loading?: boolean;
}

export function MetricCard({
  label,
  value,
  trend,
  icon,
  color = 'blue',
  onClick,
  loading = false,
}: MetricCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      onClick={onClick}
      className={`${colors.bg} border ${colors.border} rounded-lg p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? '...' : value}
          </p>

          {trend && (
            <TrendIndicator
              trend={trend.trend}
              changePercent={trend.changePercent}
            />
          )}
        </div>

        {icon && <div className={`${colors.icon} text-3xl`}>{icon}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// TREND INDICATOR COMPONENT
// ============================================================================

interface TrendIndicatorProps {
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
  showLabel?: boolean;
}

export function TrendIndicator({
  trend = 'stable',
  changePercent = 0,
  showLabel = true,
}: TrendIndicatorProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={16} className="text-green-600" />;
      case 'down':
        return <TrendingDown size={16} className="text-red-600" />;
      default:
        return <Minus size={16} className="text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center gap-1 mt-2 ${getTrendColor()}`}>
      {getTrendIcon()}
      {showLabel && (
        <span className="text-sm font-medium">
          {Math.abs(changePercent || 0).toFixed(1)}% {trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : 'stable'}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// DATE RANGE SELECTOR COMPONENT
// ============================================================================

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  presets?: Array<{
    label: string;
    getValue: () => DateRange;
  }>;
}

export function DateRangeSelector({
  dateRange,
  onDateRangeChange,
  presets = [
    {
      label: 'Last 7 days',
      getValue: () => ({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }),
    },
    {
      label: 'Last 30 days',
      getValue: () => ({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }),
    },
    {
      label: 'Last 90 days',
      getValue: () => ({
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }),
    },
  ],
}: DateRangeSelectorProps) {
  const [showPicker, setShowPicker] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
      >
        <Calendar size={18} />
        <span className="text-sm">
          {dateRange.startDate} to {dateRange.endDate}
        </span>
      </button>

      {showPicker && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          <div className="p-3">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  onDateRangeChange(preset.getValue());
                  setShowPicker(false);
                }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                {preset.label}
              </button>
            ))}

            <div className="border-t border-gray-200 my-2 pt-2">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    onDateRangeChange({
                      ...dateRange,
                      startDate: e.target.value,
                    })
                  }
                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    onDateRangeChange({
                      ...dateRange,
                      endDate: e.target.value,
                    })
                  }
                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>
              <button
                onClick={() => setShowPicker(false)}
                className="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT DIALOG COMPONENT
// ============================================================================

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardType: string;
  onExport: (request: ExportRequest) => Promise<void>;
  loading?: boolean;
  exportJob?: ExportJob | null;
}

export function ExportDialog({
  open,
  onOpenChange,
  dashboardType,
  onExport,
  loading = false,
  exportJob,
}: ExportDialogProps) {
  const [format, setFormat] = React.useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [dateRange, setDateRange] = React.useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const handleExport = async () => {
    await onExport({
      dashboardType,
      format,
      dateRangeStart: dateRange.startDate,
      dateRangeEnd: dateRange.endDate,
      includeCharts: true,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Export Report</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <div className="space-y-2">
              {(['pdf', 'csv', 'excel'] as const).map((f) => (
                <label key={f} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value={f}
                    checked={format === f}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="rounded border-gray-300"
                  />
                  <span className="capitalize">{f}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    startDate: e.target.value,
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    endDate: e.target.value,
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Export Status */}
          {exportJob && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm">
                <strong>Status:</strong> {exportJob.status}
              </p>
              {exportJob.progress > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${exportJob.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {exportJob.progress}%
                  </p>
                </div>
              )}
              {exportJob.status === 'complete' && exportJob.fileUrl && (
                <a
                  href={exportJob.fileUrl}
                  download
                  className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:underline text-sm"
                >
                  <Download size={14} />
                  Download
                </a>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading || exportJob?.status === 'processing'}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download size={18} />
            {loading ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
