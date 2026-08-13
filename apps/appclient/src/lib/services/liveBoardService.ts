/**
 * Live Board Service
 * Handles real-time casting board operations (candidate walk-in monitoring)
 */

import { api } from '@/lib/api';
import { AxiosError } from 'axios';

export interface CastingCandidate {
  id: string;
  talent_id?: string;
  project_id: string;
  name: string;
  phone: string;
  photo_url?: string;
  status: 'waiting' | 'approved' | 'rejected' | 'in_call';
  queue_number?: number;
  entered_at: string;
  notes?: string;
}

export interface LiveBoard {
  id: string;
  project_id: string;
  project_name: string;
  status: 'active' | 'paused' | 'closed';
  location: string;
  candidates_count: number;
  created_at: string;
}

export interface LiveBoardApiResponse {
  status: 'success' | 'error';
  data?: any;
  error?: string;
  message?: string;
}

class LiveBoardService {
  private pollingInterval: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Get live board for a specific project
   */
  async getLiveBoard(projectId: string): Promise<LiveBoard> {
    try {
      const response = await api.get<LiveBoardApiResponse>(
        `/live/${projectId}`,
        { withCredentials: true }
      );

      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || 'Failed to fetch live board');
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Get candidates on live board (polling)
   */
  async getCandidates(projectId: string): Promise<CastingCandidate[]> {
    try {
      const response = await api.get<LiveBoardApiResponse>(
        `/live/${projectId}/candidates`,
        { withCredentials: true }
      );

      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      }

      return [];
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      return [];
    }
  }

  /**
   * Start polling for candidate updates
   * Callback fires when new candidates arrive
   */
  startPolling(
    projectId: string,
    interval: number = 5000,
    onUpdate: (candidates: CastingCandidate[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    this.pollingInterval = setInterval(async () => {
      try {
        const candidates = await this.getCandidates(projectId);
        this.reconnectAttempts = 0; // Reset on successful poll
        onUpdate(candidates);
      } catch (err) {
        this.reconnectAttempts++;
        if (onError) {
          onError(err as Error);
        }

        // Stop polling after max attempts
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.stopPolling();
        }
      }
    }, interval);

    // Return cleanup function
    return () => this.stopPolling();
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Subscribe to candidate updates via WebSocket (future enhancement)
   * For now, uses polling as fallback
   */
  subscribeToUpdates(
    projectId: string,
    onUpdate: (candidate: CastingCandidate) => void,
    onError?: (error: Error) => void
  ): () => void {
    // TODO: Implement WebSocket subscription when backend ready
    // For now, use polling with individual candidate callback

    let lastCandidateIds: Set<string> = new Set();

    const unsubscribe = this.startPolling(
      projectId,
      3000,
      (candidates) => {
        candidates.forEach((candidate) => {
          if (!lastCandidateIds.has(candidate.id)) {
            lastCandidateIds.add(candidate.id);
            onUpdate(candidate);
          }
        });
      },
      onError
    );

    return unsubscribe;
  }

  /**
   * Approve a candidate
   */
  async approveCandidate(
    projectId: string,
    candidateId: string,
    notes?: string
  ): Promise<LiveBoardApiResponse> {
    try {
      const response = await api.patch<LiveBoardApiResponse>(
        `/live/${projectId}/candidates/${candidateId}`,
        {
          status: 'approved',
          notes,
          approved_at: new Date().toISOString(),
        },
        { withCredentials: true }
      );

      return response.data;
    } catch (err) {
      const errorResponse: LiveBoardApiResponse = {
        status: 'error',
        error: (err as AxiosError).message || 'Failed to approve candidate',
      };
      return errorResponse;
    }
  }

  /**
   * Reject a candidate
   */
  async rejectCandidate(
    projectId: string,
    candidateId: string,
    reason?: string
  ): Promise<LiveBoardApiResponse> {
    try {
      const response = await api.patch<LiveBoardApiResponse>(
        `/live/${projectId}/candidates/${candidateId}`,
        {
          status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
        },
        { withCredentials: true }
      );

      return response.data;
    } catch (err) {
      const errorResponse: LiveBoardApiResponse = {
        status: 'error',
        error: (err as AxiosError).message || 'Failed to reject candidate',
      };
      return errorResponse;
    }
  }

  /**
   * Call candidate to stage/audition room
   */
  async callCandidate(
    projectId: string,
    candidateId: string
  ): Promise<LiveBoardApiResponse> {
    try {
      const response = await api.post<LiveBoardApiResponse>(
        `/live/${projectId}/candidates/${candidateId}/call`,
        {
          called_at: new Date().toISOString(),
        },
        { withCredentials: true }
      );

      return response.data;
    } catch (err) {
      const errorResponse: LiveBoardApiResponse = {
        status: 'error',
        error: (err as AxiosError).message || 'Failed to call candidate',
      };
      return errorResponse;
    }
  }

  /**
   * Close live board
   */
  async closeBoard(projectId: string): Promise<LiveBoardApiResponse> {
    try {
      const response = await api.patch<LiveBoardApiResponse>(
        `/live/${projectId}`,
        {
          status: 'closed',
          closed_at: new Date().toISOString(),
        },
        { withCredentials: true }
      );

      return response.data;
    } catch (err) {
      const errorResponse: LiveBoardApiResponse = {
        status: 'error',
        error: (err as AxiosError).message || 'Failed to close board',
      };
      return errorResponse;
    }
  }

  /**
   * Private: Handle API errors
   */
  private handleError(err: any): Error {
    if (err instanceof AxiosError) {
      return new Error(err.response?.data?.error || err.message);
    }
    return err instanceof Error ? err : new Error(String(err));
  }
}

export const liveBoardService = new LiveBoardService();
