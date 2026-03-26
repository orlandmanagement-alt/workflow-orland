import { apiRequest } from '@/lib/api';

export const mediaService = {
  // Ambil semua media milik talent
  getMedia: () => apiRequest('/talents/me/media'),
  
  // Upload file media baru
  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/talents/me/media', { method: 'POST', body: formData });
  },

  // Hapus media
  deleteMedia: (id: string) => apiRequest(`/talents/me/media/${id}`, { method: 'DELETE' }),

  // Jadikan foto sebagai Sampul Utama (Main Profile Picture)
  setMainMedia: (id: string) => apiRequest(`/talents/me/media/${id}/main`, { method: 'PATCH' }),
};
