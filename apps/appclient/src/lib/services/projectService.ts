import { api } from '@/lib/api';
import { ProjectDraftState } from '@/store/useProjectDraftStore';

export const projectService = {
  // Create a new project
  createProject: async (draft: ProjectDraftState) => {
    // Nested JSON Transform sesuai instruksi Backend Cloudflare D1
    const payload = {
      title: draft.title,
      description: draft.description,
      visibility: draft.visibility,
      category_specific_data: draft.category_specific_data,
      roles: draft.roles.map(r => ({
        role_name: r.role_name,
        quantity: r.quantity,
        gender: r.gender,
        age_min: r.age_min,
        age_max: r.age_max,
        budget: r.budget
      }))
    };

    try {
      const response = await api('/projects', {
        method: 'POST',
        data: payload
      });
      return response?.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Gagal mempublikasikan proyek. Cek kembali koneksi Anda.');
    }
  },

  // Fetch all projects for current client
  getMyProjects: async () => {
    try {
      const response = await api.get('/projects/me');
      return response.data?.data ?? [];
    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
      return [];
    }
  },

  // Fetch projects by status (Draft, Casting, Production, Done)
  getProjectsByStatus: async (status: 'draft' | 'casting' | 'production' | 'done') => {
    try {
      const response = await api.get(`/projects/me?status=${status}`);
      return response.data?.data ?? [];
    } catch (error: any) {
      console.error('Failed to fetch projects by status:', error);
      return [];
    }
  },

  // Fetch project details with talents and roles
  getProjectDetail: async (projectId: string) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data?.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Gagal memuat detail proyek');
    }
  },

  // Update project
  updateProject: async (projectId: string, data: any) => {
    try {
      const response = await api.patch(`/projects/${projectId}`, data);
      return response.data?.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Gagal mengupdate proyek');
    }
  },

  // Get available talent based on project requirements
  searchTalent: async (query: string, filters?: any) => {
    try {
      const response = await api.get('/talents/search', {
        params: {
          q: query,
          ...filters
        }
      });
      return response.data?.data ?? [];
    } catch (error: any) {
      console.error('Failed to search talent:', error);
      return [];
    }
  },

  // Filter talents for a project
  filterTalents: async (projectId: string, filters?: {
    category?: string;
    gender?: string;
    location?: string;
    min_rate?: number;
    max_rate?: number;
    limit?: number;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.gender) params.append('gender', filters.gender);
      if (filters?.location) params.append('location', filters.location);
      if (filters?.min_rate !== undefined) params.append('min_rate', String(filters.min_rate));
      if (filters?.max_rate !== undefined) params.append('max_rate', String(filters.max_rate));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const response = await api.get(`/projects/${projectId}/talents/filter?${params}`);
      return response.data?.data ?? [];
    } catch (error: any) {
      console.error('Failed to filter talents:', error);
      return [];
    }
  },

  // Copy project roles from another project
  copyRoles: async (projectId: string, sourceProjectId: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/copy-roles`, {
        source_project_id: sourceProjectId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to copy roles');
    }
  },

  // Copy project tools from another project
  copyTools: async (projectId: string, sourceProjectId: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/copy-tools`, {
        source_project_id: sourceProjectId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to copy tools');
    }
  },

  // Duplicate a project
  duplicateProject: async (projectId: string, options?: {
    title_suffix?: string;
    include_roles?: boolean;
    include_tools?: boolean;
  }) => {
    try {
      const response = await api.post(`/projects/${projectId}/copy`, {
        title_suffix: options?.title_suffix || ' (Copy)',
        include_roles: options?.include_roles !== false,
        include_tools: options?.include_tools || false
      });
      return response.data?.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to duplicate project');
    }
  }
};
