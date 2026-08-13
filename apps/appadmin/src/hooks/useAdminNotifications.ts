import { useState, useEffect } from 'react';
import axios from 'axios';

interface NotificationPreferences {
  userId: string;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
    sound: boolean;
  };
  types: {
    message: boolean;
    project: boolean;
    talent: boolean;
    booking: boolean;
    payment: boolean;
    system: boolean;
    schedule: boolean;
  };
  scheduleReminders: {
    enabled: boolean;
    times: string[]; // ['24h', '1h']
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface NotificationSummary {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

interface AdminNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read_at: string | null;
  created_at: string;
}

const API_BASE = 'https://api.orlandmanagement.com/api/v1';

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async (filters: {
    type?: string;
    priority?: string;
    read?: boolean;
  } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.read !== undefined) params.append('read', String(filters.read));

      const response = await axios.get(
        `${API_BASE}/notifications?${params.toString()}`,
        { withCredentials: true }
      );

      setNotifications(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/notifications/summary`,
        { withCredentials: true }
      );

      setSummary(response.data.summary);
    } catch (err) {
      console.error('Failed to fetch notification summary:', err);
    }
  };

  const fetchPreferences = async (userId: string) => {
    try {
      const response = await axios.get(
        `${API_BASE}/notifications/settings`,
        { withCredentials: true }
      );

      setPreferences(response.data.preferences);
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  };

  const updatePreferences = async (
    userId: string,
    newPreferences: Partial<NotificationPreferences>
  ) => {
    try {
      await axios.put(
        `${API_BASE}/notifications/settings`,
        newPreferences,
        { withCredentials: true }
      );

      // Refetch after update
      await fetchPreferences(userId);
    } catch (err) {
      console.error('Failed to update preferences:', err);
      throw err;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.put(
        `${API_BASE}/notifications/${notificationId}/read`,
        {},
        { withCredentials: true }
      );

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );

      await fetchSummary();
    } catch (err) {
      console.error('Failed to mark as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${API_BASE}/notifications/read-all`,
        {},
        { withCredentials: true }
      );

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          read_at: new Date().toISOString(),
        }))
      );

      await fetchSummary();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      throw err;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await axios.delete(
        `${API_BASE}/notifications/${notificationId}`,
        { withCredentials: true }
      );

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      await fetchSummary();
    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  };

  return {
    notifications,
    summary,
    preferences,
    loading,
    error,
    fetchNotifications,
    fetchSummary,
    fetchPreferences,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
