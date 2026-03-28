import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = params.get('role');
    const userId = params.get('user_id');
    const name = params.get('name');
    const email = params.get('email');

    if (token && role) {
      // TENDANG JIKA BUKAN CLIENT
      if (role.toLowerCase() !== 'client') {
        alert("Akses Ditolak: Ruang Kerja ini khusus Client/Nasabah.");
        localStorage.clear();
        window.location.replace('https://sso.orlandmanagement.com/');
        return;
      }

      // SIMPAN RICH PAYLOAD KE BRANKAS
      const authState = {
        state: {
          token: token,
          role: 'client',
          user: {
            id: userId,
            name: name,
            email: email
          }
        }
      };
      
      localStorage.setItem('orland-auth-client', JSON.stringify(authState));
      
      // Buka Pintu ke Command Center (Dashboard)
      navigate('/dashboard', { replace: true });
    } else {
      // Jika nyasar tanpa token
      window.location.replace('https://sso.orlandmanagement.com/');
    }
  }, [navigate, location]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#071122]">
      <div className="text-center animate-pulse">
        <h2 className="text-xl font-bold text-brand-600 mb-2">Membuka Command Center...</h2>
        <p className="text-slate-500 text-sm">Menarik data kampanye dan metrik finansial...</p>
      </div>
    </div>
  );
}
