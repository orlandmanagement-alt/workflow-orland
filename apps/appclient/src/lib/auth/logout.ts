export const performCleanLogout = async () => {
  console.log("Memulai pembersihan total...");
  try {
    // Beritahu backend untuk menghapus cookie sesi
    await fetch('https://api.orlandmanagement.com/api/v1/auth/logout', { 
        method: 'POST', 
        credentials: 'include' 
    });
  } catch (e) {
    console.error("Logout API gagal, lanjut pembersihan lokal...");
  }

  // Daftar key yang tidak boleh dihapus (misal: tema gelap/terang)
  const safeKeys = ['orland-theme-storage', 'vite-ui-theme', 'theme'];

  // SAPU BERSIH LOCAL STORAGE
  Object.keys(localStorage).forEach((key) => {
    if (!safeKeys.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  // SAPU BERSIH SESSION STORAGE
  sessionStorage.clear();

  // Tendang paksa ke SSO
  window.location.replace('https://sso.orlandmanagement.com/');
};
