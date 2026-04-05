import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';

export default function ClientLogin() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Endpoint SSO dengan identifikasi asal aplikasi
  const ssoUrl = 'https://sso.orlandmanagement.com?app=client';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsRedirecting(true);
    setTimeout(() => {
      window.location.href = ssoUrl;
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#071122] p-4 font-sans transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 text-center max-w-md w-full relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-2xl mb-6 shadow-inner pointer-events-none">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="currentColor" className="text-brand-600 dark:text-brand-500"/>
              <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight">
            ORLAND<span className="text-brand-600 dark:text-brand-500">CLIENT</span>
          </h1>
          <div className="h-1 w-12 bg-brand-600 rounded-full mx-auto mb-6 opacity-80"></div>
          
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">B2B Command Center</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-10 px-2 leading-relaxed">
            Portal manajemen enterprise terpusat untuk mitra bisnis. Silakan autentikasi menggunakan kredensial agensi Anda.
          </p>
          
          <a 
            href={ssoUrl} 
            onClick={handleLogin}
            className="group relative flex items-center justify-center w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-2xl shadow-[0_8px_30px_rgb(15,118,110,0.25)] hover:shadow-[0_8px_30px_rgb(15,118,110,0.4)] transition-all duration-300 overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
            {isRedirecting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyambungkan ke SSO...
              </span>
            ) : (
              <span className="flex items-center">
                Access Workspace
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </span>
            )}
          </a>
          
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-8">
            Belum terdaftar sebagai mitra? Hubungi Account Executive.
          </p>
        </div>
      </div>
    </div>
  );
}
