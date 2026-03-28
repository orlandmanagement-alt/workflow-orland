import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = (params.get('role') || '').toLowerCase(); // FIX HURUF KECIL
    const userId = params.get('user_id');
    const name = params.get('name');
    const email = params.get('email');

    if (token && role) {
      if (role !== 'client') {
        alert("Akses Ditolak: Akun Anda terdaftar sebagai Talent. Mengalihkan...");
        localStorage.clear();
        window.location.replace('https://talent.orlandmanagement.com/');
        return;
      }

      localStorage.setItem('orland-auth-client', JSON.stringify({ state: { token, role: 'client', user: { id: userId, name, email } } }));
      navigate('/dashboard', { replace: true });
    } else {
      window.location.replace('https://sso.orlandmanagement.com/');
    }
  }, [navigate, location]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#071122]">
      <div className="text-center animate-pulse">
        <h2 className="text-xl font-bold text-brand-600 mb-2">Membuka Command Center...</h2>
      </div>
    </div>
  );
}
