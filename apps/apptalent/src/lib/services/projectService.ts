import { apiRequest } from '../api';

export const projectService = {
  getProjects: async () => {
    try {
      const res = await apiRequest('/projects');
      return res?.data || [];
    } catch (error) {
      console.warn("API Proyek belum siap, mengembalikan array kosong.");
      return []; // Mengembalikan kosong dengan anggun
    }
  },
  getProjectById: async (id: string) => {
    try {
      const res = await apiRequest(`/projects/${id}`);
      return res?.data || {};
    } catch (error) {
      return { id, title: 'Proyek Tidak Ditemukan', status: 'Unknown' };
    }
  }
};
