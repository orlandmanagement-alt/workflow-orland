import { api } from '../api';

export const kycService = {
  // Cek status KYC talent (verified, pending, rejected, unverified)
  getStatus: async () => {
    const res = await api.get('/talents/me/kyc');
    return res.data?.data;
  },

  /**
   * Upload dokumen KTP / Paspor via presigned URL
   */
  uploadDocument: async (file: File) => {
    // Step 1: Minta presigned URL
    const presignedRes = await api.post('/media/upload-url', {
      fileName: file.name,
      contentType: file.type,
      folder: 'kyc',
    });
    const { uploadUrl, publicUrl, fileKey } = presignedRes.data;

    // Step 2: Upload langsung ke R2
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!uploadRes.ok) throw new Error('Upload dokumen KYC gagal');

    // Step 3: Submit URL ke endpoint KYC
    const res = await api.post('/talents/me/kyc/document', {
      document_url: publicUrl,
      file_key: fileKey,
    });
    return res.data;
  },

  /**
   * Upload Video Liveness / Selfie via presigned URL
   */
  uploadLiveness: async (file: File) => {
    // Step 1: Minta presigned URL
    const presignedRes = await api.post('/media/upload-url', {
      fileName: file.name,
      contentType: file.type,
      folder: 'kyc',
    });
    const { uploadUrl, publicUrl, fileKey } = presignedRes.data;

    // Step 2: Upload langsung ke R2
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!uploadRes.ok) throw new Error('Upload liveness KYC gagal');

    // Step 3: Submit URL ke endpoint KYC
    const res = await api.post('/talents/me/kyc/liveness', {
      liveness_url: publicUrl,
      file_key: fileKey,
    });
    return res.data;
  },

  // Submit semua dokumen untuk review
  submitForReview: async () => {
    const res = await api.post('/talents/me/kyc/submit');
    return res.data;
  },
};
