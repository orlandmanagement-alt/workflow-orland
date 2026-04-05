import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';
import { performCleanLogout } from '@/lib/auth/logout';

const API_URL = 'https://api.orlandmanagement.com/api/v1';

// PERBAIKAN: Tambahkan withCredentials: true agar Cookie sid terbawa otomatis
export const api = axios.create({ 
  baseURL: API_URL, 
  withCredentials: true, 
  headers: { 'Content-Type': 'application/json' }
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
      performCleanLogout();
    }
    return Promise.reject(error);
  }
);