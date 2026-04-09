/**
 * Admin API Client Utilities
 * Centralized API calls for admin operations
 */

export interface AdminApiOptions {
  credentials?: RequestCredentials;
  timeout?: number;
}

const DEFAULT_OPTIONS: AdminApiOptions = {
  credentials: 'include',
  timeout: 30000
};

class AdminApiClient {
  private baseUrl = '/api/v1/admin';

  async request<T>(
    endpoint: string,
    options: RequestInit & AdminApiOptions = {}
  ): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
    const { credentials = 'include', timeout = 30000, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const url = this.baseUrl + endpoint;
      const response = await fetch(url, {
        ...fetchOptions,
        credentials,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers
        }
      });

      const json = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: json.message || json.error || 'Unknown error',
          message: json.message
        };
      }

      return {
        success: json.status === 'success',
        data: json.data,
        message: json.message
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout'
        };
      }
      return {
        success: false,
        error: error.message || 'Network error'
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * User Management APIs
   */

  getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    return this.request(`/users?${queryParams}`, {
      method: 'GET'
    });
  }

  getUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: 'GET'
    });
  }

  updateUserStatus(userId: string, status: 'active' | 'suspended' | 'deleted', reason?: string) {
    return this.request(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason })
    });
  }

  resetUserPassword(userId: string) {
    return this.request(`/users/${userId}/password/reset`, {
      method: 'PATCH'
    });
  }

  /**
   * Talent Verification APIs
   */

  getPendingTalents(params: { page?: number; limit?: number } = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));

    return this.request(`/talents/pending?${queryParams}`, {
      method: 'GET'
    });
  }

  verifyTalent(talentId: string, approvalNotes?: string) {
    return this.request(`/talents/${talentId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ approvalNotes })
    });
  }

  rejectTalent(talentId: string, rejectionReason: string) {
    return this.request(`/talents/${talentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason })
    });
  }

  /**
   * Project Moderation APIs
   */

  getProjects(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    return this.request(`/projects?${queryParams}`, {
      method: 'GET'
    });
  }

  deleteProject(projectId: string, reason: string, details?: string) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason, details })
    });
  }

  updateProjectStatus(
    projectId: string,
    status: 'closed' | 'cancelled',
    reason?: string
  ) {
    return this.request(`/projects/${projectId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason })
    });
  }

  /**
   * Analytics & Reporting APIs
   */

  getAdminStats() {
    return this.request('/stats/overview', {
      method: 'GET'
    });
  }

  getAuditLogs(limit: number = 50) {
    return this.request(`/audit-logs?limit=${Math.min(500, limit)}`, {
      method: 'GET'
    });
  }
}

export const adminApi = new AdminApiClient();
