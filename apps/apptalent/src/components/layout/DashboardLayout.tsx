import { WifiOff } from "lucide-react";
import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/store/useAppStore';
// FIX: Menambahkan Bell ke dalam import Lucide React!
import { Menu, X, Moon, Sun, LogOut, Bell } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MENU_ITEMS } from '@/config/menuConfig';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function DashboardLayout() {
  const { token, user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);

  if (!token) return <Navigate to="/login" replace />;

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-dark-bg transition-colors duration-300 font-sans">
      
      {/* EXCLUSIVE SIDEBAR */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#0a192f] dark:bg-dark-card border-r border-[#1a2b4b] dark:border-slate-800 transform transition-transform duration-300 ease-out flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:static lg:flex"
      )}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-[#1a2b4b] dark:border-slate-800 shadow-inner">
          <span className="text-2xl font-extrabold tracking-tighter text-white">
            ORLAND<span className="text-brand-500 font-light">TALENT</span>
          </span>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link key={item.path} to={item.path}
                className={cn(
                  "flex items-center group px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden",
                  isActive 
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-500/30" 
                    : "text-slate-300 hover:text-white"
                )}
              >
                {!isActive && (
                    <span className="absolute inset-0 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-0"></span>
                )}
                <div className="flex items-center flex-1 z-10">
                    <Icon size={20} className={cn("mr-4 transition-colors duration-300", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                    <span className="font-semibold tracking-tight">{item.label}</span>
                </div>
                {item.badge && (
                    <span className={cn(
                        "ml-auto inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold z-10",
                        isActive ? "bg-white text-brand-600" : "bg-red-500 text-white"
                    )}>
                        {item.badge}
                    </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#1a2b4b] dark:border-slate-800 bg-[#071122]">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
                <div className="h-11 w-11 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-lg border border-brand-500/30">
                {user?.full_name?.charAt(0) || 'T'}
                </div>
                <div className="ml-3 truncate">
                <p className="text-sm font-bold text-white truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.role === 'talent' ? 'verified@orland.id' : 'guest@orland.id'}</p>
                </div>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 flex items-center justify-between px-6 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-slate-800 z-10 shadow-sm">
          <div className="flex items-center flex-1">
            <button className="lg:hidden mr-4 p-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="hidden sm:block text-xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard Talent</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button className="relative p-2.5 rounded-xl text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-dark-card animate-pulse"></span>
            </button>

            <div className="relative">
                <button onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-3 p-1.5 pl-3 rounded-full bg-slate-50 border border-slate-200 hover:border-brand-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 transition-colors">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{user?.full_name?.split(' ')[0]}</span>
                    <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                        {user?.full_name?.charAt(0) || 'T'}
                    </div>
                </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 animate-fade-in relative bg-slate-100 dark:bg-dark-bg">
          <Outlet />
        </main>
      </div>

      {isOffline && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-yellow-950 px-4 py-2 rounded-full shadow-lg flex items-center text-sm font-bold animate-slide-up">
          <WifiOff size={16} className="mr-2" /> Mode Offline: Sinyal Hilang. Data diambil dari memori perangkat.
        </div>
      )}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
