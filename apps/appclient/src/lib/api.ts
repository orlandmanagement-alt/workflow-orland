import axios from 'axios';
import { APP_CONFIG } from '@/config';

export const api = axios.create({
  baseURL: APP_CONFIG.API_URL,
  timeout: APP_CONFIG.TIMEOUT,
});

// Interceptor: Otomatis sisipkan Token di setiap request
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('orland-auth-client');
  if (authData) {
    try {
      const { state } = JSON.parse(authData);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch (e) {
      console.error('Error parsing token:', e);
    }
  }
  return config;
});
