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
        id: params.get('user_id'), 
        full_name: params.get('name'), 
        email: params.get('email'), 
        role: params.get('role') 
      });
      navigate('/dashboard', { replace: true });
    } else {
      window.location.replace('https://sso.orlandmanagement.com/?app=client');
    }
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#071122] text-white">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black uppercase tracking-widest text-[10px] animate-pulse">Syncing Client Portal...</p>
    </div>
  );
}