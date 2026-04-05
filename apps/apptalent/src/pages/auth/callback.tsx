import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);
  
  const [errorStatus, setErrorStatus] = useState<'talent' | 'client' | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = (params.get('role') || '').toLowerCase();
    const userId = params.get('user_id');
    const name = params.get('name');
    const email = params.get('email');

    if (token && role) {
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

      login(token, { id: userId, name, email, role: 'talent' });
      navigate('/dashboard', { replace: true });
    } else {
      window.location.replace('https://sso.orlandmanagement.com/');
    }
  }, [navigate, location, login]);

  if (errorStatus === 'client') {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#071122]">
          <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-red-100 dark:border-red-900/30">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Akses Ditolak</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Akun Anda terdaftar sebagai <strong className="text-brand-600">Pelanggan B2B (Client)</strong>. Anda tidak boleh memasuki Portal Talent.</p>
            
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 flex flex-col items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Mengarahkan ke Dashboard Client dalam</span>
                <span className="text-4xl font-extrabold text-brand-600 font-mono animate-pulse">{countdown}</span>
            </div>
            
            <button onClick={() => window.location.replace('https://client.orlandmanagement.com/')} className="w-full mt-6 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-xl transition-colors">
                Pindah Sekarang
            </button>
          </div>
        </div>
      );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#071122]">
      <div className="flex flex-col items-center text-center animate-pulse">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-[20px] opacity-20 animate-pulse"></div>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 relative z-10">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none" className="animate-[spin_3s_linear_infinite]">
              <rect width="32" height="32" rx="8" fill="currentColor" className="text-blue-600 dark:text-blue-500"/>
              <path d="M16 8L8 16L16 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24 8L16 16L24 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Memverifikasi Ruang Talent...</h2>
        <p className="text-sm border-t border-slate-200 dark:border-slate-800 pt-3 mt-1 text-slate-500 dark:text-slate-400">Menyinkronkan sesi kredensial dengan aman</p>
      </div>
    </div>
  );
}
