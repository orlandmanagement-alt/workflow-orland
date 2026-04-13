import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';
import { performCleanLogout } from '@/lib/auth/logout';

export const api = axios.create({
  baseURL: 'https://api.orlandmanagement.com/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config: any) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use(
  (res: any) => res,
  (err: any) => {
    if ((err.response?.status === 401 || err.response?.status === 403) && !window.location.pathname.includes('/login')) {
      performCleanLogout();
    }
    return Promise.reject(err);
  }
);