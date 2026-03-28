import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = params.get('role');

    if (token && role) {
      // STRICT CROSS-ROLE CHECK
      if (role.toLowerCase() !== 'talent') {
        alert("Akses Ditolak: Anda bukan Talent.");
        localStorage.clear();
        window.location.replace('https://sso.orlandmanagement.com/');
        return;
      }

      // Simpan token jika benar Talent
      localStorage.setItem('orland-auth-talent', JSON.stringify({ state: { token, role: 'talent' } }));
      
      // Bersihkan URL dan masuk ke Dashboard
      navigate('/dashboard', { replace: true });
    } else {
      // Jika nyasar ke halaman ini tanpa token
      window.location.replace('https://sso.orlandmanagement.com/');
    }
  }, [navigate, location]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#071122]">
      <div className="text-center animate-pulse">
        <h2 className="text-xl font-bold text-brand-600 mb-2">Memverifikasi Akses...</h2>
        <p className="text-slate-500 text-sm">Menyiapkan Studio Virtual Anda</p>
      </div>
    </div>
  );
}
