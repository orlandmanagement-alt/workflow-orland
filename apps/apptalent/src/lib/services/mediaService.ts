import { api } from '../api';

export const mediaService = {
  getMedia: async () => {
    const res = await api.get('/media');
    return res.data?.data || [];
  },
  uploadMedia: async (file: File) => {
    // MENGIRIM FILE ASLI MENGGUNAKAN FORMDATA
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await api.post('/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  setMainMedia: async (mediaId: string) => {
    const res = await api.patch(`/media/${mediaId}`);
    return res.data;
  },
  deleteMedia: async (mediaId: string) => {
    const res = await api.delete(`/media/${mediaId}`);
    return res.data;
  }
};
