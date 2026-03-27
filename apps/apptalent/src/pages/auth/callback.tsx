import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Ambil fungsi setToken dari Zustand
  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    // 1. Tangkap token JWT dari URL (contoh: ?token=xyz123)
    const token = searchParams.get('token');
    
    if (token) {
      // 2. Simpan token secara permanen di Zustand (yang otomatis masuk ke LocalStorage)
      setToken(token);
      
      // 3. Hapus jejak URL callback dan lempar ke Dashboard
      navigate('/dashboard', { replace: true });
    } else {
      // Jika nyasar ke halaman ini tanpa token, kembalikan ke gerbang SSO
      navigate('/auth/login', { replace: true });
    }
  }, [searchParams, navigate, setToken]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Memverifikasi Sesi...</h2>
      <p className="text-slate-500 mt-2 text-sm">Sedang menghubungkan ke Orland SSO</p>
    </div>
  );
}
