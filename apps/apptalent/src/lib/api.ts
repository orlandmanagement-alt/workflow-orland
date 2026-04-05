import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';
import { performCleanLogout } from '@/lib/auth/logout';

const API_URL = 'https://api.orlandmanagement.com/api/v1';

export const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' }});

api.interceptors.request.use((config: any) => {
  const token = useAuthStore.getState().token;
  if (token) { config.headers = config.headers || {}; config.headers.Authorization = `Bearer ${token}`; }
  return config;
});

api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    // Jika JWT benar-benar basi setelah request Data API
    if (error.response && error.response.status === 401) {
      console.warn("API Gatekeeper: Sesi Token (JWT) Kedaluwarsa. Meluncur ke SSO...");
      performCleanLogout();
    }
    // Meneruskan pesan error asli dari API agar form bisa menampilkannya
    const errorMsg = error.response?.data?.message || 'Terjadi kesalahan sistem.';
    return Promise.reject(new Error(errorMsg));
  }
);

export const apiRequest = async (url: string, options: any = {}) => {
  try {
    const response = await api({ url, method: options.method || 'GET', data: options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : options.data, headers: options.headers });
    return response.data;
  } catch (error) { throw error; }
};
