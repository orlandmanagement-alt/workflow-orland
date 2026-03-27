import { api } from '../api';

export const talentService = {
  // Mengambil data profil sendiri (GET /api/v1/talents/me)
  getProfile: async () => {
    const response = await api.get('/api/v1/talents/me');
    // Sesuai respon backend: { status: 'ok', data: { ... } }
    return response.data.data;
  },

  // Menyimpan/mengupdate profil sendiri (PUT /api/v1/talents/me)
  updateProfile: async (data: any) => {
    const response = await api.put('/api/v1/talents/me', data);
    return response.data.data;
  }
};
