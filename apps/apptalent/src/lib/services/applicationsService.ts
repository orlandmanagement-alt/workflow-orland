import { api } from '../api';
import type { ApplicationPayload, ApplicationResponse } from '@/types/application.types';

export const applicationsService = {
  // Lamar sebuah casting/proyek
  applyForProject: async (payload: ApplicationPayload): Promise<ApplicationResponse> => {
    try {
      const response = await api.post('/applications', payload);
      return response.data?.data;
    } catch (error: any) {
      throw new Error(error.message || 'Gagal mengirim lamaran');
    }
  },

  // Ambil semua lamaran milik talent yang login
  getMyApplications: async () => {
    try {
      const response = await api.get('/applications/me');
      return response.data?.data ?? [];
    } catch (error: any) {
      throw new Error(error.message || 'Gagal memuat lamaran');
    }
  },

  // Batalkan lamaran
  cancelApplication: async (applicationId: string) => {
    try {
      const response = await api.patch(`/applications/${applicationId}/cancel`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Gagal membatalkan lamaran');
    }
  },

  // Terima undangan casting
  acceptInvite: async (inviteId: string) => {
    try {
      const response = await api.post(`/applications/${inviteId}/accept`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Gagal menerima undangan');
    }
  },

  // Tolak undangan casting
  rejectInvite: async (inviteId: string, reason?: string) => {
    try {
      const response = await api.post(`/applications/${inviteId}/reject`, { reason });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Gagal menolak undangan');
    }
  },
};
