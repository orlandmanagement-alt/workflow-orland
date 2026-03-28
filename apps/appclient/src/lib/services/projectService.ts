import { api } from '../api';

export const projectService = {
  // Ambil semua proyek dari D1
  getAll: async () => {
    const { data } = await api.get('/projects');
    return data;
  },
  
  // Ambil detail 1 proyek
  getById: async (id: string) => {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },

  // Simpan Brief Baru ke D1
  create: async (projectData: any) => {
    const { data } = await api.post('/projects', projectData);
    return data;
  },

  // Update Status Kanban di D1
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.put(`/projects/${id}/status`, { status });
    return data;
  }
};
