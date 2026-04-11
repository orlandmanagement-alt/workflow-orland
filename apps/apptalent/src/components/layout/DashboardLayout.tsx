import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';
import { performCleanLogout } from '@/lib/auth/logout';

export default function DashboardLayout() {
  const { login, isAuthenticated } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('https://sso.orlandmanagement.com/api/auth/me', { method: 'GET', credentials: 'include' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        login(data.token || 'active', data.user);
        setIsVerifying(false);
      } catch (e) {
        performCleanLogout();
      }
    }
    checkAuth();
  }, []);

  if (isVerifying) return <div className="h-screen flex items-center justify-center font-bold animate-pulse">Menghubungkan Portal Keamanan...</div>;
  return <Outlet />;
}