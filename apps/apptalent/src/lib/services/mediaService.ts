import { api } from '../api';
import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';

const CDN_URL = 'https://cdn.orlandmanagement.com';

export const mediaService = {
  // Ambil daftar semua media talent
  getMedia: async () => {
    const res = await api.get('/media');
    return res.data?.data ?? [];
  },

  /**
   * Upload media ke R2 via CDN Bridge (2 langkah):
   * 1. Minta presigned URL LANGSUNG ke CDN Worker
   * 2. Upload file langsung ke R2 dengan PUT ke presigned URL
   * 3. Simpan publicUrl ke DB via API
   */
  uploadMedia: async (file: File, folder: 'talents' | 'clients' | 'kyc' | 'misc' = 'talents') => {
    // Ambil token dari Zustand Store
    const token = useAuthStore.getState().token;

    // Step 1: Minta presigned URL dari CDN (Bypass api.orlandmanagement.com)
    const presignedRes = await axios.post(`${CDN_URL}/upload-url`, {
      fileName: file.name,
      contentType: file.type,
      folder,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const { uploadUrl, publicUrl, fileKey } = presignedRes.data;

    // Step 2: Upload file langsung ke R2
const uploadRes = await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 
    'Content-Type': file.type, // Pastikan ini persis sama dengan yang dikirim di Step 1
    // Hapus 'X-Amz-Content-Sha256' jika backend (Worker) tidak mengaturnya di Signature
  },
  body: file,
});

if (!uploadRes.ok) {
  // Tambahkan log ini untuk melihat detail error dari R2 (biasanya berupa XML)
  const errorText = await uploadRes.text();
  console.error("R2 Error Detail:", errorText);
  throw new Error(`Upload ke R2 gagal: ${uploadRes.status} ${uploadRes.statusText}`);
}


    // Step 3: Catat URL ke database via API Bisnis
    const recordRes = await api.post('/media', {
      file_key: fileKey,
      public_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });

    return recordRes.data?.data ?? { public_url: publicUrl, file_key: fileKey };
  },

  setMainMedia: async (mediaId: string) => {
    const res = await api.patch(`/media/${mediaId}`, { is_main: true });
    return res.data;
  },

  deleteMedia: async (mediaId: string, fileKey?: string) => {
    const res = await api.delete(`/media/${mediaId}`);
    return res.data;
  },

  getPublicUrl: (fileKey: string): string => {
    if (fileKey.startsWith('http')) return fileKey; 
    return `${CDN_URL}/media/${fileKey}`;
  },
};