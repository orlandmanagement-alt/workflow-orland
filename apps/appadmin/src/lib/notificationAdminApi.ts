import axios from 'axios';

const API_BASE = 'https://api.orlandmanagement.com/api/v1';

export interface AdminNotification {
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

export interface NotificationPreferences {
  userId: string;
  message_email: boolean;
  message_push: boolean;
  message_sms: boolean;
  message_sound: boolean;
  project_email: boolean;
  project_push: boolean;
  talent_email: boolean;
  talent_push: boolean;
  booking_email: boolean;
  booking_push: boolean;
  payment_email: boolean;
  payment_push: boolean;
  system_email: boolean;
  system_push: boolean;
  schedule_email: boolean;
  schedule_push: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  schedule_reminders_enabled: boolean;
  schedule_reminders_24h: boolean;
  schedule_reminders_1h: boolean;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

/**
 * Fetch notifications with optional filtering
 */
export const fetchNotifications = async (filters: {
  type?: string;
  priority?: string;
  read?: boolean;
  limit?: number;
  offset?: number;
} = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });

  const response = await axios.get(
    `${API_BASE}/notifications?${params.toString()}`,
    { withCredentials: true }
  );

  return response.data.data as AdminNotification[];
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (notificationId: string) => {
  const response = await axios.put(
    `${API_BASE}/notifications/${notificationId}/read`,
    {},
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
  const response = await axios.put(
    `${API_BASE}/notifications/read-all`,
    {},
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Get notification preferences for current user
 */
export const fetchNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await axios.get(
    `${API_BASE}/notifications/settings`,
    { withCredentials: true }
  );

  return response.data.preferences;
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>
) => {
  const response = await axios.put(
    `${API_BASE}/notifications/settings`,
    preferences,
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Get notification summary (counts by type and priority)
 */
export const fetchNotificationSummary = async (): Promise<NotificationSummary> => {
  const response = await axios.get(
    `${API_BASE}/notifications/summary`,
    { withCredentials: true }
  );

  return response.data.summary;
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string) => {
  const response = await axios.delete(
    `${API_BASE}/notifications/${notificationId}`,
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Bulk delete notifications
 */
export const bulkDeleteNotifications = async (notificationIds: string[]) => {
  const promises = notificationIds.map(id =>
    axios.delete(`${API_BASE}/notifications/${id}`, { withCredentials: true })
  );

  const responses = await Promise.all(promises);
  return responses.map(r => r.data);
};
