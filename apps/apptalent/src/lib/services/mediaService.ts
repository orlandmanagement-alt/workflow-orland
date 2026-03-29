import { api } from '../api';

const CDN_URL = 'https://cdn.orlandmanagement.com';

export const mediaService = {
  // Ambil daftar semua media talent
  getMedia: async () => {
    const res = await api.get('/media');
    return res.data?.data ?? [];
  },

  /**
   * Upload media ke R2 via CDN Bridge (2 langkah):
   * 1. Minta presigned URL ke CDN Worker
   * 2. Upload file langsung ke R2 dengan PUT ke presigned URL
   * 3. Simpan publicUrl ke DB via API
   */
  uploadMedia: async (file: File, folder: 'talents' | 'clients' | 'kyc' | 'misc' = 'talents') => {
    // Step 1: Minta presigned URL dari CDN
    const presignedRes = await api.post('/media/upload-url', {
      fileName: file.name,
      contentType: file.type,
      folder,
    });
    const { uploadUrl, publicUrl, fileKey, headers } = presignedRes.data;

    // Step 2: Upload file langsung ke R2 (tanpa melewati API Worker)
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload ke R2 gagal: ${uploadRes.statusText}`);
    }

    // Step 3: Catat URL ke database via API
    const recordRes = await api.post('/media', {
      file_key: fileKey,
      public_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });

    return recordRes.data?.data ?? { public_url: publicUrl, file_key: fileKey };
  },

  // Tandai foto sebagai foto utama
  setMainMedia: async (mediaId: string) => {
    const res = await api.patch(`/media/${mediaId}`, { is_main: true });
    return res.data;
  },

  // Hapus media
  deleteMedia: async (mediaId: string, fileKey?: string) => {
    const res = await api.delete(`/media/${mediaId}`);
    return res.data;
  },

  // Helper: buat URL gambar publik dari fileKey
  getPublicUrl: (fileKey: string): string => {
    if (fileKey.startsWith('http')) return fileKey; // sudah full URL
    return `${CDN_URL}/media/${fileKey}`;
  },
};
