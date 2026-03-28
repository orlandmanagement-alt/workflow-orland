import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = (params.get('role') || '').toLowerCase(); // FIX HURUF KECIL
    const userId = params.get('user_id');
    const name = params.get('name');
    const email = params.get('email');

    if (token && role) {
      if (role !== 'talent') {
        alert("Akses Ditolak: Akun Anda terdaftar sebagai Client. Mengalihkan...");
        localStorage.clear();
        window.location.replace('https://client.orlandmanagement.com/');
        return;
      }

      // LAZY VALIDATION (SSO-Trust): Langsung simpan Token JWT & User Data
      login(token, { id: userId, name, email, role: 'talent' });
      
      // Pembersihan residual sistem lama
      localStorage.removeItem('orland-auth-talent');

      // Masuk instan tanpa error 3s
      navigate('/dashboard', { replace: true });
    } else {
      window.location.replace('https://sso.orlandmanagement.com/');
    }
  }, [navigate, location, login]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#071122]">
      <div className="text-center animate-pulse">
        <h2 className="text-xl font-bold text-brand-600 mb-2">Memverifikasi Ruang Talent...</h2>
      </div>
    </div>
  );
}
