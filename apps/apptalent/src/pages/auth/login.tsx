import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [email, setEmail] = useState(''); // State untuk validasi lokal

  const ssoUrl = 'https://sso.orlandmanagement.com?app=talent';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Validasi Sederhana: Mencegah pengiriman jika input kosong atau tidak mengandung @
    if (!email || !email.includes('@')) {
      alert("Silakan masukkan alamat email yang valid.");
      return;
    }

    setIsRedirecting(true);
    setTimeout(() => {
      window.location.href = ssoUrl + `&identifier=${encodeURIComponent(email)}`;
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#071122] p-4 font-sans transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 text-center max-w-md w-full relative overflow-hidden">
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl mb-6 shadow-inner pointer-events-none">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="currentColor" className="text-blue-600 dark:text-blue-500"/>
              <path d="M16 8L8 16L16 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24 8L16 16L24 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight uppercase">
            ORLAND<span className="text-blue-600 dark:text-blue-500 font-light">TALENT</span>
          </h1>
          <div className="h-1 w-12 bg-blue-600 rounded-full mx-auto mb-6 opacity-80"></div>
          
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-tighter">Enterprise Portal</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-10 px-2 leading-relaxed">
            Akses aman ke ekosistem Orland Management. Masuk menggunakan gateway SSO tersentralisasi.
          </p>

          {/* Input Identifier untuk validasi awal */}
          <div className="mb-6 text-left">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">Email / No. WA</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@domain.com"
              className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
            />
          </div>
          
          <a 
            href={ssoUrl} 
            onClick={handleLogin}
            className={`group relative flex items-center justify-center w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl transition-all duration-300 overflow-hidden ${isRedirecting ? 'opacity-80 cursor-not-allowed' : ''}`}
          >
            {isRedirecting ? (
              <span className="flex items-center gap-3">
                {/* SPINNER ANIMATION */}
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menghubungkan...
              </span>
            ) : (
              <span className="flex items-center uppercase tracking-widest text-xs">
                Masuk via Orland SSO
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </span>
            )}
          </a>
          
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 mt-8 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Orland Management Group
          </p>
        </div>
      </div>
    </div>
  );
}