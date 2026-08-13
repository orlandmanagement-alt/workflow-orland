import axios from 'axios';
import { useAuthStore } from '../store/useAppStore';
import { performCleanLogout } from './auth/logout';

export const api = axios.create({
  baseURL: 'https://api.orlandmanagement.com/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) performCleanLogout();
    return Promise.reject(err);
  }
);

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

export const apiRequest = async (url: string, options: ApiRequestOptions = {}) => {
  const response = await api({ url, method: options.method || 'GET', data: options.body });
  return response.data;
};