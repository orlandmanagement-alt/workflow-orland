import { api } from '../api';

/**
 * TALENT SERVICE - ENTERPRISE EDITION
 * Menghubungkan UI Talent Dashboard ke Business API (appapi)
 */
export const talentService = {
  
  // ───── PROFILE MANAGEMENT ─────
  
  /**
   * Mengambil data profil talent yang sedang login
   */
  getProfile: async () => {
    try {
      const response = await api.get('/talents/me');
      // Jalur: axios.data -> hono.data
      return response.data?.data || null;
    } catch (error) {
      console.error('talentService.getProfile Error:', error);
      throw error;
    }
  },

  /**
   * Memperbarui data profil talent
   */
  updateProfile: async (payload: any) => {
    try {
      const response = await api.put('/talents/me', payload);
      return response.data?.data;
    } catch (error) {
      console.error('talentService.updateProfile Error:', error);
      throw error;
    }
  },

  // ───── EXPERIENCE & PORTOFOLIO ─────

  /**
   * Mengambil daftar pengalaman kerja/project
   */
  getExperiences: async () => {
    try {
      const response = await api.get('/talents/me/experiences');
      return response.data?.data ?? [];
    } catch (error) {
      console.error('talentService.getExperiences Error:', error);
      return [];
    }
  },

  addExperience: async (data: any) => {
    const response = await api.post('/talents/me/experiences', data);
    return response.data?.data;
  },

  deleteExperience: async (id: string) => {
    const response = await api.delete(`/talents/me/experiences/${id}`);
    return response.data;
  },

  // ───── CERTIFICATIONS ─────

  getCertifications: async () => {
    try {
      const response = await api.get('/talents/me/certifications');
      return response.data?.data ?? [];
    } catch (error) {
      console.error('talentService.getCertifications Error:', error);
      return [];
    }
  },

  addCertification: async (data: any) => {
    const response = await api.post('/talents/me/certifications', data);
    return response.data?.data;
  },

  deleteCertification: async (id: string) => {
    const response = await api.delete(`/talents/me/certifications/${id}`);
    return response.data;
  },

  // ───── PRICING & RATE CARDS ─────

  getRateCards: async () => {
    try {
      const response = await api.get('/talents/me/rate-cards');
      return response.data?.data ?? [];
    } catch (error) {
      console.error('talentService.getRateCards Error:', error);
      return [];
    }
  },

  upsertRateCard: async (data: any) => {
    const response = await api.put('/talents/me/rate-cards', data);
    return response.data?.data;
  },

  // ───── FINANCIAL & BANKING ─────

  getBankAccount: async () => {
    try {
      const response = await api.get('/talents/me/bank-account');
      return response.data?.data;
    } catch (error) {
      console.error('talentService.getBankAccount Error:', error);
      return null;
    }
  },

  upsertBankAccount: async (data: any) => {
    const response = await api.put('/talents/me/bank-account', data);
    return response.data?.data;
  },

  // ───── ANALYTICS & STATS ─────

  /**
   * Mengambil statistik untuk ditampilkan di Dashboard Utama
   */
  getDashboardStats: async () => {
    try {
      // Endpoint /stats sudah terdaftar di appapi/src/index.ts
      const response = await api.get('/stats/talent-dashboard');
      return response.data?.data;
    } catch (error) {
      console.error('talentService.getDashboardStats Error:', error);
      return null;
    }
  },
};