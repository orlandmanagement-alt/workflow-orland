import { ArrowRight } from 'lucide-react';

export default function Login() {
  
  const handleSSOLogin = () => {
    // 1. Tentukan URL SSO (Appsso)
    const ssoUrl = 'https://appsso.orlandmanagement.com/login';
    
    // 2. Tentukan Callback URI (Halaman talent callback yang baru kita buat)
    const callbackUri = 'https://talent.orlandmanagement.com/auth/callback';
    
    // 3. Redirect user ke SSO dengan menyertakan redirect_uri
    // Production Flow: appsso.../login?redirect_uri=talent.../auth/callback
    window.location.href = `${ssoUrl}?redirect_uri=${encodeURIComponent(callbackUri)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg p-4 font-sans">
      <div className="bg-white dark:bg-dark-card p-10 rounded-3xl shadow-xl shadow-brand-500/5 border border-slate-100 dark:border-slate-800 max-w-md w-full text-center animate-fade-in">
        <span className="text-3xl font-extrabold tracking-tighter dark:text-white">
            ORLAND<span className="text-brand-500 font-light">TALENT</span>
        </span>
        <h2 className="text-xl font-bold mt-10 mb-2 dark:text-white tracking-tight">Enterprise Talent Portal</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-10 text-sm">Gunakan Akun SSO Orland Management Anda untuk masuk ke dashboard Talent.</p>
        
        <button onClick={handleSSOLogin}
          className="w-full flex justify-center items-center py-3.5 px-6 border border-transparent rounded-2xl shadow-lg shadow-brand-500/20 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition-all group">
            Masuk dengan Orland SSO
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
