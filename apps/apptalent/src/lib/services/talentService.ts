import { api } from '../api';

export const talentService = {
  getProfile: async () => {
    // Pastikan '/api' tertulis jelas di sini
    const response = await api.get('/api/v1/talents/me');
    return response.data.data;
  },
  
  updateProfile: async (data: any) => {
    // Pastikan '/api' tertulis jelas di sini
    const response = await api.put('/api/v1/talents/me', data);
    return response.data.data;
  }
};
