export const performCleanLogout = async () => {
  console.log("Memulai proses pembersihan total...");

  try {
    // 1. Beritahu Backend untuk menghancurkan Cookie Sesi (jika ada)
    await fetch('https://api.orlandmanagement.com/api/v1/auth/logout', { 
        method: 'POST', 
        credentials: 'include' 
    });
  } catch (e) {
    console.error('API Logout gagal, melanjutkan pembersihan lokal...', e);
  }

  // 2. DAFTAR KEY YANG BOLEH SELAMAT (Pengaturan Tema UI)
  const safeKeys = ['orland-theme-storage', 'vite-ui-theme', 'theme'];

  // 3. SAPU BERSIH LOCAL STORAGE
  Object.keys(localStorage).forEach((key) => {
    if (!safeKeys.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  // 4. SAPU BERSIH SESSION STORAGE (Menghapus jejak fallback SSO jika ada)
  sessionStorage.clear();

  // 5. Tendang kembali ke SSO secara paksa (replace mencegah user back)
  window.location.replace('https://sso.orlandmanagement.com/');
};
