import axios from 'axios';
import { useAuthStore } from '@/store/useAppStore';
// Import fungsi logout kita biarkan, tapi nanti kita matikan eksekusinya
import { performCleanLogout } from '@/lib/auth/logout';

const API_URL = 'https://api.orlandmanagement.com/api/v1';

// PERBAIKAN 1: Wajib menggunakan withCredentials: true untuk arsitektur Cross-Domain SSO
export const api = axios.create({ 
  baseURL: API_URL, 
  withCredentials: true, 
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config: any) => {
  const token = useAuthStore.getState().token;
  if (token) { 
    config.headers = config.headers || {}; 
    // Mengirimkan JWT Token hasil dari SSO ke API Bisnis
    config.headers.Authorization = `Bearer ${token}`; 
  }
  return config;
});

api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    // PERBAIKAN 2: Mencegah Auto-Logout saat API mengembalikan 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.error("API Gatekeeper Menolak Akses (401)!");
      console.error("Alasan dari Server:", error.response.data);
      
      const serverReason = error.response.data?.message || 'Token tidak dikenali oleh API Bisnis';
      
      // Kita munculkan alert kecil di layar untuk melihat apa masalah aslinya
      console.warn("Peringatan API: " + serverReason);
      
      // ====================================================================
      // FUNGSI TENDANG KELUAR DIMATIKAN SEMENTARA AGAR ANDA BISA MASUK DASHBOARD
      // performCleanLogout(); 
      // ====================================================================
    }
    
    // Meneruskan pesan error asli dari API agar form/komponen UI bisa menampilkannya
    const errorMsg = error.response?.data?.message || 'Terjadi kesalahan sistem.';
    return Promise.reject(new Error(errorMsg));
  }
);

// ====================================================================
// PERBAIKAN 3: Mencegah Error "GET/HEAD method cannot have body"
// ====================================================================
export const apiRequest = async (url: string, options: any = {}) => {
  try {
    const method = (options.method || 'GET').toUpperCase();

    // 1. Siapkan konfigurasi dasar (SENGAJA DIBUAT TANPA DATA/BODY)
    const config: any = { 
      url, 
      method, 
      headers: options.headers || {}
    };

    // 2. KUNCI PENYELESAIAN: Hanya tambahkan payload data jika BUKAN GET / HEAD
    if (method !== 'GET' && method !== 'HEAD') {
       const payload = options.body || options.data;
       if (payload) {
           // Axios lebih menyukai object JSON mentah daripada string
           config.data = typeof payload === 'string' ? JSON.parse(payload) : payload;
       }
    }

    // 3. Eksekusi API
    const response = await api(config);
    return response.data;
    
  } catch (error) { 
    throw error; 
  }
};