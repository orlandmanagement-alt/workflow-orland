import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);
  const isProcessed = useRef(false);

  useEffect(() => {
    if (isProcessed.current) return;
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      isProcessed.current = true;
      login(token, { 
        id: params.get('user_id') || undefined, 
        full_name: params.get('name') || undefined, 
        email: params.get('email') || undefined, 
        role: params.get('role') || undefined 
      });
      navigate('/dashboard', { replace: true });
    } else {
      window.location.replace('https://sso.orlandmanagement.com/?app=client');
    }
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#071122] text-white">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black uppercase tracking-widest text-xs animate-pulse">Sinkronisasi Portal CLIENT...</p>
    </div>
  );
}