import { useAuthStore } from '@/store/useAppStore';

const BASE_URL = 'https://api.orlandmanagement.com/v1';

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { token } = useAuthStore.getState();
  
  // Jika mengirim FormData (File Upload), browser akan otomatis mengatur Content-Type dengan boundary.
  const isFormData = options.body instanceof FormData;
  
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP Error: ${response.status}`);
  }

  return response.json();
}
