import { api } from '../api';

export const projectService = {
  // Fungsi ini yang nanti dipanggil oleh tombol + Project
  createProject: async (projectData: any) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Gagal membuat project:', error);
      throw error;
    }
  },
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/client-stats');
    return response.data;
  }
};
