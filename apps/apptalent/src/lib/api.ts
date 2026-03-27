import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';

const API_URL = 'https://api.orlandmanagement.com/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: any) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response && error.response.status === 401) {
      const errorMsg = error.response.data?.message || 'Token tidak valid';
      console.error('API Menolak Akses:', errorMsg);
      
      // KITA NONAKTIFKAN TENDANGAN OTOMATIS SEMENTARA
      // useAuthStore.getState().logout();
      // window.location.href = '/login';
      
      // Munculkan popup agar kita tahu persis apa alasan API menolaknya
      alert(`AKSES DITOLAK API: ${errorMsg}`);
    }
    return Promise.reject(error);
  }
);

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
