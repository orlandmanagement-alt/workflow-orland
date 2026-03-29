import { api } from '../api';

export const talentService = {
  // ───── Profile ─────
  getProfile: async () => {
    const response = await api.get('/talents/me');
    return response.data.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/talents/me', data);
    return response.data.data;
  },

  // ───── Experience ─────
  getExperiences: async () => {
    const response = await api.get('/talents/me/experiences');
    return response.data.data ?? [];
  },

  addExperience: async (data: any) => {
    const response = await api.post('/talents/me/experiences', data);
    return response.data.data;
  },

  deleteExperience: async (id: string) => {
    const response = await api.delete(`/talents/me/experiences/${id}`);
    return response.data;
  },

  // ───── Certifications ─────
  getCertifications: async () => {
    const response = await api.get('/talents/me/certifications');
    return response.data.data ?? [];
  },

  addCertification: async (data: any) => {
    const response = await api.post('/talents/me/certifications', data);
    return response.data.data;
  },

  deleteCertification: async (id: string) => {
    const response = await api.delete(`/talents/me/certifications/${id}`);
    return response.data;
  },

  // ───── Rate Cards ─────
  getRateCards: async () => {
    const response = await api.get('/talents/me/rate-cards');
    return response.data.data ?? [];
  },

  upsertRateCard: async (data: any) => {
    const response = await api.put('/talents/me/rate-cards', data);
    return response.data.data;
  },

  // ───── Bank Account ─────
  getBankAccount: async () => {
    const response = await api.get('/talents/me/bank-account');
    return response.data.data;
  },

  upsertBankAccount: async (data: any) => {
    const response = await api.put('/talents/me/bank-account', data);
    return response.data.data;
  },

  // ───── Dashboard Stats ─────
  getDashboardStats: async () => {
    const response = await api.get('/stats/talent-dashboard');
    return response.data.data;
  },
};
