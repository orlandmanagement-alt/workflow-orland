import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';

export default function ClientLogin() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Jika sudah login, langsung ke dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Langsung redirect ke SSO — sama seperti apptalent
  const ssoUrl = 'https://sso.orlandmanagement.com';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#071122] p-4">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 text-center max-w-md w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-2xl mb-6">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="currentColor" className="text-brand-600"/>
            <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
          ORLAND<span className="text-brand-600">CLIENT</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 mb-8 px-4">
          Portal B2B Enterprise Orland Management. Masuk menggunakan akun SSO perusahaan Anda.
        </p>
        <a
          href={ssoUrl}
          className="flex items-center justify-center w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-brand-600/40 transition-all duration-200"
        >
          Masuk dengan Orland SSO &rarr;
        </a>
        <p className="text-xs text-slate-400 dark:text-slate-600 mt-6">
          Belum punya akun? Hubungi tim BD Orland untuk pendaftaran akun Client.
        </p>
      </div>
    </div>
  );
}
