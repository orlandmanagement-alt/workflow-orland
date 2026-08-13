/**
 * Team Service - Internal Team/Sub-user Management
 * Handles CRUD operations for team members within a client account
 * API Endpoint: /api/v1/client/team
 */

import { api } from '@/lib/api';
import { AxiosError } from 'axios';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  access_level: 'full_access' | 'edit_projects' | 'billing_escrow' | 'view_only';
  status: 'active' | 'pending' | 'suspended' | 'declined';
  phone?: string;
  avatar_url?: string;
  invited_at?: string;
  activated_at?: string;
  last_login?: string;
}

export interface InviteTeamMemberPayload {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  access_level: 'edit_projects' | 'billing_escrow' | 'view_only';
  notes?: string;
}

export interface TeamApiResponse {
  status: 'success' | 'error';
  data?: any;
  error?: string;
  message?: string;
}

export interface TeamStats {
  total_members: number;
  active_members: number;
  pending_invites: number;
  suspended_members: number;
}

class TeamService {
  /**
   * Get all team members for current client account
   */
  async getTeamMembers(filters?: {
    status?: string;
    role?: string;
    search?: string;
  }): Promise<TeamMember[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.role) params.set('role', filters.role);
      if (filters?.search) params.set('search', filters.search);

      const response = await api.get<TeamApiResponse>(
        `/client/team${params.toString() ? '?' + params : ''}`,
        { withCredentials: true }
      );

      if (response.data?.status === 'success' && response.data?.data) {
        return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      }

      return [];
    } catch (err) {
      console.error('Failed to fetch team members:', err);
      return [];
    }
  }

  /**
   * Get single team member details
   */
  async getTeamMember(memberId: string): Promise<TeamMember | null> {
    try {
      const response = await api.get<TeamApiResponse>(
        `/client/team/${memberId}`,
        { withCredentials: true }
      );

      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      }

      return null;
    } catch (err) {
      console.error('Failed to fetch team member:', err);
      return null;
    }
  }

  /**
   * Get team statistics
   */
  async getTeamStats(): Promise<TeamStats | null> {
    try {
      const response = await api.get<TeamApiResponse>(
        `/client/team/stats`,
        { withCredentials: true }
      );

      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      }

      return null;
    } catch (err) {
      console.error('Failed to fetch team stats:', err);
      return null;
    }
  }

  /**
   * Invite new team member
   */
  async inviteTeamMember(payload: InviteTeamMemberPayload): Promise<TeamApiResponse> {
    try {
      const response = await api.post<TeamApiResponse>(
        `/client/team/invite`,
        {
          email: payload.email,
          role: payload.role,
          access_level: payload.access_level,
          notes: payload.notes,
          invited_at: new Date().toISOString(),
        },
        { withCredentials: true }
      );

      return response.data;
    } catch (err) {
      const errorResponse: TeamApiResponse = {
        status: 'error',
        error: (err as AxiosError).message || 'Failed to invite team member',
      };
      return errorResponse;
    }
  }

  /**
   * Update team member role & access level
   */
  async updateTeamMember(
    memberId: string,
    updates: Partial<{
      role: string;
      access_level: string;
      phone: string;
    }>
  ): Promise<TeamApiResponse> {
    try {
      const response = await api.patch<TeamApiResponse>(
        `/client/team/${memberId}`,
        updates,
        { withCredentials: true }
      );

      return response.data;
    } catch (err) {
      const errorResponse: TeamApiResponse = {
        status: 'error',
        error: (err as AxiosError).message || 'Failed to update team member',
      };
      return errorResponse;
    }
  }

  /**
   * Revoke team member access
   */
  async revokeTeamMember(memberId: string, reason?: string): Promise<TeamApiResponse> {
    try {
      const response = await api.delete<TeamApiResponse>(
        `/client/team/${memberId}`,
        {
          data: { reason, revoked_at: new Date().toISOString() },
          withCredentials: true,
        }
      );

      return response.data;
    } catch (err) {
      const errorResponse: TeamApiResponse = {
        status: 'error',
        error: (err as AxiosError).message || 'Failed to revoke team member',
      };
      return errorResponse;
    }
  }

  /**
   * Suspend team member (temporary)
   */
  async suspendTeamMember(memberId: string, reason?: string): Promise<TeamApiResponse> {
    try {
      const response = await api.patch<TeamApiResponse>(
        `/client/team/${memberId}/suspend`,
        { reason, suspended_at: new Date().toISOString() },
        { withCredentials: true }
      );

      return response.data;
    } catch (err) {
      const errorResponse: TeamApiResponse = {
        status: 'error',
        error: (err as AxiosError).message || 'Failed to suspend team member',
      };
      return errorResponse;
    }
  }

  /**
   * Resend invitation to pending member
   */
  async resendInvitation(memberId: string): Promise<TeamApiResponse> {
    try {
      const response = await api.post<TeamApiResponse>(
        `/client/team/${memberId}/resend-invite`,
        { resent_at: new Date().toISOString() },
        { withCredentials: true }
      );

      return response.data;
    } catch (err) {
      const errorResponse: TeamApiResponse = {
        status: 'error',
        error: (err as AxiosError).message || 'Failed to resend invitation',
      };
      return errorResponse;
    }
  }

  /**
   * Get available roles
   */
  async getAvailableRoles(): Promise<
    Array<{ value: string; label: string; description: string }>
  > {
    return [
      {
        value: 'admin',
        label: 'Admin',
        description: 'Full access to projects, team, finance',
      },
      {
        value: 'editor',
        label: 'Editor',
        description: 'Can create/edit projects and manage talent',
      },
      {
        value: 'viewer',
        label: 'Viewer',
        description: 'Read-only access to projects',
      },
    ];
  }

  /**
   * Get available access levels
   */
  async getAvailableAccessLevels(): Promise<
    Array<{ value: string; label: string; permissions: string[] }>
  > {
    return [
      {
        value: 'full_access',
        label: 'Full Access',
        permissions: [
          'create_projects',
          'edit_projects',
          'manage_talent',
          'manage_finance',
          'manage_team',
        ],
      },
      {
        value: 'edit_projects',
        label: 'Edit Projects',
        permissions: ['create_projects', 'edit_projects', 'manage_talent'],
      },
      {
        value: 'billing_escrow',
        label: 'Billing & Escrow',
        permissions: ['view_projects', 'manage_finance'],
      },
      {
        value: 'view_only',
        label: 'View Only',
        permissions: ['view_projects', 'view_talent'],
      },
    ];
  }
}

// Export singleton instance
export const teamService = new TeamService();
