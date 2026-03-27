import { api } from '../api';

export const talentService = {
  getProfile: async () => {
    // Akan otomatis menggabung menjadi: https://api.orlandmanagement.com/api/v1/talents/me
    const response = await api.get('/talents/me');
    return response.data.data;
  },
  
  updateProfile: async (data: any) => {
    const response = await api.put('/talents/me', data);
    return response.data.data;
  }
};
