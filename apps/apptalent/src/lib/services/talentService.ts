import { api } from '../api';

export const talentService = {
  getProfile: async () => {
    // URL Baku sesuai router backend
    const response = await api.get('/api/v1/talents/me');
    return response.data.data;
  },
  updateProfile: async (data: any) => {
    // URL Baku sesuai router backend
    const response = await api.put('/api/v1/talents/me', data);
    return response.data.data;
  }
};
