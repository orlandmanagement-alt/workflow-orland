import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      try {
         // Dekode token manual (Simulation)
         // Payload di SSO: { id, email, name, role }
         const payload = JSON.parse(atob(token.split('.')[1]));
         
         // STRICT ADMIN GATEKEEPER
         if (payload.role !== 'admin') {
            alert('AKSES DITOLAK! Anda bukan Administrator.');
            window.location.href = 'https://sso.orlandmanagement.com/login?error=ACCESS_DENIED';
            return;
         }

         login({
            id: payload.id,
            email: payload.email,
            name: payload.name,
            role: payload.role
         }, token);

         navigate('/admin');
         
      } catch (error) {
         console.error('Invalid token format', error);
         navigate('/auth/login?error=INVALID_TOKEN');
      }
    } else {
      navigate('/auth/login');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-[#071122] flex flex-col items-center justify-center p-4 selection:bg-brand-500 selection:text-white">
      <div className="w-full max-w-md text-center flex flex-col items-center">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-red-500 rounded-full blur-[50px] opacity-30 animate-pulse"></div>
           <ShieldAlert className="text-red-500 relative z-10 animate-bounce" size={64} />
        </div>
        <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-2">Verifikasi Otoritas</h2>
        <p className="text-slate-400 font-mono text-sm mb-8 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin text-red-500" size={16} /> Menyinkronkan kredensial Pengekang...
        </p>
        <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
           <div className="h-full bg-red-500 w-1/2 rounded-full animate-[progress_1s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  );
}
