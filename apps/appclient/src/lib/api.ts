import axios from 'axios';

// URL API Worker Cloudflare Anda (appapi)
const API_URL = 'https://appapi.orlandmanagement.workers.dev/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor untuk menyuntikkan Token JWT dari SSO secara otomatis
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
