export const performCleanLogout = async () => {
  try {
    await fetch('https://sso.orlandmanagement.com/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {}
  localStorage.removeItem('orland-auth-storage');
  sessionStorage.clear();
  window.location.replace('https://www.orlandmanagement.com/?app=agency');
};