import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);
  const isProcessed = useRef(false);

  useEffect(() => {
    // Mencegah eksekusi ganda yang menyebabkan loop/stak
    if (isProcessed.current) return;

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = (params.get('role') || '').toLowerCase();
    const userId = params.get('user_id');
    const name = params.get('name');
    const email = params.get('email');

    if (token && role === 'talent') {
      isProcessed.current = true;
      
      // 1. Simpan ke Zustand Store
      login(token, { id: userId, name, email, role: 'talent' });
      
      // 2. Navigasi ke dashboard dengan sedikit jeda agar store selesai menulis ke localStorage
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);

    } else if (token && role === 'client') {
      // Jika nyasar ke portal talent, lempar ke portal client
      window.location.replace('https://client.orlandmanagement.com/');
    } else {
      // Jika tidak ada token sama sekali, kembalikan ke SSO
      window.location.replace('https://sso.orlandmanagement.com/');
    }
  }, [navigate, location, login]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#071122]">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Memverifikasi Ruang Talent...</h2>
        <p className="text-sm text-slate-500">Menyinkronkan sesi kredensial dengan aman</p>
      </div>
    </div>
  );
}