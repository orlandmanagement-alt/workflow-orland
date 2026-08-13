import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/store/useAppStore';
import { ShieldAlert, Users, LayoutDashboard, Wallet, Gavel, LogOut, Search, Moon, Sun, Settings, MessageSquare, Activity, Bell, ChevronDown } from 'lucide-react';
import LoadingOverlay from '@/components/LoadingOverlay';
import { getRedirectUrl } from '@/lib/roleRedirect';
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  const [isChecking, setIsChecking] = React.useState(true);

  useEffect(() => {
    const performCheck = () => {
      if (!isAuthenticated || !user) {
        // Redirect to SSO if not logged in
        window.location.replace(
          `https://www.orlandmanagement.com?redirect_url=${encodeURIComponent(window.location.origin + '/auth/callback')}`
        );
        return;
      }

      if (user.role !== 'admin') {
        // Redirect to appropriate dashboard based on role without logout
        const targetUrl = getRedirectUrl(user.role);
        console.log(`Redirecting curious ${user.role} to their territory: ${targetUrl}`);
        window.location.href = targetUrl;
        return;
      }

      // If everything is fine, stop loading
      setIsChecking(false);
    };

    // Small delay for better UX and animation feel
    const timer = setTimeout(performCheck, 1200);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  if (isChecking) {
    return <LoadingOverlay />;
  }

  return <>{children}</>;
};

const MENU_GROUPS = [
  {
    key: 'core',
    label: 'Core Control',
    items: [
      { path: '/admin', label: 'God Dashboard', icon: LayoutDashboard },
      { path: '/admin/users', label: 'User & Identity', icon: Users },
      { path: '/admin/notifications', label: 'Notifications Hub', icon: Bell },
    ],
  },
  {
    key: 'operations',
    label: 'Operations',
    items: [
      { path: '/admin/projects', label: 'Verification & Global Control', icon: Gavel },
      { path: '/admin/finance', label: 'Treasury & Payouts', icon: Wallet },
      { path: '/admin/disputes', label: 'Dispute Center', icon: ShieldAlert },
      { path: '/admin/chat', label: 'Chat Management', icon: MessageSquare },
    ],
  },
  {
    key: 'system',
    label: 'Platform',
    items: [{ path: '/admin/system/health', label: 'System Health', icon: Activity }],
  },
];

export const AdminLayout = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    core: true,
    operations: true,
    system: true,
  });

  // Inject dark mode class based on store
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#071122] font-sans selection:bg-brand-500 selection:text-white transition-colors">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0b1626] border-r border-slate-800 flex flex-col text-slate-300">
         <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
            <ShieldAlert className="text-red-500 mr-2" size={24} />
            <h1 className="text-xl font-black text-white tracking-widest uppercase">
              ORLAND <span className="font-light">ADMIN</span>
            </h1>
         </div>

         <div className="flex-1 overflow-y-auto py-6 px-4 space-y-3">
            {MENU_GROUPS.map((group) => (
              <div key={group.key} className="rounded-xl border border-slate-800/80 bg-slate-950/40">
                <button
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                  className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300"
                >
                  {group.label}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${openGroups[group.key] ? 'rotate-180 text-emerald-400' : 'text-slate-500'}`}
                  />
                </button>

                {openGroups[group.key] && (
                  <div className="space-y-1 p-2 pt-0">
                    {group.items.map((item) => {
                      const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                      const bgClass = active
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                        : 'hover:bg-slate-800 hover:text-white border border-transparent';
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${bgClass}`}
                        >
                          <item.icon size={17} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
         </div>

         <div className="p-4 border-t border-slate-800/50 bg-black/20 flex flex-col gap-2">
             <div className="flex items-center gap-3 px-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center font-bold text-red-500 border border-red-500/30">O</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono tracking-wider">{user?.role} rank</p>
                </div>
                <button onClick={toggleTheme} className="text-slate-500 hover:text-white">
                  {isDark ? <Sun size={16}/> : <Moon size={16}/>}
                </button>
             </div>
             
             <button onClick={logout} className="flex items-center gap-2 justify-center w-full py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-colors">
                 <LogOut size={14} /> SIGN OUT OVERRIDE
             </button>
         </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Topbar */}
          <header className="h-20 bg-white/80 dark:bg-[#071122]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10">
             <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Operations</h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">God Mode Activated</p>
             </div>
             <div className="flex items-center gap-4">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Global Search..." className="w-64 pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                 </div>
                 <Link to="/admin/notifications" className="relative p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group">
                    <Bell size={18} />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center group-hover:bg-red-600">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                 </Link>
                 <button className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    <Settings size={18} />
                 </button>
             </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 relative">
             <Outlet />
          </div>
      </main>

    </div>
  );
};
