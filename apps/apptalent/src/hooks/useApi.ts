import { useCallback } from 'react';
import { api } from '@/lib/api';

interface UseApiReturn {
  api: typeof api;
  get: typeof api.get;
  post: typeof api.post;
  put: typeof api.put;
  delete: typeof api.delete;
  patch: typeof api.patch;
}

export const useApi = (): UseApiReturn => {
  return {
    api,
    get: useCallback(api.get.bind(api), []),
    post: useCallback(api.post.bind(api), []),
    put: useCallback(api.put.bind(api), []),
    delete: useCallback(api.delete.bind(api), []),
    patch: useCallback(api.patch.bind(api), []),
  };
};
