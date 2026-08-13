import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Endpoint SSO dengan identifikasi asal aplikasi
  const ssoUrl = 'https://www.orlandmanagement.com?app=admin';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
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
    <div className="min-h-screen flex items-center justify-center bg-[#071122] p-4 font-mono transition-colors duration-300 selection:bg-red-500 selection:text-white">
      <div className="bg-slate-900/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl border border-red-900/40 text-center max-w-md w-full relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-red-900/20 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-500 rounded-full blur-[30px] opacity-20 animate-pulse"></div>
            <ShieldAlert className="text-red-500 relative z-10" size={64} />
          </div>
          
          <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-1">
            OVERWATCH<span className="text-red-500">ADMIN</span>
          </h1>
          <div className="h-[2px] w-16 bg-red-500 rounded-full mx-auto mb-6 opacity-80"></div>
          
          <h2 className="text-lg font-bold text-slate-300 mb-2 font-sans">System Authorization</h2>
          <p className="text-slate-500 text-sm mb-10 leading-relaxed max-w-[280px]">
            Restricted zone. Orland Management God Mode. Authenticate with Administrator credentials.
          </p>
          
          <a 
            href={ssoUrl} 
            onClick={handleLogin}
            className="group relative flex items-center justify-center w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest uppercase rounded-xl transition-all duration-300 overflow-hidden border border-red-500 hover:shadow-[0_0_30px_rgb(220,38,38,0.4)]"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
            {isRedirecting ? (
              <span className="flex items-center gap-3">
                <Loader2 className="animate-spin text-white" size={20} />
                CONNECTING...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                INITIATE LOGIN
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </span>
            )}
          </a>
          
          <div className="flex gap-2 mt-8 opacity-50">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-[pulse_2s_infinite]"></div>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-[pulse_2s_infinite_0.5s]"></div>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-[pulse_2s_infinite_1s]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
