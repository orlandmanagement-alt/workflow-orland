import { useAuthStore } from '@/store/useAppStore';

export const performCleanLogout = async () => {
  try {
    await fetch('https://sso.orlandmanagement.com/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (e) {}

  useAuthStore.getState().logout();
  localStorage.removeItem('orland-admin-auth');
  sessionStorage.clear();
  window.location.replace('https://sso.orlandmanagement.com/?app=admin');
};
