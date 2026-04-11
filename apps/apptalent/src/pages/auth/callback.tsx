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
        name: params.get('name'), 
        email: params.get('email'), 
        role: params.get('role') 
      });
      navigate('/dashboard', { replace: true });
    } else {
      window.location.replace('https://sso.orlandmanagement.com/');
    }
  }, []);

  return <div className="h-screen flex items-center justify-center font-bold">Memverifikasi Sesi Aman...</div>;
}