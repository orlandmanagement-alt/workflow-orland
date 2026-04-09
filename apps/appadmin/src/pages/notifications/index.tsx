import React, { useEffect, useState } from 'react';
import { Bell, Clock, AlertCircle, Trash2, Eye, EyeOff, Loader2, Download, Filter, X } from 'lucide-react';
import axios from 'axios';

interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'project' | 'talent' | 'booking' | 'payment' | 'system' | 'schedule';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read_at: string | null;
  created_at: string;
  actor?: string;
  metadata?: Record<string, any>;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'critical'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  const API_BASE = 'https://api.orlandmanagement.com/api/v1';

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, [selectedTab, typeFilter, priorityFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedTab === 'unread') params.append('read', 'false');
      if (selectedTab === 'critical') params.append('priority', 'critical');
      if (typeFilter) params.append('type', typeFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const response = await axios.get(
        `${API_BASE}/notifications?${params.toString()}`,
        { withCredentials: true }
      );

      setNotifications(response.data.data || []);
      
      // Fetch stats
      const statsRes = await axios.get(`${API_BASE}/notifications/summary`, 
        { withCredentials: true }
      );
      setStats(statsRes.data.summary);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRead = async (notifId: string, isRead: boolean) => {
    try {
      if (isRead) {
        await axios.delete(`${API_BASE}/notifications/${notifId}`, 
          { withCredentials: true }
        );
      } else {
        await axios.put(`${API_BASE}/notifications/${notifId}/read`, {}, 
          { withCredentials: true }
        );
      }
      fetchNotifications();
    } catch (error) {
      console.error('Failed to update notification:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      await Promise.all(
        selectedNotifications.map(id =>
          axios.delete(`${API_BASE}/notifications/${id}`, 
            { withCredentials: true }
          )
        )
      );
      setSelectedNotifications([]);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notifications:', error);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (!searchQuery) return true;
    return (
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const toggleNotificationSelect = (id: string) => {
    setSelectedNotifications(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900';
      case 'high': return 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900';
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      message: '💬',
      project: '📋',
      talent: '⭐',
      booking: '📅',
      payment: '💳',
      system: '⚙️',
      schedule: '🕐',
    };
    return icons[type] || '🔔';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="text-blue-500" size={32} />
            Notifications Hub
          </h1>
          <p className="text-slate-500 mt-1">Manage system notifications and delivery</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unread</p>
            <p className="text-2xl font-bold text-orange-500 mt-1">{stats.unread}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical</p>
            <p className="text-2xl font-bold text-red-500 mt-1">
              {stats.byPriority['critical'] || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Types</p>
            <p className="text-2xl font-bold text-blue-500 mt-1">{Object.keys(stats.byType).length}</p>
          </div>
        </div>
      )}

      {/* Tabs & Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['all', 'unread', 'critical'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {tab === 'all' && '📋 All'}
                {tab === 'unread' && '🔴 Unread'}
                {tab === 'critical' && '⚠️ Critical'}
              </button>
            ))}
          </div>

          {selectedNotifications.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg font-semibold text-sm transition-all"
            >
              <Trash2 size={16} />
              Delete {selectedNotifications.length}
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          >
            <option value="">📌 All Types</option>
            <option value="message">💬 Message</option>
            <option value="project">📋 Project</option>
            <option value="talent">⭐ Talent</option>
            <option value="booking">📅 Booking</option>
            <option value="payment">💳 Payment</option>
            <option value="system">⚙️ System</option>
            <option value="schedule">🕐 Schedule</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          >
            <option value="">🎯 All Priority</option>
            <option value="low">🔵 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🟠 High</option>
            <option value="critical">🔴 Critical</option>
          </select>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-blue-500" size={24} />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Bell size={32} className="mx-auto mb-2 opacity-50" />
              <p>No notifications found</p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div
                key={notif.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 ${
                  notif.read_at
                    ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notif.id)}
                  onChange={() => toggleNotificationSelect(notif.id)}
                  className="mt-1"
                />
                
                <div className="text-xl">{getTypeIcon(notif.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{notif.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notif.message}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap border ${getPriorityColor(notif.priority)}`}>
                      {notif.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                    <Clock size={12} />
                    {new Date(notif.created_at).toLocaleString()}
                    {notif.read_at && (
                      <>
                        <span>•</span>
                        <Eye size={12} />
                        Read
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleRead(notif.id, !!notif.read_at)}
                  className={`p-2 rounded-lg transition-all ${
                    notif.read_at
                      ? 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                      : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                  }`}
                >
                  {notif.read_at ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
