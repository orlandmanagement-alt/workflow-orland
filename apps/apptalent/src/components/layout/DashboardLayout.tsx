import { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/store/useAppStore';
import { Menu, X, Moon, Sun, LogOut, Bell, WifiOff, User, Shield, CheckCircle2, MessageSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MENU_ITEMS } from '@/config/menuConfig';
import { talentService } from '@/lib/services/talentService';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function DashboardLayout() {
  const { token, user, logout, setUser } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false); // STATE NOTIFIKASI BARU
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null); // REF NOTIFIKASI BARU

  if (!token) return <Navigate to="/login" replace />;

  useEffect(() => {
    talentService.getProfile().then((data) => setUser(data)).catch(console.error);
  }, [setUser]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const getInitials = (name?: string) => name ? name.charAt(0).toUpperCase() : 'T';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-dark-bg transition-colors duration-300 font-sans">
      
      {/* SIDEBAR */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#0a192f] dark:bg-dark-card border-r border-[#1a2b4b] dark:border-slate-800/50 transform transition-transform duration-300 ease-out flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:static lg:flex"
      )}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-[#1a2b4b] dark:border-slate-800/50">
          <span className="text-2xl font-extrabold tracking-tighter text-white">ORLAND<span className="text-brand-500 font-light">TALENT</span></span>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}><X size={22} /></button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link key={item.path} to={item.path} className={cn("flex items-center group px-4 py-3.5 rounded-xl text-sm font-medium transition-all", isActive ? "bg-brand-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800/50")}>
                <div className="flex items-center flex-1"><Icon size={20} className={cn("mr-3.5", isActive ? "scale-110" : "group-hover:scale-110")} /><span>{item.label}</span></div>
                {item.badge && <span className={cn("ml-auto inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold", isActive ? "bg-white text-brand-600" : "bg-red-500 text-white")}>{item.badge}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 flex items-center justify-between px-6 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-slate-800/80 z-20 shadow-sm transition-colors">
          <div className="flex items-center flex-1">
            <button className="lg:hidden mr-4 p-2.5 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
            <h1 className="hidden sm:block text-xl font-bold text-slate-800 dark:text-white tracking-tight">Dashboard Talent</h1>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-5">
            <button onClick={toggleTheme} className="p-2.5 rounded-full text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:text-amber-400 transition-colors">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* FITUR NOTIFIKASI DROPDOWN */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative p-2.5 rounded-full text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:text-brand-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-dark-card animate-pulse"></span>
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-900 dark:text-white">Notifikasi</h3>
                    <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-0.5 rounded-full">2 Baru</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-start gap-3">
                      <div className="mt-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-2 rounded-full"><CheckCircle2 size={16} /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Selamat Datang!</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Akun Enterprise Anda berhasil terhubung dengan Orland SSO.</p>
                        <p className="text-[10px] text-slate-400 mt-1">Baru saja</p>
                      </div>
                    </div>
                    <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-start gap-3">
                      <div className="mt-1 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 p-2 rounded-full"><MessageSquare size={16} /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Tips Profil</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Jangan lupa unggah minimal 3 foto terbaik Anda di Comp Card Pro.</p>
                        <p className="text-[10px] text-slate-400 mt-1">1 jam yang lalu</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-800/50">
                    <button onClick={() => setIsNotifOpen(false)} className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline">Tandai semua dibaca</button>
                  </div>
                </div>
              )}
            </div>

            {/* USER PROFILE DROPDOWN */}
            <div className="relative" ref={menuRef}>
                <button onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-3 p-1.5 pl-4 rounded-full bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                    <span className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-200">{user?.full_name?.split(' ')[0] || 'Talent'}</span>
                    <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm shadow-inner">{getInitials(user?.full_name)}</div>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.full_name || 'Talent Member'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email || 'Memuat data...'}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"><User size={16} className="mr-3" /> Edit Profil</Link>
                      <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"><Shield size={16} className="mr-3" /> Keamanan Akun</Link>
                    </div>
                    <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={handleLogout} className="flex w-full items-center px-3 py-2.5 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut size={16} className="mr-3" /> Keluar</button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in relative transition-colors"><Outlet /></main>
      </div>
      {isOffline && <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-yellow-950 px-5 py-2.5 rounded-full shadow-xl flex items-center text-sm font-bold"><WifiOff size={18} className="mr-2" /> Mode Offline.</div>}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  )
}
