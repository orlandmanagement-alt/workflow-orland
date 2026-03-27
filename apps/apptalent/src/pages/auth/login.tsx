import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const ssoUrl = import.meta.env.VITE_SSO_URL || 'https://sso.orlandmanagement.com';
  const talentUrl = import.meta.env.VITE_TALENT_URL || 'https://talent.orlandmanagement.com';
  const ssoLoginUrl = `${ssoUrl}/login?redirect_uri=${encodeURIComponent(talentUrl + '/auth/callback')}`;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center max-w-md w-full">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
          ORLAND<span className="text-blue-600">TALENT</span>
        </h1>
        <h2 className="text-lg font-bold text-slate-700 mb-4 mt-6">Enterprise Portal</h2>
        <p className="text-slate-500 text-sm mb-8 px-4">
          Gunakan Akun SSO Orland Management Anda untuk masuk.
        </p>
        <a 
          href={ssoLoginUrl} 
          className="flex items-center justify-center w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
        >
          Masuk dengan Orland SSO &rarr;
        </a>
      </div>
    </div>
  );
}
