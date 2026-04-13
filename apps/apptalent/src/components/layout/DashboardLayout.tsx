import { useState, useEffect, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';
import { performCleanLogout } from '@/lib/auth/logout';
import Sidebar from './Sidebar';
import { NotificationBell } from './NotificationBell';

interface DashboardLayoutProps {
  children?: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
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
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* SIDEBAR */}
      <Sidebar />
      
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 lg:ml-64 overflow-y-auto">
        {/* TOP BAR */}
        <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Portal Talent Orland</h1>
          </div>
          <NotificationBell />
        </div>

        {/* PAGE CONTENT */}
        <div className="p-6 lg:p-8">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}