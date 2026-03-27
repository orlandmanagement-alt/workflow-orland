import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    // Tangkap token dari URL (menangani React Router maupun native window search)
    let token = searchParams.get('token');
    if (!token && window.location.search) {
       const urlParams = new URLSearchParams(window.location.search);
       token = urlParams.get('token');
    }
    
    if (token) {
      console.log("✅ Token JWT berhasil ditangkap dari SSO!");
      
      // 🧹 SAPU BERSIH: Hapus semua cache/ghost data dari arsitektur lama
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('orland_comms_settings');
      localStorage.removeItem('talent_profile');
      
      // Tanamkan Token JWT ke sistem Zustand yang baru
      login(token); 
      
      // Beri waktu 800ms agar I/O LocalStorage selesai menulis data sebelum pindah halaman
      setTimeout(() => {
         navigate('/dashboard', { replace: true });
      }, 800);
    } else {
      console.error("❌ Token JWT tidak ditemukan di URL!");
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <h2 className="text-xl font-bold text-slate-800">Menyinkronkan Sesi...</h2>
      <p className="text-slate-500 text-sm">Mempersiapkan Enterprise Portal Anda</p>
    </div>
  );
}
