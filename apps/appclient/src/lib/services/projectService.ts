import { apiRequest } from '../api';
import { ProjectDraftState } from '@/store/useProjectDraftStore';

export const projectService = {
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
      const response = await apiRequest('/projects', {
        method: 'POST',
        data: payload
      });
      return response?.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Gagal mempublikasikan proyek. Cek kembali koneksi Anda.');
    }
  }
};
