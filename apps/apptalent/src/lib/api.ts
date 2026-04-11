import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/useAppStore';
import { performCleanLogout } from '@/lib/auth/logout';

/**
 * ORLAND ENTERPRISE API CONFIGURATION
 * Base URL mengarah ke Business Logic API (appapi)
 */
const API_URL = 'https://api.orlandmanagement.com/api/v1';

// 1. Inisialisasi Instance Axios
export const api = axios.create({
  baseURL: API_URL,
  // PENTING: Mengizinkan pengiriman cookie (sid) antar subdomain (.orlandmanagement.com)
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // Global timeout 15 detik
});

/**
 * REQUEST INTERCEPTOR
 * Mengambil token terbaru dari Zustand Store sebelum setiap request dikirim.
 */
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    
    if (token && config.headers) {
      // Menyertakan Bearer Token untuk validasi JWT di sisi API
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * Gatekeeper pusat untuk menangani error global, terutama 401 (Unauthorized).
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const status = error.response ? error.response.status : null;

    if (status === 401) {
      console.error("Sesi tidak valid atau telah berakhir (401).");
      
      // Jangan langsung tendang jika sedang di halaman login
      if (!window.location.pathname.includes('/login')) {
        // AKTIFKAN KEMBALI: Bersihkan semua data lokal dan arahkan ke Login SSO
        performCleanLogout();
      }
    }

    // Format pesan error agar konsisten untuk dikonsumsi UI (Toast/Alert)
    const apiErrorMessage = error.response?.data?.message || error.message || "Terjadi kesalahan pada server.";
    return Promise.reject(new Error(apiErrorMessage));
  }
);

/**
 * WRAPPER: apiRequest
 * Fungsi pembantu yang lebih fleksibel untuk dipanggil di dalam Services/Components.
 * Menangani pembersihan body pada metode GET/HEAD secara otomatis.
 */
export const apiRequest = async <T = any>(
  url: string, 
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: any;
    body?: any; // Alias untuk data agar kompatibel dengan Fetch API style
    headers?: any;
    params?: any;
  } = {}
): Promise<T> => {
  const method = (options.method || 'GET').toUpperCase();
  
  // Normalisasi Payload (Mendukung data atau body)
  const payload = options.data || options.body;

  const config: AxiosRequestConfig = {
    url,
    method,
    headers: options.headers || {},
    params: options.params || {},
  };

  // VALIDASI HTTP STANDARDS:
  // Metode GET dan HEAD dilarang memiliki body/data.
  if (method !== 'GET' && method !== 'HEAD' && payload) {
    config.data = typeof payload === 'string' ? JSON.parse(payload) : payload;
  }

  try {
    const response = await api.request<T>(config);
    return response.data;
  } catch (error) {
    // Error sudah ditangani di interceptor, teruskan saja ke pemanggil
    throw error;
  }
};