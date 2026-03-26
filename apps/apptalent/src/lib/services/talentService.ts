import { apiRequest } from '@/lib/api';

export const talentService = {
  // Ambil Data Profil
  getProfile: () => apiRequest('/talents/me'),
  
  // Update Comp Card
  updateProfile: (data: any) => apiRequest('/talents/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Ambil Proyek Aktif
  getProjects: () => apiRequest('/talents/me/projects'),
  
  // Ambil Jadwal
  getSchedules: () => apiRequest('/talents/me/schedules'),
};
