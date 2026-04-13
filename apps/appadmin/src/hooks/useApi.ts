import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAppStore';

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authToken = useAuthStore((state: any) => state.token);

  const request = useCallback(
    async (url: string, options: ApiOptions = {}) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authToken]
  );

  // Axios-like convenience methods
  const api = {
    get: (url: string, options?: Omit<ApiOptions, 'method' | 'body'>) =>
      request(url, { ...options, method: 'GET' }),
    post: (url: string, data?: any, options?: Omit<ApiOptions, 'method' | 'body'>) =>
      request(url, { ...options, method: 'POST', body: data }),
    put: (url: string, data?: any, options?: Omit<ApiOptions, 'method' | 'body'>) =>
      request(url, { ...options, method: 'PUT', body: data }),
    patch: (url: string, data?: any, options?: Omit<ApiOptions, 'method' | 'body'>) =>
      request(url, { ...options, method: 'PATCH', body: data }),
    delete: (url: string, options?: Omit<ApiOptions, 'method' | 'body'>) =>
      request(url, { ...options, method: 'DELETE' }),
  };

  return { request, api, loading, error };
}
