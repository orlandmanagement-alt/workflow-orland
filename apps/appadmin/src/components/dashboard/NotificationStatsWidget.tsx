import React, { useEffect, useState } from 'react';
import { Bell, AlertCircle, Loader2 } from 'lucide-react';
import { fetchNotificationSummary } from '@/lib/notificationAdminApi';

interface NotificationStatsData {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export default function NotificationStatsWidget() {
  const [stats, setStats] = useState<NotificationStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchNotificationSummary();
        setStats(data);
      } catch (error) {
        console.error('Failed to load notification stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-blue-500" size={24} />
      </div>
    );
  }

  const priorityItems = [
    {
      label: 'Critical',
      value: stats.byPriority['critical'] || 0,
      color: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'High',
      value: stats.byPriority['high'] || 0,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: 'Medium',
      value: stats.byPriority['medium'] || 0,
      color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      label: 'Low',
      value: stats.byPriority['low'] || 0,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <Bell className="text-orange-500" size={24} />
        Notification Overview
      </h3>

      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Notifications</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Unread</p>
            <p className="text-3xl font-bold text-red-500 text-right">{stats.unread}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">By Priority</p>
        <div className="grid grid-cols-2 gap-2">
          {priorityItems.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border border-slate-200 dark:border-slate-600 ${item.color}`}
            >
              <p className="text-xs font-semibold">{item.label}</p>
              <p className="text-xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-500 text-center pt-2">
        {Object.keys(stats.byType).length} notification types active
      </div>
    </div>
  );
}
