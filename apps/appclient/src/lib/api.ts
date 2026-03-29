import axios from 'axios';
import { APP_CONFIG } from '@/config';
import { useAuthStore } from '../store/useAppStore';
import { performCleanLogout } from './auth/logout';

export const api = axios.create({
  baseURL: APP_CONFIG.API_URL,
  timeout: APP_CONFIG.TIMEOUT,
});

// Request Interceptor: Otomatis sisipkan Token dari brankas resmi (Zustand)
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Menangani Lazy Validation (JWT Kadaluarsa)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jika API Utama dengan jelas mengatakan Unauthorized (Kode 401)
    if (error.response && error.response.status === 401) {
      console.warn("API Gatekeeper: Token sudah basi / hangus! Logout darurat...");
      performCleanLogout();
    }
    
    // Meneruskan pesan error asli
    const errorMsg = error.response?.data?.message || 'Terjadi kesalahan sistem.';
    return Promise.reject(new Error(errorMsg));
  }
);

export const apiRequest = async (url: string, options: any = {}) => {
  try {
    const response = await api({ 
      url, 
      method: options.method || 'GET', 
      data: options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : options.data, 
      headers: options.headers 
    });
    return response.data;
  } catch (error) { 
    throw error; 
  }
};
