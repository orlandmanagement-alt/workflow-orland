import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';

// Gunakan URL API Talent Anda (sesuaikan jika berbeda)
const API_URL = import.meta.env.VITE_API_URL || 'https://api.orlandmanagement.com';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR: Otomatis tempelkan token ke setiap request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// INTERCEPTOR: Jika token tidak valid (401), otomatis lempar ke SSO Login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
