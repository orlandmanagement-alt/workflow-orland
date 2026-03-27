import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';

// KITA KUNCI LANGSUNG KE /api/v1 AGAR TIDAK ADA PATH YANG TERPOTONG
const API_URL = 'https://api.orlandmanagement.com/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Sesi JWT kadaluarsa/ditolak. Logout otomatis...');
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
