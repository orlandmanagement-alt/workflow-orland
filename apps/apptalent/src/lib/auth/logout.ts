export const performCleanLogout = async () => {
  console.log("Memulai pembersihan total Apptalent...");
  try {
    await fetch('https://sso.orlandmanagement.com/api/auth/logout', { 
        method: 'POST', 
        credentials: 'include' 
    });
  } catch (e) {
    console.error("Logout API gagal, lanjut pembersihan lokal...");
  }

  const safeKeys = ['orland-theme-storage', 'vite-ui-theme', 'theme'];

  Object.keys(localStorage).forEach((key) => {
    if (!safeKeys.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  sessionStorage.clear();

  // Menggunakan origin SSO agar bersih
  window.location.replace('https://sso.orlandmanagement.com/');
};
