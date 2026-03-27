import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';

// SOLUSI: Kunci baseURL absolut ke v1 agar tidak pernah nyasar ke domain frontend
const API_URL = 'https://api.orlandmanagement.com/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// SOLUSI TS: Menggunakan ': any' untuk membungkam TypeScript Strict Mode
api.interceptors.request.use((config: any) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response && error.response.status === 401) {
      console.error('Sesi JWT kadaluarsa/ditolak. Logout otomatis...');
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// SOLUSI TS (BACKWARD COMPATIBILITY): Jembatan untuk service lama (kycService, dll)
export const apiRequest = async (url: string, options: any = {}) => {
  try {
    const response = await api({
      url,
      method: options.method || 'GET',
      data: options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : options.data,
      headers: options.headers,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
