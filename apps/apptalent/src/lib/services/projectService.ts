import { api } from '../api';

export const projectService = {
  getProjects: async () => {
    try {
      const res = await api('/projects');
      return res?.data || [];
    } catch (error) {
      console.warn("API Proyek belum siap, mengembalikan array kosong.");
      return []; // Mengembalikan kosong dengan anggun
    }
  },
  getProjectById: async (id: string) => {
    try {
      const res = await api(`/projects/${id}`);
      return res?.data || {};
    } catch (error) {
      return { id, title: 'Proyek Tidak Ditemukan', status: 'Unknown' };
    }
  },
  getAvailableProjects: async () => {
    try {
      const res = await api('/projects/available');
      return res?.data || [];
    } catch (error) {
      console.warn("Gagal menarik daftar open casting.");
      return [];
    }
  },
  getMatchScore: async (profileData: any) => {
    try {
      const res = await api('/projects/match-score', {
        method: 'POST',
        data: profileData
      });
      return res?.data || { score: 0 };
    } catch (error) {
      return { score: 0 };
    }
  }
};
