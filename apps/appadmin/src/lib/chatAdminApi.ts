import axios from 'axios';

const API_BASE = 'https://api.orlandmanagement.com/api/v1';

export interface ChatThread {
  id: string;
  participants: string[];
  lastMessage?: string;
  messageCount: number;
  flaggedCount: number;
  status: 'active' | 'archived' | 'flagged';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  isFlagged: boolean;
  createdAt: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface ModerationAction {
  threadId: string;
  messageId: string;
  action: 'flag' | 'delete' | 'suspend';
  reason: string;
}

export interface ChatStatistics {
  activeThreads: number;
  totalThreads: number;
  totalMessages: number;
  deletedMessages: number;
  flaggedMessages: number;
  reportedThreads: number;
}

/**
 * Fetch all chat threads with optional filtering
 */
export const fetchChatThreads = async (filters: {
  status?: string;
  userId?: string;
  projectId?: string;
  search?: string;
} = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const response = await axios.get(
    `${API_BASE}/admin/chats?${params.toString()}`,
    { withCredentials: true }
  );

  return response.data.data as ChatThread[];
};

/**
 * Fetch detailed messages for a specific thread
 */
export const fetchThreadMessages = async (threadId: string) => {
  const response = await axios.get(
    `${API_BASE}/admin/chats/${threadId}/messages`,
    { withCredentials: true }
  );

  return response.data.messages as ChatMessage[];
};

/**
 * Apply moderation action to a message
 */
export const moderateMessage = async (action: ModerationAction) => {
  const response = await axios.post(
    `${API_BASE}/admin/chats/moderate`,
    action,
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Delete an entire chat thread
 */
export const deleteThread = async (threadId: string) => {
  const response = await axios.delete(
    `${API_BASE}/admin/chats/${threadId}`,
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Fetch moderation audit logs
 */
export const fetchModerationLogs = async (filters: {
  threadId?: string;
  action?: string;
  limit?: number;
} = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, String(value));
  });

  const response = await axios.get(
    `${API_BASE}/admin/chats/moderation-logs?${params.toString()}`,
    { withCredentials: true }
  );

  return response.data.logs || [];
};

/**
 * Fetch chat statistics
 */
export const fetchChatStatistics = async (): Promise<ChatStatistics> => {
  const response = await axios.get(
    `${API_BASE}/admin/chats/statistics`,
    { withCredentials: true }
  );

  return response.data.statistics;
};
