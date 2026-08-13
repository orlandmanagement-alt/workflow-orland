import React, { useEffect, useState } from 'react';
import { MessageSquare, AlertCircle, Trash2, Flag, Loader2 } from 'lucide-react';
import { fetchChatStatistics } from '@/lib/chatAdminApi';

interface ChatStatsData {
  activeThreads: number;
  totalThreads: number;
  totalMessages: number;
  deletedMessages: number;
  flaggedMessages: number;
  reportedThreads: number;
}

export default function ChatStatsWidget() {
  const [stats, setStats] = useState<ChatStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchChatStatistics();
        setStats(data);
      } catch (error) {
        console.error('Failed to load chat stats:', error);
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

  const statItems = [
    {
      icon: MessageSquare,
      label: 'Active Threads',
      value: stats.activeThreads,
      color: 'bg-blue-500',
    },
    {
      icon: AlertCircle,
      label: 'Reported',
      value: stats.reportedThreads,
      color: 'bg-orange-500',
    },
    {
      icon: Flag,
      label: 'Flagged Messages',
      value: stats.flaggedMessages,
      color: 'bg-red-500',
    },
    {
      icon: Trash2,
      label: 'Deleted Messages',
      value: stats.deletedMessages,
      color: 'bg-slate-500',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <MessageSquare className="text-blue-500" size={24} />
        Chat Activity
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {statItems.map((item, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-600"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${item.color} bg-opacity-10`}>
                <item.icon className={`text-${item.color.split('-')[1]}-500`} size={16} />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {item.label}
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {item.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-500 text-center pt-2">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
