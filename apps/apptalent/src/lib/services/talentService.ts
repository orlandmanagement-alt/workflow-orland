import { api } from '../api';

export const talentService = {
  getProfile: async () => {
    const response = await api.get('/talent/profile');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await api.put('/talent/profile', data);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/talent/stats');
    return response.data;
  }
};
