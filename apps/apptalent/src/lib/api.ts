import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';

// Mengambil URL dari environment, jika tidak ada gunakan URL production yang valid
const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://api.orlandmanagement.com';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR REQUEST: Sebelum request dikirim, masukkan Token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// INTERCEPTOR RESPONSE: Jika API menolak (401), tendang user ke login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Sesi kadaluarsa atau tidak valid. Melakukan logout otomatis...');
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
