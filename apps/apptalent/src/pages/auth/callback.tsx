import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAppStore';
import { Loader2 } from 'lucide-react';

export default function SSOCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // 1. Ambil token JWT dari URL Parameter
    // Asumsi SSO mengirim: talent.orlandmanagement.com/auth/callback?token=eyJ...
    const token = searchParams.get('token');

    if (token) {
      // 2. Jika token ada, simpan ke Zustand
      // Di production nyata, kamu mungkin perlu menembak API /auth/me terlebih dahulu 
      // menggunakan token ini untuk mendapatkan data user utuh.
      // Di sini kita simulasi data user dulu.
      setAuth(token, { id: 'usr_sso', full_name: 'Endang Wira Surya', role: 'talent' });
      
      // 3. Redirect ke dashboard
      setTimeout(() => navigate('/dashboard'), 500);
    } else {
      // Jika gagal, tendang kembali ke login
      console.error('SSO Token tidak ditemukan di URL');
      navigate('/login');
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-bg">
      <Loader2 className="h-10 w-10 animate-spin text-brand-600 mb-4" />
      <p className="text-lg font-semibold dark:text-white">Memverifikasi Sesi SSO...</p>
      <p className="text-slate-500">Mohon tunggu sebentar.</p>
    </div>
  );
}
