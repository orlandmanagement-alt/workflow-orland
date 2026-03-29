import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/store/useAppStore';
import { Menu, X, Moon, Sun, LogOut, Bell, WifiOff, User, Shield, Settings, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MENU_ITEMS } from '@/config/menuConfig';

// IMPORT ULTIMATE LOGOUT SWEEPER
import { performCleanLogout } from '@/lib/auth/logout';
import { apiRequest } from '@/lib/api';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function DashboardLayout() {
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // STATE NOTIFIKASI API
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // STATE UNTUK GATEKEEPER & USER DATA
  const isAuthorized = useAuthStore(state => state.isAuthenticated);
  const userData = useAuthStore(state => state.user);

  // --- STRICT GATEKEEPER & DATA FETCHER ---
  useEffect(() => {
    if (!isAuthorized) {
      performCleanLogout();
    } else {
      // Lazy Fetch Notifications
      apiRequest('/notifications?limit=5&offset=0')
        .then((res: any) => {
           if (res.status === 'ok') {
             setNotifications(res.data || []);
             setUnreadCount(res.unread_count || 0);
           }
        })
        .catch(() => console.error("Gagal menarik lonceng notifikasi"));
    }
  }, [isAuthorized]);

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

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Jika sedang memverifikasi atau ditendang, jangan render UI
  if (!isAuthorized) return null; 

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
                  {userData?.name?.charAt(0) || 'T'}
                </div>
                <div className="ml-3 truncate">
                  <p className="text-sm font-bold text-white truncate">{userData?.name || 'Talent OM'}</p>
                  <p className="text-xs text-slate-400 truncate">{userData?.email || 'verified@orland.id'}</p>
                </div>
            </div>
            
            {/* TOMBOL LOGOUT MENGGUNAKAN SWEEPER TERBARU */}
            <button 
                onClick={performCleanLogout} 
                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Keluar (Logout)"
            >
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
            
            <div className="relative">
              <button onClick={() => { setIsNotifOpen(!isNotifOpen); setUserMenuOpen(false); }} className="relative p-2.5 rounded-xl text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-dark-card animate-pulse"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h4 className="font-bold text-sm dark:text-white">Notifikasi Talent</h4>
                    <span className="text-[10px] text-brand-500 font-bold cursor-pointer">Tandai dibaca</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-xs">Belum ada notifikasi baru.</div>
                    ) : (
                        notifications.map((notif, idx) => (
                            <div key={idx} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer flex gap-3 transition-colors">
                            <div className="mt-0.5"><CheckCircle2 size={16} className={notif.is_read ? "text-slate-400" : "text-brand-500"}/></div>
                            <div>
                                <p className={`text-xs ${notif.is_read ? "font-medium text-slate-600 dark:text-slate-300" : "font-bold text-slate-900 dark:text-white"}`}>{notif.title}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{notif.message}</p>
                            </div>
                            </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
                <button onClick={() => { setUserMenuOpen(!isUserMenuOpen); setIsNotifOpen(false); }} className="flex items-center space-x-3 p-1.5 pl-3 rounded-full bg-slate-50 border border-slate-200 hover:border-brand-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 transition-colors">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{userData?.name?.split(' ')[0] || 'Talent'}</span>
                    <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                        {userData?.name?.charAt(0) || 'T'}
                    </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 py-1">
                    <button className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center transition-colors">
                      <User size={14} className="mr-2 opacity-70" /> Profil Publik
                    </button>
                    <button className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center transition-colors">
                      <Settings size={14} className="mr-2 opacity-70" /> Pengaturan
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                    
                    <button 
                      onClick={performCleanLogout}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center transition-colors"
                    >
                      <LogOut size={14} className="mr-2 opacity-70" /> Keluar
                    </button>
                  </div>
                )}
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
