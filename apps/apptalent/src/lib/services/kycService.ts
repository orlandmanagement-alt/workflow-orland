import { apiRequest } from '@/lib/api';

export const kycService = {
  // Cek status KYC talent (Verified, Pending, Rejected, Unverified)
  getStatus: () => apiRequest('/talents/me/kyc'),
  
  // Upload dokumen KTP / Paspor
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    return apiRequest('/talents/me/kyc/document', { method: 'POST', body: formData });
  },

  // Upload Video Liveness / Selfie
  uploadLiveness: (file: File) => {
    const formData = new FormData();
    formData.append('liveness', file);
    return apiRequest('/talents/me/kyc/liveness', { method: 'POST', body: formData });
  },
};
