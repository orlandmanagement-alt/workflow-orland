import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/store/useAppStore';
import { ShieldAlert, Users, LayoutDashboard, Wallet, Gavel, LogOut, Search, Moon, Sun, Settings } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, logout } = useAuthStore();

  // THE ULTIMATE GATEKEEPER - BLOCKED ANYONE EXCEPT ADMIN
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user.role !== 'admin') {
    // If client or talent tries to enter Admin panel, nuke their token and kick to SSO
    alert("CRITICAL ACCESS VIOLATION: Role is not Admin. Force Logging Out.");
    logout();
    return null; 
  }

  return <>{children}</>;
};

const MENU = [
  { path: '/admin', label: 'God Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'User & Identity', icon: Users },
  { path: '/admin/finance', label: 'Treasury & Payouts', icon: Wallet },
  { path: '/admin/projects', label: 'Overwatch & Disputes', icon: Gavel },
];

export const AdminLayout = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();
  const { user, logout } = useAuthStore();

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

         <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            <div className="text-[10px] font-black tracking-widest text-slate-600 uppercase mb-4 px-2">Master Controls</div>
            {MENU.map(item => {
              const bgClass = location.pathname === item.path || location.pathname.startsWith(item.path + '/') 
                   ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                   : 'hover:bg-slate-800 hover:text-white border border-transparent';
              return (
                <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${bgClass} text-sm font-bold`}>
                   <item.icon size={18} /> {item.label}
                </Link>
              );
            })}
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
