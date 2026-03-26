import { apiRequest } from '@/lib/api';

export const projectService = {
  // Dapatkan semua proyek yang sedang aktif / dilamar oleh talent ini
  getProjects: () => apiRequest('/talents/me/projects'),
  
  // Dapatkan detail spesifik proyek (The Green Room) berdasarkan ID
  getProjectById: (id: string) => apiRequest(`/projects/${id}`),
  
  // Aksi melamar ke sebuah Open Casting
  applyProject: (id: string) => apiRequest(`/projects/${id}/apply`, { method: 'POST' }),
  
  // Respon undangan casting (Terima/Tolak)
  respondInvite: (id: string, status: 'accepted' | 'declined') => 
    apiRequest(`/projects/${id}/invites`, { 
        method: 'PATCH', 
        body: JSON.stringify({ status }) 
    }),
};
