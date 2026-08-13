import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';
import { performCleanLogout } from '@/lib/auth/logout';

const API_URL = 'https://api.orlandmanagement.com/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
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
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Admin API: Session expired, redirecting to SSO...');
      performCleanLogout();
    }
    const errorMsg = error.response?.data?.message || 'Terjadi kesalahan sistem.';
    return Promise.reject(new Error(errorMsg));
  }
);
