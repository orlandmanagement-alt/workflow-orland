// Import useAuthStore secara langsung
import { useAuthStore } from '../../store/useAppStore';

export const performCleanLogout = async () => {
  console.log("Memulai eksekusi Logout Klien...");

  try {
    // 1. Pukul Backend SSO
    await fetch('https://sso.orlandmanagement.com/api/auth/logout', { 
        method: 'POST', 
        credentials: 'include' 
    });
  } catch (e) {
    console.error("SSO API Logout gagal (mungkin offline), lanjut lokal...");
  }

  // 2. MATIKAN ZUSTAND AUTH STORE DARI DALAM!
  useAuthStore.getState().logout();

  // 3. DAFTAR KEY YANG AMAN (Jangan hapus tema)
  const safeKeys = ['orland-theme-storage', 'vite-ui-theme', 'theme'];

  // 4. PEMBANTAIAN LOKAL STORAGE
  Object.keys(localStorage).forEach((key) => {
    if (!safeKeys.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  // 5. PEMBANTAIAN SESSION STORAGE
  sessionStorage.clear();

  // 6. Eksekusi Pengusiran Paksa tanpa jejak riwayat belakang
  window.location.replace('https://sso.orlandmanagement.com/');
};
