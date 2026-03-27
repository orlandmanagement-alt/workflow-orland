import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    // Menangkap ?token=xxxx dari URL yang dikirim oleh SSO
    const token = searchParams.get('token');
    
    if (token) {
      console.log("Token berhasil ditangkap:", token);
      login(token); // Simpan permanen di LocalStorage via Zustand
      // Beri jeda 500ms agar state tersimpan sempurna sebelum pindah
      setTimeout(() => {
         navigate('/dashboard', { replace: true });
      }, 500);
    } else {
      console.error("Token tidak ditemukan di URL!");
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <h2 className="text-xl font-bold text-slate-800">Menyinkronkan Sesi...</h2>
      <p className="text-slate-500 text-sm">Menyiapkan Dashboard Talent Anda</p>
    </div>
  );
}
