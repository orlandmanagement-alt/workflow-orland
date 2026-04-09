import { useState, useEffect } from 'react';
import axios from 'axios';

interface ChatFilter {
  status?: 'active' | 'archived' | 'flagged';
  userId?: string;
  projectId?: string;
  searchQuery?: string;
}

interface ChatThread {
  id: string;
  participants: string[];
  lastMessage?: string;
  messageCount: number;
  flaggedCount: number;
  status: 'active' | 'archived' | 'flagged';
  createdAt: string;
  updatedAt: string;
}

interface ModerationLog {
  id: string;
  threadId: string;
  action: 'flag' | 'delete' | 'suspend' | 'archive';
  reason: string;
  actor: string;
  timestamp: string;
}

interface ChatStats {
  activeThreads: number;
  totalThreads: number;
  totalMessages: number;
  reportedMessages: number;
  flaggedThreads: number;
}

const API_BASE = 'https://api.orlandmanagement.com/api/v1';

export const useAdminChat = () => {
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = async (filters: ChatFilter = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.searchQuery) params.append('search', filters.searchQuery);

      const response = await axios.get(
        `${API_BASE}/admin/chats?${params.toString()}`,
        { withCredentials: true }
      );

      setChats(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch chats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/admin/chats/statistics`,
        { withCredentials: true }
      );

      setStats(response.data.statistics);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchModerationLogs = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/admin/chats/moderation-logs`,
        { withCredentials: true }
      );

      setModerationLogs(response.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const moderateMessage = async (
    threadId: string,
    messageId: string,
    action: 'flag' | 'delete' | 'suspend',
    reason: string
  ) => {
    try {
      await axios.post(
        `${API_BASE}/admin/chats/moderate`,
        {
          threadId,
          messageId,
          action,
          reason,
        },
        { withCredentials: true }
      );

      // Refetch logs after moderation
      await fetchModerationLogs();
      await fetchStats();
    } catch (err) {
      console.error('Failed to moderate message:', err);
      throw err;
    }
  };

  const deleteThread = async (threadId: string) => {
    try {
      await axios.delete(
        `${API_BASE}/admin/chats/${threadId}`,
        { withCredentials: true }
      );

      // Remove from local state
      setChats(prev => prev.filter(chat => chat.id !== threadId));
      await fetchStats();
    } catch (err) {
      console.error('Failed to delete thread:', err);
      throw err;
    }
  };

  return {
    chats,
    stats,
    moderationLogs,
    loading,
    error,
    fetchChats,
    fetchStats,
    fetchModerationLogs,
    moderateMessage,
    deleteThread,
  };
};
