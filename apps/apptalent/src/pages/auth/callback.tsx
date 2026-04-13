import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state: any) => state.login);
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

      // Auto-process invite if user came from invite link before SSO login
      const inviteToken = sessionStorage.getItem('inviteToken') || params.get('inviteToken');
      if (inviteToken) {
        sessionStorage.removeItem('inviteToken');

        fetch(`https://api.orlandmanagement.com/api/v1/public/invites/${inviteToken}/accept`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({}),
        })
          .then(async (res) => {
            const data = await res.json().catch(() => null);
            if (res.ok && data?.redirectUrl) {
              navigate(data.redirectUrl, { replace: true });
              return;
            }
            navigate(`/invite/${inviteToken}`, { replace: true });
          })
          .catch(() => {
            navigate(`/invite/${inviteToken}`, { replace: true });
          });
        return;
      }

      navigate('/dashboard', { replace: true });
    } else {
      window.location.replace('https://sso.orlandmanagement.com/');
    }
  }, []);

  return <div className="h-screen flex items-center justify-center font-bold">Memverifikasi Sesi Aman...</div>;
}