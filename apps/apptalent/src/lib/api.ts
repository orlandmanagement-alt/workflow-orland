import { useAuthStore } from '../store/useAppStore'

const BASE_URL = 'https://api.orlandmanagement.com/api/v1'

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = useAuthStore.getState().token;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new Error('Sesi telah berakhir. Silakan login kembali.');
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Terjadi kesalahan pada server');
  
  return data;
}
