import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);
  
  const [errorStatus, setErrorStatus] = useState<'talent' | 'client' | null>(null);
  const [countdown, setCountdown] = useState(5);
  
  // TAMBAHKAN INI: Penjaga agar tidak terjadi eksekusi ganda (Looping)
  const isProcessed = useRef(false);

  useEffect(() => {
    if (isProcessed.current) return;

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = (params.get('role') || '').toLowerCase();
    
    if (token && role) {
      isProcessed.current = true; // Kunci gerbang

      if (role !== 'talent') {
        setErrorStatus('client');
        let timesLeft = 5;
        const interval = setInterval(() => {
            timesLeft--;
            setCountdown(timesLeft);
            if (timesLeft <= 0) {
                clearInterval(interval);
                localStorage.clear();
                window.location.replace('https://client.orlandmanagement.com/');
            }
        }, 1000);
        return () => clearInterval(interval);
      }

      const userId = params.get('user_id');
      const name = params.get('name');
      const email = params.get('email');

      login(token, { 
  id: userId, 
  full_name: name, // Sinkronkan dengan dashboard/index.tsx
  email, 
  role: 'talent' 
});
      
      // Bersihkan URL dari token agar rapi dan aman
      window.history.replaceState({}, document.title, '/auth/callback');
      navigate('/dashboard', { replace: true });
    } else {
      window.location.replace('https://sso.orlandmanagement.com/');
    }
  }, [login, navigate, location.search]); // Dependensi dirapikan

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