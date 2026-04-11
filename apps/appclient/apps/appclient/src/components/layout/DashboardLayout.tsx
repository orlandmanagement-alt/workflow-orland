import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';
import { performCleanLogout } from '@/lib/auth/logout';

export default function DashboardLayout() {
  const { login, isAuthenticated } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    async function silentAuth() {
      try {
        const res = await fetch('https://sso.orlandmanagement.com/api/auth/me', { method: 'GET', credentials: 'include' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        // Proteksi Role
        if (data.user.role !== 'client' && data.user.role !== 'admin') {
           window.location.replace(data.redirect_url);
           return;
        }

        login(data.token || 'active', data.user);
        setIsVerifying(false);
      } catch (e) {
        performCleanLogout();
      }
    }
    silentAuth();
  }, []);

  if (isVerifying) return (
    <div className="h-screen flex items-center justify-center bg-[#071122] text-amber-500 font-black uppercase tracking-tighter animate-pulse">
      Verifikasi Client Partner...
    </div>
  );
  
  return <Outlet />;
}