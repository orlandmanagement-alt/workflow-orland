import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';

const API_URL = 'https://api.orlandmanagement.com/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT token dari store ke setiap request
api.interceptors.request.use((config: any) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — redirect ke SSO
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      console.warn('Admin API: Session expired, redirecting to SSO...');
      useAuthStore.getState().logout();
    }
    const errorMsg = error.response?.data?.message || 'Terjadi kesalahan sistem.';
    return Promise.reject(new Error(errorMsg));
  }
);
